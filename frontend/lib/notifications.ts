'use client'

import { apiService } from '@/lib/api'
import type { Notification as ApiNotification } from '@/lib/api'

// 重新导出Notification类型
export type Notification = ApiNotification

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

export const defaultNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  teamInvites: true,
  projectUpdates: true,
  hackathonReminders: true,
  reviewNotifications: true,
  prizeNotifications: true,
  systemMessages: true,
}

export function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'team_invite':
      return '👥'
    case 'project_update':
      return '📝'
    case 'hackathon_reminder':
      return '⏰'
    case 'review_complete':
      return '✅'
    case 'prize_awarded':
      return '🏆'
    case 'system_message':
      return '📢'
    default:
      return '📬'
  }
}

export function getNotificationColor(priority: Notification['priority']) {
  switch (priority) {
    case 'high':
      return 'text-red-500'
    case 'medium':
      return 'text-yellow-500'
    case 'low':
      return 'text-blue-500'
    default:
      return 'text-gray-500'
  }
}

export function formatNotificationTime(createdAt: string): string {
  const now = new Date()
  const notificationTime = new Date(createdAt)
  const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {
    return '刚刚'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} 分钟前`
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours} 小时前`
  } else {
    const days = Math.floor(diffInMinutes / 1440)
    return `${days} 天前`
  }
}

export class NotificationService {
  private notifications: Notification[] = []
  private settings: NotificationSettings = defaultNotificationSettings
  private loading = false
  private error: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadSettings()
    }
  }

  private loadSettings() {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('hackx-notification-settings')
    if (saved) {
      this.settings = { ...defaultNotificationSettings, ...JSON.parse(saved) }
    }
  }

  private saveSettings() {
    if (typeof window === 'undefined') return
    localStorage.setItem('hackx-notification-settings', JSON.stringify(this.settings))
  }

  async loadNotifications(params?: {
    page?: number
    limit?: number
    category?: string
    unreadOnly?: boolean
  }) {
    try {
      this.loading = true
      this.error = null
      
      const response = await apiService.getNotifications(params)
      
      if (response.success && response.data) {
        this.notifications = response.data.notifications
        return {
          notifications: response.data.notifications,
          pagination: response.data.pagination,
          unreadCount: response.data.unreadCount
        }
      } else {
        this.error = response.error || '获取通知失败'
        throw new Error(this.error)
      }
    } catch (error) {
      console.error('加载通知失败:', error)
      this.error = error instanceof Error ? error.message : '获取通知失败'
      throw error
    } finally {
      this.loading = false
    }
  }

  getNotifications(): Notification[] {
    return this.notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  async markAsRead(id: string) {
    try {
      const response = await apiService.markNotificationAsRead(id)
      
      if (response.success) {
        const notification = this.notifications.find(n => n.id === id)
        if (notification) {
          notification.read = true
        }
      } else {
        throw new Error(response.error || '标记已读失败')
      }
    } catch (error) {
      console.error('标记通知已读失败:', error)
      throw error
    }
  }

  async markAllAsRead() {
    try {
      const response = await apiService.markAllNotificationsAsRead()
      
      if (response.success) {
        this.notifications.forEach(n => n.read = true)
      } else {
        throw new Error(response.error || '标记全部已读失败')
      }
    } catch (error) {
      console.error('标记全部已读失败:', error)
      throw error
    }
  }

  async deleteNotification(id: string) {
    try {
      const response = await apiService.deleteNotification(id)
      
      if (response.success) {
        this.notifications = this.notifications.filter(n => n.id !== id)
      } else {
        throw new Error(response.error || '删除通知失败')
      }
    } catch (error) {
      console.error('删除通知失败:', error)
      throw error
    }
  }

  async addNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
    try {
      const response = await apiService.createNotification({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        userId: notification.userId
      })
      
      if (response.success && response.data) {
        const newNotification = response.data.notification
        this.notifications.unshift(newNotification)
        return newNotification
      } else {
        throw new Error(response.error || '创建通知失败')
      }
    } catch (error) {
      console.error('创建通知失败:', error)
      throw error
    }
  }

  getSettings(): NotificationSettings {
    return this.settings
  }

  updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
  }

  filterNotifications(category?: string, unreadOnly?: boolean): Notification[] {
    let filtered = this.getNotifications()

    if (category && category !== 'all') {
      filtered = filtered.filter(n => n.category === category)
    }

    if (unreadOnly) {
      filtered = filtered.filter(n => !n.read)
    }

    return filtered
  }

  getLoading() {
    return this.loading
  }

  getError() {
    return this.error
  }

  clearError() {
    this.error = null
  }
}

export const notificationService = new NotificationService()
