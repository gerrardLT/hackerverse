'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { useToast } from '@/hooks/use-toast'

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
  disconnectWallet: () => void
  registerUser: (profileCID: string) => Promise<boolean>
  updateProfile: (newProfileCID: string) => Promise<boolean>
  createHackathon: (hackathonCID: string) => Promise<boolean>
  joinHackathon: (hackathonId: number) => Promise<boolean>
  submitProject: (hackathonId: number, projectCID: string) => Promise<boolean>
  refreshUser: () => Promise<void>
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(undefined)

// 智能合约ABI (简化版本)
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

// 合约地址 (需要替换为实际部署的地址)
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'

export function Web3AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Web3User | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const { toast } = useToast()

  // 初始化Web3
  useEffect(() => {
    initializeWeb3()
  }, [])

  // 当signer变化时，更新合约实例
  useEffect(() => {
    if (signer && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, HACKX_CORE_ABI, signer)
      setContract(contractInstance)
    }
  }, [signer])

  const initializeWeb3 = async () => {
    try {
      // 检查是否安装了MetaMask
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        setProvider(provider)

        // 检查是否已经连接
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          await connectWallet()
        }
      }
    } catch (error) {
      console.error('Web3初始化失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectWallet = async (): Promise<boolean> => {
    if (!provider) {
      toast({
        title: "错误",
        description: "请先安装MetaMask钱包",
        variant: "destructive"
      })
      return false
    }

    try {
      setConnecting(true)
      
      // 请求连接钱包
      const accounts = await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      setSigner(signer)

      const address = accounts[0]
      
      // 检查用户是否已注册
      const isRegistered = await checkUserRegistration(address)
      const profileCID = isRegistered ? await getUserProfile(address) : undefined

      const web3User: Web3User = {
        address,
        profileCID,
        isRegistered
      }

      setUser(web3User)

      toast({
        title: "连接成功",
        description: `钱包地址: ${address.slice(0, 6)}...${address.slice(-4)}`,
      })

      return true
    } catch (error) {
      console.error('连接钱包失败:', error)
      toast({
        title: "连接失败",
        description: "请检查MetaMask是否已解锁",
        variant: "destructive"
      })
      return false
    } finally {
      setConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setUser(null)
    setSigner(null)
    setContract(null)
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