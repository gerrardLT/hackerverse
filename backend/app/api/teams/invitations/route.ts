import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }

    // 获取用户的团队邀请
    const invitations = await prisma.notification.findMany({
      where: {
        userId: user.id,
        type: 'team_invite',
        read: false
      },
      select: {
        id: true,
        title: true,
        message: true,
        data: true,
        createdAt: true,
        read: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: { invitations }
    })
  } catch (error) {
    console.error('获取邀请列表错误:', error)
    return NextResponse.json(
      { success: false, error: '获取邀请列表失败' },
      { status: 500 }
    )
  }
} 