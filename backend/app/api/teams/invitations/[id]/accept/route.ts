import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { t, getLocaleFromRequest } from '@/lib/i18n'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invitationId = params.id
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized', getLocaleFromRequest(request)) },
        { status: 401 }
      )
    }

    // 获取邀请信息
    const invitation = await prisma.notification.findFirst({
      where: {
        id: invitationId,
        userId: user.id,
        type: 'TEAM_INVITE',
        read: false
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: t('teams.invitationNotFoundOrProcessed', getLocaleFromRequest(request)) },
        { status: 404 }
      )
    }

    const teamId = (invitation.data as any)?.teamId
    if (!teamId) {
      return NextResponse.json(
        { success: false, error: t('teams.invitationDataInvalid', getLocaleFromRequest(request)) },
        { status: 400 }
      )
    }

    // 检查团队是否存在
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
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

    // 检查团队是否已满员
    if (team._count.members >= team.maxMembers) {
      return NextResponse.json(
        { success: false, error: t('teams.teamFull', getLocaleFromRequest(request)) },
        { status: 400 }
      )
    }

    // 检查用户是否已经是团队成员
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: t('teams.alreadyMember', getLocaleFromRequest(request)) },
        { status: 400 }
      )
    }

    // 加入团队
    const inviteData = invitation.data as any
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: user.id,
        role: inviteData?.role || 'member',
        joinedAt: new Date()
      },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            hackathon: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    })

    // 标记邀请为已读
    await prisma.notification.update({
      where: { id: invitationId },
      data: { read: true }
    })

    return NextResponse.json({
      success: true,
      data: { teamMember },
      message: '成功接受邀请并加入团队'
    })
  } catch (error) {
    console.error('接受邀请错误:', error)
    return NextResponse.json(
      { success: false, error: t('teams.acceptInvitationFailed', getLocaleFromRequest(request)) },
      { status: 500 }
    )
  }
} 