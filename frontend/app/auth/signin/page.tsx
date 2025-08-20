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

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, loading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await signIn(email, password)
      if (success) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('登录错误:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isSubmitDisabled = isLoading || loading || !email || !password

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">登录 HackX</CardTitle>
          <CardDescription className="text-center">
            选择你的登录方式
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" disabled>
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button variant="outline" disabled>
              <Wallet className="mr-2 h-4 w-4" />
              钱包
            </Button>
          </div>
          
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

          {/* Email Login Form */}
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
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <div className="text-center text-sm text-muted-foreground">
            还没有账号？{' '}
            <Link href="/auth/signup" className="text-primary hover:underline">
              立即注册
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
