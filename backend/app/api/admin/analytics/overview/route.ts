import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { prepareApiResponse } from '@/lib/bigint-serializer'

export async function GET(request: NextRequest) {
  try {
    // 获取国际化函数
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized') },
        { status: 401 }
      )
    }

    // 检查用户是否是管理员
    if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
      return NextResponse.json(
        { success: false, error: t('auth.forbidden') },
        { status: 403 }
      )
    }

    // 计算时间范围
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // 获取分析数据
    const [
      // 用户增长分析
      userGrowthData,
      userRoleDistribution,
      userStatusDistribution,
      
      // 内容分析
      contentCreationTrend,
      hackathonParticipation,
      projectSubmissions,
      
      // 活跃度分析
      dailyActiveUsers,
      communityEngagement,
      
      // 审核分析
      moderationWorkload,
      
      // 地理分布（如果有相关数据）
      topUsers,

      // 真实计算的指标
      averageTeamSizeResult,
      projectSubmissionStats,
      averageScoreResult,
      satisfactionScoreResult,
      collaborationScoreResult,
      averageFormationTimeResult,
      soloParticipantsResult
    ] = await Promise.all([
      // 用户增长趋势（最近30天，按天统计）
      prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*) as count
        FROM hackathon_schema.users 
        WHERE "createdAt" >= ${last30Days}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      
      // 用户角色分布
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),
      
      // 用户状态分布
      prisma.user.groupBy({
        by: ['status'],
        _count: true
      }),
      
      // 内容创建趋势（最近30天）
      Promise.all([
        prisma.$queryRaw`
          SELECT 
            DATE("createdAt") as date,
            COUNT(*) as hackathons
          FROM hackathon_schema.hackathons 
          WHERE "createdAt" >= ${last30Days}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `,
        prisma.$queryRaw`
          SELECT 
            DATE("createdAt") as date,
            COUNT(*) as projects
          FROM hackathon_schema.projects 
          WHERE "createdAt" >= ${last30Days}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `,
        prisma.$queryRaw`
          SELECT 
            DATE("createdAt") as date,
            COUNT(*) as posts
          FROM hackathon_schema.community_posts 
          WHERE "createdAt" >= ${last30Days}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `
      ]).then(([hackathons, projects, posts]) => ({
        hackathons,
        projects,
        posts
      })),
      
      // 黑客松参与度
      prisma.participation.groupBy({
        by: ['status'],
        _count: true,
        where: {
          joinedAt: {
            gte: last30Days
          }
        }
      }),
      
      // 项目提交统计
      prisma.project.groupBy({
        by: ['status'],
        _count: true,
        where: {
          createdAt: {
            gte: last30Days
          }
        }
      }),
      
      // 每日活跃用户（最近7天）
      prisma.$queryRaw`
        SELECT 
          DATE("lastLoginAt") as date,
          COUNT(DISTINCT id) as active_users
        FROM hackathon_schema.users 
        WHERE "lastLoginAt" >= ${last7Days}
        GROUP BY DATE("lastLoginAt")
        ORDER BY date ASC
      `,
      
      // 社区参与度
      Promise.all([
        prisma.communityPost.count({
          where: { createdAt: { gte: last30Days } }
        }),
        prisma.communityReply.count({
          where: { createdAt: { gte: last30Days } }
        }),
        prisma.postLike.count({
          where: { createdAt: { gte: last30Days } }
        })
      ]).then(([posts, replies, likes]) => ({
        posts,
        replies,
        likes
      })),
      
      // 审核工作量
      (prisma as any).contentReview ? Promise.all([
        (prisma as any).contentReview.count({
          where: {
            createdAt: { gte: last30Days },
            status: 'pending'
          }
        }),
        (prisma as any).contentReview.count({
          where: {
            reviewedAt: { gte: last30Days },
            status: 'approved'
          }
        }),
        (prisma as any).contentReview.count({
          where: {
            reviewedAt: { gte: last30Days },
            status: 'rejected'
          }
        })
      ]).then(([pending, approved, rejected]) => ({
        pending,
        approved,
        rejected
      })) : Promise.resolve({ pending: 0, approved: 0, rejected: 0 }),
      
      // 最活跃用户
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          reputationScore: true,
          _count: {
            select: {
              participations: true,
              projects: true,
              communityPosts: true,
              communityReplies: true
            }
          }
        },
        orderBy: {
          reputationScore: 'desc'
        },
        take: 10
      }),

      // 团队平均规模 - 从TeamMember表计算
      prisma.$queryRaw`
        SELECT AVG(member_count) as average_team_size
        FROM (
          SELECT COUNT(*) as member_count
          FROM hackathon_schema.team_members
          GROUP BY "teamId"
        ) team_sizes
      `,

      // 项目提交率 - 已提交项目数 / 总项目数
      Promise.all([
        prisma.project.count({
          where: { status: 'SUBMITTED' }
        }),
        prisma.project.count()
      ]).then(([submitted, total]) => ({
        submissionRate: total > 0 ? (submitted / total) * 100 : 0,
        submittedProjects: submitted,
        totalProjects: total
      })),

      // 项目平均评分 - 从Score表计算
      prisma.$queryRaw`
        SELECT AVG(CAST("totalScore" AS FLOAT)) as average_score
        FROM hackathon_schema.scores
        WHERE "totalScore" IS NOT NULL
      `,

      // 用户满意度 - 从Feedback表计算
      prisma.$queryRaw`
        SELECT AVG(rating) as satisfaction_score
        FROM hackathon_schema.feedbacks
      `,

      // 团队协作评分 - 基于项目评分和团队互动
      prisma.$queryRaw`
        SELECT 
          AVG(CASE WHEN tm.team_size > 1 THEN CAST(s."totalScore" AS FLOAT) ELSE NULL END) as collaboration_score
        FROM hackathon_schema.scores s
        JOIN hackathon_schema.projects p ON s."projectId" = p.id
        JOIN (
          SELECT "teamId", COUNT(*) as team_size
          FROM hackathon_schema.team_members
          GROUP BY "teamId"
        ) tm ON p."teamId" = tm."teamId"
        WHERE s."totalScore" IS NOT NULL AND tm.team_size > 1
      `,

      // 团队组建时间 - 从第一个成员加入到最后一个成员加入的平均时间
      prisma.$queryRaw`
        SELECT 
          AVG(
            EXTRACT(EPOCH FROM (max_joined - min_joined)) / 3600
          ) as average_formation_time_hours
        FROM (
          SELECT 
            "teamId",
            MIN("joinedAt") as min_joined,
            MAX("joinedAt") as max_joined
          FROM hackathon_schema.team_members
          GROUP BY "teamId"
          HAVING COUNT(*) > 1
        ) team_formation_times
      `,

      // 独立参与者数量 - 未加入任何团队的用户数
      prisma.$queryRaw`
        SELECT COUNT(*) as solo_participants
        FROM hackathon_schema.users u
        WHERE NOT EXISTS (
          SELECT 1 FROM hackathon_schema.team_members tm
          WHERE tm."userId" = u.id
        )
      `
    ])

    // 处理真实计算的指标数据
    const averageTeamSize = (averageTeamSizeResult as any[])[0]?.average_team_size || 0
    const averageScore = (averageScoreResult as any[])[0]?.average_score || 0
    const satisfactionScore = (satisfactionScoreResult as any[])[0]?.satisfaction_score || 0
    const collaborationScore = (collaborationScoreResult as any[])[0]?.collaboration_score || 0
    const averageFormationTime = (averageFormationTimeResult as any[])[0]?.average_formation_time_hours || 0
    const soloParticipants = (soloParticipantsResult as any[])[0]?.solo_participants || 0

    // 构建响应数据
    const analyticsData = {
      userAnalytics: {
        growth: userGrowthData,
        roleDistribution: userRoleDistribution,
        statusDistribution: userStatusDistribution,
        dailyActive: dailyActiveUsers
      },
      contentAnalytics: {
        creationTrend: contentCreationTrend,
        hackathonParticipation,
        projectSubmissions,
        communityEngagement
      },
      moderationAnalytics: moderationWorkload,
      topUsers: topUsers,
      realTimeMetrics: {
        averageTeamSize: Number(averageTeamSize) || 0, // 真实值，无数据时为0
        submissionRate: projectSubmissionStats?.submissionRate || 0,
        averageScore: Number(averageScore) || 0,
        satisfactionScore: Number(satisfactionScore) || 0,
        collaborationScore: Number(collaborationScore) || 0,
        averageFormationTime: Number(averageFormationTime) || 0,
        soloParticipants: Number(soloParticipants) || 0, // 真实独立参与者数
        projectSubmissionStats
      },
      summary: {
        totalUsers: (userRoleDistribution as any[]).reduce((sum: number, item: any) => sum + Number(item._count), 0),
        totalContent: {
          hackathons: (contentCreationTrend.hackathons as any[]).reduce((sum: number, item: any) => sum + parseInt(item.hackathons), 0),
          projects: (contentCreationTrend.projects as any[]).reduce((sum: number, item: any) => sum + parseInt(item.projects), 0),
          posts: (contentCreationTrend.posts as any[]).reduce((sum: number, item: any) => sum + parseInt(item.posts), 0)
        },
        activeUsersLast7Days: (dailyActiveUsers as any[]).reduce((sum: number, item: any) => sum + parseInt(item.active_users), 0),
        pendingModeration: Number(moderationWorkload.pending)
      }
    }

    // 确保所有BigInt都被序列化
    const safeData = prepareApiResponse(analyticsData)

    return NextResponse.json({
      success: true,
      data: safeData
    })

  } catch (error) {
    console.error('获取分析数据失败:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { success: false, error: t('admin.analytics.loadError') },
      { status: 500 }
    )
  }
}
