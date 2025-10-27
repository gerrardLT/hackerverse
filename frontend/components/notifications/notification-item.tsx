'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Check, X, Trash2, ExternalLink, Clock, Users, Trophy, Bell, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { 
  type Notification, 
  formatNotificationTime, 
  getNotificationIcon, 
  getNotificationColor 
} from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  compact?: boolean
}

export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  compact = false 
}: NotificationItemProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleAcceptInvite = async () => {
    setIsProcessing(true)
    try {
      // 模拟接受邀请的API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: '邀请已接受',
        description: `你已成功加入 ${notification.data?.teamName} 团队`,
      })
      
      onMarkAsRead(notification.id)
    } catch (error) {
      toast({
        title: '操作失败',
        description: '接受邀请时出现错误，请重试',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectInvite = async () => {
    setIsProcessing(true)
    try {
      // 模拟拒绝邀请的API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: '邀请已拒绝',
        description: `你已拒绝加入 ${notification.data?.teamName} 团队`,
      })
      
      onMarkAsRead(notification.id)
    } catch (error) {
      toast({
        title: '操作失败',
        description: '拒绝邀请时出现错误，请重试',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getPriorityIcon = () => {
    switch (notification.priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getCategoryIcon = () => {
    switch (notification.category) {
      case 'team':
        return <Users className="h-4 w-4" />
      case 'hackathon':
        return <Trophy className="h-4 w-4" />
      case 'system':
        return <Bell className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  if (compact) {
    return (
      <div className={`p-3 border-l-4 ${
        !notification.read 
          ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20' 
          : 'border-l-gray-200 dark:border-l-gray-700'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">{getNotificationIcon(notification.type)}</span>
              {getPriorityIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium truncate">{notification.title}</h4>
                {!notification.read && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                )}
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {notification.message}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatNotificationTime(notification.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  {getCategoryIcon()}
                  <span className="capitalize">{notification.category}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 ml-2">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(notification.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 团队邀请的操作按钮 */}
        {notification.type === 'team_invite' && !notification.read && (
          <div className="flex gap-2 mt-3 ml-8">
            <Button
              size="sm"
              disabled={isProcessing}
              onClick={handleAcceptInvite}
            >
              {isProcessing ? '处理中...' : '接受邀请'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isProcessing}
              onClick={handleRejectInvite}
            >
              拒绝
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={`border-border/50 hover:border-primary/50 hover:shadow-md transition-all duration-300 hover-lift ${
      !notification.read 
        ? 'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10' 
        : ''
    }`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          {/* 左侧：图标+内容 */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* 图标 */}
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 shrink-0">
              <span className="text-base">{getNotificationIcon(notification.type)}</span>
            </div>
            
            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-sm font-semibold truncate">{notification.title}</h4>
                {!notification.read && (
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                )}
                {notification.priority === 'high' && (
                  <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
                )}
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                {notification.message}
              </p>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatNotificationTime(notification.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  {getCategoryIcon()}
                  <span className="capitalize">{notification.category}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-1 shrink-0">
            {notification.type === 'team_invite' && !notification.read && (
              <>
                <Button
                  size="sm"
                  disabled={isProcessing}
                  onClick={handleAcceptInvite}
                  className="h-7 text-xs px-2"
                >
                  {isProcessing ? '...' : '接受'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isProcessing}
                  onClick={handleRejectInvite}
                  className="h-7 text-xs px-2"
                >
                  拒绝
                </Button>
              </>
            )}
            
            {notification.actionUrl && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                <Link href={notification.actionUrl}>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            )}

            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(notification.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
