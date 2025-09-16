'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Bell, Mail, Smartphone, Users, Trophy, MessageSquare, Settings, Save, RotateCcw, CheckCircle } from 'lucide-react'
import { 
  notificationService, 
  type NotificationSettings,
  defaultNotificationSettings 
} from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    const currentSettings = notificationService.getSettings()
    setSettings(currentSettings)
    setHasChanges(false)
  }

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // 模拟保存延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      notificationService.updateSettings(settings)
      setHasChanges(false)
      
      toast({
        title: '设置已保存',
        description: '你的通知偏好设置已成功更新',
      })
    } catch (error) {
      toast({
        title: '保存失败',
        description: '保存设置时出现错误，请重试',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(defaultNotificationSettings)
    setHasChanges(true)
    toast({
      title: '设置已重置',
      description: '所有设置已恢复为默认值',
    })
  }

  const settingSections = [
    {
      title: '通知方式',
      description: '选择你希望接收通知的方式',
      icon: Bell,
      settings: [
        {
          key: 'emailNotifications' as keyof NotificationSettings,
          label: '邮件通知',
          description: '通过邮件接收重要通知',
          icon: Mail
        },
        {
          key: 'pushNotifications' as keyof NotificationSettings,
          label: '推送通知',
          description: '在浏览器中接收实时推送通知',
          icon: Smartphone
        }
      ]
    },
    {
      title: '通知类型',
      description: '选择你想要接收的通知类型',
      icon: MessageSquare,
      settings: [
        {
          key: 'teamInvites' as keyof NotificationSettings,
          label: '团队邀请',
          description: '当有人邀请你加入团队时通知',
          icon: Users
        },
        {
          key: 'projectUpdates' as keyof NotificationSettings,
          label: '项目更新',
          description: '项目状态变更和评论通知',
          icon: MessageSquare
        },
        {
          key: 'hackathonReminders' as keyof NotificationSettings,
          label: '黑客松提醒',
          description: '黑客松开始、截止等重要时间提醒',
          icon: Trophy
        },
        {
          key: 'reviewNotifications' as keyof NotificationSettings,
          label: '评审通知',
          description: '项目评审结果和反馈通知',
          icon: CheckCircle
        },
        {
          key: 'prizeNotifications' as keyof NotificationSettings,
          label: '奖项通知',
          description: '获奖和奖金发放通知',
          icon: Trophy
        },
        {
          key: 'systemMessages' as keyof NotificationSettings,
          label: '系统消息',
          description: '平台更新和重要公告',
          icon: Settings
        }
      ]
    }
  ]

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">通知设置</h1>
              <p className="text-muted-foreground">
                自定义你的通知偏好设置
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/notifications">
                <Bell className="h-4 w-4 mr-2" />
                返回通知中心
              </Link>
            </Button>
          </div>
        </div>

        {/* 设置状态提示 */}
        {hasChanges && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">你有未保存的更改</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={loadSettings}>
                    取消更改
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? '保存中...' : '保存设置'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 设置区域 */}
        <div className="space-y-6">
          {settingSections.map((section, sectionIndex) => (
            <Card key={sectionIndex}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <section.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.settings.map((setting, settingIndex) => (
                  <div key={setting.key}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                          <setting.icon className="h-3 w-3" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={setting.key} className="text-sm font-medium">
                            {setting.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {setting.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={setting.key}
                          checked={settings[setting.key]}
                          onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
                        />
                        {settings[setting.key] && (
                          <Badge variant="default" className="text-xs">已启用</Badge>
                        )}
                      </div>
                    </div>
                    {settingIndex < section.settings.length - 1 && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 操作按钮 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">设置操作</h3>
                <p className="text-sm text-muted-foreground">
                  保存你的更改或重置为默认设置
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置默认
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? '保存中...' : '保存设置'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 帮助信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">通知说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  邮件通知
                </h4>
                <p className="text-sm text-muted-foreground">
                  重要通知将发送到你的注册邮箱，包括团队邀请、获奖通知等。
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  推送通知
                </h4>
                <p className="text-sm text-muted-foreground">
                  在浏览器中接收实时通知，需要授权浏览器通知权限。
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  团队通知
                </h4>
                <p className="text-sm text-muted-foreground">
                  包括团队邀请、成员变更、团队项目更新等相关通知。
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  黑客松通知
                </h4>
                <p className="text-sm text-muted-foreground">
                  黑客松开始提醒、截止时间、评审结果等重要时间节点通知。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
