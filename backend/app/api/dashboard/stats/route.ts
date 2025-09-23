import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }

    // 并行获取各项统计数据
    const [
      // 基础统计
      participatedHackathons,
      organizedHackathons,
      submittedProjects,
      wonPrizes,
      teamMemberships,
      judgeRoles,
      
      // 声誉相关
      currentUser,
      reputationTotal,
      
      // 成就统计
      achievementStats,
      
      // 社区活动
      communityPosts,
      communityReplies,
      postLikes,
      replyLikes,
      followers,
      following,
      
      // 时间统计
      participationTrend,
      projectTrend
    ] = await Promise.all([
      // 参与的黑客松数量
      prisma.participation.count({ 
        where: { userId: user.id } 
      }),
      
      // 组织的黑客松数量
      prisma.hackathon.count({ 
        where: { organizerId: user.id } 
      }),
      
      // 提交的项目数量
      prisma.project.count({
        where: {
          OR: [
            { creatorId: user.id },
            { team: { members: { some: { userId: user.id } } } }
          ]
        }
      }),
      
      // 获奖项目数量
      prisma.project.count({
        where: {
          OR: [
            { creatorId: user.id },
            { team: { members: { some: { userId: user.id } } } }
          ],
          status: 'WINNER'
        }
      }),
      
      // 团队成员身份数量
      prisma.teamMember.count({ 
        where: { userId: user.id } 
      }),
      
      // 评委角色数量
      prisma.judge.count({ 
        where: { userId: user.id } 
      }),
      
      // 当前用户信息
      prisma.user.findUnique({
        where: { id: user.id },
        select: { reputationScore: true }
      }),
      
      // 声誉积分总和（从记录计算）
      prisma.reputationRecord.aggregate({
        where: { 
          userId: user.id,
          isValid: true
        },
        _sum: { points: true }
      }),
      
      // 成就统计
      (prisma as any).userAchievement ? 
        (prisma as any).userAchievement.groupBy({
          by: ['isCompleted'],
          where: { 
            userId: user.id,
            isVisible: true
          },
          _count: true
        }) : 
        Promise.resolve([]),
      
      // 社区统计
      prisma.communityPost.count({
        where: { 
          authorId: user.id,
          isDeleted: false
        }
      }),
      
      prisma.communityReply.count({
        where: { 
          authorId: user.id,
          isDeleted: false
        }
      }),
      
      prisma.postLike.count({
        where: { userId: user.id }
      }),
      
      prisma.replyLike.count({
        where: { userId: user.id }
      }),
      
      prisma.userFollow.count({
        where: { followingId: user.id }
      }),
      
      prisma.userFollow.count({
        where: { followerId: user.id }
      }),
      
      // 最近12个月参与趋势
      prisma.participation.findMany({
        where: {
          userId: user.id,
          joinedAt: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 一年前
          }
        },
        select: {
          joinedAt: true
        },
        orderBy: { joinedAt: 'asc' }
      }),
      
      // 最近12个月项目趋势
      prisma.project.findMany({
        where: {
          OR: [
            { creatorId: user.id },
            { team: { members: { some: { userId: user.id } } } }
          ],
          createdAt: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 一年前
          }
        },
        select: {
          createdAt: true,
          status: true
        },
        orderBy: { createdAt: 'asc' }
      })
    ])

    // 计算月度趋势
    const getMonthlyTrend = (records: { joinedAt?: Date; createdAt?: Date }[]) => {
      const monthlyCount: Record<string, number> = {}
      
      records.forEach(record => {
        const date = record.joinedAt || record.createdAt
        if (date) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1
        }
      })
      
      // 生成最近12个月的完整数组
      const months = []
      for (let i = 11; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        months.push({
          month: monthKey,
          count: monthlyCount[monthKey] || 0
        })
      }
      
      return months
    }

    // 计算成就统计
    const completedAchievements = Array.isArray(achievementStats) ? 
      (achievementStats.find(s => s.isCompleted)?._count || 0) : 0
    const totalAchievements = Array.isArray(achievementStats) ? 
      achievementStats.reduce((sum, s) => sum + s._count, 0) : 0

    // 声誉等级计算
    const reputationScore = currentUser?.reputationScore || 0
    const level = Math.floor(reputationScore / 100) + 1
    const nextLevelPoints = level * 100
    const pointsToNextLevel = Math.max(0, nextLevelPoints - reputationScore)

    const stats = {
      // 基础统计
      hackathons: {
        participated: participatedHackathons,
        organized: organizedHackathons,
        total: participatedHackathons + organizedHackathons
      },
      
      projects: {
        submitted: submittedProjects,
        won: wonPrizes,
        winRate: submittedProjects > 0 ? (wonPrizes / submittedProjects * 100) : 0
      },
      
      teams: {
        joined: teamMemberships,
        asJudge: judgeRoles
      },
      
      // 声誉系统
      reputation: {
        score: reputationScore,
        level,
        pointsToNextLevel,
        nextLevelPoints,
        progressPercentage: ((reputationScore % 100) / 100) * 100,
        totalEarned: reputationTotal._sum.points || 0
      },
      
      // 成就系统
      achievements: {
        completed: completedAchievements,
        total: totalAchievements,
        completionRate: totalAchievements > 0 ? (completedAchievements / totalAchievements * 100) : 0
      },
      
      // 社区活动
      community: {
        posts: communityPosts,
        replies: communityReplies,
        likesGiven: postLikes + replyLikes,
        followers,
        following,
        engagement: communityPosts + communityReplies + postLikes + replyLikes
      },
      
      // 趋势数据
      trends: {
        participations: getMonthlyTrend(participationTrend),
        projects: getMonthlyTrend(projectTrend)
      }
    }

    return NextResponse.json({
      success: true,
      data: { stats }
    })

  } catch (error) {
    console.error('获取用户统计数据错误:', error)
    return NextResponse.json(
      { success: false, error: '获取统计数据失败' },
      { status: 500 }
    )
  }
}
