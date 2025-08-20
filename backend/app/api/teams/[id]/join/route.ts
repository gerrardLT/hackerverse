import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }

    // 检查团队是否存在
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        maxMembers: true,
        isPublic: true,
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

    if (!team.isPublic) {
      return NextResponse.json(
        { success: false, error: '该团队不公开招募' },
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

    // 检查用户是否已参加该黑客松
    const participation = await prisma.participation.findFirst({
      where: {
        hackathonId: team.hackathonId,
        userId: user.id
      }
    })

    if (!participation) {
      return NextResponse.json(
        { success: false, error: '请先报名参加该黑客松' },
        { status: 400 }
      )
    }

    // 检查用户是否已加入其他团队
    const otherTeamMember = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        team: {
          hackathonId: team.hackathonId
        }
      }
    })

    if (otherTeamMember) {
      return NextResponse.json(
        { success: false, error: '您已加入该黑客松的其他团队' },
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
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { teamMember },
      message: '成功加入团队'
    })
  } catch (error) {
    console.error('加入团队错误:', error)
    return NextResponse.json(
      { success: false, error: '加入团队失败' },
      { status: 500 }
    )
  }
} 