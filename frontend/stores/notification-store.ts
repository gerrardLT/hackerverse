'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { apiService } from '@/lib/api'

// 通知类型定义
export interface Notification {
  id: string
  type: string // 支持所有新的通知类型
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

export interface NotificationFilters {
  category?: string
  unreadOnly?: boolean
  priority?: 'low' | 'medium' | 'high'
  search?: string
}

export interface NotificationPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface NotificationState {
  // 数据状态
  notifications: Notification[]
  unreadCount: number
  settings: NotificationSettings
  filters: NotificationFilters
  pagination: NotificationPagination
  
  // UI状态
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  
  // 实时连接状态
  isConnected: boolean
  reconnectAttempts: number
  
  // Actions
  initialize: () => Promise<void>
  loadNotifications: (params?: { page?: number; limit?: number; category?: string; unreadOnly?: boolean }) => Promise<void>
  refreshNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>
  
  // 设置管理
  updateSettings: (settings: Partial<NotificationSettings>) => void
  
  // 筛选和搜索
  setFilters: (filters: Partial<NotificationFilters>) => void
  getFilteredNotifications: () => Notification[]
  
  // 错误处理
  setError: (error: string | null) => void
  clearError: () => void
  
  // 实时更新
  addNotification: (notification: Notification) => void
  updateNotification: (id: string, updates: Partial<Notification>) => void
  removeNotification: (id: string) => void
  
  // 重置状态
  reset: () => void
}

const defaultSettings: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  teamInvites: true,
  projectUpdates: true,
  hackathonReminders: true,
  reviewNotifications: true,
  prizeNotifications: true,
  systemMessages: true,
}

const defaultPagination: NotificationPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        notifications: [],
        unreadCount: 0,
        settings: defaultSettings,
        filters: {},
        pagination: defaultPagination,
        isLoading: false,
        isInitialized: false,
        error: null,
        isConnected: false,
        reconnectAttempts: 0,

        // 初始化
        initialize: async () => {
          const state = get()
          if (state.isInitialized) return

          set({ isLoading: true, error: null })
          
          try {
            await state.loadNotifications({ limit: 10 })
            set({ isInitialized: true, isLoading: false })
          } catch (error) {
            console.error('通知系统初始化失败:', error)
            set({ 
              error: error instanceof Error ? error.message : '初始化失败',
              isLoading: false 
            })
          }
        },

        // 加载通知列表
        loadNotifications: async (params = {}) => {
          set({ isLoading: true, error: null })
          
          try {
            // 调试信息：检查当前认证状态
            const token = typeof window !== 'undefined' ? localStorage.getItem('hackx-token') : null
            console.log('🔔 通知Store加载通知 - 当前token:', token ? token.substring(0, 20) + '...' : 'null')
            console.log('🔔 通知Store加载通知 - 请求参数:', params)
            
            if (!token) {
              throw new Error('未找到认证token，请先登录')
            }
            
            const response = await apiService.getNotifications(params)
            console.log('🔔 通知Store - API响应:', response)
            
            if (response.success && response.data) {
              set({
                notifications: response.data.notifications,
                unreadCount: response.data.unreadCount,
                pagination: response.data.pagination,
                isLoading: false,
                error: null
              })
            } else {
              throw new Error(response.error || '获取通知失败')
            }
          } catch (error) {
            console.error('❌ 通知Store加载通知失败:', error)
            set({ 
              error: error instanceof Error ? error.message : '加载通知失败',
              isLoading: false 
            })
            throw error
          }
        },

        // 刷新通知
        refreshNotifications: async () => {
          const { filters, pagination } = get()
          await get().loadNotifications({
            page: pagination.page,
            limit: pagination.limit,
            category: filters.category,
            unreadOnly: filters.unreadOnly
          })
        },

        // 标记为已读
        markAsRead: async (id: string) => {
          try {
            const response = await apiService.markNotificationAsRead(id)
            
            if (response.success) {
              set(state => ({
                notifications: state.notifications.map(n => 
                  n.id === id ? { ...n, read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1)
              }))
            } else {
              throw new Error(response.error || '标记已读失败')
            }
          } catch (error) {
            console.error('标记已读失败:', error)
            set({ error: error instanceof Error ? error.message : '标记已读失败' })
            throw error
          }
        },

        // 标记全部为已读
        markAllAsRead: async () => {
          try {
            const response = await apiService.markAllNotificationsAsRead()
            
            if (response.success) {
              set(state => ({
                notifications: state.notifications.map(n => ({ ...n, read: true })),
                unreadCount: 0
              }))
            } else {
              throw new Error(response.error || '标记全部已读失败')
            }
          } catch (error) {
            console.error('标记全部已读失败:', error)
            set({ error: error instanceof Error ? error.message : '标记全部已读失败' })
            throw error
          }
        },

        // 删除通知
        deleteNotification: async (id: string) => {
          try {
            const response = await apiService.deleteNotification(id)
            
            if (response.success) {
              set(state => {
                const notification = state.notifications.find(n => n.id === id)
                const wasUnread = notification && !notification.read
                
                return {
                  notifications: state.notifications.filter(n => n.id !== id),
                  unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
                }
              })
            } else {
              throw new Error(response.error || '删除通知失败')
            }
          } catch (error) {
            console.error('删除通知失败:', error)
            set({ error: error instanceof Error ? error.message : '删除通知失败' })
            throw error
          }
        },

        // 创建通知
        createNotification: async (notificationData) => {
          try {
            const response = await apiService.createNotification({
              type: notificationData.type,
              title: notificationData.title,
              message: notificationData.message,
              data: notificationData.data,
              userId: notificationData.userId
            })
            
            if (response.success && response.data) {
              const newNotification = response.data.notification
              set(state => ({
                notifications: [newNotification, ...state.notifications],
                unreadCount: state.unreadCount + 1
              }))
            } else {
              throw new Error(response.error || '创建通知失败')
            }
          } catch (error) {
            console.error('创建通知失败:', error)
            set({ error: error instanceof Error ? error.message : '创建通知失败' })
            throw error
          }
        },

        // 更新设置
        updateSettings: (newSettings) => {
          set(state => ({
            settings: { ...state.settings, ...newSettings }
          }))
        },

        // 设置筛选条件
        setFilters: (newFilters) => {
          set(state => ({
            filters: { ...state.filters, ...newFilters }
          }))
        },

        // 获取筛选后的通知
        getFilteredNotifications: () => {
          const { notifications, filters } = get()
          let filtered = [...notifications]

          if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(n => n.category === filters.category)
          }

          if (filters.unreadOnly) {
            filtered = filtered.filter(n => !n.read)
          }

          if (filters.priority) {
            filtered = filtered.filter(n => n.priority === filters.priority)
          }

          if (filters.search) {
            const search = filters.search.toLowerCase()
            filtered = filtered.filter(n => 
              n.title.toLowerCase().includes(search) ||
              n.message.toLowerCase().includes(search)
            )
          }

          return filtered.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        },

        // 错误处理
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // 实时更新方法
        addNotification: (notification) => {
          set(state => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1
          }))
        },

        updateNotification: (id, updates) => {
          set(state => ({
            notifications: state.notifications.map(n => 
              n.id === id ? { ...n, ...updates } : n
            )
          }))
        },

        removeNotification: (id) => {
          set(state => {
            const notification = state.notifications.find(n => n.id === id)
            const wasUnread = notification && !notification.read
            
            return {
              notifications: state.notifications.filter(n => n.id !== id),
              unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
            }
          })
        },

        // 重置状态
        reset: () => {
          set({
            notifications: [],
            unreadCount: 0,
            settings: defaultSettings,
            filters: {},
            pagination: defaultPagination,
            isLoading: false,
            isInitialized: false,
            error: null,
            isConnected: false,
            reconnectAttempts: 0,
          })
        },
      }),
      {
        name: 'notification-store',
        partialize: (state) => ({ 
          settings: state.settings,
          filters: state.filters 
        }),
      }
    ),
    {
      name: 'notification-store',
    }
  )
)

// 导出便捷的 hooks
export const useNotifications = () => {
  const store = useNotificationStore()
  return {
    notifications: store.getFilteredNotifications(),
    unreadCount: store.unreadCount,
    isLoading: store.isLoading,
    error: store.error,
    refresh: store.refreshNotifications,
  }
}

export const useNotificationActions = () => {
  const store = useNotificationStore()
  return {
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    deleteNotification: store.deleteNotification,
    setFilters: store.setFilters,
    clearError: store.clearError,
  }
}
