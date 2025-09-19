'use client'

import { useState, useEffect } from 'react'
import { Bell, BellRing, Check, Trash2, MoreHorizontal, User, Heart, MessageSquare, Users, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'
import { AuthGuard } from '@/components/auth/auth-guard'
import { formatTimeAgo } from '@/lib/community'

interface CommunityNotification {
  id: string
  type: string
  title: string
  content: string
  entityType?: string
  entityId?: string
  isRead: boolean
  createdAt: string
  readAt?: string
  triggerUser?: {
    id: string
    name: string
    username: string
    avatar?: string
  }
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'REPLY':
    case 'REPLY_MENTION':
      return <MessageSquare className="w-5 h-5 text-blue-600" />
    case 'POST_LIKE':
    case 'REPLY_LIKE':
      return <Heart className="w-5 h-5 text-red-600" />
    case 'NEW_FOLLOWER':
      return <Users className="w-5 h-5 text-green-600" />
    case 'FOLLOWER_POST':
      return <User className="w-5 h-5 text-purple-600" />
    case 'SYSTEM_ANNOUNCEMENT':
      return <BellRing className="w-5 h-5 text-orange-600" />
    case 'WELCOME':
      return <Bell className="w-5 h-5 text-blue-600" />
    default:
      return <Bell className="w-5 h-5 text-gray-600" />
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'REPLY':
    case 'REPLY_MENTION':
      return 'bg-blue-50 border-blue-200'
    case 'POST_LIKE':
    case 'REPLY_LIKE':
      return 'bg-red-50 border-red-200'
    case 'NEW_FOLLOWER':
      return 'bg-green-50 border-green-200'
    case 'FOLLOWER_POST':
      return 'bg-purple-50 border-purple-200'
    case 'SYSTEM_ANNOUNCEMENT':
      return 'bg-orange-50 border-orange-200'
    case 'WELCOME':
      return 'bg-blue-50 border-blue-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
}

export default function NotificationsPage() {
  const { toast } = useToast()
  
  const [notifications, setNotifications] = useState<CommunityNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
  }, [activeTab])

  const loadNotifications = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.getCommunityNotifications({
        page: 1,
        limit: 50,
        unreadOnly: activeTab === 'unread'
      })

      if (response.success && response.data) {
        setNotifications(response.data.notifications)
      } else {
        setError(response.error || '加载通知失败')
      }
    } catch (error) {
      console.error('加载通知错误:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await apiService.getUnreadNotificationCount()
      if (response.success && response.data) {
        setUnreadCount(response.data.unreadCount)
      }
    } catch (error) {
      console.error('获取未读数量错误:', error)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await apiService.notificationActions({
        action: 'markRead',
        notificationIds
      })

      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notificationIds.includes(notification.id) 
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
        
        toast({
          title: '操作成功',
          description: '通知已标记为已读'
        })
      } else {
        throw new Error(response.error || '操作失败')
      }
    } catch (error) {
      console.error('标记已读错误:', error)
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '标记已读失败',
        variant: 'destructive'
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await apiService.notificationActions({
        action: 'markAllRead'
      })

      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ 
            ...notification, 
            isRead: true, 
            readAt: new Date().toISOString() 
          }))
        )
        setUnreadCount(0)
        
        toast({
          title: '操作成功',
          description: '所有通知已标记为已读'
        })
      } else {
        throw new Error(response.error || '操作失败')
      }
    } catch (error) {
      console.error('全部标记已读错误:', error)
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '全部标记已读失败',
        variant: 'destructive'
      })
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await apiService.notificationActions({
        action: 'delete',
        notificationIds: [notificationId]
      })

      if (response.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        
        toast({
          title: '删除成功',
          description: '通知已删除'
        })
      } else {
        throw new Error(response.error || '删除失败')
      }
    } catch (error) {
      console.error('删除通知错误:', error)
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '删除通知失败',
        variant: 'destructive'
      })
    }
  }

  const handleNotificationClick = (notification: CommunityNotification) => {
    // 如果未读，则标记为已读
    if (!notification.isRead) {
      markAsRead([notification.id])
    }

    // 根据通知类型跳转到相关页面
    if (notification.entityType === 'post' && notification.entityId) {
      window.open(`/community/posts/${notification.entityId}`, '_blank')
    }
  }

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications

  return (
    <AuthGuard>
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Bell className="w-8 h-8" />
              通知中心
            </h1>
            <p className="text-muted-foreground">查看和管理您的通知</p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                <Check className="w-4 h-4 mr-2" />
                全部标记已读
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">
              全部通知 ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              未读通知 ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Loading */}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">加载中...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">加载失败</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadNotifications}>重试</Button>
              </div>
            )}

            {/* Notifications List */}
            {!loading && !error && (
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      {activeTab === 'unread' ? '没有未读通知' : '暂无通知'}
                    </h3>
                    <p className="text-muted-foreground">
                      {activeTab === 'unread' 
                        ? '所有通知都已阅读完成' 
                        : '当有新的互动时，通知会显示在这里'
                      }
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card 
                      key={notification.id} 
                      className={`cursor-pointer hover:shadow-md transition-all ${
                        !notification.isRead ? 'ring-2 ring-primary/20' : ''
                      } ${getNotificationColor(notification.type)}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                                  {notification.title}
                                  {!notification.isRead && (
                                    <Badge variant="secondary" className="text-xs">
                                      新
                                    </Badge>
                                  )}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.content}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>{formatTimeAgo(notification.createdAt, locale)}</span>
                                  {notification.triggerUser && (
                                    <div className="flex items-center gap-1">
                                      <Avatar className="w-4 h-4">
                                        <AvatarImage 
                                          src={notification.triggerUser.avatar || "/placeholder.svg"} 
                                          alt={notification.triggerUser.name} 
                                        />
                                        <AvatarFallback className="text-xs">
                                          {notification.triggerUser.name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span>{notification.triggerUser.name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!notification.isRead && (
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        markAsRead([notification.id])
                                      }}
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      标记已读
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    删除
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}
