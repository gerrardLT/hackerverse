'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  FileText, 
  Shield, 
  TrendingUp,
  UserPlus,
  AlertTriangle,
  Activity,
  BarChart3
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface DashboardData {
  userStats: {
    total: number
    active: number
    newToday: number
    banned: number
  }
  contentStats: {
    hackathons: number
    projects: number
    posts: number
    pendingReviews: number
  }
  recentActivity: {
    registrations: Array<{
      id: string
      username: string
      email: string
      role: string
      createdAt: string
    }>
    adminActions: Array<{
      id: string
      action: string
      targetType: string
      targetTitle: string
      createdAt: string
      admin: {
        username: string
      }
    }>
  }
  moderationStats: {
    contentReviews: Array<{
      status: string
      _count: number
    }>
    adminActions: number
    auditLogs: number
  }
}

export default function AdminDashboard() {
  const t = useTranslations('admin.dashboard')
  const tCommon = useTranslations('common')
  const { toast } = useToast()
  
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadDashboardData = async () => {
      try {
        const response = await apiService.get('/admin/dashboard')
        
        if (isMounted && response.success) {
          setData(response.data)
        } else if (isMounted) {
          toast({
            title: t('loadError'),
            description: response.error || t('unknownError'),
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('加载管理员仪表板失败:', error)
        if (isMounted) {
          toast({
            title: t('loadError'),
            description: t('networkError'),
            variant: 'destructive'
          })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">{t('noData')}</h3>
              <p className="text-muted-foreground">{t('noDataDescription')}</p>
              <Button onClick={() => window.location.reload()}>
                {tCommon('retry')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 紧凑页面标题 - 80px高度 */}
      <div className="glass-light border border-border/50 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{t('title')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
          </div>
        </div>
      </div>

      {/* 紧凑统计卡片 - 100px高度 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* User Statistics */}
        <Card className="glass-light border-border/50 hover:border-primary/30 transition-all hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium">{t('userStats.title')}</CardTitle>
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Users className="h-3.5 w-3.5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{data.userStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {t('userStats.active')}: {data.userStats.active}
            </p>
            <div className="flex gap-1.5 mt-2">
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                +{data.userStats.newToday}
              </Badge>
              {data.userStats.banned > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                  {data.userStats.banned}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Statistics */}
        <Card className="glass-light border-border/50 hover:border-primary/30 transition-all hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium">{t('contentStats.title')}</CardTitle>
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {data.contentStats.hackathons + data.contentStats.projects + data.contentStats.posts}
            </div>
            <p className="text-xs text-muted-foreground">{t('contentStats.total')}</p>
            <div className="flex gap-1 mt-2 text-[10px] text-muted-foreground">
              <span>{data.contentStats.hackathons}H</span>
              <span>•</span>
              <span>{data.contentStats.projects}P</span>
              <span>•</span>
              <span>{data.contentStats.posts}C</span>
            </div>
          </CardContent>
        </Card>

        {/* Moderation Statistics */}
        <Card className="glass-light border-border/50 hover:border-primary/30 transition-all hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium">{t('moderationStats.title')}</CardTitle>
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{data.contentStats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">{t('moderationStats.pending')}</p>
            <Badge variant="outline" className="mt-2 text-xs px-1.5 py-0">
              {data.moderationStats.adminActions}
            </Badge>
          </CardContent>
        </Card>

        {/* System Activity */}
        <Card className="glass-light border-border/50 hover:border-primary/30 transition-all hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium">{t('systemStats.title')}</CardTitle>
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Activity className="h-3.5 w-3.5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{data.moderationStats.auditLogs}</div>
            <p className="text-xs text-muted-foreground">{t('systemStats.auditLogs')}</p>
            <Badge variant="secondary" className="mt-2 text-xs px-1.5 py-0">
              30d
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Registrations */}
        <Card className="glass-light border-border/50">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4" />
              {t('recentActivity.registrations')}
            </CardTitle>
            <CardDescription className="text-xs">{t('recentActivity.registrationsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.registrations.length > 0 ? (
                data.recentActivity.registrations.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{user.role}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {t('recentActivity.noRegistrations')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Admin Actions */}
        <Card className="glass-light border-border/50">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              {t('recentActivity.adminActions')}
            </CardTitle>
            <CardDescription className="text-xs">{t('recentActivity.adminActionsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.adminActions.length > 0 ? (
                data.recentActivity.adminActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{action.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {action.targetType}: {action.targetTitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{action.admin.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(action.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {t('recentActivity.noActions')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
