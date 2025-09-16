import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// 获取单个帖子详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id

    // 获取帖子详情
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true
          }
        },
        communityReplies: {
          where: {
            isDeleted: false,
            parentId: null // 只获取顶级回复
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
            replies: {
              where: {
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
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: '帖子不存在' },
        { status: 404 }
      )
    }

    // 检查是否需要增加浏览量 (通过query参数控制)
    const { searchParams } = new URL(request.url)
    const incrementView = searchParams.get('incrementView') === 'true'
    
    let currentViews = post.views
    if (incrementView) {
      const updatedPost = await prisma.communityPost.update({
        where: { id: postId },
        data: { views: { increment: 1 } }
      })
      currentViews = updatedPost.views
    }

    return NextResponse.json({
      success: true,
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
        views: currentViews,
        likes: post.likes,
        replies: post.communityReplies.map((reply: any) => ({
          id: reply.id,
          content: reply.content,
          author: {
            id: reply.author.id,
            name: reply.author.username,
            username: reply.author.username,
            avatar: reply.author.avatarUrl,
            reputation: reply.author.reputationScore
          },
          createdAt: reply.createdAt.toISOString(),
          updatedAt: reply.updatedAt.toISOString(),
          likes: reply.likes,
          replies: reply.replies.map((subReply: any) => ({
            id: subReply.id,
            content: subReply.content,
            author: {
              id: subReply.author.id,
              name: subReply.author.username,
              username: subReply.author.username,
              avatar: subReply.author.avatarUrl,
              reputation: subReply.author.reputationScore
            },
            createdAt: subReply.createdAt.toISOString(),
            updatedAt: subReply.updatedAt.toISOString(),
            likes: subReply.likes
          }))
        })),
        isPinned: post.isPinned,
        isLocked: post.isLocked,
        lastReplyAt: post.lastReplyAt?.toISOString()
      }
    })

  } catch (error) {
    console.error('获取帖子详情错误:', error)
    return NextResponse.json(
      { error: '获取帖子详情失败' },
      { status: 500 }
    )
  }
}

// 更新帖子
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const postId = params.id
    const body = await request.json()

    // 验证请求数据
    const updateSchema = z.object({
      title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符').optional(),
      content: z.string().min(1, '内容不能为空').max(10000, '内容不能超过10000字符').optional(),
      category: z.enum(['general', 'technical', 'showcase', 'help', 'announcement']).optional(),
      tags: z.array(z.string()).max(10, '标签不能超过10个').optional(),
      excerpt: z.string().optional()
    })

    const validatedData = updateSchema.parse(body)

    // 检查帖子是否存在且用户是否有权限编辑
    const existingPost = await prisma.communityPost.findFirst({
      where: {
        id: postId,
        isDeleted: false
      }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: '帖子不存在' },
        { status: 404 }
      )
    }

    if (existingPost.authorId !== decoded.userId) {
      return NextResponse.json(
        { error: '无权限编辑此帖子' },
        { status: 403 }
      )
    }

    // 更新帖子
    const updatedPost = await prisma.communityPost.update({
      where: { id: postId },
      data: {
        ...validatedData,
        updatedAt: new Date()
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
      message: '帖子更新成功',
      data: {
        id: updatedPost.id,
        title: updatedPost.title,
        content: updatedPost.content,
        excerpt: updatedPost.excerpt,
        author: {
          id: updatedPost.author.id,
          name: updatedPost.author.username,
          username: updatedPost.author.username,
          avatar: updatedPost.author.avatarUrl,
          reputation: updatedPost.author.reputationScore
        },
        category: updatedPost.category,
        tags: updatedPost.tags,
        createdAt: updatedPost.createdAt.toISOString(),
        updatedAt: updatedPost.updatedAt.toISOString(),
        views: updatedPost.views,
        likes: updatedPost.likes,
        replies: updatedPost.replies,
        isPinned: updatedPost.isPinned,
        isLocked: updatedPost.isLocked
      }
    })

  } catch (error) {
    console.error('更新帖子错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '更新帖子失败' },
      { status: 500 }
    )
  }
}

// 删除帖子
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const postId = params.id

    // 检查帖子是否存在且用户是否有权限删除
    const existingPost = await prisma.communityPost.findFirst({
      where: {
        id: postId,
        isDeleted: false
      }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: '帖子不存在' },
        { status: 404 }
      )
    }

    if (existingPost.authorId !== decoded.userId) {
      return NextResponse.json(
        { error: '无权限删除此帖子' },
        { status: 403 }
      )
    }

    // 软删除帖子
    await prisma.communityPost.update({
      where: { id: postId },
      data: { isDeleted: true }
    })

    return NextResponse.json({
      success: true,
      message: '帖子删除成功'
    })

  } catch (error) {
    console.error('删除帖子错误:', error)
    return NextResponse.json(
      { error: '删除帖子失败' },
      { status: 500 }
    )
  }
} 