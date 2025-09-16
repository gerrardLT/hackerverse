import { formatTimeAgo } from '@/lib/community'

// 重新导出类型定义
export interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: string
  userId: string
  actionUrl?: string
  actionLabel?: string
  priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
  category?: 'TEAM' | 'HACKATHON' | 'PROJECT' | 'COMMUNITY' | 'SYSTEM'
  readAt?: string
}

export interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  teamInvites: boolean
  projectUpdates: boolean
  hackathonReminders: boolean
  reviewNotifications: boolean
  prizeNotifications: boolean
  systemMessages: boolean
}

// 默认通知设置
export const defaultNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  teamInvites: true,
  projectUpdates: true,
  hackathonReminders: true,
  reviewNotifications: true,
  prizeNotifications: true,
  systemMessages: true
}

// 通知时间格式化
export function formatNotificationTime(dateString: string): string {
  return formatTimeAgo(dateString)
}

// 获取通知图标
export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'team_invite':
    case 'team_application_approved':
    case 'team_application_rejected':
    case 'team_member_joined':
      return '👥'
    case 'hackathon_starting':
    case 'hackathon_ending':
    case 'hackathon_started':
    case 'hackathon_ended':
    case 'hackathon_registration_reminder':
    case 'hackathon_submission_reminder':
    case 'hackathon_results_announced':
      return '🏆'
    case 'prize_awarded':
      return '🎁'
    case 'project_liked':
    case 'project_commented':
    case 'project_reviewed':
    case 'project_status_changed':
      return '💻'
    case 'community_post_replied':
    case 'community_post_liked':
    case 'community_reply_liked':
    case 'community_new_follower':
      return '💬'
    default:
      return '🔔'
  }
}

// 获取通知颜色
export function getNotificationColor(priority: string = 'MEDIUM'): string {
  switch (priority) {
    case 'URGENT':
      return 'text-red-600 dark:text-red-400'
    case 'HIGH':
      return 'text-orange-600 dark:text-orange-400'
    case 'MEDIUM':
      return 'text-blue-600 dark:text-blue-400'
    case 'LOW':
      return 'text-gray-600 dark:text-gray-400'
    default:
      return 'text-blue-600 dark:text-blue-400'
  }
}

// 通知服务类
class NotificationService {
  private storageKey = 'hackx-notifications'
  private settingsKey = 'hackx-notification-settings'

  // 获取所有通知
  getNotifications(): Notification[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('获取通知失败:', error)
      return []
    }
  }

  // 获取设置
  getSettings(): NotificationSettings {
    if (typeof window === 'undefined') return defaultNotificationSettings
    
    try {
      const stored = localStorage.getItem(this.settingsKey)
      return stored ? { ...defaultNotificationSettings, ...JSON.parse(stored) } : defaultNotificationSettings
    } catch (error) {
      console.error('获取通知设置失败:', error)
      return defaultNotificationSettings
    }
  }

  // 更新设置
  updateSettings(settings: NotificationSettings): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(settings))
    } catch (error) {
      console.error('保存通知设置失败:', error)
    }
  }

  // 标记为已读
  markAsRead(id: string): void {
    if (typeof window === 'undefined') return
    
    const notifications = this.getNotifications()
    const updated = notifications.map(notification => 
      notification.id === id 
        ? { ...notification, read: true, readAt: new Date().toISOString() }
        : notification
    )
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updated))
    } catch (error) {
      console.error('标记通知为已读失败:', error)
    }
  }

  // 标记所有为已读
  markAllAsRead(): void {
    if (typeof window === 'undefined') return
    
    const notifications = this.getNotifications()
    const updated = notifications.map(notification => ({
      ...notification,
      read: true,
      readAt: new Date().toISOString()
    }))
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updated))
    } catch (error) {
      console.error('标记所有通知为已读失败:', error)
    }
  }

  // 删除通知
  deleteNotification(id: string): void {
    if (typeof window === 'undefined') return
    
    const notifications = this.getNotifications()
    const updated = notifications.filter(notification => notification.id !== id)
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updated))
    } catch (error) {
      console.error('删除通知失败:', error)
    }
  }

  // 添加通知（用于开发/测试）
  addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): void {
    if (typeof window === 'undefined') return
    
    const notifications = this.getNotifications()
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    
    const updated = [newNotification, ...notifications]
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updated))
    } catch (error) {
      console.error('添加通知失败:', error)
    }
  }

  // 获取未读数量
  getUnreadCount(): number {
    const notifications = this.getNotifications()
    return notifications.filter(n => !n.read).length
  }
}

// 导出单例实例
export const notificationService = new NotificationService()

// 导出默认的通知数据（用于开发/演示）
export function getDefaultNotifications(): Notification[] {
  return [
    {
      id: '1',
      type: 'team_invite',
      title: '团队邀请',
      message: 'Alice 邀请你加入 "Web3 创新团队"',
      read: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      userId: 'current-user',
      actionUrl: '/teams/123',
      actionLabel: '查看团队',
      priority: 'HIGH',
      category: 'TEAM'
    },
    {
      id: '2',
      type: 'hackathon_starting',
      title: '黑客松即将开始',
      message: '"DeFi 创新挑战" 将在 2 小时后开始',
      read: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      userId: 'current-user',
      actionUrl: '/hackathons/456',
      actionLabel: '查看详情',
      priority: 'URGENT',
      category: 'HACKATHON'
    },
    {
      id: '3',
      type: 'project_liked',
      title: '项目获得点赞',
      message: 'Bob 点赞了你的项目 "去中心化投票系统"',
      read: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      userId: 'current-user',
      actionUrl: '/projects/789',
      actionLabel: '查看项目',
      priority: 'LOW',
      category: 'PROJECT',
      readAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    }
  ]
}
