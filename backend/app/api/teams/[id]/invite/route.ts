import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { SimpleNotificationService } from '@/lib/simple-notification-service'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 邀请用户验证模式
const inviteUserSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
  role: z.enum(['member', 'admin']).default('member'),
  message: z.string().max(500, '邀请消息不能超过500字符').optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    const teamId = params.id
    const body = await request.json()
    
    // 验证请求数据
    const validatedData = inviteUserSchema.parse(body)
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized') },
        { status: 401 }
      )
    }

    // 检查团队是否存在且用户是队长
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
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
        { success: false, error: t('teams.notFound') },
        { status: 404 }
      )
    }

    if (team.leaderId !== user.id) {
      return NextResponse.json(
        { success: false, error: t('teams.onlyLeaderCanInvite', { fallback: 'Only team leader can invite members' }) },
        { status: 403 }
      )
    }

    // 检查团队是否已满员
    if (team._count.members >= team.maxMembers) {
      return NextResponse.json(
        { success: false, error: t('teams.teamFull') },
        { status: 400 }
      )
    }

    // 检查被邀请用户是否存在
    const invitedUser = await prisma.user.findUnique({
      where: { id: validatedData.userId }
    })

    if (!invitedUser) {
      return NextResponse.json(
        { success: false, error: t('teams.invitedUserNotFound', { fallback: 'Invited user not found' }) },
        { status: 404 }
      )
    }

    // 检查被邀请用户是否已经是团队成员
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: validatedData.userId
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: t('teams.alreadyTeamMember', { fallback: 'User is already a team member' }) },
        { status: 400 }
      )
    }

    // 检查被邀请用户是否已参加该黑客松
    const participation = await prisma.participation.findFirst({
      where: {
        hackathonId: team.hackathonId,
        userId: validatedData.userId
      }
    })

    if (!participation) {
      return NextResponse.json(
        { success: false, error: t('teams.userNotRegistered', { fallback: 'Invited user has not registered for this hackathon' }) },
        { status: 400 }
      )
    }

    // 检查被邀请用户是否已加入其他团队
    const otherTeamMember = await prisma.teamMember.findFirst({
      where: {
        userId: validatedData.userId,
        team: {
          hackathonId: team.hackathonId
        }
      }
    })

    if (otherTeamMember) {
      return NextResponse.json(
        { success: false, error: t('teams.alreadyInOtherTeam', { fallback: 'Invited user has already joined another team' }) },
        { status: 400 }
      )
    }

    // 获取团队详细信息以便创建邀请通知
    const teamWithDetails = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        leader: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    })

    // 检查是否已有未处理的邀请
    const existingInvitation = await prisma.notification.findFirst({
      where: {
        userId: validatedData.userId,
        type: 'TEAM_INVITE',
        read: false,
        data: {
          path: ['teamId'],
          equals: teamId
        }
      }
    })

    if (existingInvitation) {
      return NextResponse.json(
        { success: false, error: t('teams.pendingInvitationExists', { fallback: 'User already has a pending team invitation' }) },
        { status: 400 }
      )
    }

    // 创建邀请通知
    await SimpleNotificationService.createTeamInviteNotification(
      validatedData.userId,
      teamWithDetails?.name || '未知团队',
      user.username || '未知用户',
      teamId
    )

    return NextResponse.json({
      success: true,
      message: t('teams.inviteSent')
    })
  } catch (error) {
    console.error('发送邀请错误:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('errors.validationError'), details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: t('teams.inviteError', { fallback: 'Failed to send invitation' }) },
      { status: 500 }
    )
  }
} 