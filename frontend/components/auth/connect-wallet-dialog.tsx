'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ExternalLink, AlertTriangle, CheckCircle, Wallet, Smartphone, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { WalletIcon } from '@/components/ui/wallet-icons'
import { switchToBSCTestnet } from '@/components/web3/network-status'

interface WalletOption {
  id: string
  name: string
  description: string
        icon?: string
  isInstalled: () => boolean
  downloadUrl: string
  connect: () => Promise<{ address: string; chainId: number }>
  type: 'browser' | 'mobile' | 'desktop'
  recommended?: boolean
}

interface ConnectWalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnect: (address: string, chainId: number) => void
  onWalletConnected?: () => void // 新增：钱包连接成功后的回调
}

export function ConnectWalletDialog({ open, onOpenChange, onConnect, onWalletConnected }: ConnectWalletDialogProps) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // 定义支持的钱包
  const walletOptions: WalletOption[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: '最受欢迎的以太坊钱包',
      type: 'browser',
      recommended: true,
      isInstalled: () => typeof window !== 'undefined' && !!window.ethereum?.isMetaMask,
      downloadUrl: 'https://metamask.io/download/',
      connect: async () => {
        if (!window.ethereum?.isMetaMask) {
          throw new Error('MetaMask未安装')
        }
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        return { address: accounts[0], chainId: parseInt(chainId, 16) }
      }
    },
    {
      id: 'trustwallet',
      name: 'Trust Wallet',
      description: '移动端首选钱包',
      type: 'mobile',
      isInstalled: () => typeof window !== 'undefined' && !!window.ethereum?.isTrust,
      downloadUrl: 'https://trustwallet.com/',
      connect: async () => {
        if (!window.ethereum?.isTrust) {
          throw new Error('Trust Wallet未安装')
        }
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        return { address: accounts[0], chainId: parseInt(chainId, 16) }
      }
    },
    {
      id: 'binance',
      name: 'Binance Wallet',
      description: 'BSC生态官方钱包',
      type: 'browser',
      isInstalled: () => typeof window !== 'undefined' && !!window.BinanceChain,
      downloadUrl: 'https://www.binance.org/en/binance-wallet',
      connect: async () => {
        if (!window.BinanceChain) {
          throw new Error('Binance Wallet未安装')
        }
        const accounts = await window.BinanceChain.request({ method: 'eth_requestAccounts' })
        const chainId = await window.BinanceChain.request({ method: 'eth_chainId' })
        return { address: accounts[0], chainId: parseInt(chainId, 16) }
      }
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: '安全易用的数字钱包',
      type: 'browser',
      isInstalled: () => typeof window !== 'undefined' && !!window.ethereum?.isCoinbaseWallet,
      downloadUrl: 'https://wallet.coinbase.com/',
      connect: async () => {
        if (!window.ethereum?.isCoinbaseWallet) {
          throw new Error('Coinbase Wallet未安装')
        }
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        return { address: accounts[0], chainId: parseInt(chainId, 16) }
      }
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: '扫码连接移动钱包',
      type: 'mobile',
      isInstalled: () => true, // WalletConnect is always available
      downloadUrl: 'https://walletconnect.com/',
      connect: async () => {
        // 这里需要集成 WalletConnect 库
        throw new Error('WalletConnect 即将支持')
      }
    }
  ]

  const handleConnect = async (wallet: WalletOption) => {
    setConnecting(wallet.id)
    setError(null)

    try {
      if (!wallet.isInstalled()) {
        setError(`${wallet.name} 未安装，请先下载安装`)
        return
      }

      const result = await wallet.connect()
      
      // 检查网络是否正确 (BSC Testnet)
      const expectedChainId = 97 // BSC Testnet
      if (result.chainId !== expectedChainId) {
        try {
          await switchToBSCTestnet()
          toast({
            title: "网络已切换",
            description: "已自动切换到 BSC Testnet",
          })
        } catch (switchError) {
          toast({
            title: "网络错误",
            description: `请手动切换到 BSC Testnet (ChainID: ${expectedChainId})`,
            variant: "destructive"
          })
          return
        }
      }

      onConnect(result.address, result.chainId)
      
      // 调用Web3Auth连接回调
      if (onWalletConnected) {
        onWalletConnected()
      }
      
      onOpenChange(false)
      
      toast({
        title: "连接成功",
        description: `已通过 ${wallet.name} 连接钱包`,
      })

    } catch (error: any) {
      console.error('钱包连接失败:', error)
      setError(error.message || '连接失败，请重试')
      
      toast({
        title: "连接失败",
        description: error.message || '请检查钱包是否已解锁',
        variant: "destructive"
      })
    } finally {
      setConnecting(null)
    }
  }

  const handleDownload = (wallet: WalletOption) => {
    window.open(wallet.downloadUrl, '_blank', 'noopener,noreferrer')
  }

  const getWalletTypeIcon = (type: string) => {
    switch (type) {
      case 'browser': return <Globe className="h-4 w-4 text-blue-500" />
      case 'mobile': return <Smartphone className="h-4 w-4 text-green-500" />
      case 'desktop': return <Wallet className="h-4 w-4 text-purple-500" />
      default: return <Wallet className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            连接钱包
          </DialogTitle>
          <DialogDescription>
            选择你喜欢的钱包来连接到 HackX 平台
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 网络提示 */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              请确保您的钱包已连接到 <strong>BSC Testnet (ChainID: 97)</strong>
            </AlertDescription>
          </Alert>

          {/* 钱包选项 */}
          <div className="space-y-2">
            {walletOptions.map((wallet) => {
              const isInstalled = wallet.isInstalled()
              const isConnecting = connecting === wallet.id

              return (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <WalletIcon walletId={wallet.id} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{wallet.name}</h3>
                        {wallet.recommended && (
                          <Badge variant="secondary" className="text-xs">推荐</Badge>
                        )}
                        {getWalletTypeIcon(wallet.type)}
                      </div>
                      <p className="text-sm text-muted-foreground">{wallet.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isInstalled ? (
                      <Button
                        onClick={() => handleConnect(wallet)}
                        disabled={isConnecting}
                        size="sm"
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            连接中...
                          </>
                        ) : (
                          '连接'
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => handleDownload(wallet)}
                        size="sm"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        安装
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 错误信息 */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 安全提示 */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              我们不会存储您的私钥或助记词
            </div>
            <div className="text-xs text-muted-foreground">
              连接钱包即表示您同意我们的服务条款
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 扩展 Window 接口以支持各种钱包
declare global {
  interface Window {
    ethereum?: any
    BinanceChain?: any
  }
}