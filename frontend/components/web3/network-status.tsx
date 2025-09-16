'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { NETWORK_CONFIG } from '@/lib/smart-contracts'

interface NetworkStatusProps {
  className?: string
}

export function NetworkStatus({ className }: NetworkStatusProps) {
  const t = useTranslations('web3.network')
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'connected' | 'error' | 'warning'>('checking')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  const checkNetworkStatus = async () => {
    setNetworkStatus('checking')
    
    try {
      // 检查用户是否连接到正确的网络
      if (typeof window !== 'undefined' && window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        const currentChainId = parseInt(chainId, 16)
        
        if (currentChainId !== NETWORK_CONFIG.chainId) {
          setNetworkStatus('warning')
          setErrorMessage(t('switchToNetwork', { networkName: NETWORK_CONFIG.name, chainId: NETWORK_CONFIG.chainId }))
          return
        }
        
        // 尝试调用一个简单的RPC方法来测试连接
        const blockNumber = await window.ethereum.request({ 
          method: 'eth_blockNumber' 
        })
        
        if (blockNumber) {
          setNetworkStatus('connected')
          setErrorMessage('')
        }
      } else {
        setNetworkStatus('warning')
        setErrorMessage(t('walletNotDetected'))
      }
    } catch (error: any) {
      console.error('Network status check failed:', error)
      setNetworkStatus('error')
      
      if (error.message?.includes('missing trie node')) {
        setErrorMessage(t('bscNodeSyncIssue'))
      } else if (error.message?.includes('Internal JSON-RPC error')) {
        setErrorMessage(t('networkUnstable'))
      } else {
        setErrorMessage(t('networkError'))
      }
    } finally {
      setLastChecked(new Date())
    }
  }

  useEffect(() => {
    checkNetworkStatus()
    
    // 每30秒检查一次网络状态
    const interval = setInterval(checkNetworkStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // 监听网络切换事件
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleChainChanged = () => {
        checkNetworkStatus()
      }
      
      window.ethereum.on('chainChanged', handleChainChanged)
      
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const getStatusIcon = () => {
    switch (networkStatus) {
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'error':
      case 'warning':
        return <WifiOff className="h-4 w-4 text-orange-500" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getAlertVariant = () => {
    switch (networkStatus) {
      case 'error':
        return 'destructive' as const
      case 'warning':
        return 'default' as const
      default:
        return 'default' as const
    }
  }

  // 只在有问题时显示
  if (networkStatus === 'connected' || networkStatus === 'checking') {
    return null
  }

  return (
    <Alert variant={getAlertVariant()} className={className}>
      {getStatusIcon()}
      <AlertDescription className="flex items-center justify-between">
        <span>{errorMessage}</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkNetworkStatus}
          disabled={networkStatus === 'checking'}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${networkStatus === 'checking' ? 'animate-spin' : ''}`} />
          {t('retry')}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

// 辅助函数：切换到BSC Testnet
export const switchToBSCTestnet = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error(t('walletNotDetected'))
  }

  try {
    // 尝试切换到BSC Testnet
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
    })
  } catch (switchError: any) {
    // 如果网络不存在，尝试添加
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
            chainName: NETWORK_CONFIG.name,
            rpcUrls: NETWORK_CONFIG.rpcUrls,
            blockExplorerUrls: [NETWORK_CONFIG.blockExplorer],
            nativeCurrency: NETWORK_CONFIG.nativeCurrency,
          }],
        })
      } catch (addError) {
        throw new Error(t('addBSCTestnetFailed'))
      }
    } else {
      throw switchError
    }
  }
}
