import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { t, getLocaleFromRequest } from '@/lib/i18n'

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized', getLocaleFromRequest(request)) },
        { status: 401 }
      )
    }

    // 获取用户的团队邀请
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        type: 'TEAM_INVITE',
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

    // 转换数据结构以匹配前端期望
    const invitations = notifications.map(notification => {
      const data = notification.data as any
      return {
        id: notification.id,
        teamId: data?.teamId || '',
        teamName: data?.teamName || '未知团队',
        inviterName: data?.inviterName || '未知用户',
        inviterAvatar: data?.inviterAvatar || '',
        message: notification.message || '',
        createdAt: notification.createdAt
      }
    })

    return NextResponse.json({
      success: true,
      data: { invitations }
    })
  } catch (error) {
    console.error('获取邀请列表错误:', error)
    return NextResponse.json(
      { success: false, error: t('teams.getInvitationsError', getLocaleFromRequest(request)) },
      { status: 500 }
    )
  }
} 