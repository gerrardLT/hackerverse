'use client'

import { useState, useEffect } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { notificationService, getNotificationIcon, formatNotificationTime } from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  // 加载通知
  const loadNotifications = async () => {
    try {
      setLoading(true)
      const result = await notificationService.loadNotifications({
        limit: 10,
        unreadOnly: false
      })
      setNotifications(result.notifications)
      setUnreadCount(result.unreadCount)
    } catch (error) {
      console.error('加载通知失败:', error)
      toast({
        title: '加载失败',
        description: '无法加载通知',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 标记通知为已读
  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      // 更新本地状态
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('标记已读失败:', error)
      toast({
        title: '操作失败',
        description: '无法标记通知为已读',
        variant: 'destructive'
      })
    }
  }

  // 标记所有为已读
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      toast({
        title: '成功',
        description: '所有通知已标记为已读'
      })
    } catch (error) {
      console.error('标记全部已读失败:', error)
      toast({
        title: '操作失败',
        description: '无法标记所有通知为已读',
        variant: 'destructive'
      })
    }
  }

  // 删除通知
  const deleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast({
        title: '成功',
        description: '通知已删除'
      })
    } catch (error) {
      console.error('删除通知失败:', error)
      toast({
        title: '操作失败',
        description: '无法删除通知',
        variant: 'destructive'
      })
    }
  }

  // 当下拉菜单打开时加载通知
  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open])

  // 初始加载未读数量
  useEffect(() => {
    loadNotifications()
  }, [])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
          <Bell className="h-4 w-4" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>通知</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              全部已读
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-64">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              暂无通知
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.read ? 'bg-muted/50' : ''
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start w-full">
                  <span className="mr-2 text-lg">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.actionUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = notification.actionUrl
                        }}
                      >
                        {notification.actionLabel || '查看详情'}
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notification.id)
                    }}
                  >
                    ×
                  </Button>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
        <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center cursor-pointer"
              onClick={() => window.location.href = '/notifications'}
            >
              查看全部通知
        </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
