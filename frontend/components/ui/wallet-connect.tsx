"use client"

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from './button'
import { useWeb3Auth } from '@/hooks/use-web3-auth'
import { useAuth } from '@/hooks/use-auth'
import { Wallet, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConnectWalletDialog } from '@/components/auth/connect-wallet-dialog'

interface WalletConnectProps {
  className?: string
}

export function WalletConnect({ className }: WalletConnectProps) {
  const { user, loading, connecting, connectWallet, disconnectWallet } = useWeb3Auth()
  const { loading: authLoading } = useAuth() // 获取认证loading状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const t = useTranslations('ui.walletConnect')
  const tCommon = useTranslations('common')

  const handleConnect = () => {
    setDialogOpen(true)
  }

  const handleWalletConnect = async (address: string, chainId: number) => {
    // Additional post-connection logic can be added here
    console.log('Wallet connected successfully:', { address, chainId })
  }

  const handleWalletConnected = async () => {
    // 钱包底层连接成功后，调用Web3Auth进行状态同步
    await connectWallet()
  }

  const handleDisconnect = async () => {
    await disconnectWallet()
  }

  // 显示loading状态：Web3Auth loading、认证loading、或连接中
  if (loading || authLoading || connecting) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">
          {authLoading ? t('registering') : connecting ? tCommon('connecting') : tCommon('loading')}
        </span>
      </div>
    )
  }

  if (user) {
    return (
      <div className={cn("flex items-center space-x-3", className)}>
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {user.address.slice(0, 6)}...{user.address.slice(-4)}
          </span>
          {/* 只有在不处于认证loading状态且用户已注册时才显示"已注册" */}
          {!authLoading && user.isRegistered && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              {t('registered')}
            </span>
          )}
          {/* 如果正在认证中，显示loading状态 */}
          {authLoading && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              {t('registering')}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <Button
        onClick={handleConnect}
        disabled={connecting}
        className={cn("flex items-center space-x-2", className)}
      >
        <Wallet className="h-4 w-4" />
        <span>{connecting ? tCommon('connecting') : t('connectWallet')}</span>
      </Button>
      
      <ConnectWalletDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConnect={handleWalletConnect}
        onWalletConnected={handleWalletConnected}
      />
    </>
  )
} 