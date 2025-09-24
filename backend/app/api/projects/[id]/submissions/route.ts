import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { ApiResponseHandler } from '@/lib/api-response'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    // 认证
    const user = await auth(request)
    if (!user) {
      return ApiResponseHandler.unauthorized(t('auth.unauthorized'))
    }
    
    const projectId = params.id
    
    // 检查项目是否存在和用户权限
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          select: {
            members: {
              where: { userId: user.id },
              select: { userId: true }
            }
          }
        }
      }
    })
    
    if (!project) {
      return ApiResponseHandler.notFound(t('projects.notFound'))
    }
    
    // 检查用户权限：项目创建者或团队成员
    const isCreator = project.creatorId === user.id
    const isTeamMember = project.team?.members?.some(member => member.userId === user.id)
    
    if (!isCreator && !isTeamMember) {
      return ApiResponseHandler.forbidden(t('projects.noPermission'))
    }
    
    // 获取提交历史
    const submissions = await prisma.projectSubmission.findMany({
      where: { projectId },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true,
            organizerId: true,
            organizer: {
              select: {
                id: true,
                username: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })
    
    // 转换数据格式
    const submissionsWithDetails = submissions.map(submission => ({
      id: submission.id,
      hackathon: submission.hackathon,
      submittedAt: submission.submittedAt,
      status: submission.status,
      statusDisplay: getSubmissionStatusDisplay(submission.status, t),
      notes: submission.notes,
      withdrawnAt: submission.withdrawnAt,
      withdrawReason: submission.withdrawReason,
      canWithdraw: submission.status === 'SUBMITTED' && 
                   new Date() < submission.hackathon.endDate, // 黑客松结束前可以撤销
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt
    }))
    
    // 统计信息
    const stats = {
      total: submissions.length,
      active: submissions.filter(s => s.status === 'SUBMITTED').length,
      withdrawn: submissions.filter(s => s.status === 'WITHDRAWN').length,
      accepted: submissions.filter(s => s.status === 'ACCEPTED').length,
      rejected: submissions.filter(s => s.status === 'REJECTED').length
    }
    
    return ApiResponseHandler.success({
      submissions: submissionsWithDetails,
      stats
    })
    
  } catch (error) {
    console.error('获取项目提交历史失败:', error)
    return ApiResponseHandler.internalError('Failed to get project submissions')
  }
}

// 辅助函数：获取提交状态显示文本（国际化）
function getSubmissionStatusDisplay(status: string, t: any): string {
  const statusKey = `projects.submissionStatus.${status.toLowerCase()}`
  try {
    return t(statusKey)
  } catch {
    return status
  }
}
