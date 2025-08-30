'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Github, Mail, Wallet, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useWeb3Auth } from '@/hooks/use-web3-auth'
import { ConnectWalletDialog } from '@/components/auth/connect-wallet-dialog'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [walletDialogOpen, setWalletDialogOpen] = useState(false)
  const { signIn, loading } = useAuth()
  const { connectWallet, connecting, user } = useWeb3Auth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn(email, password)
      if (result.success) {
        router.push('/dashboard')
      } else {
        // 显示错误信息（signIn函数已经处理toast）
        console.error('登录失败:', result.error)
      }
    } catch (error) {
      console.error('登录错误:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWalletLogin = () => {
    setWalletDialogOpen(true)
  }

  const handleWalletConnect = async (address: string, chainId: number) => {
    console.log('钱包连接成功:', { address, chainId })
  }

  const handleWalletConnected = async () => {
    // 钱包底层连接成功后，调用Web3Auth进行状态同步
    try {
      const success = await connectWallet()
      if (success) {
        // Web3认证成功，由authStateManager统一处理跳转
        // 等待稍片容认证状态同步完成
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      } else {
        console.warn('钱包认证失败')
      }
    } catch (error) {
      console.error('钱包连接处理错误:', error)
    }
  }

  const isSubmitDisabled = isLoading || loading || !email || !password

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">登录 HackX</CardTitle>
          <CardDescription className="text-center">
            使用 Web3 钱包安全登录
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 钱包登录 - 主要登录方式 */}
          <div className="space-y-4">
            <Button 
              size="lg"
              className="w-full" 
              onClick={handleWalletLogin}
            >
              <Wallet className="mr-2 h-5 w-5" />
              连接钱包登录
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              支持 MetaMask、WalletConnect 等主流钱包
            </p>
          </div>
          
          {/* 暂时隐藏的邮箱登录部分 */}
          {/* 
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                或使用邮箱登录
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="输入你的密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || loading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
              {(isLoading || loading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  登录
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <Link href="/auth/forgot-password" className="text-primary hover:underline">
              忘记密码？
            </Link>
          </div>
          */}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <div className="text-center text-sm text-muted-foreground">
            第一次使用？连接钱包即可自动创建账户
          </div>
        </CardFooter>
      </Card>

      <ConnectWalletDialog
        open={walletDialogOpen}
        onOpenChange={setWalletDialogOpen}
        onConnect={handleWalletConnect}
        onWalletConnected={handleWalletConnected}
      />
    </div>
  )
}
