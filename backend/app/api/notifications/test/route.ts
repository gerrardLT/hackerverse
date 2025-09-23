import { NextRequest, NextResponse } from 'next/server'
import { SimpleNotificationService } from '@/lib/simple-notification-service'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

// 测试通知创建API
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户认证失败' },
        { status: 401 }
      )
    }

    // 创建各种类型的测试通知
    const notifications = []

    // 1. 欢迎通知
    notifications.push(
      await SimpleNotificationService.createWelcomeNotification(
        user.id,
        user.username || user.email
      )
    )

    // 2. 团队邀请通知
    notifications.push(
      await SimpleNotificationService.createTeamInviteNotification(
        user.id,
        'React开发团队',
        '张三',
        'team-123'
      )
    )

    // 3. 申请批准通知
    notifications.push(
      await SimpleNotificationService.createApplicationResultNotification(
        user.id,
        'AI创新团队',
        true,
        'team-456'
      )
    )

    // 4. 申请拒绝通知
    notifications.push(
      await SimpleNotificationService.createApplicationResultNotification(
        user.id,
        'Web3团队',
        false,
        'team-789'
      )
    )

    // 5. 新成员加入通知
    notifications.push(
      await SimpleNotificationService.createMemberJoinedNotification(
        user.id,
        'React开发团队',
        '李四',
        'team-123'
      )
    )

    // 6. 黑客松提醒通知
    notifications.push(
      await SimpleNotificationService.createHackathonReminderNotification(
        user.id,
        'React黑客松2024',
        'starting',
        'hackathon-123',
        '1小时'
      )
    )

    // 7. 项目互动通知
    notifications.push(
      await SimpleNotificationService.createProjectInteractionNotification(
        user.id,
        'AI聊天机器人',
        'liked',
        '王五',
        'project-123'
      )
    )

    // 8. 社区互动通知
    notifications.push(
      await SimpleNotificationService.createCommunityInteractionNotification(
        user.id,
        'post_replied',
        '赵六',
        'React最佳实践分享',
        'post-123'
      )
    )

    // 9. 系统公告通知
    notifications.push(
      await SimpleNotificationService.createSystemAnnouncementNotification(
        user.id,
        '系统维护通知',
        '系统将于今晚23:00-01:00进行维护升级，期间可能无法访问',
        '/announcements/maintenance'
      )
    )

    return NextResponse.json({
      success: true,
      message: `成功创建 ${notifications.length} 条测试通知`,
      data: {
        count: notifications.length,
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message
        }))
      }
    })

  } catch (error) {
    console.error('创建测试通知失败:', error)
    return NextResponse.json(
      { success: false, error: '创建测试通知失败' },
      { status: 500 }
    )
  }
}

// 清理测试通知API
export async function DELETE(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户认证失败' },
        { status: 401 }
      )
    }

    // 删除用户的所有通知（仅用于测试）
    const { prisma } = require('@/lib/prisma')
    const result = await prisma.notification.deleteMany({
      where: {
        userId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: `成功清理 ${result.count} 条通知`,
      data: { deletedCount: result.count }
    })

  } catch (error) {
    console.error('清理测试通知失败:', error)
    return NextResponse.json(
      { success: false, error: '清理测试通知失败' },
      { status: 500 }
    )
  }
}
