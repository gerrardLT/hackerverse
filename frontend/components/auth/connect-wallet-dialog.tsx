'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')

  // 检测所有可用钱包
  const detectWallets = (): WalletOption[] => {
    const allWallets: WalletOption[] = [
      {
        id: 'metamask',
        name: 'MetaMask',
        description: t('wallet.metamaskDesc'),
        type: 'browser',
        recommended: true,
        isInstalled: () => typeof window !== 'undefined' && !!window.ethereum?.isMetaMask,
        downloadUrl: 'https://metamask.io/download/',
        connect: async () => {
          if (!window.ethereum?.isMetaMask) {
            throw new Error(t('wallet.metamaskNotInstalled'))
          }
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          return { address: accounts[0], chainId: parseInt(chainId, 16) }
        }
      },
      {
        id: 'trustwallet',
        name: 'Trust Wallet',
        description: t('wallet.trustWalletDesc'),
        type: 'mobile',
        isInstalled: () => typeof window !== 'undefined' && !!window.ethereum?.isTrust,
        downloadUrl: 'https://trustwallet.com/',
        connect: async () => {
          if (!window.ethereum?.isTrust) {
            throw new Error(t('wallet.trustWalletNotInstalled'))
          }
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          return { address: accounts[0], chainId: parseInt(chainId, 16) }
        }
      },
      {
        id: 'binance',
        name: 'Binance Wallet',
        description: t('wallet.binanceWalletDesc'),
        type: 'browser',
        isInstalled: () => typeof window !== 'undefined' && !!window.BinanceChain,
        downloadUrl: 'https://www.binance.org/en/binance-wallet',
        connect: async () => {
          if (!window.BinanceChain) {
            throw new Error(t('wallet.binanceWalletNotInstalled'))
          }
          const accounts = await window.BinanceChain.request({ method: 'eth_requestAccounts' })
          const chainId = await window.BinanceChain.request({ method: 'eth_chainId' })
          return { address: accounts[0], chainId: parseInt(chainId, 16) }
        }
      },
      {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        description: t('wallet.coinbaseWalletDesc'),
        type: 'browser',
        isInstalled: () => typeof window !== 'undefined' && !!window.ethereum?.isCoinbaseWallet,
        downloadUrl: 'https://wallet.coinbase.com/',
        connect: async () => {
          if (!window.ethereum?.isCoinbaseWallet) {
            throw new Error(t('wallet.coinbaseWalletNotInstalled'))
          }
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          return { address: accounts[0], chainId: parseInt(chainId, 16) }
        }
      },
      {
        id: 'okx',
        name: 'OKX Wallet',
        description: t('wallet.okxWalletDesc'),
        type: 'browser',
        isInstalled: () => typeof window !== 'undefined' && !!window.okxwallet,
        downloadUrl: 'https://www.okx.com/web3',
        connect: async () => {
          if (!window.okxwallet) {
            throw new Error(t('wallet.okxWalletNotInstalled'))
          }
          const accounts = await window.okxwallet.request({ method: 'eth_requestAccounts' })
          const chainId = await window.okxwallet.request({ method: 'eth_chainId' })
          return { address: accounts[0], chainId: parseInt(chainId, 16) }
        }
      },
      {
        id: 'phantom',
        name: 'Phantom',
        description: t('wallet.phantomDesc'),
        type: 'browser',
        isInstalled: () => typeof window !== 'undefined' && !!window.phantom?.ethereum,
        downloadUrl: 'https://phantom.app/',
        connect: async () => {
          if (!window.phantom?.ethereum) {
            throw new Error(t('wallet.phantomNotInstalled'))
          }
          const accounts = await window.phantom.ethereum.request({ method: 'eth_requestAccounts' })
          const chainId = await window.phantom.ethereum.request({ method: 'eth_chainId' })
          return { address: accounts[0], chainId: parseInt(chainId, 16) }
        }
      }
    ]

    // Put installed wallets first, then uninstalled ones
    const installedWallets = allWallets.filter(wallet => wallet.isInstalled())
    const notInstalledWallets = allWallets.filter(wallet => !wallet.isInstalled())
    
    return [...installedWallets, ...notInstalledWallets]
  }

  const walletOptions = detectWallets()

  const handleConnect = async (wallet: WalletOption) => {
    setConnecting(wallet.id)
    setError(null)

    try {
      if (!wallet.isInstalled()) {
        setError(t('wallet.notInstalledError', { walletName: wallet.name }))
        return
      }

      const result = await wallet.connect()
      
      // 检查网络是否正确 (BSC Testnet)
      const expectedChainId = 97 // BSC Testnet
      if (result.chainId !== expectedChainId) {
        try {
          await switchToBSCTestnet()
          toast({
            title: t('wallet.networkSwitched'),
            description: t('wallet.switchedToBSCTestnet'),
          })
        } catch (switchError) {
          toast({
            title: t('wallet.networkError'),
            description: t('wallet.switchToBSCManually', { chainId: expectedChainId }),
            variant: "destructive"
          })
          return
        }
      }

      onConnect(result.address, result.chainId)
      
      // Call Web3Auth connection callback
      if (onWalletConnected) {
        onWalletConnected()
      }
      
      onOpenChange(false)
      
      toast({
        title: t('wallet.connectSuccess'),
        description: t('wallet.connectedVia', { walletName: wallet.name }),
      })

    } catch (error: any) {
      console.error('Wallet connection failed:', error)
      setError(error.message || t('wallet.connectFailed'))
      
      toast({
        title: t('wallet.connectFailed'),
        description: error.message || t('wallet.checkWalletUnlocked'),
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
            {t('wallet.connect')}
          </DialogTitle>
          <DialogDescription>
            {t('wallet.selectWalletDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 网络提示 */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t.rich('wallet.ensureBSCTestnet', {
                strong: (chunks) => <strong className="font-semibold">{chunks}</strong>
              })}
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
                          <Badge variant="secondary" className="text-xs">{tCommon('recommended')}</Badge>
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
                            {tCommon('connecting')}
                          </>
                        ) : (
                          t('wallet.connect')
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => handleDownload(wallet)}
                        size="sm"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {tCommon('install')}
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
              {t('wallet.securityPromise')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('wallet.termsAgreement')}
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
    okxwallet?: any
    phantom?: any
  }
}