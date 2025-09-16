import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 更新回复
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

    const replyId = params.id
    const body = await request.json()

    // 验证请求数据
    const updateSchema = z.object({
      content: z.string().min(1, '回复内容不能为空').max(2000, '回复内容不能超过2000字符')
    })

    const validatedData = updateSchema.parse(body)

    // 检查回复是否存在且用户是否有权限编辑
    const existingReply = await prisma.communityReply.findFirst({
      where: {
        id: replyId,
        isDeleted: false
      }
    })

    if (!existingReply) {
      return NextResponse.json(
        { error: '回复不存在' },
        { status: 404 }
      )
    }

    if (existingReply.authorId !== decoded.userId) {
      return NextResponse.json(
        { error: '无权限编辑此回复' },
        { status: 403 }
      )
    }

    // 更新回复
    const updatedReply = await prisma.communityReply.update({
      where: { id: replyId },
      data: {
        content: validatedData.content,
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
      message: '回复更新成功',
      data: {
        reply: {
          id: updatedReply.id,
          content: updatedReply.content,
          author: {
            id: updatedReply.author.id,
            name: updatedReply.author.username,
            username: updatedReply.author.username,
            avatar: updatedReply.author.avatarUrl,
            reputation: updatedReply.author.reputationScore
          },
          createdAt: updatedReply.createdAt.toISOString(),
          updatedAt: updatedReply.updatedAt.toISOString(),
          likes: updatedReply.likes
        }
      }
    })

  } catch (error) {
    console.error('更新回复错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '更新回复失败' },
      { status: 500 }
    )
  }
}

// 删除回复
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

    const replyId = params.id

    // 检查回复是否存在且用户是否有权限删除
    const existingReply = await prisma.communityReply.findFirst({
      where: {
        id: replyId,
        isDeleted: false
      }
    })

    if (!existingReply) {
      return NextResponse.json(
        { error: '回复不存在' },
        { status: 404 }
      )
    }

    if (existingReply.authorId !== decoded.userId) {
      return NextResponse.json(
        { error: '无权限删除此回复' },
        { status: 403 }
      )
    }

    // 软删除回复
    await prisma.communityReply.update({
      where: { id: replyId },
      data: { isDeleted: true }
    })

    // 更新帖子的回复数量
    await prisma.communityPost.update({
      where: { id: existingReply.postId },
      data: {
        replies: { decrement: 1 }
      }
    })

    return NextResponse.json({
      success: true,
      message: '回复删除成功'
    })

  } catch (error) {
    console.error('删除回复错误:', error)
    return NextResponse.json(
      { error: '删除回复失败' },
      { status: 500 }
    )
  }
}
