import { prisma } from './prisma'
import { t } from './i18n'

interface SimpleNotificationData {
  userId: string
  type: string
  title: string
  message: string
  priority?: string
  category?: string
  actionUrl?: string
  actionLabel?: string
  data?: any
}

export class SimpleNotificationService {
  
  /**
   * 创建团队邀请通知
   */
  static async createTeamInviteNotification(
    userId: string,
    teamName: string,
    inviterName: string,
    teamId: string,
    locale: 'en' | 'zh' = 'en'
  ) {
    return this.createNotification({
      userId,
      type: 'TEAM_INVITE',
      title: t('notificationTemplates.teamInvite', locale),
      message: t('notificationTemplates.teamInviteMessage', locale, { inviterName, teamName }),
      priority: 'HIGH',
      category: 'TEAM',
      actionUrl: `/teams/${teamId}`,
      actionLabel: t('notificationTemplates.viewDetails', locale),
      data: {
        teamId,
        teamName,
        inviterName
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
    teamId: string,
    locale: 'en' | 'zh' = 'en'
  ) {
    return this.createNotification({
      userId,
      type: approved ? 'TEAM_APPLICATION_APPROVED' : 'TEAM_APPLICATION_REJECTED',
      title: approved ? t('notificationTemplates.applicationApproved', locale) : t('notificationTemplates.applicationRejected', locale),
      message: approved 
        ? t('notificationTemplates.applicationApprovedMessage', locale, { teamName })
        : t('notificationTemplates.applicationRejectedMessage', locale, { teamName }),
      priority: 'HIGH',
      category: 'TEAM',
      actionUrl: `/teams/${teamId}`,
      actionLabel: t('notificationTemplates.viewTeam', locale),
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
    teamId: string,
    locale: 'en' | 'zh' = 'en'
  ) {
    return this.createNotification({
      userId,
      type: 'TEAM_MEMBER_JOINED',
      title: t('notificationTemplates.newMemberJoined', locale),
      message: t('notificationTemplates.newMemberJoinedMessage', locale, { memberName: newMemberName, teamName }),
      priority: 'MEDIUM',
      category: 'TEAM',
      actionUrl: `/teams/${teamId}`,
      actionLabel: t('notificationTemplates.viewTeam', locale),
      data: {
        teamId,
        teamName,
        newMemberName
      }
    })
  }

  /**
   * 创建欢迎消息
   */
  static async createWelcomeNotification(userId: string, username: string) {
    return this.createNotification({
      userId,
      type: 'WELCOME_MESSAGE',
      title: '欢迎加入 HackX！',
      message: `欢迎 ${username}！开始你的黑客松之旅，探索无限可能！`,
      priority: 'MEDIUM',
      category: 'SYSTEM',
      actionUrl: '/dashboard',
      actionLabel: '开始探索',
      data: {
        username,
        isWelcome: true
      }
    })
  }

  /**
   * 创建黑客松提醒通知
   */
  static async createHackathonReminderNotification(
    userId: string,
    hackathonTitle: string,
    reminderType: 'starting' | 'ending' | 'registration_ending' | 'submission_ending',
    hackathonId: string,
    timeRemaining: string
  ) {
    const typeMap = {
      starting: 'HACKATHON_STARTING',
      ending: 'HACKATHON_ENDING',
      registration_ending: 'HACKATHON_REGISTRATION_REMINDER',
      submission_ending: 'HACKATHON_SUBMISSION_REMINDER'
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
      priority: 'URGENT',
      category: 'HACKATHON',
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
   * 创建项目互动通知
   */
  static async createProjectInteractionNotification(
    userId: string,
    projectTitle: string,
    interactionType: 'liked' | 'commented',
    actorName: string,
    projectId: string
  ) {
    const type = interactionType === 'liked' ? 'PROJECT_LIKED' : 'PROJECT_COMMENTED'
    const message = interactionType === 'liked' 
      ? `${actorName} 点赞了你的项目 "${projectTitle}"`
      : `${actorName} 评论了你的项目 "${projectTitle}"`

    return this.createNotification({
      userId,
      type,
      title: '项目互动',
      message,
      priority: 'LOW',
      category: 'PROJECT',
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
      post_replied: 'COMMUNITY_POST_REPLIED',
      post_liked: 'COMMUNITY_POST_LIKED',
      reply_liked: 'COMMUNITY_REPLY_LIKED',
      new_follower: 'COMMUNITY_NEW_FOLLOWER'
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
      priority: 'LOW',
      category: 'COMMUNITY',
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
      type: 'SYSTEM_ANNOUNCEMENT',
      title: `📢 ${title}`,
      message,
      priority: 'MEDIUM',
      category: 'SYSTEM',
      actionUrl,
      actionLabel: actionUrl ? '查看详情' : undefined,
      data: {
        announcementTitle: title
      }
    })
  }

  /**
   * 创建通知的核心方法
   */
  private static async createNotification(data: SimpleNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          // 暂时只使用基础字段，新字段等Prisma完全更新后再添加
        }
      })

      console.log(`✅ 通知已创建: ${data.type} -> ${data.userId}`)
      return notification
    } catch (error) {
      console.error('❌ 创建通知失败:', error)
      throw error
    }
  }
}
