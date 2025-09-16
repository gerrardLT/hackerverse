'use client'

import { useNotificationStore } from '@/stores/notification-store'
import { useToast } from '@/hooks/use-toast'

/**
 * 通知系统便捷Hook
 * 提供简化的通知操作接口
 */
export function useNotifications() {
  const store = useNotificationStore()
  const { toast } = useToast()

  // 基础数据和状态
  const notifications = store.getFilteredNotifications()
  const unreadCount = store.unreadCount
  const isLoading = store.isLoading
  const error = store.error
  const isInitialized = store.isInitialized

  // 操作方法（带错误处理）
  const markAsRead = async (id: string) => {
    try {
      await store.markAsRead(id)
    } catch (error) {
      toast({
        title: '操作失败',
        description: '无法标记通知为已读',
        variant: 'destructive'
      })
      throw error
    }
  }

  const markAllAsRead = async () => {
    try {
      await store.markAllAsRead()
      toast({
        title: '成功',
        description: '所有通知已标记为已读'
      })
    } catch (error) {
      toast({
        title: '操作失败',
        description: '无法标记所有通知为已读',
        variant: 'destructive'
      })
      throw error
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await store.deleteNotification(id)
      toast({
        title: '成功',
        description: '通知已删除'
      })
    } catch (error) {
      toast({
        title: '操作失败',
        description: '无法删除通知',
        variant: 'destructive'
      })
      throw error
    }
  }

  const refreshNotifications = async () => {
    try {
      await store.refreshNotifications()
    } catch (error) {
      toast({
        title: '刷新失败',
        description: '无法刷新通知列表',
        variant: 'destructive'
      })
      throw error
    }
  }

  const createNotification = async (notification: Parameters<typeof store.createNotification>[0]) => {
    try {
      await store.createNotification(notification)
      toast({
        title: '成功',
        description: '通知已创建'
      })
    } catch (error) {
      toast({
        title: '创建失败',
        description: '无法创建通知',
        variant: 'destructive'
      })
      throw error
    }
  }

  // 筛选方法
  const setFilters = store.setFilters
  const clearFilters = () => store.setFilters({})

  // 错误处理
  const clearError = store.clearError
  const retry = () => {
    store.clearError()
    return store.refreshNotifications()
  }

  // 设置管理
  const settings = store.settings
  const updateSettings = store.updateSettings

  return {
    // 数据
    notifications,
    unreadCount,
    settings,
    
    // 状态
    isLoading,
    error,
    isInitialized,
    
    // 操作
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    createNotification,
    
    // 筛选
    setFilters,
    clearFilters,
    
    // 错误处理
    clearError,
    retry,
    
    // 设置
    updateSettings,

    // 便捷方法
    hasUnread: unreadCount > 0,
    isEmpty: notifications.length === 0,
    getNotificationsByCategory: (category: string) => 
      notifications.filter(n => n.category === category),
    getHighPriorityNotifications: () => 
      notifications.filter(n => n.priority === 'high'),
    getUnreadNotifications: () => 
      notifications.filter(n => !n.read),
  }
}

/**
 * 通知操作Hook（仅操作方法）
 */
export function useNotificationActions() {
  const store = useNotificationStore()
  const { toast } = useToast()

  return {
    markAsRead: async (id: string) => {
      try {
        await store.markAsRead(id)
      } catch (error) {
        toast({
          title: '操作失败',
          description: '无法标记通知为已读',
          variant: 'destructive'
        })
        throw error
      }
    },
    
    markAllAsRead: async () => {
      try {
        await store.markAllAsRead()
        toast({
          title: '成功',
          description: '所有通知已标记为已读'
        })
      } catch (error) {
        toast({
          title: '操作失败',
          description: '无法标记所有通知为已读',
          variant: 'destructive'
        })
        throw error
      }
    },
    
    deleteNotification: async (id: string) => {
      try {
        await store.deleteNotification(id)
        toast({
          title: '成功',
          description: '通知已删除'
        })
      } catch (error) {
        toast({
          title: '操作失败',
          description: '无法删除通知',
          variant: 'destructive'
        })
        throw error
      }
    },
    
    setFilters: store.setFilters,
    clearError: store.clearError,
  }
}
