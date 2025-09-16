import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 获取用户的粉丝列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = AuthService.verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: '无效的令牌' },
        { status: 401 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // 获取用户的粉丝
    const followers = await prisma.userFollow.findMany({
      where: {
        followingId: decoded.userId
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            bio: true,
            _count: {
              select: {
                communityPosts: {
                  where: { isDeleted: false }
                },
                followers: true,
                following: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // 获取总数
    const total = await prisma.userFollow.count({
      where: { followingId: decoded.userId }
    })

    return NextResponse.json({
      success: true,
      data: {
        followers: followers.map(follow => ({
          id: follow.id,
          followedAt: follow.createdAt.toISOString(),
          user: {
            id: follow.follower.id,
            name: follow.follower.username,
            username: follow.follower.username,
            avatar: follow.follower.avatarUrl,
            bio: follow.follower.bio,
            reputation: follow.follower.reputationScore,
            postsCount: follow.follower._count.communityPosts,
            followersCount: follow.follower._count.followers,
            followingCount: follow.follower._count.following
          }
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('获取粉丝列表错误:', error)
    return NextResponse.json(
      { error: '获取粉丝列表失败' },
      { status: 500 }
    )
  }
}
