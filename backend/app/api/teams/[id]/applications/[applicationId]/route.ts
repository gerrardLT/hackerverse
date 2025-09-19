import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { t, getLocaleFromRequest } from '@/lib/i18n'
import { SimpleNotificationService } from '@/lib/simple-notification-service'

// 审批申请验证模式
const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(200, '理由不能超过200字符').optional()
})

// 审批团队申请
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; applicationId: string } }
) {
  try {
    const teamId = params.id
    const applicationId = params.applicationId
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized', getLocaleFromRequest(request)) },
        { status: 401 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    // 检查团队是否存在且用户是否为团队领导
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        leaderId: true,
        maxMembers: true,
        hackathonId: true,
        _count: {
          select: {
            members: true
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { success: false, error: t('teams.notFound', getLocaleFromRequest(request)) },
        { status: 404 }
      )
    }

    if (team.leaderId !== user.id) {
      return NextResponse.json(
        { success: false, error: t('teams.onlyLeaderCanReviewApplications', getLocaleFromRequest(request)) },
        { status: 403 }
      )
    }

    // 检查申请是否存在且状态为待审核
    // @ts-ignore - Prisma客户端类型更新延迟
    const application = await prisma.teamApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        teamId: true,
        userId: true,
        status: true,
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { success: false, error: t('teams.applicationNotFound', getLocaleFromRequest(request)) },
        { status: 404 }
      )
    }

    if (application.teamId !== teamId) {
      return NextResponse.json(
        { success: false, error: t('teams.applicationNotBelongToTeam', getLocaleFromRequest(request)) },
        { status: 400 }
      )
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: t('teams.applicationAlreadyProcessed', getLocaleFromRequest(request)) },
        { status: 400 }
      )
    }

    // 如果是批准申请，需要额外检查
    if (validatedData.action === 'approve') {
      // 检查团队是否已满员
      if (team._count.members >= team.maxMembers) {
        return NextResponse.json(
          { success: false, error: t('teams.teamFull', getLocaleFromRequest(request)) },
          { status: 400 }
        )
      }

      // 检查申请人是否已经在其他团队
      const existingMembership = await prisma.teamMember.findFirst({
        where: {
          userId: application.userId,
          team: {
            hackathonId: team.hackathonId
          }
        }
      })

      if (existingMembership) {
        return NextResponse.json(
          { success: false, error: t('teams.alreadyInOtherTeam', getLocaleFromRequest(request)) },
          { status: 400 }
        )
      }

      // 使用事务处理批准申请
      const result = await prisma.$transaction(async (tx) => {
        // 更新申请状态
        // @ts-ignore - Prisma客户端类型更新延迟
        const updatedApplication = await tx.teamApplication.update({
          where: { id: applicationId },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedBy: user.id
          }
        })

        // 创建团队成员记录
        const teamMember = await tx.teamMember.create({
          data: {
            teamId: teamId,
            userId: application.userId,
            role: 'member',
            joinedAt: new Date()
          }
        })

        // 检查是否需要更新团队状态为已满员
        const memberCount = await tx.teamMember.count({
          where: { teamId: teamId }
        })

        if (memberCount >= team.maxMembers) {
          // @ts-ignore - Prisma客户端类型更新延迟，Team模型status字段
          await tx.team.update({
            where: { id: teamId },
            // @ts-ignore - Team模型status字段类型未更新
            data: { status: 'FULL' }
          })
        }

        return { application: updatedApplication, teamMember }
      })

      // 发送批准通知给申请人
      try {
        await SimpleNotificationService.createApplicationResultNotification(
          application.userId,
          team.name,
          true,
          teamId
        )

        // 通知团队其他成员有新成员加入
        const otherMembers = await prisma.teamMember.findMany({
          where: {
            teamId: teamId,
            userId: { not: application.userId }
          },
          select: { userId: true }
        })

        for (const member of otherMembers) {
          await SimpleNotificationService.createMemberJoinedNotification(
            member.userId,
            team.name,
            application.user.username,
            teamId
          )
        }
      } catch (notificationError) {
        console.error('发送通知失败:', notificationError)
        // 通知失败不影响主流程
      }

      return NextResponse.json({
        success: true,
        message: `已批准 ${application.user.username} 的申请`,
        data: result
      })

    } else {
      // 拒绝申请
      // @ts-ignore - Prisma客户端类型更新延迟
      const updatedApplication = await prisma.teamApplication.update({
        where: { id: applicationId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: user.id
        }
      })

      // 发送拒绝通知给申请人
      try {
        await SimpleNotificationService.createApplicationResultNotification(
          application.userId,
          team.name,
          false,
          teamId
        )
      } catch (notificationError) {
        console.error('发送通知失败:', notificationError)
        // 通知失败不影响主流程
      }

      return NextResponse.json({
        success: true,
        message: `已拒绝 ${application.user.username} 的申请`,
        data: { application: updatedApplication }
      })
    }

  } catch (error) {
    console.error('审批申请错误:', error)
    return NextResponse.json(
      { success: false, error: t('teams.reviewApplicationFailed', getLocaleFromRequest(request)) },
      { status: 500 }
    )
  }
}
