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
        type: 'TEAM_INVITE',
        read: false
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: '邀请不存在或已处理' },
        { status: 404 }
      )
    }

    // 标记邀请为已读
    await prisma.notification.update({
      where: { id: invitationId },
      data: { read: true }
    })

    return NextResponse.json({
      success: true,
      message: '已拒绝邀请'
    })
  } catch (error) {
    console.error('拒绝邀请错误:', error)
    return NextResponse.json(
      { success: false, error: '拒绝邀请失败' },
      { status: 500 }
    )
  }
} 