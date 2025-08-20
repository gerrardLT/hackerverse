import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(
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
        leaderId: true,
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

    // 检查用户是否是队长
    if (team.leaderId === user.id) {
      return NextResponse.json(
        { success: false, error: '队长不能离开团队，请转让队长或解散团队' },
        { status: 400 }
      )
    }

    // 检查用户是否是团队成员
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id
      }
    })

    if (!teamMember) {
      return NextResponse.json(
        { success: false, error: '您不是该团队成员' },
        { status: 400 }
      )
    }

    // 离开团队
    await prisma.teamMember.delete({
      where: {
        id: teamMember.id
      }
    })

    return NextResponse.json({
      success: true,
      message: '成功离开团队'
    })
  } catch (error) {
    console.error('离开团队错误:', error)
    return NextResponse.json(
      { success: false, error: '离开团队失败' },
      { status: 500 }
    )
  }
} 