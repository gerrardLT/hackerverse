import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { retrieveFromIPFS } from '@/lib/ipfs'
import { z } from 'zod'

// 查询参数验证
const retrieveQuerySchema = z.object({
  format: z.enum(['json', 'raw']).optional().default('json'),
  includeMetadata: z.enum(['true', 'false']).optional().default('true'),
  verifyAccess: z.enum(['true', 'false']).optional().default('true')
})

/**
 * 从IPFS检索评分记录API
 * GET /api/judging/ipfs/[hash]/retrieve
 * 
 * 功能：
 * - 从IPFS网络检索指定哈希的评分记录
 * - 验证用户访问权限
 * - 提供多种数据格式
 * - 包含元数据和访问记录
 * - 支持数据完整性验证
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)
  const { hash } = params

  try {
    // 验证用户身份
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
    const validatedQuery = retrieveQuerySchema.parse(query)

    console.log('📥 从IPFS检索数据:', hash, user.id, validatedQuery)

    // 验证哈希格式（基本的IPFS哈希格式检查）
    if (!hash || hash.length < 20 || !hash.startsWith('Qm')) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('judging.errors.invalidIPFSHash'),
          code: 'INVALID_IPFS_HASH'
        },
        { status: 400 }
      )
    }

    // 查找IPFS记录以验证访问权限
    let ipfsRecord = null
    if (validatedQuery.verifyAccess === 'true') {
      ipfsRecord = await prisma.judgingIpfsRecord.findUnique({
        where: { ipfsHash: hash },
        include: {
          score: {
            include: {
              project: {
                select: {
                  id: true,
                  title: true,
                  creatorId: true,
                  isPublic: true,
                  hackathonId: true
                }
              },
              judge: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      email: true
                    }
                  }
                }
              }
            }
          },
          hackathon: {
            select: {
              id: true,
              title: true,
              organizerId: true
            }
          }
        }
      })

      // 权限检查
      if (ipfsRecord) {
        const hasAccess = 
          // 管理员和审核员
          ['ADMIN', 'MODERATOR'].includes(user.role) ||
          // 项目创建者
          user.id === ipfsRecord.score.project.creatorId ||
          // 评委本人
          user.id === ipfsRecord.score.judge.userId ||
          // 黑客松组织者
          user.id === ipfsRecord.hackathon.organizerId ||
          // 公开项目
          ipfsRecord.score.project.isPublic

        if (!hasAccess) {
          return NextResponse.json(
            { 
              success: false, 
              error: t('common.errors.insufficientPermissions'),
              code: 'INSUFFICIENT_PERMISSIONS',
              data: {
                hash,
                projectId: ipfsRecord.score.project.id,
                isPublic: ipfsRecord.score.project.isPublic
              }
            },
            { status: 403 }
          )
        }
      } else {
        // 如果没有找到记录，只有管理员可以访问
        if (!['ADMIN', 'MODERATOR'].includes(user.role)) {
          return NextResponse.json(
            { 
              success: false, 
              error: t('judging.errors.ipfsRecordNotFound'),
              code: 'IPFS_RECORD_NOT_FOUND'
            },
            { status: 404 }
          )
        }
      }
    }

    // 从IPFS检索数据
    console.log('📥 从IPFS检索数据...')
    const ipfsResult = await retrieveFromIPFS(hash)

    if (!ipfsResult.success || !ipfsResult.data) {
      // 记录检索失败
      if (ipfsRecord) {
        await prisma.judgingIpfsRecord.update({
          where: { id: ipfsRecord.id },
          data: {
            verificationStatus: 'failed',
            metadata: {
              ...ipfsRecord.metadata,
              lastAccessAttempt: new Date().toISOString(),
              lastAccessError: ipfsResult.error,
              accessAttemptBy: user.id
            }
          }
        })
      }

      return NextResponse.json(
        { 
          success: false, 
          error: t('judging.errors.ipfsRetrievalFailed'),
          code: 'IPFS_RETRIEVAL_FAILED',
          details: ipfsResult.error
        },
        { status: 503 }
      )
    }

    // 解析和验证数据
    let parsedData = null
    let dataFormat = 'raw'
    
    try {
      if (validatedQuery.format === 'json') {
        parsedData = JSON.parse(ipfsResult.data)
        dataFormat = 'json'
        
        // 基本数据结构验证
        if (!parsedData.type || !parsedData.scores || !parsedData.project) {
          console.warn('⚠️ IPFS数据结构不完整:', hash)
        }
      }
    } catch (parseError) {
      console.warn('⚠️ IPFS数据解析失败:', parseError)
      // 如果解析失败，返回原始数据
      if (validatedQuery.format === 'json') {
        return NextResponse.json(
          { 
            success: false, 
            error: t('judging.errors.ipfsDataParseError'),
            code: 'IPFS_DATA_PARSE_ERROR',
            details: parseError
          },
          { status: 422 }
        )
      }
    }

    // 更新IPFS记录状态
    if (ipfsRecord) {
      await prisma.judgingIpfsRecord.update({
        where: { id: ipfsRecord.id },
        data: {
          verificationStatus: parsedData ? 'verified' : 'pending',
          verifiedAt: parsedData ? new Date() : null,
          metadata: {
            ...ipfsRecord.metadata,
            lastAccessedAt: new Date().toISOString(),
            lastAccessedBy: user.id,
            accessCount: (ipfsRecord.metadata as any)?.accessCount ? 
              (ipfsRecord.metadata as any).accessCount + 1 : 1,
            dataSize: ipfsResult.data.length,
            parseSuccess: Boolean(parsedData)
          }
        }
      })
    }

    // 构建响应数据
    const responseData: any = {
      hash,
      format: dataFormat,
      size: ipfsResult.data.length,
      retrievedAt: new Date().toISOString(),
      data: validatedQuery.format === 'json' ? parsedData : ipfsResult.data
    }

    // 包含元数据
    if (validatedQuery.includeMetadata === 'true' && ipfsRecord) {
      responseData.metadata = {
        record: {
          id: ipfsRecord.id,
          walletAddress: ipfsRecord.walletAddress,
          verificationStatus: ipfsRecord.verificationStatus,
          createdAt: ipfsRecord.createdAt,
          verifiedAt: ipfsRecord.verifiedAt
        },
        project: {
          id: ipfsRecord.score.project.id,
          title: ipfsRecord.score.project.title,
          isPublic: ipfsRecord.score.project.isPublic
        },
        judge: {
          id: ipfsRecord.score.judge.id,
          user: ipfsRecord.score.judge.user,
          role: ipfsRecord.score.judge.role
        },
        hackathon: {
          id: ipfsRecord.hackathon.id,
          title: ipfsRecord.hackathon.title
        },
        access: {
          accessedBy: user.id,
          accessTime: new Date().toISOString(),
          userRole: user.role
        }
      }
    }

    // 数据完整性验证（如果是JSON格式）
    if (parsedData && validatedQuery.includeMetadata === 'true') {
      responseData.verification = {
        structureValid: Boolean(parsedData.type && parsedData.scores),
        timestampValid: Boolean(parsedData.timestamp && new Date(parsedData.timestamp) <= new Date()),
        signaturePresent: Boolean(parsedData.signature),
        dataComplete: Boolean(
          parsedData.judge && 
          parsedData.project && 
          parsedData.scores &&
          parsedData.scores.totalScore !== undefined
        )
      }

      // 如果有数据库记录，验证数据一致性
      if (ipfsRecord) {
        const scoreMatches = Math.abs(
          parsedData.scores.totalScore - Number(ipfsRecord.score.totalScore)
        ) < 0.01

        responseData.verification.dataConsistency = {
          projectIdMatches: parsedData.project.id === ipfsRecord.score.project.id,
          judgeIdMatches: parsedData.judge.id === ipfsRecord.score.judge.id,
          scoreMatches,
          walletAddressMatches: parsedData.signature?.walletAddress === ipfsRecord.walletAddress
        }
      }
    }

    console.log('✅ IPFS数据检索成功:', {
      hash,
      dataSize: ipfsResult.data.length,
      format: dataFormat,
      hasRecord: Boolean(ipfsRecord),
      hasMetadata: validatedQuery.includeMetadata === 'true'
    })

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error: any) {
    console.error('❌ IPFS数据检索失败:', error)
    
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
