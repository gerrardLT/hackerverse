import { SimpleNotificationService } from './simple-notification-service'
import { prisma } from './prisma'

export class NotificationScheduler {
  
  /**
   * 检查并发送黑客松提醒通知
   */
  static async checkHackathonReminders() {
    try {
      const now = new Date()
      
      // 检查即将开始的黑客松 (1小时内)
      const startingSoon = await prisma.hackathon.findMany({
        where: {
          startDate: {
            gte: now,
            lte: new Date(now.getTime() + 60 * 60 * 1000) // 1小时后
          },
          status: 'APPROVED'
        },
        include: {
          participations: {
            select: { userId: true }
          }
        }
      })

      for (const hackathon of startingSoon) {
        for (const participant of hackathon.participations) {
          await SimpleNotificationService.createHackathonReminderNotification(
            participant.userId,
            hackathon.title,
            'starting',
            hackathon.id,
            '1小时'
          )
        }
      }

      // 检查即将结束的黑客松 (24小时内)
      const endingSoon = await prisma.hackathon.findMany({
        where: {
          endDate: {
            gte: now,
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24小时后
          },
          status: 'ACTIVE'
        },
        include: {
          participations: {
            select: { userId: true }
          }
        }
      })

      for (const hackathon of endingSoon) {
        for (const participant of hackathon.participations) {
          await SimpleNotificationService.createHackathonReminderNotification(
            participant.userId,
            hackathon.title,
            'ending',
            hackathon.id,
            '24小时'
          )
        }
      }

      // 检查报名即将截止的黑客松 (3天内)
      const registrationEnding = await prisma.hackathon.findMany({
        where: {
          registrationDeadline: {
            gte: now,
            lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3天后
          },
          status: 'APPROVED'
        },
        include: {
          _count: {
            select: { participations: true }
          }
        }
      })

      // 向所有用户发送报名提醒（这里简化处理，实际应该有更智能的推荐逻辑）
      const activeUsers = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30天内活跃用户
          }
        },
        take: 100, // 限制数量
        select: { id: true }
      })

      for (const hackathon of registrationEnding) {
        for (const user of activeUsers.slice(0, 50)) { // 限制通知数量
          await SimpleNotificationService.createHackathonReminderNotification(
            user.id,
            hackathon.title,
            'registration_ending',
            hackathon.id,
            '3天'
          )
        }
      }

      console.log(`✅ 黑客松提醒检查完成: 开始提醒 ${startingSoon.length}, 结束提醒 ${endingSoon.length}, 报名提醒 ${registrationEnding.length}`)
      
    } catch (error) {
      console.error('❌ 黑客松提醒检查失败:', error)
    }
  }

  /**
   * 清理过期通知
   */
  static async cleanupExpiredNotifications() {
    try {
      // 删除30天前的已读通知
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const result = await prisma.notification.deleteMany({
        where: {
          read: true,
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      })

      console.log(`🗑️ 清理过期通知: ${result.count} 条`)
      return result.count
      
    } catch (error) {
      console.error('❌ 清理过期通知失败:', error)
      return 0
    }
  }

  /**
   * 启动定时任务
   */
  static startScheduler() {
    // 每10分钟检查一次黑客松提醒
    setInterval(async () => {
      await this.checkHackathonReminders()
    }, 10 * 60 * 1000)

    // 每天凌晨2点清理过期通知
    setInterval(async () => {
      const now = new Date()
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        await this.cleanupExpiredNotifications()
      }
    }, 60 * 1000) // 每分钟检查一次时间

    console.log('📅 通知调度器已启动')
  }
}
