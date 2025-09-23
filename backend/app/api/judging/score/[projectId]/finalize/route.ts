import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { uploadToIPFS } from '@/lib/ipfs'
import { z } from 'zod'

// 最终确认评分请求验证
const finalizeScoreSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required'),
  signature: z.string().min(1, 'Signature is required'),
  signatureMessage: z.string().optional(), // 签名消息（用于验证）
  additionalMetadata: z.object({}).passthrough().optional() // 额外的元数据
})

/**
 * 最终确认评分并上传IPFS + 钱包签名API
 * POST /api/judging/score/[projectId]/finalize
 * 
 * 功能：
 * - 最终确认评委对项目的评分
 * - 将评分数据上传到IPFS
 * - 验证和存储钱包签名
 * - 锁定评分，防止后续修改
 * - 生成不可篡改的评分记录
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)
  const { projectId } = params

  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user || !['ADMIN', 'MODERATOR', 'JUDGE'].includes(user.role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('common.errors.insufficientPermissions'),
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = finalizeScoreSchema.parse(body)

    console.log('🔐 最终确认评分请求:', projectId, user.id, {
      walletAddress: validatedData.walletAddress,
      hasSignature: Boolean(validatedData.signature)
    })

    // 获取项目和评委信息
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        hackathon: {
          include: {
            judgingSessions: {
              include: {
                judgingLocks: {
                  where: { isActive: true }
                }
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            email: true
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

    // 检查评审期是否已锁定
    const isLocked = project.hackathon?.judgingSessions.some(session => 
      session.isLocked || session.judgingLocks.some(lock => lock.isActive)
    ) || false

    if (isLocked) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('judging.errors.periodLocked'),
          code: 'JUDGING_PERIOD_LOCKED'
        },
        { status: 403 }
      )
    }

    // 获取评委信息
    const judge = await prisma.judge.findFirst({
      where: {
        userId: user.id,
        hackathonId: project.hackathonId || ''
      }
    })

    if (!judge && user.role === 'JUDGE') {
      return NextResponse.json(
        { 
          success: false, 
          error: t('judging.errors.notAssignedJudge'),
          code: 'NOT_ASSIGNED_JUDGE'
        },
        { status: 403 }
      )
    }

    // 获取现有评分
    const existingScore = await prisma.score.findFirst({
      where: {
        projectId,
        judgeId: judge?.id || ''
      },
      include: {
        ipfsRecords: true
      }
    })

    if (!existingScore) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('judging.errors.scoreNotFound'),
          code: 'SCORE_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // 检查是否已经最终确认
    if (existingScore.isFinalized) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('judging.errors.alreadyFinalized'),
          code: 'ALREADY_FINALIZED',
          data: {
            finalizedAt: existingScore.finalizedAt,
            ipfsHash: existingScore.ipfsHash,
            hasSignature: Boolean(existingScore.walletSignature)
          }
        },
        { status: 409 }
      )
    }

    // 检查评分是否完整（必须有总分）
    if (!existingScore.totalScore) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('judging.errors.incompleteScore'),
          code: 'INCOMPLETE_SCORE'
        },
        { status: 400 }
      )
    }

    // 准备IPFS存储的数据结构
    const ipfsData = {
      version: '1.0',
      type: 'hackathon_judge_score',
      timestamp: new Date().toISOString(),
      judge: {
        id: judge?.id,
        userId: user.id,
        walletAddress: validatedData.walletAddress,
        role: judge?.role || 'admin',
        expertise: judge?.expertise
      },
      project: {
        id: project.id,
        title: project.title,
        hackathonId: project.hackathonId,
        creatorId: project.creatorId
      },
      hackathon: {
        id: project.hackathon?.id,
        title: project.hackathon?.title,
        endDate: project.hackathon?.endDate
      },
      scores: {
        innovation: existingScore.innovation ? Number(existingScore.innovation) : null,
        technicalComplexity: existingScore.technicalComplexity ? Number(existingScore.technicalComplexity) : null,
        userExperience: existingScore.userExperience ? Number(existingScore.userExperience) : null,
        businessPotential: existingScore.businessPotential ? Number(existingScore.businessPotential) : null,
        presentation: existingScore.presentation ? Number(existingScore.presentation) : null,
        totalScore: Number(existingScore.totalScore)
      },
      comments: existingScore.comments,
      signature: {
        walletAddress: validatedData.walletAddress,
        signature: validatedData.signature,
        message: validatedData.signatureMessage,
        timestamp: new Date().toISOString()
      },
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        locale,
        scoreCreatedAt: existingScore.createdAt,
        scoreUpdatedAt: existingScore.updatedAt,
        ...validatedData.additionalMetadata
      }
    }

    // 在事务中执行最终确认操作
    const result = await prisma.$transaction(async (tx) => {
      // 1. 上传数据到IPFS
      console.log('📤 上传评分数据到IPFS...')
      const ipfsUploadResult = await uploadToIPFS(JSON.stringify(ipfsData, null, 2))
      
      if (!ipfsUploadResult.success || !ipfsUploadResult.hash) {
        throw new Error('Failed to upload to IPFS: ' + ipfsUploadResult.error)
      }

      const ipfsHash = ipfsUploadResult.hash
      console.log('✅ IPFS上传成功:', ipfsHash)

      // 2. 更新评分记录
      const updatedScore = await tx.score.update({
        where: { id: existingScore.id },
        data: {
          isFinalized: true,
          finalizedAt: new Date(),
          walletSignature: validatedData.signature,
          signatureTimestamp: new Date(),
          ipfsHash: ipfsHash
        }
      })

      // 3. 创建IPFS记录
      const ipfsRecord = await tx.judgingIpfsRecord.create({
        data: {
          scoreId: existingScore.id,
          judgeId: judge?.id || '',
          projectId: project.id,
          hackathonId: project.hackathonId || '',
          ipfsHash: ipfsHash,
          walletAddress: validatedData.walletAddress,
          signature: validatedData.signature,
          signatureMessage: validatedData.signatureMessage,
          verificationStatus: 'pending',
          dataStructure: ipfsData,
          metadata: {
            uploadedAt: new Date().toISOString(),
            userAgent: request.headers.get('user-agent'),
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            dataSize: JSON.stringify(ipfsData).length
          }
        }
      })

      // 4. 发送通知给项目创建者
      const notification = await tx.notification.create({
        data: {
          userId: project.creatorId,
          type: 'SCORE_FINALIZED',
          title: t('judging.notifications.scoreFinalized.title'),
          message: t('judging.notifications.scoreFinalized.message', {
            projectTitle: project.title,
            judgeName: user.username || user.email,
            score: Number(existingScore.totalScore)
          }),
          priority: 'MEDIUM',
          category: 'JUDGING',
          data: {
            projectId: project.id,
            scoreId: existingScore.id,
            judgeId: judge?.id,
            ipfsHash: ipfsHash,
            totalScore: Number(existingScore.totalScore)
          }
        }
      })

      // 5. 如果是管理员操作，也通知相关评委
      let judgeNotification = null
      if (user.role !== 'JUDGE' && judge) {
        judgeNotification = await tx.notification.create({
          data: {
            userId: judge.userId,
            type: 'SCORE_FINALIZED_BY_ADMIN',
            title: t('judging.notifications.scoreFinalizedByAdmin.title'),
            message: t('judging.notifications.scoreFinalizedByAdmin.message', {
              projectTitle: project.title,
              adminName: user.username || user.email
            }),
            priority: 'LOW',
            category: 'JUDGING',
            data: {
              projectId: project.id,
              scoreId: existingScore.id,
              adminId: user.id,
              ipfsHash: ipfsHash
            }
          }
        })
      }

      return {
        updatedScore,
        ipfsRecord,
        notification,
        judgeNotification,
        ipfsHash
      }
    })

    console.log('✅ 评分最终确认成功:', {
      scoreId: result.updatedScore.id,
      projectId,
      ipfsHash: result.ipfsHash,
      finalizedAt: result.updatedScore.finalizedAt
    })

    return NextResponse.json({
      success: true,
      data: {
        score: {
          id: result.updatedScore.id,
          projectId: result.updatedScore.projectId,
          judgeId: result.updatedScore.judgeId,
          totalScore: Number(result.updatedScore.totalScore),
          isFinalized: result.updatedScore.isFinalized,
          finalizedAt: result.updatedScore.finalizedAt,
          ipfsHash: result.updatedScore.ipfsHash,
          walletSignature: Boolean(result.updatedScore.walletSignature),
          signatureTimestamp: result.updatedScore.signatureTimestamp
        },
        ipfsRecord: {
          id: result.ipfsRecord.id,
          hash: result.ipfsRecord.ipfsHash,
          walletAddress: result.ipfsRecord.walletAddress,
          verificationStatus: result.ipfsRecord.verificationStatus,
          createdAt: result.ipfsRecord.createdAt
        },
        verification: {
          ipfsUrl: `https://ipfs.io/ipfs/${result.ipfsHash}`,
          dataStructure: ipfsData,
          verifiable: true
        },
        message: t('judging.success.scoreFinalized', {
          projectTitle: project.title,
          score: Number(result.updatedScore.totalScore)
        })
      }
    })

  } catch (error: any) {
    console.error('❌ 最终确认评分失败:', error)
    
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

    // IPFS上传失败
    if (error.message?.includes('Failed to upload to IPFS')) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('judging.errors.ipfsUploadFailed'),
          code: 'IPFS_UPLOAD_FAILED',
          details: error.message
        },
        { status: 503 }
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
