import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Wallet } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()

  // 直接重定向到登录页面，因为现在只支持钱包登录
  React.useEffect(() => {
    router.push('/auth/signin')
  }, [router])

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">加入 HackX</CardTitle>
          <CardDescription className="text-center">
            使用 Web3 钱包进行注册和登录
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">钱包连接注册</h3>
              <p className="text-sm text-muted-foreground">
                现在只需要连接你的 Web3 钱包即可快速注册和登录 HackX。
                无需邮箱和密码，更加安全便捷。
              </p>
            </div>
            
            <Button size="lg" className="w-full" onClick={() => router.push('/auth/signin')}>
              <Wallet className="mr-2 h-5 w-5" />
              去连接钱包
            </Button>
            
            <div className="text-xs text-muted-foreground">
              支持 MetaMask、WalletConnect、Trust Wallet 等主流钱包
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <div className="text-center text-sm text-muted-foreground">
            已经有钱包？{' '}
            <Link href="/auth/signin" className="text-primary hover:underline">
              立即登录
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
