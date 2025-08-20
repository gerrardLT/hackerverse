"use client"

import React from 'react'
import { Button } from './button'
import { useWeb3Auth } from '@/hooks/use-web3-auth'
import { Wallet, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WalletConnectProps {
  className?: string
}

export function WalletConnect({ className }: WalletConnectProps) {
  const { user, loading, connecting, connectWallet, disconnectWallet } = useWeb3Auth()

  const handleConnect = async () => {
    await connectWallet()
  }

  const handleDisconnect = () => {
    disconnectWallet()
  }

  if (loading) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">连接中...</span>
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
          {user.isRegistered && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              已注册
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="flex items-center space-x-1"
        >
          <LogOut className="h-3 w-3" />
          <span>断开</span>
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={connecting}
      className={cn("flex items-center space-x-2", className)}
    >
      <Wallet className="h-4 w-4" />
      <span>{connecting ? '连接中...' : '连接钱包'}</span>
    </Button>
  )
} 