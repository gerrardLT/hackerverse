import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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
    const teamId = params.id
    const body = await request.json()
    
    // 验证请求数据
    const validatedData = inviteUserSchema.parse(body)
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
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
        { success: false, error: '团队不存在' },
        { status: 404 }
      )
    }

    if (team.leaderId !== user.id) {
      return NextResponse.json(
        { success: false, error: '只有队长可以邀请成员' },
        { status: 403 }
      )
    }

    // 检查团队是否已满员
    if (team._count.members >= team.maxMembers) {
      return NextResponse.json(
        { success: false, error: '团队已满员' },
        { status: 400 }
      )
    }

    // 检查被邀请用户是否存在
    const invitedUser = await prisma.user.findUnique({
      where: { id: validatedData.userId }
    })

    if (!invitedUser) {
      return NextResponse.json(
        { success: false, error: '被邀请用户不存在' },
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
        { success: false, error: '该用户已经是团队成员' },
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
        { success: false, error: '被邀请用户未参加该黑客松' },
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
        { success: false, error: '被邀请用户已加入其他团队' },
        { status: 400 }
      )
    }

    // 创建邀请（这里可以扩展为邀请系统，暂时直接加入团队）
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: validatedData.userId,
        role: validatedData.role,
        joinedAt: new Date()
      },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          }
        }
      }
    })

    // 创建通知
    await prisma.notification.create({
      data: {
        userId: validatedData.userId,
        type: 'team_invite',
        title: '团队邀请',
        message: `您被邀请加入团队，邀请消息：${validatedData.message || '欢迎加入我们的团队！'}`,
        data: {
          teamId,
          teamName: team.id, // 这里应该获取团队名称
          inviterId: user.id
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { teamMember },
      message: '邀请发送成功'
    })
  } catch (error) {
    console.error('发送邀请错误:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '发送邀请失败' },
      { status: 500 }
    )
  }
} 