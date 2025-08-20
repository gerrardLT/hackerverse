'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiService, type User } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, username?: string, walletAddress?: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => void
  connectWallet: (address: string) => Promise<boolean>
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('hackx-token')
      if (token) {
        apiService.setToken(token)
        const response = await apiService.getCurrentUser()
        if (response.success && response.data) {
          setUser(response.data.user)
        } else {
          // Token无效，清除存储
          apiService.clearToken()
          localStorage.removeItem('hackx-user')
        }
      }
    } catch (error) {
      console.error('检查认证状态失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取当前用户信息
  const getCurrentUser = async () => {
    try {
      setLoading(true)
      const response = await apiService.getCurrentUser()
      
      if (response.success && response.data) {
        setUser(response.data.user)
      } else {
        setUser(null)
        apiService.clearToken()
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      setUser(null)
      apiService.clearToken()
    } finally {
      setLoading(false)
    }
  }

  // 登录
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const response = await apiService.signIn(email, password)
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data
        setUser(userData)
        apiService.setToken(token)
        // 保存token到localStorage
        localStorage.setItem('hackx-token', token)
        localStorage.setItem('hackx-user', JSON.stringify(userData))
        return { success: true }
      } else {
        return { success: false, error: response.error || '登录失败' }
      }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, error: '登录失败，请稍后重试' }
    } finally {
      setLoading(false)
    }
  }

  // 注册
  const signUp = async (email: string, password: string, username?: string, walletAddress?: string) => {
    try {
      setLoading(true)
      const response = await apiService.signUp(email, password, username, walletAddress)
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data
        setUser(userData)
        apiService.setToken(token)
        // 保存token到localStorage
        localStorage.setItem('hackx-token', token)
        localStorage.setItem('hackx-user', JSON.stringify(userData))
        return { success: true }
      } else {
        return { success: false, error: response.error || '注册失败' }
      }
    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, error: '注册失败，请稍后重试' }
    } finally {
      setLoading(false)
    }
  }

  // 登出
  const signOut = () => {
    setUser(null)
    apiService.clearToken()
    // 清除localStorage
    localStorage.removeItem('hackx-token')
    localStorage.removeItem('hackx-user')
  }

  // 更新用户信息
  const updateUser = async (data: {
    username?: string
    bio?: string
    avatarUrl?: string
    walletAddress?: string
    notificationSettings?: any
    privacySettings?: any
  }) => {
    try {
      setLoading(true)
      const response = await apiService.updateUser(data)
      
      if (response.success && response.data) {
        const updatedUser = response.data.user
        setUser(updatedUser)
        return { success: true }
      } else {
        return { success: false, error: response.error || '更新失败' }
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return { success: false, error: '更新失败，请稍后重试' }
    } finally {
      setLoading(false)
    }
  }

  // 更新用户偏好设置
  const updatePreferences = async (preferences: {
    theme?: string
    language?: string
    timezone?: string
    notificationSettings?: any
    privacySettings?: any
  }) => {
    try {
      setLoading(true)
      const response = await apiService.updateUserPreferences(preferences)
      
      if (response.success && response.data) {
        const updatedPreferences = response.data.preferences
        // 更新本地用户状态
        setUser(prev => prev ? { ...prev, ...updatedPreferences } : null)
        return { success: true }
      } else {
        return { success: false, error: response.error || '更新偏好设置失败' }
      }
    } catch (error) {
      console.error('更新偏好设置失败:', error)
      return { success: false, error: '更新失败，请稍后重试' }
    } finally {
      setLoading(false)
    }
  }

  // 连接钱包
  const connectWallet = async (address: string) => {
    try {
      setLoading(true)
      const response = await apiService.updateUser({ walletAddress: address })

      if (response.success && response.data) {
        const updatedUser = response.data.user
        setUser(updatedUser)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('连接钱包失败:', error)
      return false
    } finally {
      setLoading(false)
      }
  }

  // 刷新用户信息
  const refreshUser = async () => {
    await getCurrentUser()
  }

  const value: AuthContextType = {
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      connectWallet,
    updateProfile: updateUser,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
