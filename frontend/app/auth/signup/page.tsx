'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Github, Mail, Wallet, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signUp, loading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: '密码不匹配',
        description: '请确认两次输入的密码相同',
        variant: 'destructive',
      })
      return
    }

    if (!agreeToTerms) {
      toast({
        title: '请同意服务条款',
        description: '您需要同意服务条款才能注册',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await signUp(email, password, username)
      if (result.success) {
        toast({
          title: '注册成功',
          description: '欢迎加入 HackX！',
        })
        router.push('/dashboard')
      } else {
        // 显示具体的错误信息
        toast({
          title: '注册失败',
          description: result.error || '注册失败，请稍后重试',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('注册错误:', error)
      toast({
        title: '注册失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isSubmitDisabled = isLoading || loading || !email || !username || !password || !confirmPassword || !agreeToTerms

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">加入 HackX</CardTitle>
          <CardDescription className="text-center">
            创建你的账户开始黑客松之旅
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
                或使用邮箱注册
              </span>
            </div>
          </div>

          {/* Email Registration Form */}
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
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="选择一个用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading || loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少6位字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || loading}
                minLength={6}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || loading}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                disabled={isLoading || loading}
              />
              <Label
                htmlFor="terms"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                我同意{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  服务条款
                </Link>{' '}
                和{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  隐私政策
                </Link>
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
              {(isLoading || loading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  注册中...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  创建账户
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <div className="text-center text-sm text-muted-foreground">
            已经有账号？{' '}
            <Link href="/auth/signin" className="text-primary hover:underline">
              立即登录
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
