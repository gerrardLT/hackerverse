import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// 强制使用Node.js运行时，避免Edge Runtime的crypto模块限制
export const runtime = 'nodejs'

// 获取帖子列表
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const sortBy = searchParams.get('sortBy') || 'latest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {
      isDeleted: false
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    // 构建排序条件
    let orderBy: any = {}
    switch (sortBy) {
      case 'popular':
        orderBy = { likes: 'desc' }
        break
      case 'replies':
        orderBy = { replies: 'desc' }
        break
      case 'views':
        orderBy = { views: 'desc' }
        break
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // 获取帖子列表
    const posts = await prisma.communityPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    })

    // 若带有用户令牌，查询该用户对本页帖子点赞/收藏状态
    let likedPostIds = new Set<string>()
    let bookmarkedPostIds = new Set<string>()

    const authHeader = request.headers.get('authorization')
    console.log('🔍 [社区列表] 检查认证header:', authHeader ? `Bearer ${authHeader.substring(7, 27)}...` : 'null')
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = AuthService.verifyToken(token)
      console.log('🔍 [社区列表] Token解码结果:', decoded ? `用户ID: ${decoded.userId}` : '解码失败')
      
      if (decoded) {
        const postIds = posts.map(p => p.id)
        console.log('🔍 [社区列表] 查询用户状态, 帖子数:', postIds.length)
        
        if (postIds.length > 0) {
          const [likes, bookmarks] = await Promise.all([
            prisma.postLike.findMany({
              where: { userId: decoded.userId, postId: { in: postIds } },
              select: { postId: true }
            }),
            prisma.postBookmark.findMany({
              where: { userId: decoded.userId, postId: { in: postIds } },
              select: { postId: true }
            })
          ])
          likedPostIds = new Set(likes.map(l => l.postId))
          bookmarkedPostIds = new Set(bookmarks.map(b => b.postId))
          console.log('🔍 [社区列表] 用户状态统计:', {
            点赞帖子数: likedPostIds.size,
            收藏帖子数: bookmarkedPostIds.size,
            点赞帖子IDs: Array.from(likedPostIds),
            收藏帖子IDs: Array.from(bookmarkedPostIds)
          })
        }
      }
    }

    // 获取总数
    const total = await prisma.communityPost.count({ where })

    // 获取社区统计
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 计算本周开始时间（周一）
    const weekStart = new Date(today)
    const dayOfWeek = weekStart.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    weekStart.setDate(weekStart.getDate() - daysToMonday)
    weekStart.setHours(0, 0, 0, 0)
    
    const [
      totalPosts,
      activeUsers,
      weeklyPosts,
      totalLikes,
      todayPosts,
      todayReplies,
      topContributors
    ] = await Promise.all([
      // 总帖子数
      prisma.communityPost.count({
        where: { isDeleted: false }
      }),
      // 活跃用户数（最近30天有发帖或回复的用户）
      prisma.user.count({
        where: {
          status: 'ACTIVE',
          OR: [
            {
              communityPosts: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  },
                  isDeleted: false
                }
              }
            },
            {
              communityReplies: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  },
                  isDeleted: false
                }
              }
            }
          ]
        }
      }),
      // 本周新帖数
      prisma.communityPost.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: weekStart
          }
        }
      }),
      // 总点赞数
      prisma.postLike.count(),
      // 今日新帖数
      prisma.communityPost.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: today
          }
        }
      }),
      // 今日新回复数
      prisma.communityReply.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: today
          }
        }
      }),
      // 热门贡献者（按发帖数 + 回复数排序）
      prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          reputationScore: true,
          _count: {
            select: {
              communityPosts: {
                where: { isDeleted: false }
              },
              communityReplies: {
                where: { isDeleted: false }
              }
            }
          }
        },
        orderBy: [
          { reputationScore: 'desc' }
        ],
        take: 10
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        posts: posts.map(post => ({
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
          likes: post.likes,
          replies: post.replies,
          isPinned: post.isPinned,
          isLocked: post.isLocked,
          isLiked: likedPostIds.has(post.id),
          isBookmarked: bookmarkedPostIds.has(post.id),
          lastReplyAt: post.lastReplyAt?.toISOString()
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          totalPosts,
          activeUsers,
          weeklyPosts,
          totalLikes,
          todayPosts,
          todayReplies,
          topContributors: topContributors.map(user => ({
            id: user.id,
            name: user.username,
            username: user.username,
            avatar: user.avatarUrl,
            reputation: user.reputationScore,
            postsCount: user._count.communityPosts,
            repliesCount: user._count.communityReplies
          }))
        }
      }
    })

  } catch (error) {
    console.error('获取帖子列表错误:', error)
    return NextResponse.json(
      { error: '获取帖子列表失败' },
      { status: 500 }
    )
  }
}

// 创建新帖子
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    
    // 验证请求数据
    const postSchema = z.object({
      title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
      content: z.string().min(1, '内容不能为空').max(10000, '内容不能超过10000字符'),
      category: z.enum(['general', 'technical', 'showcase', 'help', 'announcement']),
      tags: z.array(z.string()).max(10, '标签不能超过10个'),
      excerpt: z.string().optional()
    })

    const validatedData = postSchema.parse(body)

    // 创建帖子
    const post = await prisma.communityPost.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        excerpt: validatedData.excerpt || validatedData.content.substring(0, 200),
        category: validatedData.category,
        tags: validatedData.tags,
        authorId: decoded.userId,
        views: 0,
        likes: 0,
        replies: 0,
        isPinned: false,
        isLocked: false,
        isDeleted: false
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: '帖子创建成功',
      data: {
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
        likes: post.likes,
        replies: post.replies,
        isPinned: post.isPinned,
        isLocked: post.isLocked
      }
    })

  } catch (error) {
    console.error('创建帖子错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '创建帖子失败' },
      { status: 500 }
    )
  }
} 