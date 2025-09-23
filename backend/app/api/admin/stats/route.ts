import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { prepareApiResponse } from '@/lib/bigint-serializer'

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

    // 检查用户是否是管理员
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    // 获取统计数据
    const [
      totalUsers,
      activeUsers,
      totalPosts,
      totalHackathons,
      totalProjects,
      pendingReviews,
      userGrowth,
      postGrowth,
      hackathonGrowth,
      projectGrowth
    ] = await Promise.all([
      // 总用户数
      prisma.user.count(),
      
      // 活跃用户数（最近7天有活动的用户）
      prisma.user.count({
        where: {
          OR: [
            { lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            { participations: { some: { joinedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } },
            { communityPosts: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } }
          ]
        }
      }),
      
      // 总帖子数
      prisma.communityPost.count(),
      
      // 总黑客松数
      prisma.hackathon.count(),
      
      // 总项目数
      prisma.project.count(),
      
      // 待审核项目数
      prisma.project.count({
        where: { status: 'SUBMITTED' }
      }),
      
      // 用户增长（本月新增用户数）
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      }),
      
      // 帖子增长（本月新增帖子数）
      prisma.communityPost.count({
        where: {
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      }),
      
      // 黑客松增长（本月新增黑客松数）
      prisma.hackathon.count({
        where: {
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      }),
      
      // 项目增长（本月新增项目数）
      prisma.project.count({
        where: {
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      })
    ])

    // 计算增长率
    const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    const [lastMonthUsers, lastMonthPosts, lastMonthHackathons, lastMonthProjects] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: lastMonth, lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      }),
      prisma.communityPost.count({
        where: {
          createdAt: { gte: lastMonth, lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      }),
      prisma.hackathon.count({
        where: {
          createdAt: { gte: lastMonth, lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      }),
      prisma.project.count({
        where: {
          createdAt: { gte: lastMonth, lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      })
    ])

    const userGrowthRate = lastMonthUsers > 0 ? ((userGrowth - lastMonthUsers) / lastMonthUsers * 100).toFixed(1) : '0'
    const postGrowthRate = lastMonthPosts > 0 ? ((postGrowth - lastMonthPosts) / lastMonthPosts * 100).toFixed(1) : '0'
    const hackathonGrowthRate = lastMonthHackathons > 0 ? ((hackathonGrowth - lastMonthHackathons) / lastMonthHackathons * 100).toFixed(1) : '0'
    const projectGrowthRate = lastMonthProjects > 0 ? ((projectGrowth - lastMonthProjects) / lastMonthProjects * 100).toFixed(1) : '0'

    const responseData = {
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalPosts,
          totalHackathons,
          totalProjects,
          pendingReviews
        },
        growth: {
          users: {
            count: userGrowth,
            rate: userGrowthRate
          },
          posts: {
            count: postGrowth,
            rate: postGrowthRate
          },
          hackathons: {
            count: hackathonGrowth,
            rate: hackathonGrowthRate
          },
          projects: {
            count: projectGrowth,
            rate: projectGrowthRate
          }
        }
      }
    }

    return NextResponse.json(prepareApiResponse(responseData))

  } catch (error) {
    console.error('获取统计数据错误:', error)
    return NextResponse.json(
      { success: false, error: '获取统计数据失败' },
      { status: 500 }
    )
  }
} 