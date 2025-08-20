'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, LogIn } from 'lucide-react'
import Link from 'next/link'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/auth/signin'
}: AuthGuardProps) {
  const { user, loading } = useAuth()

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  // 如果用户未登录，显示登录提示
  if (!user) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="container py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle>需要登录</CardTitle>
              <CardDescription>
                此页面需要登录后才能访问
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href={redirectTo}>
                  <LogIn className="h-4 w-4 mr-2" />
                  立即登录
                </Link>
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  还没有账户？{' '}
                  <Link href="/auth/signup" className="text-primary hover:underline">
                    立即注册
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 用户已登录，显示内容
  return <>{children}</>
} 