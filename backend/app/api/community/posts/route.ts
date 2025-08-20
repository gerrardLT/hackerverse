import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

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

    // 获取总数
    const total = await prisma.communityPost.count({ where })

    // 获取社区统计
    const stats = await prisma.communityPost.aggregate({
      where: { isDeleted: false },
      _count: {
        id: true
      }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayPosts = await prisma.communityPost.count({
      where: {
        isDeleted: false,
        createdAt: {
          gte: today
        }
      }
    })

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
          lastReplyAt: post.lastReplyAt?.toISOString()
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          totalPosts: stats._count.id,
          todayPosts
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