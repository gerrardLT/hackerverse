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
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="flex items-center gap-4">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">{t('title')}</h1>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>{t('role.' + user.role.toLowerCase())}</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              {t('backToSite')}
            </Button>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <div className="container py-6">
        <Tabs value={getCurrentTab()} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              return (
                <TabsTrigger 
                  key={item.key} 
                  value={item.key}
                  asChild
                >
                  <Link href={item.href} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </TabsTrigger>
              )
            })}
          </TabsList>
          
          {/* Content Area */}
          <div className="space-y-6">
            {children}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
