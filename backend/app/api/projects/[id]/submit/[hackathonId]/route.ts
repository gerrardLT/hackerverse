import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { AuthService } from '@/lib/auth'
import { ApiResponseHandler } from '@/lib/api-response'

// 提交项目的验证schema
const submitProjectSchema = z.object({
  notes: z.string().optional(), // 提交备注
  finalizeProject: z.boolean().optional().default(false) // 是否同时将项目状态设为READY_TO_SUBMIT
})

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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; hackathonId: string } }
) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    // 认证
    const authHeader = request.headers.get('authorization')
    const token = AuthService.extractTokenFromHeader(authHeader || undefined)
    
    if (!token) {
      return ApiResponseHandler.unauthorized(t('auth.unauthorized'))
    }
    
    const payload = AuthService.verifyToken(token)
    if (!payload) {
      return ApiResponseHandler.unauthorized(t('auth.tokenInvalid'))
    }
    
    const projectId = params.id
    const hackathonId = params.hackathonId
    const body = await request.json()
    const validatedData = submitProjectSchema.parse(body)
    
    // 检查项目是否存在和用户权限
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          select: {
            members: {
              where: { userId: payload.userId },
              select: { userId: true, role: true }
            }
          }
        },
        submissions: {
          where: { hackathonId },
          select: { id: true, status: true }
        }
      }
    })
    
    if (!project) {
      return ApiResponseHandler.notFound(t('projects.notFound'))
    }
    
    // 检查用户权限：项目创建者或团队成员
    const isCreator = project.creatorId === payload.userId
    const isTeamMember = project.team?.members?.some(member => member.userId === payload.userId)
    
    if (!isCreator && !isTeamMember) {
      return ApiResponseHandler.forbidden(t('projects.noPermission'))
    }
    
    // 检查项目状态是否允许提交
    if (!['DRAFT', 'READY_TO_SUBMIT'].includes(project.status)) {
      return ApiResponseHandler.badRequest(
        t('projects.cannotSubmitInCurrentStatus', { status: project.status })
      )
    }
    
    // 检查是否已经提交到这个黑客松
    if (project.submissions.length > 0 && 
        project.submissions[0].status !== 'WITHDRAWN') {
      return ApiResponseHandler.conflict(
        t('projects.alreadySubmittedToHackathon')
      )
    }
    
    // 检查黑客松是否存在和状态
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        registrationDeadline: true,
        isPublic: true,
        participations: {
          where: { userId: payload.userId },
          select: { id: true }
        }
      }
    })
    
    if (!hackathon) {
      return ApiResponseHandler.notFound(t('hackathons.notFound'))
    }
    
    // 检查黑客松是否公开
    if (!hackathon.isPublic) {
      return ApiResponseHandler.forbidden(t('hackathons.privateEvent'))
    }
    
    // 检查用户是否已报名
    if (hackathon.participations.length === 0) {
      return ApiResponseHandler.badRequest(t('teams.needRegistration'))
    }
    
    // 检查黑客松状态和时间
    const now = new Date()
    
    if (hackathon.status !== 'APPROVED') {
      return ApiResponseHandler.badRequest(
        t('hackathons.notAcceptingSubmissions', { status: hackathon.status })
      )
    }
    
    // 检查是否在提交时间范围内
    if (now < hackathon.startDate) {
      return ApiResponseHandler.badRequest(
        t('projects.hackathonNotStarted', {
          startTime: hackathon.startDate.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')
        })
      )
    }
    
    if (now > hackathon.endDate) {
      return ApiResponseHandler.badRequest(
        t('projects.hackathonEnded', {
          endTime: hackathon.endDate.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')
        })
      )
    }
    
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 1. 如果需要，更新项目状态
      if (validatedData.finalizeProject && project.status === 'DRAFT') {
        await tx.project.update({
          where: { id: projectId },
          data: { status: 'READY_TO_SUBMIT' }
        })
      }
      
      // 2. 创建提交记录
      const submission = await tx.projectSubmission.create({
        data: {
          projectId,
          hackathonId,
          status: 'SUBMITTED',
          notes: validatedData.notes,
          submittedAt: new Date()
        },
        include: {
          hackathon: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          project: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      })
      
      // 3. 更新项目的主要黑客松关联（如果之前没有）
      if (!project.hackathonId) { // ✅ 修复：检查 null 而不是空字符串
        await tx.project.update({
          where: { id: projectId },
          data: { hackathonId, status: 'SUBMITTED' }
        })
      } else if (project.hackathonId !== hackathonId) {
        // 如果提交到不同的黑客松，只更新状态
        await tx.project.update({
          where: { id: projectId },
          data: { status: 'SUBMITTED' }
        })
      }
      
      // 4. 创建通知（通知项目团队成员）
      if (project.team) {
        const teamMemberIds = project.team.members.map(member => member.userId)
        const notifications = teamMemberIds
          .filter(userId => userId !== payload.userId) // 排除提交者自己
          .map(userId => ({
            type: 'PROJECT_STATUS_CHANGED' as const,
            title: t('notifications.projectSubmitted.title'),
            message: t('notifications.projectSubmitted.message', {
              projectTitle: project.title,
              hackathonTitle: hackathon.title
            }),
            userId,
            data: {
              projectId,
              hackathonId,
              submissionId: submission.id
            },
            actionUrl: `/projects/${projectId}`,
            actionLabel: t('notifications.viewProject')
          }))
        
        if (notifications.length > 0) {
          await tx.notification.createMany({
            data: notifications
          })
        }
      }
      
      return submission
    })
    
    return ApiResponseHandler.success({
      submission: result,
      message: t('projects.submittedSuccessfully', {
        projectTitle: project.title,
        hackathonTitle: hackathon.title
      })
    })
    
  } catch (error) {
    console.error('提交项目到黑客松失败:', error)
    
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.validationError(error.errors.map(e => e.message).join(', '))
    }
    
    return ApiResponseHandler.internalError('Failed to submit project to hackathon')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; hackathonId: string } }
) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    // 认证
    const authHeader = request.headers.get('authorization')
    const token = AuthService.extractTokenFromHeader(authHeader || undefined)
    
    if (!token) {
      return ApiResponseHandler.unauthorized(t('auth.unauthorized'))
    }
    
    const payload = AuthService.verifyToken(token)
    if (!payload) {
      return ApiResponseHandler.unauthorized(t('auth.tokenInvalid'))
    }
    
    const projectId = params.id
    const hackathonId = params.hackathonId
    
    // 检查提交记录是否存在
    const submission = await prisma.projectSubmission.findUnique({
      where: {
        projectId_hackathonId: {
          projectId,
          hackathonId
        }
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            creatorId: true,
            team: {
              select: {
                members: {
                  where: { userId: payload.userId },
                  select: { userId: true, role: true }
                }
              }
            }
          }
        },
        hackathon: {
          select: {
            id: true,
            title: true,
            endDate: true
          }
        }
      }
    })
    
    if (!submission) {
      return ApiResponseHandler.notFound(t('projects.submissionNotFound'))
    }
    
    // 检查用户权限
    const isCreator = submission.project.creatorId === payload.userId
    const isTeamMember = submission.project.team?.members?.some(member => member.userId === payload.userId)
    
    if (!isCreator && !isTeamMember) {
      return ApiResponseHandler.forbidden(t('projects.noPermission'))
    }
    
    // 检查是否可以撤销
    if (submission.status !== 'SUBMITTED') {
      return ApiResponseHandler.badRequest(
        t('projects.cannotWithdrawInCurrentStatus', { status: submission.status })
      )
    }
    
    // 检查撤销时间限制
    const now = new Date()
    if (now > submission.hackathon.endDate) {
      return ApiResponseHandler.badRequest(
        t('projects.cannotWithdrawAfterDeadline')
      )
    }
    
    // 撤销提交
    const withdrawnSubmission = await prisma.projectSubmission.update({
      where: {
        projectId_hackathonId: {
          projectId,
          hackathonId
        }
      },
      data: {
        status: 'WITHDRAWN',
        withdrawnAt: new Date(),
        withdrawReason: 'User requested withdrawal'
      },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })
    
    return ApiResponseHandler.success({
      submission: withdrawnSubmission,
      message: t('projects.withdrawnSuccessfully', {
        projectTitle: submission.project.title,
        hackathonTitle: submission.hackathon.title
      })
    })
    
  } catch (error) {
    console.error('撤销项目提交失败:', error)
    return ApiResponseHandler.internalError('Failed to withdraw project submission')
  }
}
