'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  FileText,
  AlertTriangle,
  Activity,
  Database,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('admin')
  const tCommon = useTranslations('common')
  
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      if (!['ADMIN', 'MODERATOR'].includes(user.role)) {
        router.push('/dashboard')
        return
      }
      
      setIsAuthorized(true)
    }
  }, [user, loading, router])

  const adminNavItems = [
    {
      key: 'dashboard',
      label: t('nav.dashboard'),
      href: '/admin/dashboard',
      icon: BarChart3
    },
    {
      key: 'hackathons',
      label: t('nav.hackathons'),
      href: '/admin/hackathons',
      icon: Calendar
    },
    {
      key: 'users',
      label: t('nav.users'),
      href: '/admin/users',
      icon: Users
    },
    {
      key: 'content',
      label: t('nav.content'),
      href: '/admin/content',
      icon: FileText
    },
    {
      key: 'analytics',
      label: t('nav.analytics'),
      href: '/admin/analytics',
      icon: Activity
    },
    {
      key: 'settings',
      label: t('nav.settings'),
      href: '/admin/settings',
      icon: Settings
    }
  ]

  const getCurrentTab = () => {
    const path = pathname.split('/').pop()
    return path || 'dashboard'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-xl font-semibold">{t('unauthorized.title')}</h2>
              <p className="text-muted-foreground">{t('unauthorized.description')}</p>
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                {t('unauthorized.backToDashboard')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* 动态背景 */}
      <div className="absolute inset-0 gradient-mesh opacity-10 -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/90 to-background -z-10" />
      
      {/* Admin Header - 80px高度 Flat Design 2.0 */}
      <header className="sticky top-0 z-50 w-full glass-light border-b border-border/50 backdrop-blur-xl">
        <div className="container flex h-20 items-center max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-xl">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{t('title')}</h1>
              <p className="text-xs text-muted-foreground">{t('role.' + user.role.toLowerCase())}</p>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="glass hover-lift"
            >
              {t('backToSite')}
            </Button>
          </div>
        </div>
      </header>

      {/* Admin Navigation - 48px Tab高度 */}
      <div className="container max-w-[1400px] mx-auto px-6 py-6">
        <Tabs value={getCurrentTab()} className="space-y-6">
          {/* 紧凑Tab导航 */}
          <div className="bg-muted/30 rounded-xl p-1">
            <TabsList className="h-[48px] w-full grid grid-cols-3 md:grid-cols-6 bg-transparent gap-1 border-0">
              {adminNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <TabsTrigger 
                    key={item.key} 
                    value={item.key}
                    asChild
                    className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    <Link href={item.href} className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>
          
          {/* Content Area */}
          <div className="space-y-6">
            {children}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
