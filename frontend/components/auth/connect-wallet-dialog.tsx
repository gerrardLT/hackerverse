'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Wallet, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth' // Updated import statement
import { useToast } from '@/hooks/use-toast'

interface ConnectWalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConnectWalletDialog({ open, onOpenChange }: ConnectWalletDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const { connectWallet } = useAuth()
  const { toast } = useToast()

  const handleConnectMetaMask = async () => {
    setIsConnecting(true)
    try {
      // 检查是否安装了 MetaMask
      if (typeof window.ethereum === 'undefined') {
        toast({
          title: '未检测到 MetaMask',
          description: '请先安装 MetaMask 钱包扩展',
          variant: 'destructive',
        })
        return
      }

      // 请求连接钱包
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts && accounts.length > 0) {
        const address = accounts[0]
        await connectWallet(address)
        
        toast({
          title: '钱包连接成功',
          description: '您的 MetaMask 钱包已成功连接到 HackX',
        })
        onOpenChange(false)
      } else {
        throw new Error('用户拒绝了连接请求')
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error)
      
      if (error.code === 4001) {
        toast({
          title: '连接被拒绝',
          description: '您拒绝了钱包连接请求',
          variant: 'destructive',
        })
      } else {
        toast({
          title: '连接失败',
          description: '无法连接到您的钱包，请重试',
          variant: 'destructive',
        })
      }
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>连接钱包</DialogTitle>
          <DialogDescription>
            连接您的 Web3 钱包以享受完整的去中心化体验
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button
            onClick={handleConnectMetaMask}
            disabled={isConnecting}
            className="w-full justify-start"
            variant="outline"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {isConnecting ? '连接中...' : 'MetaMask'}
          </Button>
          
          <Button
            onClick={() => {
              toast({
                title: '即将支持',
                description: 'WalletConnect 支持即将推出',
              })
            }}
            className="w-full justify-start"
            variant="outline"
            disabled
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            WalletConnect
          </Button>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>连接钱包后，您可以：</p>
          <ul className="mt-2 space-y-1 text-left">
            <li>• 使用 Web3 身份验证</li>
            <li>• 将项目存储到 IPFS</li>
            <li>• 获得 NFT 证书</li>
            <li>• 参与链上治理</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
