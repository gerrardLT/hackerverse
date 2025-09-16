import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 获取帖子的回复列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id

    // 验证帖子是否存在
    const post = await prisma.communityPost.findUnique({
      where: { id: postId, isDeleted: false }
    })

    if (!post) {
      return NextResponse.json(
        { error: '帖子不存在' },
        { status: 404 }
      )
    }

    // 获取回复列表 (包括嵌套回复)
    const replies = await prisma.communityReply.findMany({
      where: {
        postId: postId,
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
    })

    return NextResponse.json({
      success: true,
      data: {
        replies: replies.map(reply => ({
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
          replies: reply.replies.map(subReply => ({
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
        }))
      }
    })

  } catch (error) {
    console.error('获取回复列表错误:', error)
    return NextResponse.json(
      { error: '获取回复列表失败' },
      { status: 500 }
    )
  }
}

// 创建新回复
export async function POST(
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
    const replySchema = z.object({
      content: z.string().min(1, '回复内容不能为空').max(2000, '回复内容不能超过2000字符'),
      parentId: z.string().optional() // 用于嵌套回复
    })

    const validatedData = replySchema.parse(body)

    // 验证帖子是否存在且未锁定
    const post = await prisma.communityPost.findUnique({
      where: { id: postId, isDeleted: false }
    })

    if (!post) {
      return NextResponse.json(
        { error: '帖子不存在' },
        { status: 404 }
      )
    }

    if (post.isLocked) {
      return NextResponse.json(
        { error: '帖子已锁定，无法回复' },
        { status: 403 }
      )
    }

    // 如果是嵌套回复，验证父回复是否存在
    if (validatedData.parentId) {
      const parentReply = await prisma.communityReply.findUnique({
        where: { 
          id: validatedData.parentId,
          postId: postId,
          isDeleted: false
        }
      })

      if (!parentReply) {
        return NextResponse.json(
          { error: '父回复不存在' },
          { status: 404 }
        )
      }
    }

    // 创建回复
    const reply = await prisma.communityReply.create({
      data: {
        content: validatedData.content,
        authorId: decoded.userId,
        postId: postId,
        parentId: validatedData.parentId || null,
        likes: 0,
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

    // 更新帖子的回复数量和最后回复时间
    await prisma.communityPost.update({
      where: { id: postId },
      data: {
        replies: { increment: 1 },
        lastReplyAt: new Date()
      }
    })

    // 创建回复通知
    try {
      await NotificationService.createReplyNotification(
        post.authorId,
        decoded.userId,
        postId,
        post.title
      )
    } catch (notificationError) {
      console.error('创建回复通知失败:', notificationError)
      // 通知失败不影响主要功能
    }

    return NextResponse.json({
      success: true,
      message: '回复创建成功',
      data: {
        reply: {
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
          parentId: reply.parentId
        }
      }
    })

  } catch (error) {
    console.error('创建回复错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '创建回复失败' },
      { status: 500 }
    )
  }
}
