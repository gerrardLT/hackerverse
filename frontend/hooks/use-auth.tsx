'use client'

import React, { useEffect } from 'react'
import { apiService, type User } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore, initializeAuth } from '@/lib/auth-state-manager'

/**
 * 初始化认证的Provider组件
 * 只负责应用启动时的认证初始化，不再提供Context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeAuth()
  }, [])

  return <>{children}</>
}

/**
 * 统一的认证Hook
 * 直接使用Zustand store，并添加业务逻辑封装
 */
export function useAuth() {
  const auth = useAuthStore()
  const { toast } = useToast()

  // 登录方法封装
  const signIn = async (email: string, password: string) => {
    try {
      await auth.login(email, password)
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${auth.user?.username || auth.user?.email}!`
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || 'Login failed' }
    }
  }

  // 注册方法封装
  const signUp = async (email: string, password: string, username?: string, walletAddress?: string) => {
    try {
      await auth.register(email, password, username || '')
      toast({
        title: 'Registration Successful',
        description: `Welcome to HackX, ${auth.user?.username || auth.user?.email}!`
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || 'Registration failed' }
    }
  }

  // 登出方法封装
  const signOut = async () => {
    await auth.logout()
    toast({
      title: 'Logged Out',
      description: 'See you next time!'
    })
  }

  // 更新用户信息
  const updateProfile = async (data: Partial<User>) => {
    try {
      const res = await apiService.updateUser(data)
      if (res.success && res.data) {
        auth.setUser(res.data.user)
        return { success: true }
      }
      return { success: false, error: res.error || 'Update failed' }
    } catch (e) {
      return { success: false, error: 'Update failed, please try again later' }
    }
  }

  // 连接钱包（仅更新用户钱包地址到后端）
  const connectWallet = async (address: string) => {
    try {
      const response = await apiService.updateUser({ walletAddress: address })
      if (response.success && response.data) {
        auth.setUser(response.data.user)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      const response = await apiService.getCurrentUser()
      if (response.success && response.data) {
        auth.setUser(response.data.user)
      }
    } catch {}
  }

  return {
    // 基础状态
    user: auth.user as any,
    loading: auth.isLoading || auth.isInitializing,
    isAuthenticated: auth.isAuthenticated,
    authType: auth.authType,
    walletAddress: auth.walletAddress,
    chainId: auth.chainId,
    networkName: auth.networkName,
    isWalletConnected: auth.isWalletConnected,
    error: auth.error,
    
    // 方法
    signIn,
    signUp,
    signOut,
    connectWallet,
    updateProfile,
    refreshUser,
    
    // 直接暴露store方法供高级使用
    loginWithWallet: auth.loginWithWallet,
    connectWalletDirect: auth.connectWallet,
    disconnectWallet: auth.disconnectWallet,
    switchNetwork: auth.switchNetwork,
    refreshAuth: auth.refreshAuth,
    updatePreferences: auth.updatePreferences,
    
    // 便捷方法
    isAdmin: auth.user?.role === 'admin',
    isModerator: auth.user?.role === 'moderator' || auth.user?.role === 'admin',
    isJudge: auth.user?.role === 'judge' || auth.user?.role === 'admin',
    canManageContent: auth.user?.role === 'moderator' || auth.user?.role === 'admin',
    canJudge: auth.user?.role === 'judge' || auth.user?.role === 'admin',
    
    // 网络相关
    isSupportedNetwork: auth.chainId ? [1, 137, 80001, 11155111].includes(auth.chainId) : false,
    isTestnet: auth.chainId ? [80001, 11155111, 97].includes(auth.chainId) : false,
    
    // 认证状态
    isFullyAuthenticated: auth.isAuthenticated && auth.user && auth.token,
    needsWalletConnection: auth.authType === 'web3' && !auth.isWalletConnected,
    needsTraditionalAuth: auth.authType === 'traditional' && !auth.isAuthenticated
  }
}