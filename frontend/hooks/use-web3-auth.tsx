'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { useToast } from '@/hooks/use-toast'
import { smartContractService } from '@/lib/smart-contracts'
import { apiService } from '@/lib/api'

interface Web3User {
  address: string
  profileCID?: string
  profileData?: any
  isRegistered: boolean
}

interface Web3AuthContextType {
  user: Web3User | null
  loading: boolean
  connecting: boolean
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  contract: ethers.Contract | null
  connectWallet: () => Promise<boolean>
  disconnectWallet: () => Promise<void>
  registerUser: (profileCID: string) => Promise<boolean>
  updateProfile: (newProfileCID: string) => Promise<boolean>
  createHackathon: (hackathonCID: string) => Promise<boolean>
  joinHackathon: (hackathonId: number) => Promise<boolean>
  submitProject: (hackathonId: number, projectCID: string) => Promise<boolean>
  refreshUser: () => Promise<void>
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(undefined)

// Smart contract ABI (simplified version)
const HACKX_CORE_ABI = [
  "function registerUser(string memory profileCID) external",
  "function updateUserProfile(string memory newProfileCID) external",
  "function createHackathon(string memory hackathonDataCID) external returns (uint256)",
  "function joinHackathon(uint256 hackathonId) external",
  "function submitProject(uint256 hackathonId, string memory projectCID) external",
  "function getUserProfile(address user) external view returns (string memory)",
  "function isUserRegistered(address user) external view returns (bool)",
  "event UserRegistered(address indexed user, string profileCID)",
  "event ProfileUpdated(address indexed user, string newProfileCID)",
  "event HackathonCreated(uint256 indexed hackathonId, address indexed organizer, string dataCID)",
  "event UserJoinedHackathon(uint256 indexed hackathonId, address indexed participant)",
  "event ProjectSubmitted(uint256 indexed hackathonId, address indexed participant, string projectCID)"
]

// Contract address - BSC Testnet deployment address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x4BcFE52B6f38881d888b595E201E56B2cde93699'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function Web3AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Web3User | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const { toast } = useToast()

  // Initialize Web3
  useEffect(() => {
    initializeWeb3()
    
    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        console.log('🔄 Detected MetaMask account switch:', accounts)
        
        if (accounts.length === 0) {
          // User disconnected
          console.log('👋 User disconnected wallet')
          setUser(null)
          setProvider(null)
          setSigner(null)
          setContract(null)
          
          // Clear authentication state
          const { useAuthStore } = await import('@/lib/auth-state-manager')
          const authStore = useAuthStore.getState()
          if (authStore.authType === 'web3') {
            await authStore.logout()
          }
        } else {
          // User switched to new account, force re-authentication
          console.log('🔄 Account switched, cleaning old auth state and reconnecting wallet')
          
          // Clear old authentication state
          const { useAuthStore } = await import('@/lib/auth-state-manager')
          const authStore = useAuthStore.getState()
          await authStore.logout()
          
          // Clear local state
          setUser(null)
          setProvider(null)
          setSigner(null)
          setContract(null)
          
          // Reconnect wallet
          await connectWallet()
        }
      }
      
      const handleChainChanged = (chainId: string) => {
        console.log('🌐 Detected network switch:', chainId)
        // Reconnect when network switches
        window.location.reload()
      }
      
      // Add event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
      
      // Cleanup function
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
          window.ethereum.removeListener('chainChanged', handleChainChanged)
        }
      }
    }
  }, [])

  // Update contract instance when signer changes
  useEffect(() => {
    if (signer && CONTRACT_ADDRESS !== ZERO_ADDRESS) {
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, HACKX_CORE_ABI, signer)
      setContract(contractInstance)
    }
  }, [signer])

  // ⭐ 同步Web3用户到传统认证系统
  const syncWithTraditionalAuth = async (walletAddress: string, profileCID?: string) => {
    try {
      console.log('🔄 检查Web3用户认证状态...')
      
      // ⭐ 验证现有token是否与当前钱包地址匹配
      const existingToken = localStorage.getItem('hackx-token')
      if (existingToken) {
        console.log('🔍 发现现有token，验证有效性和钱包地址匹配性...')
        
        try {
          // 验证token有效性
          const isValid = await apiService.validateToken(existingToken)
          if (isValid) {
            // 获取token关联的用户信息
            const userResponse = await apiService.getCurrentUser()
            if (userResponse.success && userResponse.data) {
              const tokenWalletAddress = userResponse.data.user.walletAddress?.toLowerCase()
              const currentWalletAddress = user?.address?.toLowerCase()
              
              // 检查钱包地址是否匹配
              if (tokenWalletAddress === currentWalletAddress) {
                console.log('✅ 现有token有效且钱包地址匹配，跳过重复登录')
                return
              } else {
                console.warn('⚠️ 钱包地址不匹配，需要重新认证', {
                  tokenAddress: tokenWalletAddress,
                  currentAddress: currentWalletAddress
                })
              }
            }
          } else {
            console.warn('⚠️ 现有token已失效')
          }
        } catch (error) {
          console.warn('⚠️ token验证失败:', error)
        }
        
        // 清理无效或不匹配的token
        localStorage.removeItem('hackx-token')
        localStorage.removeItem('hackx-user')
      }
      
      console.log('🔑 开始钱包认证流程...')
      
      // 1. 尝试通过钱包地址登录
      const response = await apiService.signInWithWallet(walletAddress)
      
      if (response.success && response.data) {
        console.log('✅ 找到现有用户，使用统一认证管理器')
        
        // 使用统一的认证状态管理器
        const { useAuthStore } = await import('@/lib/auth-state-manager')
        const authStore = useAuthStore.getState()
        // 转换User类型到UserState类型，添加缺失的字段
        const userState = {
          ...response.data.user,
          role: 'user' as const,  // 前端使用小写，后端会处理转换
          status: 'active' as const  // 前端使用小写，后端会处理转换
        }
        authStore.setAuthenticated(userState, response.data.token, 'web3')
        
      } else {
        console.log('📝 用户不存在，需要创建新用户')
        
        // 2. 用户不存在，创建新的Web3用户
        console.log('📝 开始创建新Web3用户，可能需要IPFS上传...')
        
        const createResponse = await apiService.createWeb3User({
          walletAddress,
          profileCID,
          username: `user_${walletAddress.slice(0, 8)}`, // 默认用户名
          bio: profileCID ? '通过Web3连接的用户' : '新的Web3用户'
        })
        
        if (createResponse.success && createResponse.data) {
          console.log('✅ 新用户创建成功，使用统一认证管理器')
          
          // 使用统一的认证状态管理器
          const { useAuthStore } = await import('@/lib/auth-state-manager')
          const authStore = useAuthStore.getState()
          // 转换User类型到UserState类型，添加缺失的字段
          const userState = {
            ...createResponse.data.user,
            role: 'user' as const,  // 前端使用小写，后端会处理转换
            status: 'active' as const  // 前端使用小写，后端会处理转换
          }
          authStore.setAuthenticated(userState, createResponse.data.token, 'web3')
        } else {
          console.warn('⚠️ 创建新用户失败:', createResponse.error)
          // 如果是IPFS相关错误，给用户友好提示
          if (createResponse.error && createResponse.error.includes('IPFS')) {
            throw new Error('网络服务暂时不可用，请稍后重试')
          }
        }
      }
      
    } catch (error) {
      console.error('❌ 同步认证系统失败:', error)
      // 即使同步失败，Web3连接仍然有效
    }
  }

  const initializeWeb3 = async () => {
    try {
      // 检查是否安装了MetaMask
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        setProvider(provider)

        // 不自动连接，让用户主动选择连接
        // 这样确保连接的是MetaMask当前活跃的账户
        console.log('🔗 Web3 provider已准备，等待用户主动连接钱包')
      }
    } catch (error) {
      console.error('Web3初始化失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectWallet = async (): Promise<boolean> => {
    try {
      setConnecting(true)
      
      // 检查是否有钱包可用
      if (!window.ethereum) {
        toast({
          title: "错误",
          description: "请先安装支持的钱包 (MetaMask, Trust Wallet, 等)",
          variant: "destructive"
        })
        return false
      }

      // 强制刷新MetaMask连接状态，确保获取最新的活跃账户
      try {
        console.log('🔄 强制刷新MetaMask连接状态...')
        // 先请求权限，这会确保MetaMask处于活跃状态
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{
            eth_accounts: {}
          }]
        })
        console.log('✅ MetaMask权限已刷新')
      } catch (permissionError) {
        console.log('⚠️ 权限刷新失败，继续使用现有连接:', permissionError)
        // 如果权限刷新失败，继续使用现有连接
      }

      // 创建或更新provider
      const newProvider = new ethers.BrowserProvider(window.ethereum)
      setProvider(newProvider)
      
      // 强制请求连接钱包，这会弹出MetaMask并获取当前活跃账户
      console.log('🔄 请求连接MetaMask当前活跃账户...')
      
      // 方法1: 使用 eth_requestAccounts 强制弹出授权
      const requestedAccounts = await newProvider.send("eth_requestAccounts", [])
      console.log('📋 eth_requestAccounts 返回的账户:', requestedAccounts)
      
      // 方法2: 再次获取当前账户，确保是最新的
      const currentAccounts = await newProvider.send("eth_accounts", [])
      console.log('📋 eth_accounts 返回的账户:', currentAccounts)
      
      // 方法3: 直接从window.ethereum获取
      const windowAccounts = await window.ethereum.request({ method: 'eth_accounts' })
      console.log('📋 window.ethereum 返回的账户:', windowAccounts)
      
      // 使用最可靠的账户源
      const accounts = currentAccounts.length > 0 ? currentAccounts : 
                     (requestedAccounts.length > 0 ? requestedAccounts : windowAccounts)
      
      if (!accounts || accounts.length === 0) {
        throw new Error('未获取到钱包账户')
      }
      
      const address = accounts[0]
      console.log('✅ 最终使用的MetaMask账户:', address)
      console.log('🔍 账户来源分析:', {
        requestedAccounts: requestedAccounts[0],
        currentAccounts: currentAccounts[0], 
        windowAccounts: windowAccounts[0],
        finalAddress: address
      })
      
      const signer = await newProvider.getSigner()
      setSigner(signer)
      
      // 验证signer地址与获取的地址是否一致
      const signerAddress = await signer.getAddress()
      console.log('🔍 Signer地址验证:', {
        获取的地址: address,
        Signer地址: signerAddress,
        是否一致: address.toLowerCase() === signerAddress.toLowerCase()
      })
      
      // 使用signer的地址作为最终地址，这是最可靠的当前活跃地址
      let finalAddress = address
      if (address.toLowerCase() !== signerAddress.toLowerCase()) {
        console.warn('⚠️ 地址不一致，使用Signer地址作为最终地址')
        finalAddress = signerAddress
        console.log('🔄 更新最终地址为:', finalAddress)
      }
      
      // 检查网络
      const network = await newProvider.getNetwork()
      console.log('当前网络:', network)
      
      // 检查用户是否已注册 (需要合约实例化后才能检查)
      let isRegistered = false
      let profileCID = undefined
      
      try {
        if (CONTRACT_ADDRESS !== ZERO_ADDRESS) {
          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, HACKX_CORE_ABI, signer)
          setContract(contractInstance)
          
          isRegistered = await contractInstance.isUserRegistered(finalAddress)
          profileCID = isRegistered ? await contractInstance.getUserProfile(finalAddress) : undefined
          
          console.log('🔍 智能合约注册状态:', { isRegistered, profileCID })
        }
      } catch (contractError) {
        console.warn('合约交互失败:', contractError)
        // 即使合约交互失败，我们仍然允许钱包连接
        // 后端会在登录/注册时处理智能合约注册
      }

      const web3User: Web3User = {
        address: finalAddress,
        profileCID,
        isRegistered
      }

      setUser(web3User)

      // 同步更新SmartContractService
      await smartContractService.initialize(newProvider, signer)

      // ⭐ 新增：同步到传统认证系统
      await syncWithTraditionalAuth(finalAddress, profileCID)

      toast({
        title: "连接成功",
        description: `钱包地址: ${finalAddress.slice(0, 6)}...${finalAddress.slice(-4)}`,
      })

      return true
    } catch (error: any) {
      console.error('连接钱包失败:', error)
      
      let errorMessage = "请检查钱包是否已解锁"
      if (error.code === 4001) {
        errorMessage = "用户拒绝了连接请求"
      } else if (error.code === -32002) {
        errorMessage = "请先完成钱包中的待处理请求"
      }
      
      toast({
        title: "连接失败",
        description: errorMessage,
        variant: "destructive"
      })
      return false
    } finally {
      setConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    // 1. 清理本地 Web3Auth 状态
    setUser(null)
    setSigner(null)
    setContract(null)
    
    // 2. 同步清理全局认证状态
    try {
      const { useAuthStore } = await import('@/lib/auth-state-manager')
      const authStore = useAuthStore.getState()
      
      // 由于Web3和钱包用户是同步注册的，断开钱包连接意味着用户要完全退出
      if (authStore.isAuthenticated) {
        console.log('🔄 钱包断开连接，执行完全登出（Web3和钱包用户同步）')
        await authStore.logout()
      } else {
        // 只是清理钱包连接状态（用户可能没有完全登录）
        console.log('🔄 清理钱包连接状态')
        authStore.disconnectWallet()
      }
    } catch (error) {
      console.error('❌ 清理认证状态失败:', error)
    }
    
    toast({
      title: "已断开连接",
      description: "钱包连接已断开",
    })
  }

  const checkUserRegistration = async (address: string): Promise<boolean> => {
    if (!contract) return false
    
    try {
      return await contract.isUserRegistered(address)
    } catch (error) {
      console.error('检查用户注册状态失败:', error)
      return false
    }
  }

  const getUserProfile = async (address: string): Promise<string> => {
    if (!contract) return ''
    
    try {
      return await contract.getUserProfile(address)
    } catch (error) {
      console.error('获取用户资料失败:', error)
      return ''
    }
  }

  const registerUser = async (profileCID: string): Promise<boolean> => {
    if (!contract || !user) {
      toast({
        title: "错误",
        description: "请先连接钱包",
        variant: "destructive"
      })
      return false
    }

    try {
      const tx = await contract.registerUser(profileCID)
      await tx.wait()

      setUser(prev => prev ? { ...prev, isRegistered: true, profileCID } : null)

      toast({
        title: "注册成功",
        description: "用户已成功注册到区块链",
      })

      return true
    } catch (error) {
      console.error('用户注册失败:', error)
      toast({
        title: "注册失败",
        description: "请检查网络连接和Gas费用",
        variant: "destructive"
      })
      return false
    }
  }

  const updateProfile = async (newProfileCID: string): Promise<boolean> => {
    if (!contract || !user) {
      toast({
        title: "错误",
        description: "请先连接钱包",
        variant: "destructive"
      })
      return false
    }

    try {
      const tx = await contract.updateUserProfile(newProfileCID)
      await tx.wait()

      setUser(prev => prev ? { ...prev, profileCID: newProfileCID } : null)

      toast({
        title: "更新成功",
        description: "用户资料已更新",
      })

      return true
    } catch (error) {
      console.error('更新用户资料失败:', error)
      toast({
        title: "更新失败",
        description: "请检查网络连接和Gas费用",
        variant: "destructive"
      })
      return false
    }
  }

  const createHackathon = async (hackathonCID: string): Promise<boolean> => {
    if (!contract || !user) {
      toast({
        title: "错误",
        description: "请先连接钱包",
        variant: "destructive"
      })
      return false
    }

    try {
      const tx = await contract.createHackathon(hackathonCID)
      const receipt = await tx.wait()

      toast({
        title: "创建成功",
        description: "黑客松已创建到区块链",
      })

      return true
    } catch (error) {
      console.error('创建黑客松失败:', error)
      toast({
        title: "创建失败",
        description: "请检查网络连接和Gas费用",
        variant: "destructive"
      })
      return false
    }
  }

  const joinHackathon = async (hackathonId: number): Promise<boolean> => {
    if (!contract || !user) {
      toast({
        title: "错误",
        description: "请先连接钱包",
        variant: "destructive"
      })
      return false
    }

    try {
      const tx = await contract.joinHackathon(hackathonId)
      await tx.wait()

      toast({
        title: "加入成功",
        description: "已成功加入黑客松",
      })

      return true
    } catch (error) {
      console.error('加入黑客松失败:', error)
      toast({
        title: "加入失败",
        description: "请检查网络连接和Gas费用",
        variant: "destructive"
      })
      return false
    }
  }

  const submitProject = async (hackathonId: number, projectCID: string): Promise<boolean> => {
    if (!contract || !user) {
      toast({
        title: "错误",
        description: "请先连接钱包",
        variant: "destructive"
      })
      return false
    }

    try {
      const tx = await contract.submitProject(hackathonId, projectCID)
      await tx.wait()

      toast({
        title: "提交成功",
        description: "项目已提交到区块链",
      })

      return true
    } catch (error) {
      console.error('提交项目失败:', error)
      toast({
        title: "提交失败",
        description: "请检查网络连接和Gas费用",
        variant: "destructive"
      })
      return false
    }
  }

  const refreshUser = async () => {
    if (!user?.address) return

    try {
      const isRegistered = await checkUserRegistration(user.address)
      const profileCID = isRegistered ? await getUserProfile(user.address) : undefined

      setUser(prev => prev ? { ...prev, isRegistered, profileCID } : null)
    } catch (error) {
      console.error('刷新用户信息失败:', error)
    }
  }

  const value: Web3AuthContextType = {
    user,
    loading,
    connecting,
    provider,
    signer,
    contract,
    connectWallet,
    disconnectWallet,
    registerUser,
    updateProfile,
    createHackathon,
    joinHackathon,
    submitProject,
    refreshUser,
  }

  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  )
}

export function useWeb3Auth() {
  const context = useContext(Web3AuthContext)
  if (context === undefined) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider')
  }
  return context
} 