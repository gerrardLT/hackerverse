import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ApiResponseHandler } from '@/lib/api-response'

// 获取项目交互统计
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    console.log('📊 获取项目交互统计:', projectId)
    
    // 检查项目是否存在且公开
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        isPublic: true,
        status: true,
        title: true,
        createdAt: true,
      }
    })
    
    if (!project) {
      return ApiResponseHandler.notFound('项目不存在')
    }
    
    if (!project.isPublic || project.status === 'DRAFT') {
      return ApiResponseHandler.forbidden('无法查看此项目的统计信息')
    }
    
    // 并行获取各种统计数据
    const [
      likeCount,
      commentCount,
      feedbackCount,
      recentComments,
      topLikers,
    ] = await Promise.all([
      // 点赞数
      prisma.projectLike.count({
        where: { projectId }
      }),
      
      // 评论数
      prisma.projectComment.count({
        where: { projectId }
      }),
      
      // 反馈数
      prisma.feedback.count({
        where: { projectId }
      }),
      
      // 最近评论
      prisma.projectComment.findMany({
        where: { projectId },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      
      // 点赞用户
      prisma.projectLike.findMany({
        where: { projectId },
        select: {
          createdAt: true,
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])
    
    // 统计当前用户的交互状态（如果已登录）
    const user = await auth(request)
    let userInteractions = {
      isLiked: false,
      hasCommented: false,
      hasFeedback: false,
    }
    
    if (user) {
      const [userLike, userComment, userFeedback] = await Promise.all([
        prisma.projectLike.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId: user.id,
            }
          }
        }),
        prisma.projectComment.findFirst({
          where: {
            projectId,
            userId: user.id,
          }
        }),
        prisma.feedback.findFirst({
          where: {
            projectId,
            userId: user.id,
          }
        }),
      ])
      
      userInteractions = {
        isLiked: !!userLike,
        hasCommented: !!userComment,
        hasFeedback: !!userFeedback,
      }
    }
    
    // 计算活跃度指标
    const daysSinceCreation = Math.max(1, Math.floor((Date.now() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24)))
    const engagementScore = Math.round((likeCount * 2 + commentCount * 3 + feedbackCount * 5) / daysSinceCreation * 10) / 10
    
    return ApiResponseHandler.success({
      project: {
        id: project.id,
        title: project.title,
        createdAt: project.createdAt,
      },
      stats: {
        likes: likeCount,
        comments: commentCount,
        feedbacks: feedbackCount,
        engagementScore,
        daysSinceCreation,
      },
      userInteractions,
      recentActivity: {
        comments: recentComments,
        likers: topLikers.map(like => ({
          user: like.user,
          likedAt: like.createdAt,
        })),
      },
      summary: {
        totalInteractions: likeCount + commentCount + feedbackCount,
        mostActiveType: likeCount >= commentCount && likeCount >= feedbackCount ? 'likes' :
                       commentCount >= feedbackCount ? 'comments' : 'feedbacks',
        isActive: likeCount > 0 || commentCount > 0 || feedbackCount > 0,
      }
    })
    
  } catch (error) {
    console.error('获取项目交互统计错误:', error)
    return ApiResponseHandler.internalError('获取统计信息失败')
  }
}
