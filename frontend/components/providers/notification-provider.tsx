'use client'

import { useEffect } from 'react'
import { useNotificationStore } from '@/stores/notification-store'
import { useAuth } from '@/hooks/use-auth'

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { isAuthenticated, isFullyAuthenticated, user } = useAuth()
  const { initialize, reset, isInitialized } = useNotificationStore()

  // 当用户认证状态改变时初始化或重置通知系统
  useEffect(() => {
    console.log('🔔 NotificationProvider - 认证状态变化:', {
      isAuthenticated,
      isFullyAuthenticated,
      hasUser: !!user,
      isInitialized,
      hasToken: typeof window !== 'undefined' ? !!localStorage.getItem('hackx-token') : false
    })
    
    if (isFullyAuthenticated && user && !isInitialized) {
      console.log('🔔 用户已认证，延迟初始化通知系统')
      // 延迟一下确保token已经设置到apiService
      setTimeout(() => {
        initialize().catch(error => {
          console.error('通知系统初始化失败:', error)
        })
      }, 500) // 增加延迟时间，确保token已设置
    } else if (!isAuthenticated && isInitialized) {
      console.log('🔔 用户已退出，重置通知系统')
      reset()
    }
  }, [isAuthenticated, isFullyAuthenticated, user, isInitialized, initialize, reset])

  return <>{children}</>
}
