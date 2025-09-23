import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ApiResponseHandler } from '@/lib/api-response'

// 点赞项目
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // 认证检查
    const user = await auth(request)
    if (!user) {
      return ApiResponseHandler.unauthorized('请先登录')
    }
    
    console.log('👍 点赞项目:', projectId, user.id)
    
    // 检查项目是否存在且公开
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        isPublic: true,
        status: true,
        creatorId: true,
        title: true,
      }
    })
    
    if (!project) {
      return ApiResponseHandler.notFound('项目不存在')
    }
    
    if (!project.isPublic || project.status === 'DRAFT') {
      return ApiResponseHandler.forbidden('无法点赞此项目')
    }
    
    // 检查是否已经点赞过
    const existingLike = await prisma.projectLike.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        }
      }
    })
    
    if (existingLike) {
      return ApiResponseHandler.badRequest('您已经点赞过此项目')
    }
    
    // 创建点赞记录
    const like = await prisma.projectLike.create({
      data: {
        projectId,
        userId: user.id,
      },
      select: {
        id: true,
        createdAt: true,
      }
    })
    
    // 获取更新后的点赞数
    const likeCount = await prisma.projectLike.count({
      where: { projectId }
    })
    
    // 发送通知给项目创建者（如果不是自己点赞）
    if (project.creatorId !== user.id) {
      await prisma.notification.create({
        data: {
          type: 'PROJECT_LIKED',
          title: '项目收到点赞',
          message: `${user.username} 点赞了您的项目「${project.title}」`,
          userId: project.creatorId,
          data: {
            projectId,
            likerName: user.username,
          },
          actionUrl: `/projects/${projectId}`,
          actionLabel: '查看项目',
        }
      })
    }
    
    return ApiResponseHandler.success({
      like,
      likeCount,
      isLiked: true,
    }, '点赞成功')
    
  } catch (error) {
    console.error('点赞项目错误:', error)
    return ApiResponseHandler.internalError('点赞失败')
  }
}

// 取消点赞
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // 认证检查
    const user = await auth(request)
    if (!user) {
      return ApiResponseHandler.unauthorized('请先登录')
    }
    
    console.log('👎 取消点赞项目:', projectId, user.id)
    
    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        isPublic: true,
        status: true,
      }
    })
    
    if (!project) {
      return ApiResponseHandler.notFound('项目不存在')
    }
    
    // 检查是否已经点赞过
    const existingLike = await prisma.projectLike.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        }
      }
    })
    
    if (!existingLike) {
      return ApiResponseHandler.badRequest('您尚未点赞过此项目')
    }
    
    // 删除点赞记录
    await prisma.projectLike.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        }
      }
    })
    
    // 获取更新后的点赞数
    const likeCount = await prisma.projectLike.count({
      where: { projectId }
    })
    
    return ApiResponseHandler.success({
      likeCount,
      isLiked: false,
    }, '取消点赞成功')
    
  } catch (error) {
    console.error('取消点赞项目错误:', error)
    return ApiResponseHandler.internalError('取消点赞失败')
  }
}

// 获取点赞状态
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // 认证检查（可选）
    const user = await auth(request)
    
    console.log('📊 获取项目点赞状态:', projectId, user?.id)
    
    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        isPublic: true,
        status: true,
      }
    })
    
    if (!project) {
      return ApiResponseHandler.notFound('项目不存在')
    }
    
    // 获取点赞数
    const likeCount = await prisma.projectLike.count({
      where: { projectId }
    })
    
    // 如果用户已登录，检查是否已点赞
    let isLiked = false
    if (user) {
      const existingLike = await prisma.projectLike.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: user.id,
          }
        }
      })
      isLiked = !!existingLike
    }
    
    return ApiResponseHandler.success({
      likeCount,
      isLiked,
    })
    
  } catch (error) {
    console.error('获取项目点赞状态错误:', error)
    return ApiResponseHandler.internalError('获取点赞状态失败')
  }
}