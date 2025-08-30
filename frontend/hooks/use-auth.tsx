'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiService, type User } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { authStateManager, type AuthState } from '@/lib/auth-state-manager'

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
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true
  })
  const { toast } = useToast()

  // 订阅认证状态管理器
  useEffect(() => {
    const unsubscribe = authStateManager.subscribe((newState) => {
      setAuthState(newState)
    })
    
    // 初始化认证状态
    authStateManager.initialize()
    
    return unsubscribe
  }, [])

  // 登录
  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiService.signIn(email, password)
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data
        await authStateManager.authenticateUser(userData, token, 'email')
        
        toast({
          title: "登录成功",
          description: `欢迎回来，${userData.username || userData.email}！`,
        })
        
        return { success: true }
      } else {
        return { success: false, error: response.error || '登录失败' }
      }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, error: '登录失败，请稍后重试' }
    }
  }

  // 注册
  const signUp = async (email: string, password: string, username?: string, walletAddress?: string) => {
    try {
      const response = await apiService.signUp(email, password, username, walletAddress)
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data
        await authStateManager.authenticateUser(userData, token, 'email')
        
        toast({
          title: "注册成功",
          description: `欢迎加入HackX，${userData.username || userData.email}！`,
        })
        
        return { success: true }
      } else {
        return { success: false, error: response.error || '注册失败' }
      }
    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, error: '注册失败，请稍后重试' }
    }
  }

  // 登出
  const signOut = () => {
    authStateManager.logout()
    toast({
      title: "已退出登录",
      description: "感谢使用HackX，期待您的再次访问！",
    })
  }

  // 更新用户信息
  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await apiService.updateUser(data)
      
      if (response.success && response.data) {
        authStateManager.updateUser(response.data.user)
        return { success: true }
      } else {
        return { success: false, error: response.error || '更新失败' }
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return { success: false, error: '更新失败，请稍后重试' }
    }
  }

  // 连接钱包
  const connectWallet = async (address: string) => {
    try {
      const response = await apiService.updateUser({ walletAddress: address })

      if (response.success && response.data) {
        authStateManager.updateUser(response.data.user)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('连接钱包失败:', error)
      return false
    }
  }

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      const response = await apiService.getCurrentUser()
      
      if (response.success && response.data) {
        authStateManager.updateUser(response.data.user)
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error)
    }
  }

  const value: AuthContextType = {
    user: authState.user, 
    loading: authState.loading, 
    signIn, 
    signUp, 
    signOut, 
    connectWallet,
    updateProfile,
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