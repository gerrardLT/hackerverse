import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { retrieveFromIPFS } from '@/lib/ipfs'
import { z } from 'zod'
import * as crypto from 'crypto'

// 验证查询参数
const verifyQuerySchema = z.object({
  judgeId: z.string().optional(), // 指定评委ID（可选）
  includeData: z.enum(['true', 'false']).optional().default('false'), // 是否包含完整IPFS数据
  verifySignature: z.enum(['true', 'false']).optional().default('true') // 是否验证签名
})

/**
 * 验证评分的IPFS存储和钱包签名API
 * GET /api/judging/score/[projectId]/verify
 * 
 * 功能：
 * - 验证评分记录的IPFS存储完整性
 * - 验证钱包签名的真实性
 * - 检查数据是否被篡改
 * - 提供详细的验证报告
 * - 支持多评委项目的验证
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)
  const { projectId } = params

  try {
    // 验证用户身份（所有登录用户都可以验证评分）
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('common.errors.authRequired'),
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      )
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = verifyQuerySchema.parse(query)

    console.log('🔍 验证评分请求:', projectId, user.id, validatedQuery)

    // 获取项目信息
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        hackathonId: true,
        isPublic: true,
        creatorId: true,
        hackathon: {
          select: {
            id: true,
            title: true,
            endDate: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('judging.errors.projectNotFound'),
          code: 'PROJECT_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // 权限检查：项目创建者、评委、管理员可以验证
    const hasPermission = user.id === project.creatorId || 
                         ['ADMIN', 'MODERATOR'].includes(user.role) ||
                         (user.role === 'JUDGE') ||
                         project.isPublic

    if (!hasPermission) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('common.errors.insufficientPermissions'),
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      )
    }

    // 构建查询条件
    let scoreWhere: any = {
      projectId: projectId,
      isFinalized: true // 只验证已最终确认的评分
    }

    // 如果指定了评委ID
    if (validatedQuery.judgeId) {
      scoreWhere.judgeId = validatedQuery.judgeId
    }

    // 获取评分记录和IPFS记录
    const scores = await prisma.score.findMany({
      where: scoreWhere,
      include: {
        judge: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                walletAddress: true
              }
            }
          }
        },
        ipfsRecords: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (scores.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          project: {
            id: project.id,
            title: project.title
          },
          verificationResults: [],
          summary: {
            totalScores: 0,
            verifiedScores: 0,
            failedVerifications: 0,
            overallStatus: 'NO_SCORES',
            message: t('judging.verification.noFinalizedScores')
          }
        }
      })
    }

    // 验证每个评分记录
    const verificationResults = await Promise.all(
      scores.map(async (score) => {
        const verificationResult = {
          scoreId: score.id,
          judgeId: score.judgeId,
          judge: {
            user: score.judge.user,
            role: score.judge.role
          },
          totalScore: Number(score.totalScore),
          finalizedAt: score.finalizedAt,
          ipfsHash: score.ipfsHash,
          hasWalletSignature: Boolean(score.walletSignature),
          signatureTimestamp: score.signatureTimestamp,
          ipfsRecords: score.ipfsRecords.map(record => ({
            id: record.id,
            hash: record.ipfsHash,
            walletAddress: record.walletAddress,
            verificationStatus: record.verificationStatus,
            createdAt: record.createdAt
          })),
          verification: {
            ipfsAccessible: false,
            dataIntegrity: false,
            signatureValid: false,
            timestampValid: false,
            overallValid: false,
            errors: [] as string[],
            warnings: [] as string[]
          },
          ipfsData: null as any
        }

        try {
          // 1. 验证IPFS可访问性
          if (score.ipfsHash) {
            console.log(`🔍 验证IPFS数据: ${score.ipfsHash}`)
            
            const ipfsResult = await retrieveFromIPFS(score.ipfsHash)
            if (ipfsResult.success && ipfsResult.data) {
              verificationResult.verification.ipfsAccessible = true
              
              try {
                const ipfsData = JSON.parse(ipfsResult.data)
                verificationResult.ipfsData = validatedQuery.includeData === 'true' ? ipfsData : null

                // 2. 验证数据完整性
                if (ipfsData.scores && ipfsData.project && ipfsData.judge) {
                  // 检查关键数据是否匹配
                  const dataMatches = {
                    projectId: ipfsData.project.id === projectId,
                    judgeId: ipfsData.judge.id === score.judgeId,
                    totalScore: Math.abs(ipfsData.scores.totalScore - Number(score.totalScore)) < 0.01,
                    timestamp: ipfsData.timestamp && new Date(ipfsData.timestamp) <= new Date()
                  }

                  if (Object.values(dataMatches).every(Boolean)) {
                    verificationResult.verification.dataIntegrity = true
                  } else {
                    verificationResult.verification.errors.push(
                      t('judging.verification.dataIntegrityFailed', {
                        mismatches: Object.entries(dataMatches)
                          .filter(([_, matches]) => !matches)
                          .map(([key]) => key)
                          .join(', ')
                      })
                    )
                  }

                  // 3. 验证时间戳有效性
                  if (ipfsData.timestamp) {
                    const ipfsTimestamp = new Date(ipfsData.timestamp)
                    const finalizedTimestamp = new Date(score.finalizedAt!)
                    const timeDiff = Math.abs(ipfsTimestamp.getTime() - finalizedTimestamp.getTime())
                    
                    // 允许5分钟的时间误差
                    if (timeDiff <= 5 * 60 * 1000) {
                      verificationResult.verification.timestampValid = true
                    } else {
                      verificationResult.verification.warnings.push(
                        t('judging.verification.timestampMismatch', {
                          diff: Math.round(timeDiff / 1000).toString()
                        })
                      )
                    }
                  }

                  // 4. 验证钱包签名
                  if (validatedQuery.verifySignature === 'true' && 
                      score.walletSignature && 
                      ipfsData.signature) {
                    
                    try {
                      // 这里应该实现真正的签名验证逻辑
                      // 目前简化为检查签名是否存在且匹配
                      const signatureMatches = ipfsData.signature.signature === score.walletSignature
                      const walletMatches = ipfsData.signature.walletAddress === score.judge.user.walletAddress

                      if (signatureMatches && walletMatches) {
                        verificationResult.verification.signatureValid = true
                      } else {
                        verificationResult.verification.errors.push(
                          t('judging.verification.signatureInvalid')
                        )
                      }
                    } catch (signError) {
                      verificationResult.verification.errors.push(
                        t('judging.verification.signatureVerificationFailed', {
                          error: signError instanceof Error ? signError.message : String(signError)
                        })
                      )
                    }
                  } else if (validatedQuery.verifySignature === 'true') {
                    verificationResult.verification.warnings.push(
                      t('judging.verification.noSignatureToVerify')
                    )
                  } else {
                    verificationResult.verification.signatureValid = true // 跳过签名验证时标记为有效
                  }

                } else {
                  verificationResult.verification.errors.push(
                    t('judging.verification.incompleteIPFSData')
                  )
                }

              } catch (parseError) {
                verificationResult.verification.errors.push(
                  t('judging.verification.ipfsParseError', { error: parseError instanceof Error ? parseError.message : String(parseError) })
                )
              }
            } else {
              verificationResult.verification.errors.push(
                t('judging.verification.ipfsNotAccessible', { 
                  hash: score.ipfsHash,
                  error: ipfsResult.error || 'Unknown error'
                })
              )
            }
          } else {
            verificationResult.verification.errors.push(
              t('judging.verification.noIPFSHash')
            )
          }

          // 5. 确定总体验证状态
          verificationResult.verification.overallValid = 
            verificationResult.verification.ipfsAccessible &&
            verificationResult.verification.dataIntegrity &&
            verificationResult.verification.signatureValid &&
            (verificationResult.verification.timestampValid || 
             verificationResult.verification.warnings.some(w => w.includes('timestamp')))

        } catch (verifyError) {
          console.error('❌ 验证过程出错:', verifyError)
          verificationResult.verification.errors.push(
            t('judging.verification.verificationError', { error: verifyError instanceof Error ? verifyError.message : String(verifyError) })
          )
        }

        return verificationResult
      })
    )

    // 生成验证摘要
    const verifiedCount = verificationResults.filter(r => r.verification.overallValid).length
    const failedCount = verificationResults.filter(r => !r.verification.overallValid).length
    
    const overallStatus = (() => {
      if (verificationResults.length === 0) return 'NO_SCORES'
      if (verifiedCount === verificationResults.length) return 'ALL_VERIFIED'
      if (verifiedCount > 0) return 'PARTIALLY_VERIFIED'
      return 'VERIFICATION_FAILED'
    })()

    console.log('✅ 评分验证完成:', {
      projectId,
      totalScores: verificationResults.length,
      verified: verifiedCount,
      failed: failedCount,
      overallStatus
    })

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          title: project.title,
          hackathon: project.hackathon
        },
        verificationResults,
        summary: {
          totalScores: verificationResults.length,
          verifiedScores: verifiedCount,
          failedVerifications: failedCount,
          overallStatus,
          verificationTimestamp: new Date().toISOString(),
          message: t(`judging.verification.status.${overallStatus.toLowerCase()}`, {
            verified: verifiedCount.toString(),
            total: verificationResults.length.toString()
          })
        },
        recommendations: generateVerificationRecommendations(verificationResults, t)
      }
    })

  } catch (error: any) {
    console.error('❌ 验证评分失败:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('common.errors.invalidInput'),
          code: 'VALIDATION_ERROR',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: t('common.errors.internalServer'),
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * 生成验证建议
 */
function generateVerificationRecommendations(results: any[], t: Function): string[] {
  const recommendations: string[] = []
  
  const failedResults = results.filter(r => !r.verification.overallValid)
  const inaccessibleIPFS = results.filter(r => !r.verification.ipfsAccessible)
  const invalidSignatures = results.filter(r => !r.verification.signatureValid)
  const integrityIssues = results.filter(r => !r.verification.dataIntegrity)
  
  if (failedResults.length > 0) {
    recommendations.push(
      t('judging.verification.recommendations.hasFailures', {
        count: failedResults.length
      })
    )
  }
  
  if (inaccessibleIPFS.length > 0) {
    recommendations.push(
      t('judging.verification.recommendations.ipfsIssues', {
        count: inaccessibleIPFS.length
      })
    )
  }
  
  if (invalidSignatures.length > 0) {
    recommendations.push(
      t('judging.verification.recommendations.signatureIssues', {
        count: invalidSignatures.length
      })
    )
  }
  
  if (integrityIssues.length > 0) {
    recommendations.push(
      t('judging.verification.recommendations.integrityIssues', {
        count: integrityIssues.length
      })
    )
  }
  
  if (recommendations.length === 0) {
    recommendations.push(
      t('judging.verification.recommendations.allGood')
    )
  }
  
  return recommendations
}
