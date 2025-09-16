import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 点赞/取消点赞帖子
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

    // 检查用户是否已经点赞过此帖子
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId: decoded.userId,
          postId: postId
        }
      }
    })

    let isLiked: boolean
    let likeCount: number

    if (existingLike) {
      // 取消点赞
      await prisma.postLike.delete({
        where: {
          userId_postId: {
            userId: decoded.userId,
            postId: postId
          }
        }
      })

      // 减少帖子点赞数
      const updatedPost = await prisma.communityPost.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } }
      })

      isLiked = false
      likeCount = updatedPost.likes
    } else {
      // 添加点赞
      await prisma.postLike.create({
        data: {
          userId: decoded.userId,
          postId: postId
        }
      })

      // 增加帖子点赞数
      const updatedPost = await prisma.communityPost.update({
        where: { id: postId },
        data: { likes: { increment: 1 } }
      })

      isLiked = true
      likeCount = updatedPost.likes

      // 创建点赞通知 (只在点赞时创建，取消点赞不通知)
      try {
        await NotificationService.createPostLikeNotification(
          post.authorId,
          decoded.userId,
          postId,
          post.title
        )
      } catch (notificationError) {
        console.error('创建点赞通知失败:', notificationError)
        // 通知失败不影响主要功能
      }
    }

    return NextResponse.json({
      success: true,
      message: isLiked ? '点赞成功' : '取消点赞成功',
      data: {
        isLiked,
        likeCount
      }
    })

  } catch (error) {
    console.error('点赞操作错误:', error)
    return NextResponse.json(
      { error: '点赞操作失败' },
      { status: 500 }
    )
  }
}

// 获取用户对帖子的点赞状态
export async function GET(
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

    // 检查用户是否已经点赞过此帖子
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId: decoded.userId,
          postId: postId
        }
      }
    })

    // 获取帖子总点赞数
    const post = await prisma.communityPost.findUnique({
      where: { id: postId, isDeleted: false },
      select: { likes: true }
    })

    if (!post) {
      return NextResponse.json(
        { error: '帖子不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        isLiked: !!existingLike,
        likeCount: post.likes
      }
    })

  } catch (error) {
    console.error('获取点赞状态错误:', error)
    return NextResponse.json(
      { error: '获取点赞状态失败' },
      { status: 500 }
    )
  }
}
