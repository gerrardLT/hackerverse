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
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">通知中心</h1>
              <p className="text-muted-foreground">
                管理你的所有通知和消息
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/notifications/settings">
                <Settings className="h-4 w-4 mr-2" />
                通知设置
              </Link>
            </Button>
            {stats.unread > 0 && (
              <Button onClick={handleMarkAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                全部已读
              </Button>
            )}
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">总通知</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.unread}</p>
                  <p className="text-sm text-muted-foreground">未读消息</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.highPriority}</p>
                  <p className="text-sm text-muted-foreground">高优先级</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.teamInvites}</p>
                  <p className="text-sm text-muted-foreground">团队邀请</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索通知..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    <SelectItem value="team">团队</SelectItem>
                    <SelectItem value="hackathon">黑客松</SelectItem>
                    <SelectItem value="project">项目</SelectItem>
                    <SelectItem value="system">系统</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="排序" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">最新优先</SelectItem>
                    <SelectItem value="oldest">最旧优先</SelectItem>
                    <SelectItem value="priority">优先级</SelectItem>
                  </SelectContent>
                </Select>

                {filteredNotifications.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleDeleteAll}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    批量删除
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 通知标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              全部
              <Badge variant="secondary" className="text-xs">
                {getTabCount('all')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              未读
              {getTabCount('unread') > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {getTabCount('unread')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="invites" className="flex items-center gap-2">
              邀请
              {getTabCount('invites') > 0 && (
                <Badge variant="default" className="text-xs">
                  {getTabCount('invites')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              团队
            </TabsTrigger>
            <TabsTrigger value="hackathon" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              黑客松
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              系统
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">暂无通知</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? '没有找到匹配的通知' : '你目前没有任何通知'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
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
  )
}
