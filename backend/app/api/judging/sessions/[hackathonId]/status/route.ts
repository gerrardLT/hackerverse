import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

/**
 * 获取评审期状态API
 * GET /api/judging/sessions/[hackathonId]/status
 * 
 * 功能：
 * - 获取指定黑客松的评审期状态
 * - 检查是否锁定、宽限期状态
 * - 返回评审进度和时间信息
 * - 评委专用状态检查
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)
  const { hackathonId } = params

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

    console.log('📊 获取评审期状态:', hackathonId, user.id)

    // 获取黑客松和相关信息
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      include: {
        judgingSessions: {
          include: {
            judgingLocks: {
              where: { isActive: true }
            }
          },
          orderBy: { startTime: 'asc' }
        },
        judges: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true
              }
            },
            scores: {
              where: {
                project: {
                  hackathonId: hackathonId
                }
              },
              select: {
                id: true,
                projectId: true,
                isFinalized: true,
                totalScore: true,
                createdAt: true
              }
            }
          }
        },
        projects: {
          where: {
            status: {
              in: ['SUBMITTED', 'REVIEWED']
            }
          },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true
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

    // 检查用户是否是该黑客松的评委（如果是JUDGE角色）
    const currentJudge = user.role === 'JUDGE' 
      ? hackathon.judges.find(j => j.userId === user.id)
      : null

    if (user.role === 'JUDGE' && !currentJudge) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('judging.errors.notAssignedJudge'),
          code: 'NOT_ASSIGNED_JUDGE'
        },
        { status: 403 }
      )
    }

    // 分析当前锁定状态
    const activeLock = hackathon.judgingSessions
      .flatMap(session => session.judgingLocks)
      .find(lock => lock.isActive)

    const currentTime = new Date()
    
    // 检查每个评审会话的状态
    const sessionStatuses = hackathon.judgingSessions.map(session => {
      const isActive = session.status === 'ACTIVE'
      const hasStarted = currentTime >= new Date(session.startTime)
      const hasEnded = currentTime > new Date(session.endTime)
      const isLocked = session.isLocked || Boolean(activeLock)
      
      // 检查宽限期
      let inGracePeriod = false
      let gracePeriodEndsAt = null
      
      if (hasEnded && !isLocked && session.autoLockEnabled && session.lockGracePeriod > 0) {
        const gracePeriodEnd = new Date(new Date(session.endTime).getTime() + session.lockGracePeriod * 60 * 1000)
        inGracePeriod = currentTime < gracePeriodEnd
        gracePeriodEndsAt = gracePeriodEnd
      }

      // 确定会话状态
      let status: string
      if (isLocked) {
        status = 'LOCKED'
      } else if (!hasStarted) {
        status = 'SCHEDULED'
      } else if (hasEnded) {
        if (inGracePeriod) {
          status = 'GRACE_PERIOD'
        } else {
          status = 'EXPIRED'
        }
      } else if (isActive && hasStarted) {
        status = 'ACTIVE'
      } else {
        status = 'INACTIVE'
      }

      return {
        id: session.id,
        name: session.name,
        description: session.description,
        startTime: session.startTime,
        endTime: session.endTime,
        status,
        isLocked,
        inGracePeriod,
        gracePeriodEndsAt,
        autoLockEnabled: session.autoLockEnabled,
        lockGracePeriod: session.lockGracePeriod,
        allowLateSubmission: session.allowLateSubmission
      }
    })

    // 计算评审进度统计
    const allProjects = hackathon.projects
    const totalProjects = allProjects.length
    
    // 获取当前用户相关的评委（如果是评委）或所有评委（如果是管理员）
    const relevantJudges = user.role === 'JUDGE' && currentJudge
      ? [currentJudge]
      : hackathon.judges

    // 计算评分统计
    const scoreStats = {
      totalScores: 0,
      completedScores: 0,
      finalizedScores: 0,
      averageScore: 0
    }

    let allScores: any[] = []
    relevantJudges.forEach(judge => {
      allScores.push(...judge.scores)
      scoreStats.totalScores += judge.scores.length
      scoreStats.completedScores += judge.scores.filter(s => s.totalScore !== null).length
      scoreStats.finalizedScores += judge.scores.filter(s => s.isFinalized).length
    })

    if (allScores.length > 0) {
      const totalScoreSum = allScores
        .filter(s => s.totalScore !== null)
        .reduce((sum, s) => sum + Number(s.totalScore), 0)
      scoreStats.averageScore = totalScoreSum / scoreStats.completedScores || 0
    }

    // 个人评审进度（仅评委可见）
    let personalProgress = null
    if (user.role === 'JUDGE' && currentJudge) {
      const assignedProjects = Array.isArray(currentJudge.assignedProjects) 
        ? currentJudge.assignedProjects as string[]
        : []
      
      personalProgress = {
        assignedCount: assignedProjects.length,
        scoredCount: currentJudge.scores.length,
        completedCount: currentJudge.scores.filter(s => s.totalScore !== null).length,
        finalizedCount: currentJudge.scores.filter(s => s.isFinalized).length,
        completionRate: assignedProjects.length > 0 
          ? (currentJudge.scores.filter(s => s.totalScore !== null).length / assignedProjects.length) * 100
          : 0
      }
    }

    // 判断总体评审状态
    const overallStatus = (() => {
      if (activeLock) return 'LOCKED'
      
      const activeSession = sessionStatuses.find(s => s.status === 'ACTIVE')
      if (activeSession) return 'ACTIVE'
      
      const gracePeriodSession = sessionStatuses.find(s => s.status === 'GRACE_PERIOD')
      if (gracePeriodSession) return 'GRACE_PERIOD'
      
      const scheduledSession = sessionStatuses.find(s => s.status === 'SCHEDULED')
      if (scheduledSession) return 'SCHEDULED'
      
      return 'EXPIRED'
    })()

    // 下一个重要时间点
    const nextImportantTime = (() => {
      const now = currentTime.getTime()
      
      // 如果在宽限期，返回宽限期结束时间
      const gracePeriodSession = sessionStatuses.find(s => s.inGracePeriod)
      if (gracePeriodSession?.gracePeriodEndsAt) {
        return {
          type: 'grace_period_end',
          time: gracePeriodSession.gracePeriodEndsAt,
          sessionId: gracePeriodSession.id
        }
      }
      
      // 查找即将开始的会话
      const upcomingSession = sessionStatuses
        .filter(s => s.status === 'SCHEDULED')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .shift()
      
      if (upcomingSession) {
        return {
          type: 'session_start',
          time: upcomingSession.startTime,
          sessionId: upcomingSession.id
        }
      }
      
      // 查找即将结束的活跃会话
      const activeSession = sessionStatuses.find(s => s.status === 'ACTIVE')
      if (activeSession) {
        return {
          type: 'session_end',
          time: activeSession.endTime,
          sessionId: activeSession.id
        }
      }
      
      return null
    })()

    console.log('✅ 成功获取评审期状态:', {
      hackathonId,
      overallStatus,
      sessionsCount: sessionStatuses.length,
      totalProjects,
      scoreStats,
      isJudge: user.role === 'JUDGE',
      hasPersonalProgress: Boolean(personalProgress)
    })

    return NextResponse.json({
      success: true,
      data: {
        hackathon: {
          id: hackathon.id,
          title: hackathon.title,
          status: hackathon.status,
          endDate: hackathon.endDate
        },
        overallStatus,
        isLocked: Boolean(activeLock),
        lockInfo: activeLock ? {
          id: activeLock.id,
          lockType: activeLock.lockType,
          lockedAt: activeLock.lockedAt,
          reason: (activeLock.lockMetadata as any)?.reason,
          gracePeriodMinutes: activeLock.gracePeriodMinutes
        } : null,
        sessions: sessionStatuses,
        nextImportantTime,
        projectStats: {
          total: totalProjects,
          submitted: allProjects.filter(p => p.status === 'SUBMITTED').length,
          reviewed: allProjects.filter(p => p.status === 'REVIEWED').length
        },
        scoreStats,
        personalProgress, // 仅评委可见
        judges: user.role !== 'JUDGE' ? hackathon.judges.map(judge => ({
          id: judge.id,
          user: judge.user,
          role: judge.role,
          expertise: judge.expertise,
          assignedProjectCount: Array.isArray(judge.assignedProjects) 
            ? (judge.assignedProjects as string[]).length 
            : 0,
          scoreCount: judge.scores.length,
          completedCount: judge.scores.filter(s => s.totalScore !== null).length,
          finalizedCount: judge.scores.filter(s => s.isFinalized).length
        })) : undefined, // 管理员可见所有评委信息
        permissions: {
          canViewAllScores: ['ADMIN', 'MODERATOR'].includes(user.role),
          canLockUnlock: ['ADMIN', 'MODERATOR'].includes(user.role),
          canSubmitScores: overallStatus !== 'LOCKED' && Boolean(currentJudge),
          canFinalizeScores: overallStatus !== 'LOCKED' && Boolean(currentJudge)
        }
      }
    })

  } catch (error: any) {
    console.error('❌ 获取评审期状态失败:', error)

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
