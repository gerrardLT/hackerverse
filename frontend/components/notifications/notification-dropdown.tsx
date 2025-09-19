'use client'

import { useState, useEffect } from 'react'
import { Bell, Loader2, AlertCircle } from 'lucide-react'
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
import { useNotificationStore } from '@/stores/notification-store'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useLocale } from 'next-intl'
import { useEnumTranslations } from '@/lib/enum-utils'

// 通知工具函数
function getNotificationIcon(type: string) {
  switch (type) {
    // 团队相关
    case 'TEAM_INVITE':
    case 'team_invite':
      return '👥'
    case 'TEAM_APPLICATION_APPROVED':
      return '✅'
    case 'TEAM_APPLICATION_REJECTED':
      return '❌'
    case 'TEAM_MEMBER_JOINED':
      return '👋'
    case 'TEAM_STATUS_CHANGED':
      return '🔄'
    
    // 黑客松相关
    case 'HACKATHON_STARTING':
    case 'HACKATHON_ENDING':
    case 'HACKATHON_REGISTRATION_REMINDER':
    case 'HACKATHON_SUBMISSION_REMINDER':
    case 'hackathon_reminder':
      return '⏰'
    case 'HACKATHON_STARTED':
    case 'HACKATHON_ENDED':
      return '🏁'
    case 'HACKATHON_RESULTS_ANNOUNCED':
    case 'PRIZE_AWARDED':
    case 'prize_awarded':
      return '🏆'
    
    // 项目相关
    case 'PROJECT_LIKED':
      return '❤️'
    case 'PROJECT_COMMENTED':
      return '💬'
    case 'PROJECT_REVIEWED':
    case 'review_complete':
      return '✅'
    case 'PROJECT_STATUS_CHANGED':
    case 'project_update':
      return '📝'
    
    // 社区相关
    case 'COMMUNITY_POST_REPLIED':
    case 'COMMUNITY_POST_LIKED':
    case 'COMMUNITY_REPLY_LIKED':
      return '💬'
    case 'COMMUNITY_NEW_FOLLOWER':
    case 'COMMUNITY_FOLLOWER_POST':
      return '👤'
    
    // 系统相关
    case 'SYSTEM_ANNOUNCEMENT':
    case 'SYSTEM_MAINTENANCE':
    case 'SECURITY_ALERT':
    case 'FEATURE_UPDATE':
    case 'system_message':
      return '📢'
    case 'WELCOME_MESSAGE':
      return '🎉'
    
    default:
      return '📬'
  }
}

// 获取通知优先级样式
function getPriorityStyle(priority?: string) {
  switch (priority) {
    case 'URGENT':
      return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950'
    case 'HIGH':
      return 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950'
    case 'MEDIUM':
      return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950'
    case 'LOW':
      return 'border-l-4 border-gray-500 bg-gray-50 dark:bg-gray-950'
    default:
      return 'border-l-4 border-gray-300 bg-gray-50 dark:bg-gray-900'
  }
}

// 获取通知分类颜色
function getCategoryColor(category?: string) {
  switch (category) {
    case 'TEAM':
      return 'text-blue-600 dark:text-blue-400'
    case 'HACKATHON':
      return 'text-purple-600 dark:text-purple-400'
    case 'PROJECT':
      return 'text-green-600 dark:text-green-400'
    case 'COMMUNITY':
      return 'text-pink-600 dark:text-pink-400'
    case 'SYSTEM':
      return 'text-gray-600 dark:text-gray-400'
    default:
      return 'text-gray-500 dark:text-gray-400'
  }
}

// 获取通知分类标签
function getCategoryLabel(category?: string) {
  switch (category) {
    case 'TEAM':
      return '团队'
    case 'HACKATHON':
      return '黑客松'
    case 'PROJECT':
      return '项目'
    case 'COMMUNITY':
      return '社区'
    case 'SYSTEM':
      return '系统'
    default:
      return '通知'
  }
}

function formatNotificationTime(createdAt: string, locale: string = 'zh'): string {
  const now = new Date()
  const notificationTime = new Date(createdAt)
  const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {
    return locale === 'zh' ? '刚刚' : 'Just now'
  } else if (diffInMinutes < 60) {
    return locale === 'zh' 
      ? `${diffInMinutes} 分钟前` 
      : `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60)
    return locale === 'zh' 
      ? `${hours} 小时前` 
      : `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diffInMinutes / 1440)
    return locale === 'zh' 
      ? `${days} 天前` 
      : `${days} day${days > 1 ? 's' : ''} ago`
  }
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const locale = useLocale()
  const enumT = useEnumTranslations()
  
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    isInitialized,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    clearError
  } = useNotificationStore()

  // 当下拉菜单打开时刷新通知
  useEffect(() => {
    if (open && isAuthenticated && isInitialized) {
      refreshNotifications().catch(error => {
        console.error('刷新通知失败:', error)
      })
    }
  }, [open, isAuthenticated, isInitialized, refreshNotifications])

  // 处理标记已读
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
    } catch (error) {
      toast({
        title: '操作失败',
        description: '无法标记通知为已读',
        variant: 'destructive'
      })
    }
  }

  // 处理标记全部已读
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast({
        title: '成功',
        description: '所有通知已标记为已读'
      })
    } catch (error) {
      toast({
        title: '操作失败',
        description: '无法标记所有通知为已读',
        variant: 'destructive'
      })
    }
  }

  // 处理删除通知
  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id)
      toast({
        title: '成功',
        description: '通知已删除'
      })
    } catch (error) {
      toast({
        title: '操作失败',
        description: '无法删除通知',
        variant: 'destructive'
      })
    }
  }

  // 处理错误重试
  const handleRetry = () => {
    clearError()
    if (isAuthenticated) {
      refreshNotifications()
    }
  }

  // 如果用户未认证，不显示通知按钮
  if (!isAuthenticated) {
    return null
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : error ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
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
              onClick={handleMarkAllAsRead}
              className="text-xs"
              disabled={isLoading}
            >
              全部已读
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-64">
          {error ? (
            <div className="flex flex-col items-center justify-center p-4 space-y-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-center text-muted-foreground">
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
              >
                重试
              </Button>
            </div>
          ) : isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              暂无通知
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.read ? 'bg-muted/50' : ''
                } ${getPriorityStyle(notification.priority)}`}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
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
                        {formatNotificationTime(notification.createdAt, locale)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    {/* 优先级和分类标识 */}
                    <div className="flex items-center gap-2 mt-1">
                      {(notification.priority === 'URGENT' || notification.priority === 'HIGH') && (
                        <Badge 
                          variant={notification.priority === 'URGENT' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {notification.priority === 'URGENT' ? '🚨 紧急' : '⚡ 重要'}
                        </Badge>
                      )}
                      {notification.category && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getCategoryColor(notification.category)}`}
                        >
                          {getCategoryLabel(notification.category)}
                        </Badge>
                      )}
                    </div>
                    
                    {notification.actionUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = notification.actionUrl!
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
                      handleDeleteNotification(notification.id)
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
