import { prisma } from './prisma'

// 临时使用字符串类型，直到Prisma客户端完全更新
type NotificationType = string
type NotificationPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
type NotificationCategory = 'TEAM' | 'HACKATHON' | 'PROJECT' | 'COMMUNITY' | 'SYSTEM'

interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  priority?: NotificationPriority
  category?: NotificationCategory
  actionUrl?: string
  actionLabel?: string
  data?: any
  expiresAt?: Date
}

export class UnifiedNotificationService {
  
  // ============ 团队相关通知 ============
  
  /**
   * 创建团队邀请通知
   */
  static async createTeamInviteNotification(
    userId: string,
    teamName: string,
    inviterName: string,
    teamId: string,
    inviteId: string
  ) {
    return this.createNotification({
      userId,
      type: 'TEAM_INVITE',
      title: '团队邀请',
      message: `${inviterName} 邀请你加入 "${teamName}" 团队`,
      priority: NotificationPriority.HIGH,
      category: NotificationCategory.TEAM,
      actionUrl: `/teams/${teamId}`,
      actionLabel: '查看详情',
      data: {
        teamId,
        teamName,
        inviterName,
        inviteId
      }
    })
  }

  /**
   * 创建申请结果通知
   */
  static async createApplicationResultNotification(
    userId: string,
    teamName: string,
    approved: boolean,
    teamId: string
  ) {
    return this.createNotification({
      userId,
      type: approved ? NotificationType.TEAM_APPLICATION_APPROVED : NotificationType.TEAM_APPLICATION_REJECTED,
      title: approved ? '申请已批准' : '申请被拒绝',
      message: approved 
        ? `恭喜！你的加入 "${teamName}" 团队的申请已被批准`
        : `很遗憾，你的加入 "${teamName}" 团队的申请被拒绝`,
      priority: NotificationPriority.HIGH,
      category: NotificationCategory.TEAM,
      actionUrl: `/teams/${teamId}`,
      actionLabel: '查看团队',
      data: {
        teamId,
        teamName,
        approved
      }
    })
  }

  /**
   * 创建新成员加入通知
   */
  static async createMemberJoinedNotification(
    userId: string,
    teamName: string,
    newMemberName: string,
    teamId: string
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.TEAM_MEMBER_JOINED,
      title: '新成员加入',
      message: `${newMemberName} 已加入你的团队 "${teamName}"`,
      priority: NotificationPriority.MEDIUM,
      category: NotificationCategory.TEAM,
      actionUrl: `/teams/${teamId}`,
      actionLabel: '查看团队',
      data: {
        teamId,
        teamName,
        newMemberName
      }
    })
  }

  // ============ 黑客松相关通知 ============
  
  /**
   * 创建黑客松时间提醒通知
   */
  static async createHackathonReminderNotification(
    userId: string,
    hackathonTitle: string,
    reminderType: 'starting' | 'ending' | 'registration_ending' | 'submission_ending',
    hackathonId: string,
    timeRemaining: string
  ) {
    const typeMap = {
      starting: NotificationType.HACKATHON_STARTING,
      ending: NotificationType.HACKATHON_ENDING,
      registration_ending: NotificationType.HACKATHON_REGISTRATION_REMINDER,
      submission_ending: NotificationType.HACKATHON_SUBMISSION_REMINDER
    }

    const messageMap = {
      starting: `"${hackathonTitle}" 将在 ${timeRemaining} 后开始`,
      ending: `"${hackathonTitle}" 将在 ${timeRemaining} 后结束`,
      registration_ending: `"${hackathonTitle}" 报名将在 ${timeRemaining} 后截止`,
      submission_ending: `"${hackathonTitle}" 项目提交将在 ${timeRemaining} 后截止`
    }

    return this.createNotification({
      userId,
      type: typeMap[reminderType],
      title: '黑客松提醒',
      message: messageMap[reminderType],
      priority: NotificationPriority.URGENT,
      category: NotificationCategory.HACKATHON,
      actionUrl: `/hackathons/${hackathonId}`,
      actionLabel: '查看详情',
      data: {
        hackathonId,
        hackathonTitle,
        reminderType,
        timeRemaining
      }
    })
  }

  /**
   * 创建获奖通知
   */
  static async createPrizeNotification(
    userId: string,
    hackathonTitle: string,
    prize: string,
    hackathonId: string,
    projectId?: string
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.PRIZE_AWARDED,
      title: '🏆 恭喜获奖！',
      message: `恭喜！你在 "${hackathonTitle}" 中获得了 ${prize}`,
      priority: NotificationPriority.URGENT,
      category: NotificationCategory.HACKATHON,
      actionUrl: projectId ? `/projects/${projectId}` : `/hackathons/${hackathonId}`,
      actionLabel: '查看详情',
      data: {
        hackathonId,
        hackathonTitle,
        prize,
        projectId
      }
    })
  }

  // ============ 项目相关通知 ============
  
  /**
   * 创建项目互动通知
   */
  static async createProjectInteractionNotification(
    userId: string,
    projectTitle: string,
    interactionType: 'liked' | 'commented',
    actorName: string,
    projectId: string
  ) {
    const type = interactionType === 'liked' ? NotificationType.PROJECT_LIKED : NotificationType.PROJECT_COMMENTED
    const message = interactionType === 'liked' 
      ? `${actorName} 点赞了你的项目 "${projectTitle}"`
      : `${actorName} 评论了你的项目 "${projectTitle}"`

    return this.createNotification({
      userId,
      type,
      title: '项目互动',
      message,
      priority: NotificationPriority.LOW,
      category: NotificationCategory.PROJECT,
      actionUrl: `/projects/${projectId}`,
      actionLabel: '查看项目',
      data: {
        projectId,
        projectTitle,
        interactionType,
        actorName
      }
    })
  }

  /**
   * 创建项目评审通知
   */
  static async createProjectReviewNotification(
    userId: string,
    projectTitle: string,
    judgeName: string,
    score: number,
    projectId: string
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.PROJECT_REVIEWED,
      title: '项目评审完成',
      message: `评审员 ${judgeName} 已完成对你的项目 "${projectTitle}" 的评审，得分：${score}`,
      priority: NotificationPriority.MEDIUM,
      category: NotificationCategory.PROJECT,
      actionUrl: `/projects/${projectId}`,
      actionLabel: '查看详情',
      data: {
        projectId,
        projectTitle,
        judgeName,
        score
      }
    })
  }

  // ============ 社区相关通知 ============
  
  /**
   * 创建社区互动通知
   */
  static async createCommunityInteractionNotification(
    userId: string,
    interactionType: 'post_replied' | 'post_liked' | 'reply_liked' | 'new_follower',
    actorName: string,
    entityTitle?: string,
    entityId?: string
  ) {
    const typeMap = {
      post_replied: NotificationType.COMMUNITY_POST_REPLIED,
      post_liked: NotificationType.COMMUNITY_POST_LIKED,
      reply_liked: NotificationType.COMMUNITY_REPLY_LIKED,
      new_follower: NotificationType.COMMUNITY_NEW_FOLLOWER
    }

    const messageMap = {
      post_replied: `${actorName} 回复了你的帖子${entityTitle ? ` "${entityTitle}"` : ''}`,
      post_liked: `${actorName} 点赞了你的帖子${entityTitle ? ` "${entityTitle}"` : ''}`,
      reply_liked: `${actorName} 点赞了你的回复`,
      new_follower: `${actorName} 关注了你`
    }

    return this.createNotification({
      userId,
      type: typeMap[interactionType],
      title: '社区互动',
      message: messageMap[interactionType],
      priority: NotificationPriority.LOW,
      category: NotificationCategory.COMMUNITY,
      actionUrl: entityId ? `/community/posts/${entityId}` : '/community',
      actionLabel: '查看详情',
      data: {
        interactionType,
        actorName,
        entityTitle,
        entityId
      }
    })
  }

  // ============ 系统相关通知 ============
  
  /**
   * 创建系统公告通知
   */
  static async createSystemAnnouncementNotification(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: `📢 ${title}`,
      message,
      priority: NotificationPriority.MEDIUM,
      category: NotificationCategory.SYSTEM,
      actionUrl,
      actionLabel: actionUrl ? '查看详情' : undefined,
      data: {
        announcementTitle: title
      }
    })
  }

  /**
   * 创建欢迎消息
   */
  static async createWelcomeNotification(userId: string, username: string) {
    return this.createNotification({
      userId,
      type: NotificationType.WELCOME_MESSAGE,
      title: '欢迎加入 HackX！',
      message: `欢迎 ${username}！开始你的黑客松之旅，探索无限可能！`,
      priority: NotificationPriority.MEDIUM,
      category: NotificationCategory.SYSTEM,
      actionUrl: '/dashboard',
      actionLabel: '开始探索',
      data: {
        username,
        isWelcome: true
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期
    })
  }

  // ============ 核心方法 ============
  
  /**
   * 创建通知的核心方法
   */
  private static async createNotification(data: NotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          priority: data.priority || NotificationPriority.MEDIUM,
          category: data.category || NotificationCategory.SYSTEM,
          actionUrl: data.actionUrl,
          actionLabel: data.actionLabel,
          data: data.data,
          expiresAt: data.expiresAt
        }
      })

      console.log(`✅ 通知已创建: ${data.type} -> ${data.userId}`)
      return notification
    } catch (error) {
      console.error('❌ 创建通知失败:', error)
      throw error
    }
  }

  /**
   * 批量创建通知
   */
  static async createBulkNotifications(notifications: NotificationData[]) {
    try {
      const result = await prisma.notification.createMany({
        data: notifications.map(data => ({
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          priority: data.priority || NotificationPriority.MEDIUM,
          category: data.category || NotificationCategory.SYSTEM,
          actionUrl: data.actionUrl,
          actionLabel: data.actionLabel,
          data: data.data,
          expiresAt: data.expiresAt
        }))
      })

      console.log(`✅ 批量创建通知成功: ${result.count} 条`)
      return result
    } catch (error) {
      console.error('❌ 批量创建通知失败:', error)
      throw error
    }
  }

  /**
   * 清理过期通知
   */
  static async cleanupExpiredNotifications() {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lte: new Date()
          }
        }
      })

      console.log(`🗑️ 清理过期通知: ${result.count} 条`)
      return result
    } catch (error) {
      console.error('❌ 清理过期通知失败:', error)
      throw error
    }
  }

  /**
   * 获取用户未读通知数量
   */
  static async getUnreadCount(userId: string) {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          read: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })
    } catch (error) {
      console.error('❌ 获取未读通知数量失败:', error)
      return 0
    }
  }
}
