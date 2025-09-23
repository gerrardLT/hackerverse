'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 认证类型
export type AuthType = 'traditional' | 'web3' | 'none'

// 用户状态
export interface UserState {
  id: string
  email: string
  username: string
  walletAddress?: string
  avatarUrl?: string
  bio?: string
  reputationScore: number
  role: 'USER' | 'ADMIN' | 'MODERATOR' | 'JUDGE'
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING'
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

// 认证状态
export interface AuthState {
  // 认证状态
  isAuthenticated: boolean
  authType: AuthType
  user: UserState | null
  token: string | null
  refreshToken: string | null
  
  // Web3状态
  walletAddress: string | null
  chainId: number | null
  networkName: string | null
  isWalletConnected: boolean
  
  // 加载状态
  isLoading: boolean
  isInitializing: boolean
  
  // 错误状态
  error: string | null
  
  // 设置方法
  setAuthenticated: (user: UserState, token: string, authType: AuthType) => void
  setWeb3Auth: (walletAddress: string, chainId: number, networkName: string) => void
  setToken: (token: string, refreshToken?: string) => void
  setUser: (user: UserState) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // 认证方法
  login: (email: string, password: string) => Promise<void>
  loginWithWallet: (walletAddress: string, signature: string, message: string) => Promise<void>
  register: (email: string, password: string, username: string) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
  
  // Web3方法
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchNetwork: (chainId: number) => Promise<void>
  
  // 用户方法
  updateProfile: (updates: Partial<UserState>) => Promise<void>
  updatePreferences: (preferences: any) => Promise<void>
}

/**
 * 统一认证状态管理器
 * 管理传统认证和Web3认证的完整生命周期
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isAuthenticated: false,
      authType: 'none',
    user: null,
    token: null,
      refreshToken: null,
      walletAddress: null,
      chainId: null,
      networkName: null,
      isWalletConnected: false,
      isLoading: false,
      isInitializing: true,
      error: null,

      // 设置方法
      setAuthenticated: (user: UserState, token: string, authType: AuthType) => {
        console.log('🔐 setAuthenticated 被调用:', {
          userId: user.id,
          userEmail: user.email,
          tokenPrefix: token.substring(0, 20) + '...',
          authType
        })
        
        set({
          isAuthenticated: true,
          user,
          token,
          authType,
          error: null,
          isLoading: false
        })
        
        // 同步更新apiService的token
        if (typeof window !== 'undefined') {
          try {
            console.log('🔧 准备设置localStorage token:', token.substring(0, 20) + '...')
            localStorage.setItem('hackx-token', token)
            console.log('✅ hackx-token 已设置到 localStorage')
            
            localStorage.setItem('hackx-user', JSON.stringify(user))
            console.log('✅ hackx-user 已设置到 localStorage')
            
            // 立即验证设置结果
            const savedToken = localStorage.getItem('hackx-token')
            const savedUser = localStorage.getItem('hackx-user')
            console.log('🔍 验证localStorage设置结果:')
            console.log('  - hackx-token:', savedToken ? savedToken.substring(0, 20) + '...' : 'null')
            console.log('  - hackx-user:', savedUser ? 'exists' : 'null')
            
            console.log('📱 认证数据已保存到localStorage')
            
            // 动态导入apiService并设置token
            import('./api').then(({ apiService }) => {
              console.log('🔄 开始同步token到apiService')
              apiService.setToken(token)
              console.log('✅ token已同步到apiService')
            }).catch(error => {
              console.error('❌ 同步token到apiService失败:', error)
            })
          } catch (error) {
            console.error('❌ localStorage设置失败:', error)
          }
        }
      },

      setWeb3Auth: (walletAddress: string, chainId: number, networkName: string) => {
        set({
          walletAddress,
          chainId,
          networkName,
          isWalletConnected: true,
          authType: 'web3'
        })
      },

      setToken: (token: string, refreshToken?: string) => {
        set({
          token,
          refreshToken: refreshToken || get().refreshToken
        })
      },

      setUser: (user: UserState) => {
        set({ user })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false })
      },

      // 传统认证方法
      login: async (email: string, password: string) => {
        const { setLoading, setError, setAuthenticated } = get()
        
        try {
          setLoading(true)
          setError(null)

          const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Login failed')
          }

          if (data.success && data.data) {
            setAuthenticated(data.data.user as UserState, data.data.token, 'traditional')
          } else {
            throw new Error('Invalid login response format')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed'
          setError(errorMessage)
          throw error
        }
      },

      register: async (email: string, password: string, username: string) => {
        const { setLoading, setError, setAuthenticated } = get()
        
        try {
          setLoading(true)
          setError(null)
          
          console.log('[AUTH] Starting registration process with IPFS upload...')

          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, username })
          })

          const data = await response.json()
          
          console.log('[AUTH] Registration API response:', {
            success: data.success,
            hasUser: !!data.data?.user,
            hasToken: !!data.data?.token,
            error: data.error
          })

          if (!response.ok) {
            // Provide user-friendly error message for IPFS-related errors
            if (data.error && data.error.includes('IPFS')) {
              throw new Error('Network service temporarily unavailable, please try again later')
            }
            throw new Error(data.error || 'Registration failed')
          }

          if (data.success && data.data) {
            console.log('[AUTH] Registration successful, setting auth state')
            setAuthenticated(data.data.user as UserState, data.data.token, 'traditional')
          } else {
            throw new Error('Invalid registration response format')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed'
          console.error('[AUTH] Registration failed:', errorMessage)
          setError(errorMessage)
          throw error
        } finally {
          // 确保loading状态被正确清除
          setLoading(false)
        }
      },

      // Web3认证方法
      loginWithWallet: async (walletAddress: string, signature: string, message: string) => {
        const { setLoading, setError, setAuthenticated, setWeb3Auth } = get()
        
        try {
          setLoading(true)
          setError(null)

          const response = await fetch('/api/auth/wallet-signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress,
              signature,
              message,
              chainId: get().chainId || 137
            })
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || '钱包登录失败')
          }

          if (data.success && data.data) {
            setAuthenticated(data.data.user as UserState, data.data.token, 'web3')
            setWeb3Auth(walletAddress, data.data.session?.chainId || 137, data.data.session?.networkName || 'Polygon')
          } else {
            throw new Error('钱包登录响应格式错误')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '钱包登录失败'
          setError(errorMessage)
          throw error
        }
      },

      // Web3钱包方法
      connectWallet: async () => {
        const { setLoading, setError, setWeb3Auth } = get()
        
        try {
          setLoading(true)
          setError(null)

          // 检查是否支持MetaMask
          if (typeof window.ethereum === 'undefined') {
            throw new Error('请安装MetaMask钱包')
          }

          // 强制重新获取当前活跃账户，确保获取最新的钱包地址
          console.log('🔄 正在获取当前MetaMask活跃账户...')
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
          })

          if (accounts.length === 0) {
            throw new Error('用户拒绝了钱包连接')
          }

          // 总是使用accounts[0]作为当前活跃地址
          const walletAddress = accounts[0]
          console.log('✅ 获取到当前活跃钱包地址:', walletAddress)
          
          // 获取网络信息
          const chainId = await window.ethereum.request({
            method: 'eth_chainId'
          })

          const networkName = getNetworkName(parseInt(chainId, 16))
          
          setWeb3Auth(walletAddress, parseInt(chainId, 16), networkName)
          
          // 监听账户变化
          window.ethereum.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) {
              get().disconnectWallet()
            } else {
              setWeb3Auth(accounts[0], get().chainId || 137, get().networkName || 'Polygon')
            }
          })

          // 监听网络变化
          window.ethereum.on('chainChanged', (chainId: string) => {
            const newChainId = parseInt(chainId, 16)
            const networkName = getNetworkName(newChainId)
            setWeb3Auth(get().walletAddress || '', newChainId, networkName)
          })

    } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '钱包连接失败'
          setError(errorMessage)
          throw error
        } finally {
          setLoading(false)
        }
      },

      disconnectWallet: () => {
        set({
          walletAddress: null,
          chainId: null,
          networkName: null,
          isWalletConnected: false,
          authType: get().isAuthenticated ? get().authType : 'none'
        })
      },

      switchNetwork: async (chainId: number) => {
        const { setLoading, setError, setWeb3Auth } = get()
        
        try {
          setLoading(true)
          setError(null)

          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chainId.toString(16)}` }]
          })

          const networkName = getNetworkName(chainId)
          setWeb3Auth(get().walletAddress || '', chainId, networkName)
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '网络切换失败'
          setError(errorMessage)
          throw error
        } finally {
          setLoading(false)
        }
      },

      // 通用方法
      logout: async () => {
        const { token } = get()
        
        // 如果有token，先调用后端logout接口
        if (token) {
          try {
            console.log('🔄 调用后端logout接口...')
            const { apiService } = await import('./api')
            apiService.setToken(token) // 确保token设置正确
            await apiService.logout()
            console.log('✅ 后端logout成功')
          } catch (error) {
            console.error('⚠️ 后端logout失败:', error)
            // 即使后端logout失败，也要清除前端状态
          }
        }

        // 清除前端状态
        set({
          isAuthenticated: false,
          authType: 'none',
          user: null,
          token: null,
          refreshToken: null,
          walletAddress: null,
          chainId: null,
          networkName: null,
          isWalletConnected: false,
          error: null,
          isLoading: false
        })
        
        // 清理localStorage和apiService
        if (typeof window !== 'undefined') {
          localStorage.removeItem('hackx-token')
          localStorage.removeItem('hackx-user')
          
          // 动态导入apiService并清理token
          import('./api').then(({ apiService }) => {
            apiService.clearToken()
          })
        }

        console.log('✅ 用户已完全退出登录')
      },

      refreshAuth: async () => {
        const { token, refreshToken, authType, setAuthenticated, setError, logout } = get()
        
        // 首先验证当前token是否有效（对所有认证类型）
        if (token) {
          try {
            console.log('🔍 验证当前token有效性...')
            const { apiService } = await import('./api')
            apiService.setToken(token)
            const response = await apiService.getCurrentUser()
            
            if (response.success && response.data) {
              console.log('✅ Token有效，用户信息已更新')
              setAuthenticated(response.data.user as UserState, token, authType)
        return
            } else {
              console.log('❌ Token无效:', response.error)
            }
          } catch (error) {
            console.log('❌ Token验证失败:', error)
          }
        }
        
        // Web3认证token无效时，需要重新登录
        if (authType === 'web3') {
          console.log('🔗 Web3认证token无效，需要重新连接钱包')
          await logout()
          return
        }

        if (!refreshToken) {
          console.log('⚠️ 没有refreshToken，执行logout')
          await logout()
          return
        }

        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || '令牌刷新失败')
          }

          if (data.success && data.data) {
            setAuthenticated(data.data.user as UserState, data.data.token, get().authType)
          } else {
            throw new Error('令牌刷新响应格式错误')
          }
        } catch (error) {
          console.error('令牌刷新失败:', error)
          await logout()
        }
      },

      updateProfile: async (updates: Partial<UserState>) => {
        const { user, token, setUser, setError } = get()
        
        if (!user || !token) {
          throw new Error('用户未认证')
        }

        try {
          const response = await fetch('/api/users/me', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || '资料更新失败')
          }

          if (data.success && data.data) {
            setUser({ ...user, ...updates })
          } else {
            throw new Error('资料更新响应格式错误')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '资料更新失败'
          setError(errorMessage)
          throw error
        }
      },

      updatePreferences: async (preferences: any) => {
        const { token, setError } = get()
        
        if (!token) {
          throw new Error('用户未认证')
        }

        try {
          const response = await fetch('/api/users/preferences', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(preferences)
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || '偏好设置更新失败')
          }

          if (!data.success) {
            throw new Error('偏好设置更新响应格式错误')
          }
    } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '偏好设置更新失败'
          setError(errorMessage)
          throw error
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        authType: state.authType,
        // 移除walletAddress的持久化存储，确保每次都重新获取当前活跃地址
        // walletAddress: state.walletAddress,
        chainId: state.chainId,
        networkName: state.networkName,
        // 移除钱包连接状态的持久化，确保每次都重新连接
        // isWalletConnected: state.isWalletConnected
      })
    }
  )
)

/**
 * 获取网络名称
 */
function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    80001: 'Polygon Mumbai',
    11155111: 'Sepolia',
    56: 'BSC',
    97: 'BSC Testnet'
  }
  return networks[chainId] || `Chain ${chainId}`
}

/**
 * 初始化认证状态
 */
export const initializeAuth = async () => {
  console.log('🚀 开始初始化认证状态...')
  
  const { isAuthenticated, token, refreshAuth, setLoading } = useAuthStore.getState()
  
  console.log('🔍 当前认证状态:', {
    isAuthenticated,
    hasToken: !!token,
    tokenPrefix: token ? token.substring(0, 20) + '...' : 'null'
  })
  
  // 确保apiService获得存储的token
  if (token) {
    console.log('🔄 设置apiService token')
    const { apiService } = await import('./api')
    apiService.setToken(token)
  } else {
    // 如果store中没有token，尝试从localStorage获取
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('hackx-token') : null
    if (storedToken) {
      console.log('🔄 从localStorage获取token并设置到apiService')
      const { apiService } = await import('./api')
      apiService.setToken(storedToken)
    }
  }
  
  if (isAuthenticated && token) {
    try {
      setLoading(true)
      await refreshAuth()
    } catch (error) {
      console.error('认证初始化失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  console.log('✅ 认证状态初始化完成')
  useAuthStore.setState({ isInitializing: false })
}

/**
 * 认证Hook
 */
export const useAuth = () => {
  const auth = useAuthStore()
  
  return {
    ...auth,
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