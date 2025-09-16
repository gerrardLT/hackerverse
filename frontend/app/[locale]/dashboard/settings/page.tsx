'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { User, Settings, Shield, Bell, Palette } from 'lucide-react'

interface UserSettings {
  username?: string
  bio?: string
  avatarUrl?: string
  notificationSettings: {
    email: boolean
    push: boolean
    sms: boolean
    teamInvites: boolean
    projectUpdates: boolean
    hackathonReminders: boolean
  }
  privacySettings: {
    profileVisibility: 'public' | 'private' | 'friends'
    showEmail: boolean
    showWalletAddress: boolean
  }
}

export default function SettingsPage() {
  const { user, updateProfile, loading } = useAuth()
  const { toast } = useToast()
  const [settings, setSettings] = useState<UserSettings>({
    username: '',
    bio: '',
    avatarUrl: '',
    notificationSettings: {
      email: true,
      push: true,
      sms: false,
      teamInvites: true,
      projectUpdates: true,
      hackathonReminders: true,
    },
    privacySettings: {
      profileVisibility: 'public',
      showEmail: false,
      showWalletAddress: true,
    },
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setSettings({
        username: user.username || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
        notificationSettings: user.notificationSettings || {
          email: true,
          push: true,
          sms: false,
          teamInvites: true,
          projectUpdates: true,
          hackathonReminders: true,
        },
        privacySettings: user.privacySettings || {
          profileVisibility: 'public',
          showEmail: false,
          showWalletAddress: true,
        },
      })
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const result = await updateProfile({
        username: settings.username,
        bio: settings.bio,
        avatarUrl: settings.avatarUrl,
        notificationSettings: settings.notificationSettings,
        privacySettings: settings.privacySettings,
      })

      if (result.success) {
        toast({
          title: "保存成功",
          description: "个人信息已更新",
        })
      } else {
        toast({
          title: "保存失败",
          description: result.error || "更新失败，请稍后重试",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "保存失败",
        description: "更新失败，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [key]: value,
      },
    }))
  }

  const handlePrivacyChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [key]: value,
      },
    }))
  }

  if (!user) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">请先登录</h1>
          <p className="text-muted-foreground">登录后才能访问设置页面</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-3xl font-bold">设置</h1>
          <p className="text-muted-foreground">管理你的账户设置和偏好</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              个人信息
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              通知设置
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              隐私设置
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              外观设置
            </TabsTrigger>
          </TabsList>

          {/* 个人信息设置 */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>个人信息</CardTitle>
                <CardDescription>
                  更新你的个人资料信息，这些信息将显示在你的个人资料页面上
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 头像 */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={settings.avatarUrl || '/placeholder.svg'} />
                    <AvatarFallback className="text-lg">
                      {settings.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">头像链接</Label>
                    <Input
                      id="avatarUrl"
                      placeholder="https://example.com/avatar.jpg"
                      value={settings.avatarUrl}
                      onChange={(e) => setSettings(prev => ({ ...prev, avatarUrl: e.target.value }))}
                    />
                  </div>
                </div>

                {/* 用户名 */}
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    placeholder="输入用户名"
                    value={settings.username}
                    onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>

                {/* 个人简介 */}
                <div className="space-y-2">
                  <Label htmlFor="bio">个人简介</Label>
                  <Textarea
                    id="bio"
                    placeholder="介绍一下你自己..."
                    value={settings.bio}
                    onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                  />
                </div>

                {/* 钱包地址（只读） */}
                {user.walletAddress && (
                  <div className="space-y-2">
                    <Label>钱包地址</Label>
                    <Input
                      value={user.walletAddress}
                      readOnly
                      className="bg-muted"
                    />
                    <p className="text-sm text-muted-foreground">
                      钱包地址已连接，无法在此修改
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving || loading}
                  className="w-full"
                >
                  {isSaving ? "保存中..." : "保存个人信息"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 通知设置 */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>通知设置</CardTitle>
                <CardDescription>
                  管理你接收通知的方式和类型
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>邮件通知</Label>
                      <p className="text-sm text-muted-foreground">
                        接收重要的邮件通知
                      </p>
                    </div>
                    <Switch
                      checked={settings.notificationSettings.email}
                      onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>推送通知</Label>
                      <p className="text-sm text-muted-foreground">
                        接收浏览器推送通知
                      </p>
                    </div>
                    <Switch
                      checked={settings.notificationSettings.push}
                      onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>短信通知</Label>
                      <p className="text-sm text-muted-foreground">
                        接收短信通知（需要绑定手机号）
                      </p>
                    </div>
                    <Switch
                      checked={settings.notificationSettings.sms}
                      onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>团队邀请</Label>
                      <p className="text-sm text-muted-foreground">
                        接收团队邀请通知
                      </p>
                    </div>
                    <Switch
                      checked={settings.notificationSettings.teamInvites}
                      onCheckedChange={(checked) => handleNotificationChange('teamInvites', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>项目更新</Label>
                      <p className="text-sm text-muted-foreground">
                        接收项目相关更新通知
                      </p>
                    </div>
                    <Switch
                      checked={settings.notificationSettings.projectUpdates}
                      onCheckedChange={(checked) => handleNotificationChange('projectUpdates', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>黑客松提醒</Label>
                      <p className="text-sm text-muted-foreground">
                        接收黑客松开始和截止提醒
                      </p>
                    </div>
                    <Switch
                      checked={settings.notificationSettings.hackathonReminders}
                      onCheckedChange={(checked) => handleNotificationChange('hackathonReminders', checked)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving || loading}
                  className="w-full"
                >
                  {isSaving ? "保存中..." : "保存通知设置"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 隐私设置 */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>隐私设置</CardTitle>
                <CardDescription>
                  控制你的个人信息对其他用户的可见性
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>个人资料可见性</Label>
                    <Select
                      value={settings.privacySettings.profileVisibility}
                      onValueChange={(value: 'public' | 'private' | 'friends') => 
                        handlePrivacyChange('profileVisibility', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">公开</SelectItem>
                        <SelectItem value="friends">仅好友</SelectItem>
                        <SelectItem value="private">私密</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>显示邮箱地址</Label>
                      <p className="text-sm text-muted-foreground">
                        允许其他用户查看你的邮箱地址
                      </p>
                    </div>
                    <Switch
                      checked={settings.privacySettings.showEmail}
                      onCheckedChange={(checked) => handlePrivacyChange('showEmail', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>显示钱包地址</Label>
                      <p className="text-sm text-muted-foreground">
                        允许其他用户查看你的钱包地址
                      </p>
                    </div>
                    <Switch
                      checked={settings.privacySettings.showWalletAddress}
                      onCheckedChange={(checked) => handlePrivacyChange('showWalletAddress', checked)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving || loading}
                  className="w-full"
                >
                  {isSaving ? "保存中..." : "保存隐私设置"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 外观设置 */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>外观设置</CardTitle>
                <CardDescription>
                  自定义你的界面外观
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>主题模式</Label>
                    <Select defaultValue="system">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">浅色模式</SelectItem>
                        <SelectItem value="dark">深色模式</SelectItem>
                        <SelectItem value="system">跟随系统</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>语言</Label>
                    <Select defaultValue="zh-CN">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zh-CN">简体中文</SelectItem>
                        <SelectItem value="en-US">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={() => toast({
                    title: "功能开发中",
                    description: "外观设置功能正在开发中",
                  })} 
                  className="w-full"
                >
                  保存外观设置
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
