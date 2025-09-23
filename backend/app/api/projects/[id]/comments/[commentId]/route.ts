import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ApiResponseHandler } from '@/lib/api-response'

// 评论更新验证模式
const updateCommentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(1000, '评论内容不能超过1000字符'),
})

// 更新评论
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const { id: projectId, commentId } = params
    
    // 认证检查
    const user = await auth(request)
    if (!user) {
      return ApiResponseHandler.unauthorized('请先登录')
    }
    
    const body = await request.json()
    const validatedData = updateCommentSchema.parse(body)
    
    console.log('📝 更新项目评论:', projectId, commentId, user.id)
    
    // 检查评论是否存在且属于当前用户
    const comment = await prisma.projectComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        projectId: true,
        userId: true,
        content: true,
      }
    })
    
    if (!comment) {
      return ApiResponseHandler.notFound('评论不存在')
    }
    
    if (comment.projectId !== projectId) {
      return ApiResponseHandler.badRequest('评论不属于此项目')
    }
    
    if (comment.userId !== user.id) {
      return ApiResponseHandler.forbidden('只能编辑自己的评论')
    }
    
    // 检查内容是否有变化
    if (comment.content === validatedData.content) {
      return ApiResponseHandler.badRequest('评论内容没有变化')
    }
    
    // 更新评论
    const updatedComment = await prisma.projectComment.update({
      where: { id: commentId },
      data: {
        content: validatedData.content,
        isEdited: true,
        editedAt: new Date(),
      },
      select: {
        id: true,
        content: true,
        isEdited: true,
        createdAt: true,
        updatedAt: true,
        editedAt: true,
        parentId: true,
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          }
        },
      }
    })
    
    return ApiResponseHandler.success(updatedComment, '评论更新成功')
    
  } catch (error) {
    console.error('更新项目评论错误:', error)
    
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.validationError('参数验证失败', error.errors)
    }
    
    return ApiResponseHandler.internalError('更新评论失败')
  }
}

// 删除评论
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const { id: projectId, commentId } = params
    
    // 认证检查
    const user = await auth(request)
    if (!user) {
      return ApiResponseHandler.unauthorized('请先登录')
    }
    
    console.log('🗑️ 删除项目评论:', projectId, commentId, user.id)
    
    // 检查评论是否存在
    const comment = await prisma.projectComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        projectId: true,
        userId: true,
        parentId: true,
        project: {
          select: {
            creatorId: true,
          }
        },
        _count: {
          select: {
            replies: true,
          }
        }
      }
    })
    
    if (!comment) {
      return ApiResponseHandler.notFound('评论不存在')
    }
    
    if (comment.projectId !== projectId) {
      return ApiResponseHandler.badRequest('评论不属于此项目')
    }
    
    // 检查权限：评论作者或项目创建者可以删除
    const canDelete = comment.userId === user.id || comment.project.creatorId === user.id
    if (!canDelete) {
      return ApiResponseHandler.forbidden('只能删除自己的评论或自己项目下的评论')
    }
    
    // 如果评论有回复，需要处理级联删除
    if (comment._count.replies > 0) {
      // 先删除所有回复
      await prisma.projectComment.deleteMany({
        where: {
          parentId: commentId
        }
      })
    }
    
    // 删除评论
    await prisma.projectComment.delete({
      where: { id: commentId }
    })
    
    return ApiResponseHandler.success(null, '评论删除成功')
    
  } catch (error) {
    console.error('删除项目评论错误:', error)
    return ApiResponseHandler.internalError('删除评论失败')
  }
}
