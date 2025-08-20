import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }

    // 获取邀请信息
    const invitation = await prisma.notification.findFirst({
      where: {
        id: invitationId,
        userId: user.id,
        type: 'team_invite',
        read: false
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: '邀请不存在或已处理' },
        { status: 404 }
      )
    }

    const teamId = (invitation.data as any)?.teamId
    if (!teamId) {
      return NextResponse.json(
        { success: false, error: '邀请数据无效' },
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
        { success: false, error: '团队不存在' },
        { status: 404 }
      )
    }

    // 检查团队是否已满员
    if (team._count.members >= team.maxMembers) {
      return NextResponse.json(
        { success: false, error: '团队已满员' },
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
        { success: false, error: '您已经是该团队成员' },
        { status: 400 }
      )
    }

    // 加入团队
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: user.id,
        role: 'member',
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
      { success: false, error: '接受邀请失败' },
      { status: 500 }
    )
  }
} 