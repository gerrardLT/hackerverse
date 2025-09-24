import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ApiResponseHandler } from '@/lib/api-response'

// 评论创建验证模式
const createCommentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(1000, '评论内容不能超过1000字符'),
  parentId: z.string().optional(), // 父评论ID，用于回复
})

// 评论查询参数验证
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default('20'),
  sortBy: z.enum(['created', 'updated']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// 获取项目评论
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    // 验证查询参数
    const validatedQuery = querySchema.parse(query)
    
    console.log('🔍 获取项目评论:', projectId, validatedQuery)
    
    // 获取当前用户（如果已登录）
    const user = await auth(request)
    
    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        isPublic: true,
        status: true,
        creatorId: true,
      }
    })
    
    if (!project) {
      return ApiResponseHandler.notFound('项目不存在')
    }
    
    // 权限检查：公开项目或项目所有者可以查看评论
    const canViewComments = project.isPublic || (user && project.creatorId === user.id)
    
    if (!canViewComments) {
      return ApiResponseHandler.forbidden('无法查看此项目的评论')
    }
    
    // 计算分页
    const skip = (validatedQuery.page - 1) * validatedQuery.limit
    
    // 排序设置
    const orderBy = {
      [validatedQuery.sortBy === 'updated' ? 'updatedAt' : 'createdAt']: validatedQuery.sortOrder
    }
    
    // 获取顶级评论（parentId为null）
    const [comments, total] = await Promise.all([
      prisma.projectComment.findMany({
        where: {
          projectId,
          parentId: null, // 只获取顶级评论
        },
        select: {
          id: true,
          content: true,
          isEdited: true,
          createdAt: true,
          updatedAt: true,
          editedAt: true,
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            }
          },
          // 获取回复
          replies: {
            select: {
              id: true,
              content: true,
              isEdited: true,
              createdAt: true,
              updatedAt: true,
              editedAt: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                }
              },
            },
            orderBy: {
              createdAt: 'asc' // 回复按时间正序排列
            }
          },
          _count: {
            select: {
              replies: true,
            }
          }
        },
        orderBy,
        skip,
        take: validatedQuery.limit,
      }),
      prisma.projectComment.count({
        where: {
          projectId,
          parentId: null,
        }
      })
    ])
    
    return ApiResponseHandler.success({
      comments,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        totalPages: Math.ceil(total / validatedQuery.limit),
      }
    })
    
  } catch (error) {
    console.error('获取项目评论错误:', error)
    
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.validationError('参数验证失败', error.errors)
    }
    
    return ApiResponseHandler.internalError('获取评论失败')
  }
}

// 创建项目评论
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
    
    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)
    
    console.log('📝 创建项目评论:', projectId, user.id, validatedData)
    
    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        isPublic: true,
        status: true,
        creatorId: true,
      }
    })
    
    if (!project) {
      return ApiResponseHandler.notFound('项目不存在')
    }
    
    // 权限检查：公开项目或项目所有者可以评论
    const canComment = project.isPublic || project.creatorId === user.id
    
    if (!canComment) {
      return ApiResponseHandler.forbidden('无法评论此项目')
    }
    
    // 如果是回复，检查父评论是否存在
    if (validatedData.parentId) {
      const parentComment = await prisma.projectComment.findUnique({
        where: { 
          id: validatedData.parentId,
          projectId // 确保父评论属于同一个项目
        }
      })
      
      if (!parentComment) {
        return ApiResponseHandler.badRequest('回复的评论不存在')
      }
    }
    
    // 创建评论
    const comment = await prisma.projectComment.create({
      data: {
        projectId,
        userId: user.id,
        content: validatedData.content,
        parentId: validatedData.parentId,
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
    
    // 发送通知给项目创建者（如果不是自己评论）
    if (project.creatorId !== user.id) {
      await prisma.notification.create({
        data: {
          type: 'PROJECT_COMMENTED',
          title: '项目收到新评论',
          message: `${user.username} 评论了您的项目`,
          userId: project.creatorId,
          data: {
            projectId,
            commentId: comment.id,
            commenterName: user.username,
          },
          actionUrl: `/projects/${projectId}`,
          actionLabel: '查看评论',
        }
      })
    }
    
    return ApiResponseHandler.created({ comment }, '评论发表成功')
    
  } catch (error) {
    console.error('创建项目评论错误:', error)
    
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.validationError('参数验证失败', error.errors)
    }
    
    return ApiResponseHandler.internalError('发表评论失败')
  }
}
