'use client'

import { apiService } from '@/lib/api'

export interface User {
  id: string
  email: string
  username: string
  walletAddress?: string
  avatarUrl?: string
  bio?: string
  reputationScore: number
  emailVerified: boolean
  notificationSettings: any
  privacySettings: any
  ipfsProfileHash?: string
  ipfsUrl?: string
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
}

export type AuthMethod = 'email' | 'wallet' | 'github'

/**
 * 统一认证状态管理器
 * 解决Web3认证和传统认证的状态同步问题
 */
class AuthStateManager {
  private static instance: AuthStateManager
  private listeners: ((state: AuthState) => void)[] = []
  private currentState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true
  }

  static getInstance(): AuthStateManager {
    if (!AuthStateManager.instance) {
      AuthStateManager.instance = new AuthStateManager()
    }
    return AuthStateManager.instance
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    // 立即调用一次，同步当前状态
    listener(this.currentState)
    
    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 通知所有监听器状态变化
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentState))
  }

  /**
   * 设置加载状态
   */
  setLoading(loading: boolean) {
    this.currentState = { ...this.currentState, loading }
    this.notifyListeners()
  }

  /**
   * 统一认证成功处理
   */
  async authenticateUser(userData: User, token: string, method: AuthMethod) {
    try {
      console.log(`🔐 ${method}认证成功，更新状态:`, userData.username || userData.email)
      
      // 更新内部状态
      this.currentState = {
        user: userData,
        token,
        isAuthenticated: true,
        loading: false
      }

      // 设置API服务的token
      apiService.setToken(token)

      // 保存到localStorage（同步操作）
      if (typeof window !== 'undefined') {
        localStorage.setItem('hackx-token', token)
        localStorage.setItem('hackx-user', JSON.stringify(userData))
        localStorage.setItem('hackx-auth-method', method)
      }

      // 通知所有监听器
      this.notifyListeners()

      return true
    } catch (error) {
      console.error('认证状态更新失败:', error)
      return false
    }
  }

  /**
   * 登出处理
   */
  logout() {
    console.log('🚪 用户登出，清理认证状态')
    
    this.currentState = {
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false
    }

    // 清理API服务
    apiService.clearToken()

    // 清理localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hackx-token')
      localStorage.removeItem('hackx-user')
      localStorage.removeItem('hackx-auth-method')
    }

    // 通知所有监听器
    this.notifyListeners()
  }

  /**
   * 初始化认证状态
   * 从localStorage恢复状态并验证token有效性
   */
  async initialize(): Promise<void> {
    try {
      this.setLoading(true)

      if (typeof window === 'undefined') {
        this.setLoading(false)
        return
      }

      const token = localStorage.getItem('hackx-token')
      const userStr = localStorage.getItem('hackx-user')
      
      if (!token || !userStr) {
        this.setLoading(false)
        return
      }

      // 验证token有效性
      const isValid = await apiService.validateToken(token)
      if (!isValid) {
        console.warn('⚠️ 存储的token无效，清理认证状态')
        this.logout()
        return
      }

      // 恢复用户状态
      const userData = JSON.parse(userStr)
      this.currentState = {
        user: userData,
        token,
        isAuthenticated: true,
        loading: false
      }

      // 设置API服务的token
      apiService.setToken(token)
      
      console.log('✅ 认证状态初始化完成')
      this.notifyListeners()
      
    } catch (error) {
      console.error('❌ 认证状态初始化失败:', error)
      this.logout()
    }
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): AuthState {
    return { ...this.currentState }
  }

  /**
   * 更新用户信息
   */
  updateUser(userData: Partial<User>) {
    if (!this.currentState.user) return

    const updatedUser = { ...this.currentState.user, ...userData }
    this.currentState = {
      ...this.currentState,
      user: updatedUser
    }

    // 更新localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('hackx-user', JSON.stringify(updatedUser))
    }

    this.notifyListeners()
  }
}

// 导出单例实例
export const authStateManager = AuthStateManager.getInstance()