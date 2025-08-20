'use client'

declare global {
  interface Window {
    ethereum?: any
  }
}

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Wallet, Copy, ExternalLink, RefreshCw, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { smartContractService } from '@/lib/smart-contracts'
import { ethers } from 'ethers'

interface WalletInfo {
  address: string
  balance: string
  tokenBalance: string
  network: string
  chainId: number
}

export function WalletConnect() {
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkConnection()
    
    // 监听账户变化
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }

    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setIsConnected(true)
          await loadWalletInfo()
        }
      } catch (error) {
        console.error('Error checking connection:', error)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast({
        title: '未检测到钱包',
        description: '请安装 MetaMask 或其他以太坊钱包',
        variant: 'destructive',
      })
      return
    }

    setIsConnecting(true)
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      await smartContractService.initialize()
      setIsConnected(true)
      await loadWalletInfo()
      
      toast({
        title: '钱包连接成功',
        description: '已成功连接到您的钱包',
      })
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      toast({
        title: '连接失败',
        description: error.message || '无法连接到钱包',
        variant: 'destructive',
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const loadWalletInfo = async () => {
    if (!window.ethereum) return

    setIsLoading(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const balance = await provider.getBalance(address)
      const network = await provider.getNetwork()
      
      // 获取代币余额
      let tokenBalance = '0'
      try {
        tokenBalance = await smartContractService.getTokenBalance(address)
      } catch (error) {
        console.warn('Could not fetch token balance:', error)
      }

      setWalletInfo({
        address,
        balance: ethers.formatEther(balance),
        tokenBalance,
        network: network.name,
        chainId: Number(network.chainId)
      })
    } catch (error) {
      console.error('Error loading wallet info:', error)
      toast({
        title: '加载钱包信息失败',
        description: '请刷新页面重试',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setIsConnected(false)
      setWalletInfo(null)
      toast({
        title: '钱包已断开',
        description: '请重新连接钱包',
        variant: 'destructive',
      })
    } else {
      loadWalletInfo()
    }
  }

  const handleChainChanged = () => {
    window.location.reload()
  }

  const copyAddress = () => {
    if (walletInfo?.address) {
      navigator.clipboard.writeText(walletInfo.address)
      toast({
        title: '地址已复制',
        description: '钱包地址已复制到剪贴板',
      })
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getNetworkStatus = () => {
    if (!walletInfo) return null
    
    const isMainnet = walletInfo.chainId === 1
    const isTestnet = [3, 4, 5, 42, 11155111].includes(walletInfo.chainId)
    
    if (isMainnet) {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          主网
        </Badge>
      )
    } else if (isTestnet) {
      return (
        <Badge className="bg-yellow-500 text-white">
          <AlertCircle className="h-3 w-3 mr-1" />
          测试网
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          未知网络
        </Badge>
      )
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>连接钱包</CardTitle>
          <CardDescription>
            连接您的以太坊钱包以使用 Web3 功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full" 
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                连接中...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                连接 MetaMask
              </>
            )}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>支持的钱包：</p>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <img src="/metamask-icon.png" alt="MetaMask" className="w-4 h-4" />
                <span>MetaMask</span>
              </div>
              <div className="flex items-center gap-1">
                <img src="/walletconnect-icon.png" alt="WalletConnect" className="w-4 h-4" />
                <span>WalletConnect</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${walletInfo?.address}`} />
              <AvatarFallback>
                <Wallet className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">钱包已连接</CardTitle>
              <CardDescription>
                {walletInfo ? formatAddress(walletInfo.address) : '加载中...'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getNetworkStatus()}
            <Button
              variant="outline"
              size="sm"
              onClick={loadWalletInfo}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {walletInfo && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ETH 余额</span>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="font-mono">
                    {parseFloat(walletInfo.balance).toFixed(4)} ETH
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">HXT 余额</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-primary" />
                  <span className="font-mono">
                    {parseFloat(walletInfo.tokenBalance).toFixed(2)} HXT
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">网络</span>
                <span className="font-medium">{walletInfo.network}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">链 ID</span>
                <span className="font-mono">{walletInfo.chainId}</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyAddress} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              复制地址
            </Button>
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a 
                href={`https://etherscan.io/address/${walletInfo.address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                查看详情
              </a>
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            <p>钱包地址: {walletInfo.address}</p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
