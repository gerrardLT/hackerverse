'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Bell, Search, Filter, Check, Trash2, Settings, Users, Trophy, MessageSquare, TrendingUp, Calendar, AlertCircle } from 'lucide-react'
import { NotificationItem } from '@/components/notifications/notification-item'
import { 
  notificationService, 
  type Notification,
  type NotificationSettings 
} from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [activeTab, setActiveTab] = useState('all')
  const [settings, setSettings] = useState<NotificationSettings>()
  const { toast } = useToast()

  useEffect(() => {
    loadNotifications()
    loadSettings()
  }, [])

  useEffect(() => {
    filterAndSortNotifications()
  }, [notifications, searchQuery, selectedCategory, sortBy, activeTab])

  const loadNotifications = () => {
    const allNotifications = notificationService.getNotifications()
    setNotifications(allNotifications)
  }

  const loadSettings = () => {
    const currentSettings = notificationService.getSettings()
    setSettings(currentSettings)
  }

  const filterAndSortNotifications = () => {
    let filtered = [...notifications]

    // 按标签页筛选
    switch (activeTab) {
      case 'unread':
        filtered = filtered.filter(n => !n.read)
        break
      case 'invites':
        filtered = filtered.filter(n => n.type === 'team_invite')
        break
      case 'team':
        filtered = filtered.filter(n => n.category === 'team')
        break
      case 'hackathon':
        filtered = filtered.filter(n => n.category === 'hackathon')
        break
      case 'system':
        filtered = filtered.filter(n => n.category === 'system')
        break
    }

    // 按分类筛选
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(n => n.category === selectedCategory)
    }

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      )
    }

    // 排序
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'priority':
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
        filtered.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))
        break
    }

    setFilteredNotifications(filtered)
  }

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id)
    loadNotifications()
  }

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead()
    loadNotifications()
    toast({
      title: '操作成功',
      description: '所有通知已标记为已读',
    })
  }

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id)
    loadNotifications()
    toast({
      title: '通知已删除',
      description: '通知已从列表中移除',
    })
  }

  const handleDeleteAll = () => {
    filteredNotifications.forEach(n => {
      notificationService.deleteNotification(n.id)
    })
    loadNotifications()
    toast({
      title: '批量删除成功',
      description: `已删除 ${filteredNotifications.length} 条通知`,
    })
  }

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'unread':
        return notifications.filter(n => !n.read).length
      case 'invites':
        return notifications.filter(n => n.type === 'team_invite').length
      case 'team':
        return notifications.filter(n => n.category === 'team').length
      case 'hackathon':
        return notifications.filter(n => n.category === 'hackathon').length
      case 'system':
        return notifications.filter(n => n.category === 'system').length
      default:
        return notifications.length
    }
  }

  const getStatistics = () => {
    const total = notifications.length
    const unread = notifications.filter(n => !n.read).length
    const highPriority = notifications.filter(n => n.priority === 'high').length
    const teamInvites = notifications.filter(n => n.type === 'team_invite' && !n.read).length

    return { total, unread, highPriority, teamInvites }
  }

  const stats = getStatistics()

  return (
    <div className="min-h-screen bg-background">
      {/* 主内容区 - max-width 1280px */}
      <div className="container max-w-[1280px] mx-auto px-4 md:px-6">
        {/* 紧凑头部工具栏 - 80px高度 - Flat Design 2.0 */}
        <div className="h-[80px] flex items-center justify-between border-b border-border/50">
          {/* 左侧：标题+统计 */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">通知中心</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.total} 条通知 · {stats.unread} 条未读
            </p>
          </div>

          {/* 右侧：搜索+筛选+操作 */}
          <div className="flex items-center gap-2">
            <div className="relative w-[200px] hidden md:block">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索通知..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-sm"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[100px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="team">团队</SelectItem>
                <SelectItem value="hackathon">黑客松</SelectItem>
                <SelectItem value="project">项目</SelectItem>
                <SelectItem value="system">系统</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[100px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">最新</SelectItem>
                <SelectItem value="oldest">最旧</SelectItem>
                <SelectItem value="priority">优先级</SelectItem>
              </SelectContent>
            </Select>

            {stats.unread > 0 && (
              <Button size="sm" onClick={handleMarkAllAsRead} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Check className="h-4 w-4 mr-1" />
                全部已读
              </Button>
            )}

            <Button size="sm" variant="outline" asChild>
              <Link href="/notifications/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* 快速统计 - 内联显示 */}
        <div className="py-3 flex items-center gap-4 border-b border-border/30">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <Bell className="h-3 w-3 text-blue-500" />
            <span className="text-xs font-medium">{stats.total} 总通知</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/20">
            <MessageSquare className="h-3 w-3 text-orange-500" />
            <span className="text-xs font-medium">{stats.unread} 未读</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <span className="text-xs font-medium">{stats.highPriority} 高优先级</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-950/20">
            <Users className="h-3 w-3 text-green-500" />
            <span className="text-xs font-medium">{stats.teamInvites} 团队邀请</span>
          </div>
          
          {filteredNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAll}
              className="ml-auto text-destructive hover:text-destructive h-7 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              批量删除
            </Button>
          )}
        </div>

        {/* 紧凑Tab系统 - 48px高度 - Flat Design 2.0 */}
        <div className="py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="bg-muted/30 rounded-xl p-1">
              <TabsList className="h-[48px] w-full grid grid-cols-3 md:grid-cols-6 bg-transparent gap-1 border-0">
                <TabsTrigger value="all" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  全部 <Badge variant="secondary" className="ml-1.5 text-xs">{getTabCount('all')}</Badge>
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  未读 
                  {getTabCount('unread') > 0 && (
                    <Badge variant="destructive" className="ml-1.5 text-xs">{getTabCount('unread')}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="invites" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  邀请
                  {getTabCount('invites') > 0 && (
                    <Badge variant="default" className="ml-1.5 text-xs bg-blue-100">{getTabCount('invites')}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="team" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm hidden md:flex">
                  <Users className="h-3 w-3 mr-1" />
                  团队
                </TabsTrigger>
                <TabsTrigger value="hackathon" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm hidden md:flex">
                  <Trophy className="h-3 w-3 mr-1" />
                  黑客松
                </TabsTrigger>
                <TabsTrigger value="system" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm hidden md:flex">
                  <Settings className="h-3 w-3 mr-1" />
                  系统
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-4">
              {filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-base font-medium mb-2">暂无通知</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? '没有找到匹配的通知' : '你目前没有任何通知'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
