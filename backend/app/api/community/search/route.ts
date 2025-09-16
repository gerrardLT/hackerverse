import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 搜索帖子、用户和标签
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all' // posts, users, tags, all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: '搜索关键词至少需要2个字符' },
        { status: 400 }
      )
    }

    const searchQuery = query.trim()
    const results: any = {}

    // 搜索帖子
    if (type === 'all' || type === 'posts') {
      const posts = await prisma.communityPost.findMany({
        where: {
          isDeleted: false,
          OR: [
            {
              title: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            },
            {
              content: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            },
            {
              excerpt: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            }
          ]
        },
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
        },
        orderBy: [
          { isPinned: 'desc' },
          { likes: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: type === 'posts' ? skip : 0,
        take: type === 'posts' ? limit : 10
      })

      const postsTotal = await prisma.communityPost.count({
        where: {
          isDeleted: false,
          OR: [
            {
              title: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            },
            {
              content: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            },
            {
              excerpt: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            }
          ]
        }
      })

      results.posts = {
        items: posts.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          author: {
            id: post.author.id,
            name: post.author.username,
            username: post.author.username,
            avatar: post.author.avatarUrl,
            reputation: post.author.reputationScore
          },
          category: post.category,
          tags: post.tags,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          views: post.views,
          likes: post._count.postLikes,
          replies: post._count.communityReplies,
          bookmarks: post._count.postBookmarks,
          isPinned: post.isPinned,
          isLocked: post.isLocked
        })),
        total: postsTotal,
        pagination: type === 'posts' ? {
          page,
          limit,
          total: postsTotal,
          totalPages: Math.ceil(postsTotal / limit)
        } : null
      }
    }

    // 搜索用户
    if (type === 'all' || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            {
              username: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            },
            {
              bio: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            }
          ]
        },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          bio: true,
          reputationScore: true,
          createdAt: true,
          _count: {
            select: {
              communityPosts: {
                where: { isDeleted: false }
              },
              followers: true,
              following: true
            }
          }
        },
        orderBy: [
          { reputationScore: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: type === 'users' ? skip : 0,
        take: type === 'users' ? limit : 10
      })

      const usersTotal = await prisma.user.count({
        where: {
          status: 'ACTIVE',
          OR: [
            {
              username: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            },
            {
              bio: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            }
          ]
        }
      })

      results.users = {
        items: users.map(user => ({
          id: user.id,
          name: user.username,
          username: user.username,
          avatar: user.avatarUrl,
          bio: user.bio,
          reputation: user.reputationScore,
          joinedAt: user.createdAt.toISOString(),
          postsCount: user._count.communityPosts,
          followersCount: user._count.followers,
          followingCount: user._count.following
        })),
        total: usersTotal,
        pagination: type === 'users' ? {
          page,
          limit,
          total: usersTotal,
          totalPages: Math.ceil(usersTotal / limit)
        } : null
      }
    }

    // 搜索标签
    if (type === 'all' || type === 'tags') {
      // 搜索包含关键词的标签
      const postsWithTags = await prisma.communityPost.findMany({
        where: {
          isDeleted: false,
            tags: {
              array_contains: [searchQuery]
            }
        },
        select: {
          tags: true
        }
      })

      // 统计标签使用频率
      const tagCounts: Record<string, number> = {}
      postsWithTags.forEach(post => {
        if (Array.isArray(post.tags)) {
          (post.tags as string[]).forEach((tag: string) => {
            if (tag.toLowerCase().includes(searchQuery.toLowerCase())) {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1
            }
          })
        }
      })

      // 按使用频率排序
      const sortedTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, type === 'tags' ? limit : 10)

      results.tags = {
        items: sortedTags.map(([tag, count]) => ({
          name: tag,
          count,
          postsCount: count
        })),
        total: sortedTags.length
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        query: searchQuery,
        type,
        results
      }
    })

  } catch (error) {
    console.error('搜索错误:', error)
    return NextResponse.json(
      { error: '搜索失败' },
      { status: 500 }
    )
  }
}
