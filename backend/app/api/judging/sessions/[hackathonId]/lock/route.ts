import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { z } from 'zod'

// 锁定评审期请求验证
const lockSessionSchema = z.object({
  lockType: z.enum(['time_based', 'manual', 'emergency']).default('manual'),
  reason: z.string().optional(),
  gracePeriodMinutes: z.number().min(0).max(1440).optional().default(0), // 最多24小时宽限期
  affectedJudges: z.array(z.string()).optional(),
  affectedProjects: z.array(z.string()).optional(),
  forceFinalize: z.boolean().optional().default(false) // 是否强制最终确认所有评分
})

/**
 * 锁定评审期API
 * POST /api/judging/sessions/[hackathonId]/lock
 * 
 * 功能：
 * - 锁定指定黑客松的评审期
 * - 阻止新的评分提交和修改
 * - 可选择强制最终确认所有未确认的评分
 * - 支持宽限期设置
 * - 记录锁定操作和影响范围
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)
  const { hackathonId } = params

  try {
    // 验证用户身份（只有管理员可以锁定评审期）
    const user = await auth(request)
    if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
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
    const validatedData = lockSessionSchema.parse(body)

    console.log('🔒 锁定评审期请求:', hackathonId, user.id, validatedData)

    // 验证黑客松存在
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      include: {
        judgingSessions: {
          include: {
            judgingLocks: {
              where: { isActive: true }
            }
          }
        },
        judges: {
          select: {
            id: true,
            userId: true,
            assignedProjects: true
          }
        }
      }
    })

    if (!hackathon) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('judging.errors.hackathonNotFound'),
          code: 'HACKATHON_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // 检查是否已经锁定
    const activeLock = hackathon.judgingSessions
      .flatMap(session => session.judgingLocks)
      .find(lock => lock.isActive)

    if (activeLock) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('judging.errors.alreadyLocked'),
          code: 'ALREADY_LOCKED',
          data: {
            lockId: activeLock.id,
            lockedAt: activeLock.lockedAt,
            lockType: activeLock.lockType
          }
        },
        { status: 409 }
      )
    }

    // 获取所有评审会话
    const sessions = hackathon.judgingSessions

    // 获取受影响的评委和项目
    const affectedJudges = validatedData.affectedJudges || 
      hackathon.judges.map(j => j.userId)
    
    const affectedProjects = validatedData.affectedProjects ||
      hackathon.judges.flatMap(j => 
        Array.isArray(j.assignedProjects) ? j.assignedProjects as string[] : []
      )

    // 在事务中执行锁定操作
    const result = await prisma.$transaction(async (tx) => {
      // 1. 锁定所有相关的评审会话
      const updatedSessions = await Promise.all(
        sessions.map(session => 
          tx.judgingSession.update({
            where: { id: session.id },
            data: {
              isLocked: true,
              lockTimestamp: new Date(),
              lockGracePeriod: validatedData.gracePeriodMinutes
            }
          })
        )
      )

      // 2. 创建锁定记录
      const lockRecord = await tx.judgingLock.create({
        data: {
          hackathonId,
          sessionId: sessions.length === 1 ? sessions[0].id : null, // 如果只有一个会话，关联它
          lockType: validatedData.lockType,
          isActive: true,
          lockedAt: new Date(),
          lockedBy: user.id,
          gracePeriodMinutes: validatedData.gracePeriodMinutes,
          affectedJudges,
          affectedProjects,
          lockMetadata: {
            reason: validatedData.reason,
            sessionCount: sessions.length,
            judgeCount: affectedJudges.length,
            projectCount: affectedProjects.length,
            userAgent: request.headers.get('user-agent'),
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
          }
        }
      })

      // 3. 如果选择强制最终确认，更新所有未确认的评分
      let finalizedScores: any = { count: 0 }
      if (validatedData.forceFinalize) {
        const judgeIds = hackathon.judges.map(j => j.id)
        
        finalizedScores = await tx.score.updateMany({
          where: {
            judgeId: { in: judgeIds },
            projectId: { in: affectedProjects },
            isFinalized: false,
            totalScore: { not: null } // 只确认已有总分的评分
          },
          data: {
            isFinalized: true,
            finalizedAt: new Date()
          }
        })
      }

      // 4. 发送通知给受影响的评委
      const notifications = await Promise.all(
        affectedJudges.map(judgeUserId => 
          tx.notification.create({
            data: {
              userId: judgeUserId,
              type: 'SYSTEM_ANNOUNCEMENT',
              title: t('judging.notifications.periodLocked.title'),
              message: t('judging.notifications.periodLocked.message', {
                hackathonTitle: hackathon.title,
                lockType: validatedData.lockType,
                reason: validatedData.reason || t('judging.notifications.periodLocked.defaultReason')
              }),
              priority: 'HIGH',
              category: 'SYSTEM',
              data: {
                hackathonId,
                lockId: lockRecord.id,
                lockType: validatedData.lockType,
                gracePeriodMinutes: validatedData.gracePeriodMinutes
              }
            }
          })
        )
      )

      return {
        lockRecord,
        updatedSessions,
        finalizedScores,
        notifications
      }
    })

    console.log('✅ 评审期锁定成功:', {
      lockId: result.lockRecord.id,
      hackathonId,
      sessionsLocked: result.updatedSessions.length,
      judgesAffected: affectedJudges.length,
      projectsAffected: affectedProjects.length,
      scoresFinalized: validatedData.forceFinalize ? result.finalizedScores.count : 0,
      notificationsSent: result.notifications.length
    })

    return NextResponse.json({
      success: true,
      data: {
        lock: {
          id: result.lockRecord.id,
          hackathonId,
          lockType: result.lockRecord.lockType,
          lockedAt: result.lockRecord.lockedAt,
          lockedBy: user.id,
          gracePeriodMinutes: result.lockRecord.gracePeriodMinutes,
          affectedJudges: result.lockRecord.affectedJudges,
          affectedProjects: result.lockRecord.affectedProjects
        },
        impact: {
          sessionsLocked: result.updatedSessions.length,
          judgesAffected: affectedJudges.length,
          projectsAffected: affectedProjects.length,
          scoresFinalized: validatedData.forceFinalize ? result.finalizedScores.count : 0,
          notificationsSent: result.notifications.length
        },
        message: t('judging.success.periodLocked', {
          hackathonTitle: hackathon.title,
          judgeCount: affectedJudges.length.toString()
        })
      }
    })

  } catch (error: any) {
    console.error('❌ 锁定评审期失败:', error)
    
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

// 解锁评审期请求验证
const unlockSessionSchema = z.object({
  reason: z.string().min(1, 'Unlock reason is required'),
  extendMinutes: z.number().min(0).max(10080).optional().default(0), // 最多延长7天
  notifyJudges: z.boolean().optional().default(true)
})

/**
 * 解锁评审期API
 * DELETE /api/judging/sessions/[hackathonId]/lock
 * 
 * 功能：
 * - 解锁指定黑客松的评审期
 * - 允许评委继续提交和修改评分
 * - 可选择延长评审截止时间
 * - 记录解锁操作和原因
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)
  const { hackathonId } = params

  try {
    // 验证用户身份（只有管理员可以解锁评审期）
    const user = await auth(request)
    if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
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
    const validatedData = unlockSessionSchema.parse(body)

    console.log('🔓 解锁评审期请求:', hackathonId, user.id, validatedData)

    // 获取当前锁定记录
    const activeLock = await prisma.judgingLock.findFirst({
      where: {
        hackathonId,
        isActive: true
      },
      include: {
        hackathon: {
          include: {
            judgingSessions: true,
            judges: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    })

    if (!activeLock) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('judging.errors.notLocked'),
          code: 'NOT_LOCKED'
        },
        { status: 404 }
      )
    }

    // 在事务中执行解锁操作
    const result = await prisma.$transaction(async (tx) => {
      // 1. 解锁所有评审会话
      const updatedSessions = await Promise.all(
        activeLock.hackathon.judgingSessions.map(session => {
          const newEndTime = validatedData.extendMinutes > 0 
            ? new Date(session.endTime.getTime() + validatedData.extendMinutes * 60 * 1000)
            : session.endTime

          return tx.judgingSession.update({
            where: { id: session.id },
            data: {
              isLocked: false,
              lockTimestamp: null,
              endTime: newEndTime
            }
          })
        })
      )

      // 2. 更新锁定记录为非活跃状态
      const updatedLock = await tx.judgingLock.update({
        where: { id: activeLock.id },
        data: {
          isActive: false,
          unlockedAt: new Date(),
          unlockedBy: user.id,
          unlockReason: validatedData.reason,
          lockMetadata: {
            ...(activeLock.lockMetadata as object || {}),
            unlockReason: validatedData.reason,
            extendedMinutes: validatedData.extendMinutes,
            unlockedBy: user.id,
            unlockedAt: new Date().toISOString()
          }
        }
      })

      // 3. 如果选择通知评委，发送解锁通知
      let notifications: any[] = []
      if (validatedData.notifyJudges) {
        const judgeUserIds = activeLock.hackathon.judges.map(j => j.userId)
        
        notifications = await Promise.all(
          judgeUserIds.map(judgeUserId => 
            tx.notification.create({
              data: {
                userId: judgeUserId,
                type: 'SYSTEM_ANNOUNCEMENT',
                title: t('judging.notifications.periodUnlocked.title'),
                message: t('judging.notifications.periodUnlocked.message', {
                  hackathonTitle: activeLock.hackathon.title,
                  reason: validatedData.reason,
                  extendedTime: validatedData.extendMinutes > 0 
                    ? t('judging.notifications.periodUnlocked.extended', { minutes: validatedData.extendMinutes.toString() })
                    : ''
                }),
                priority: 'MEDIUM',
                category: 'SYSTEM',
                data: {
                  hackathonId,
                  lockId: activeLock.id,
                  extendedMinutes: validatedData.extendMinutes,
                  newDeadlines: updatedSessions.map(s => ({
                    sessionId: s.id,
                    endTime: s.endTime
                  }))
                }
              }
            })
          )
        )
      }

      return {
        updatedLock,
        updatedSessions,
        notifications
      }
    })

    console.log('✅ 评审期解锁成功:', {
      lockId: result.updatedLock.id,
      hackathonId,
      sessionsUnlocked: result.updatedSessions.length,
      extendedMinutes: validatedData.extendMinutes,
      notificationsSent: result.notifications.length
    })

    return NextResponse.json({
      success: true,
      data: {
        lock: {
          id: result.updatedLock.id,
          unlockedAt: result.updatedLock.unlockedAt,
          unlockedBy: result.updatedLock.unlockedBy,
          reason: result.updatedLock.unlockReason,
          extendedMinutes: validatedData.extendMinutes
        },
        sessions: result.updatedSessions.map(session => ({
          id: session.id,
          name: session.name,
          endTime: session.endTime,
          isLocked: session.isLocked
        })),
        impact: {
          sessionsUnlocked: result.updatedSessions.length,
          judgesNotified: result.notifications.length,
          timeExtended: validatedData.extendMinutes > 0
        },
        message: t('judging.success.periodUnlocked', {
          hackathonTitle: activeLock.hackathon.title,
          extendInfo: validatedData.extendMinutes > 0 
            ? t('judging.success.timeExtended', { minutes: validatedData.extendMinutes.toString() })
            : ''
        })
      }
    })

  } catch (error: any) {
    console.error('❌ 解锁评审期失败:', error)
    
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
