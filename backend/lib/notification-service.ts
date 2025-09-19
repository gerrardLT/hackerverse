import { prisma } from './prisma'
import { CommunityNotificationType } from '@prisma/client'
import { t } from './i18n'

export class NotificationService {
  // 创建回复通知
  static async createReplyNotification(
    postAuthorId: string,
    replyAuthorId: string,
    postId: string,
    postTitle: string,
    locale: 'en' | 'zh' = 'en'
  ) {
    // 不给自己发通知
    if (postAuthorId === replyAuthorId) return

    await prisma.communityNotification.create({
      data: {
        userId: postAuthorId,
        type: CommunityNotificationType.REPLY,
        title: t('notificationTemplates.postReply', locale),
        content: t('notificationTemplates.postReplyMessage', locale, { postTitle }),
        entityType: 'post',
        entityId: postId,
        triggerUserId: replyAuthorId
      }
    })
  }

  // 创建点赞帖子通知
  static async createPostLikeNotification(
    postAuthorId: string,
    likerUserId: string,
    postId: string,
    postTitle: string,
    locale: 'en' | 'zh' = 'en'
  ) {
    // 不给自己发通知
    if (postAuthorId === likerUserId) return

    await prisma.communityNotification.create({
      data: {
        userId: postAuthorId,
        type: CommunityNotificationType.POST_LIKE,
        title: t('notificationTemplates.postLiked', locale),
        content: t('notificationTemplates.postLikedMessage', locale, { postTitle }),
        entityType: 'post',
        entityId: postId,
        triggerUserId: likerUserId
      }
    })
  }

  // 创建点赞回复通知
  static async createReplyLikeNotification(
    replyAuthorId: string,
    likerUserId: string,
    replyId: string,
    postTitle: string,
    locale: 'en' | 'zh' = 'en'
  ) {
    // 不给自己发通知
    if (replyAuthorId === likerUserId) return

    await prisma.communityNotification.create({
      data: {
        userId: replyAuthorId,
        type: CommunityNotificationType.REPLY_LIKE,
        title: t('notificationTemplates.replyLiked', locale),
        content: t('notificationTemplates.replyLikedMessage', locale, { postTitle }),
        entityType: 'reply',
        entityId: replyId,
        triggerUserId: likerUserId
      }
    })
  }

  // 创建新关注者通知
  static async createNewFollowerNotification(
    followedUserId: string,
    followerUserId: string,
    followerUsername: string,
    locale: 'en' | 'zh' = 'en'
  ) {
    await prisma.communityNotification.create({
      data: {
        userId: followedUserId,
        type: CommunityNotificationType.NEW_FOLLOWER,
        title: t('notificationTemplates.newFollower', locale),
        content: t('notificationTemplates.newFollowerMessage', locale, { followerName: followerUsername }),
        entityType: 'user',
        entityId: followerUserId,
        triggerUserId: followerUserId
      }
    })
  }

  // 创建关注用户发帖通知
  static async createFollowerPostNotification(
    authorId: string,
    postId: string,
    postTitle: string,
    authorUsername: string
  ) {
    // 获取作者的粉丝
    const followers = await prisma.userFollow.findMany({
      where: { followingId: authorId },
      select: { followerId: true }
    })

    // 为每个粉丝创建通知
    const notifications = followers.map(follow => ({
      userId: follow.followerId,
      type: CommunityNotificationType.FOLLOWER_POST,
      title: '你关注的人发布了新帖子',
      content: `${authorUsername} 发布了新帖子《${postTitle}》`,
      entityType: 'post',
      entityId: postId,
      triggerUserId: authorId
    }))

    if (notifications.length > 0) {
      await prisma.communityNotification.createMany({
        data: notifications
      })
    }
  }

  // 创建系统公告通知
  static async createSystemAnnouncement(
    title: string,
    content: string,
    targetUserIds?: string[]
  ) {
    let userIds: string[]

    if (targetUserIds && targetUserIds.length > 0) {
      userIds = targetUserIds
    } else {
      // 给所有活跃用户发送
      const activeUsers = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true }
      })
      userIds = activeUsers.map(user => user.id)
    }

    const notifications = userIds.map(userId => ({
      userId,
      type: CommunityNotificationType.SYSTEM_ANNOUNCEMENT,
      title,
      content,
      entityType: null,
      entityId: null,
      triggerUserId: null
    }))

    if (notifications.length > 0) {
      await prisma.communityNotification.createMany({
        data: notifications
      })
    }
  }

  // 创建欢迎通知
  static async createWelcomeNotification(userId: string, username: string) {
    await prisma.communityNotification.create({
      data: {
        userId,
        type: CommunityNotificationType.WELCOME,
        title: '欢迎加入 HackX 社区！',
        content: `欢迎 ${username}！开始探索精彩的黑客松世界吧。你可以发布帖子、参与讨论、关注其他用户。`,
        entityType: null,
        entityId: null,
        triggerUserId: null
      }
    })
  }

  // 获取用户通知列表
  static async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ) {
    const skip = (page - 1) * limit
    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {})
    }

    const notifications = await prisma.communityNotification.findMany({
      where,
      include: {
        triggerUser: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    const total = await prisma.communityNotification.count({ where })

    return {
      notifications,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  // 标记通知为已读
  static async markAsRead(notificationIds: string[], userId: string) {
    await prisma.communityNotification.updateMany({
      where: {
        id: { in: notificationIds },
        userId // 确保只能标记自己的通知
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })
  }

  // 标记所有通知为已读
  static async markAllAsRead(userId: string) {
    await prisma.communityNotification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })
  }

  // 获取未读通知数量
  static async getUnreadCount(userId: string) {
    return await prisma.communityNotification.count({
      where: {
        userId,
        isRead: false
      }
    })
  }

  // 删除通知
  static async deleteNotification(notificationId: string, userId: string) {
    await prisma.communityNotification.deleteMany({
      where: {
        id: notificationId,
        userId // 确保只能删除自己的通知
      }
    })
  }
}
