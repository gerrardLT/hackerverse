import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 点赞/取消点赞回复
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

    const replyId = params.id

    // 验证回复是否存在
    const reply = await prisma.communityReply.findUnique({
      where: { id: replyId, isDeleted: false }
    })

    if (!reply) {
      return NextResponse.json(
        { error: '回复不存在' },
        { status: 404 }
      )
    }

    // 检查用户是否已经点赞过此回复
    const existingLike = await prisma.replyLike.findUnique({
      where: {
        userId_replyId: {
          userId: decoded.userId,
          replyId: replyId
        }
      }
    })

    let isLiked: boolean
    let likeCount: number

    if (existingLike) {
      // 取消点赞
      await prisma.replyLike.delete({
        where: {
          userId_replyId: {
            userId: decoded.userId,
            replyId: replyId
          }
        }
      })

      // 减少回复点赞数
      const updatedReply = await prisma.communityReply.update({
        where: { id: replyId },
        data: { likes: { decrement: 1 } }
      })

      isLiked = false
      likeCount = updatedReply.likes
    } else {
      // 添加点赞
      await prisma.replyLike.create({
        data: {
          userId: decoded.userId,
          replyId: replyId
        }
      })

      // 增加回复点赞数
      const updatedReply = await prisma.communityReply.update({
        where: { id: replyId },
        data: { likes: { increment: 1 } }
      })

      isLiked = true
      likeCount = updatedReply.likes
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
    console.error('回复点赞操作错误:', error)
    return NextResponse.json(
      { error: '回复点赞操作失败' },
      { status: 500 }
    )
  }
}

// 获取用户对回复的点赞状态
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

    const replyId = params.id

    // 检查用户是否已经点赞过此回复
    const existingLike = await prisma.replyLike.findUnique({
      where: {
        userId_replyId: {
          userId: decoded.userId,
          replyId: replyId
        }
      }
    })

    // 获取回复总点赞数
    const reply = await prisma.communityReply.findUnique({
      where: { id: replyId, isDeleted: false },
      select: { likes: true }
    })

    if (!reply) {
      return NextResponse.json(
        { error: '回复不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        isLiked: !!existingLike,
        likeCount: reply.likes
      }
    })

  } catch (error) {
    console.error('获取回复点赞状态错误:', error)
    return NextResponse.json(
      { error: '获取回复点赞状态失败' },
      { status: 500 }
    )
  }
}
