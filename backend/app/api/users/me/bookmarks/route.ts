import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 获取用户收藏的帖子列表
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

    // 获取用户收藏的帖子
    const bookmarks = await prisma.postBookmark.findMany({
      where: {
        userId: decoded.userId
      },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                reputationScore: true
              }
            },
            _count: {
              select: {
                communityReplies: {
                  where: { isDeleted: false }
                },
                postLikes: true,
                postBookmarks: true
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

    // 过滤掉已删除的帖子
    const validBookmarks = bookmarks.filter(bookmark => bookmark.post)

    // 获取总数
    const total = await prisma.postBookmark.count({
      where: {
        userId: decoded.userId,
        post: {
          isDeleted: false
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        bookmarks: validBookmarks.map(bookmark => ({
          id: bookmark.id,
          bookmarkedAt: bookmark.createdAt.toISOString(),
          post: {
            id: bookmark.post.id,
            title: bookmark.post.title,
            content: bookmark.post.content,
            excerpt: bookmark.post.excerpt,
            author: {
              id: bookmark.post.author.id,
              name: bookmark.post.author.username,
              username: bookmark.post.author.username,
              avatar: bookmark.post.author.avatarUrl,
              reputation: bookmark.post.author.reputationScore
            },
            category: bookmark.post.category,
            tags: bookmark.post.tags,
            createdAt: bookmark.post.createdAt.toISOString(),
            updatedAt: bookmark.post.updatedAt.toISOString(),
            views: bookmark.post.views,
            likes: bookmark.post._count.postLikes,
            replies: bookmark.post._count.communityReplies,
            bookmarks: bookmark.post._count.postBookmarks,
            isPinned: bookmark.post.isPinned,
            isLocked: bookmark.post.isLocked
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
    console.error('获取收藏列表错误:', error)
    return NextResponse.json(
      { error: '获取收藏列表失败' },
      { status: 500 }
    )
  }
}
