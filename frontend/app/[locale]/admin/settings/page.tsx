'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  Settings, 
  Globe, 
  Shield, 
  Database, 
  Mail, 
  Bell, 
  Palette, 
  Code, 
  Save, 
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'

interface SystemSettings {
  // 基础设置
  siteName: string
  siteDescription: string
  siteUrl: string
  adminEmail: string
  
  // 功能开关
  registrationEnabled: boolean
  hackathonCreationEnabled: boolean
  web3Enabled: boolean
  ipfsEnabled: boolean
  notificationsEnabled: boolean
  
  // 安全设置
  requireEmailVerification: boolean
  enableCaptcha: boolean
  maxLoginAttempts: number
  sessionTimeout: number
  
  // 邮件设置
  emailProvider: string
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  emailFromAddress: string
  emailFromName: string
  
  // 通知设置
  enablePushNotifications: boolean
  enableEmailNotifications: boolean
  enableSlackIntegration: boolean
  slackWebhookUrl: string
  
  // 主题设置
  primaryColor: string
  secondaryColor: string
  darkModeEnabled: boolean
  customCss: string
  
  // IPFS设置
  ipfsGateway: string
  pinataApiKey: string
  pinataSecretKey: string
  
  // Web3设置
  defaultChainId: number
  rpcEndpoint: string
  contractAddress: string
  
  // 性能设置
  cacheTTL: number
  maxFileSize: number
  enableCDN: boolean
  cdnUrl: string
}

interface SystemStatus {
  database: 'healthy' | 'warning' | 'error'
  storage: 'healthy' | 'warning' | 'error'
  api: 'healthy' | 'warning' | 'error'
  blockchain: 'healthy' | 'warning' | 'error'
  ipfs: 'healthy' | 'warning' | 'error'
  email: 'healthy' | 'warning' | 'error'
}

export default function AdminSettingsPage() {
  const t = useTranslations('admin.settings')
  const tCommon = useTranslations('common')
  const { toast } = useToast()

  const [settings, setSettings] = useState<Partial<SystemSettings>>({})
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  // 模拟加载系统设置
  const loadSettings = async () => {
    try {
      setLoading(true)
      
      // 模拟默认设置（在实际项目中这里会调用API）
      const defaultSettings: SystemSettings = {
        siteName: 'HackX Platform',
        siteDescription: '全球领先的去中心化黑客松平台',
        siteUrl: 'https://hackx.dev',
        adminEmail: 'admin@hackx.dev',
        
        registrationEnabled: true,
        hackathonCreationEnabled: true,
        web3Enabled: true,
        ipfsEnabled: true,
        notificationsEnabled: true,
        
        requireEmailVerification: true,
        enableCaptcha: false,
        maxLoginAttempts: 5,
        sessionTimeout: 7200,
        
        emailProvider: 'smtp',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        emailFromAddress: 'noreply@hackx.dev',
        emailFromName: 'HackX Platform',
        
        enablePushNotifications: true,
        enableEmailNotifications: true,
        enableSlackIntegration: false,
        slackWebhookUrl: '',
        
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        darkModeEnabled: true,
        customCss: '',
        
        ipfsGateway: 'https://ipfs.io/ipfs/',
        pinataApiKey: '',
        pinataSecretKey: '',
        
        defaultChainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97'),
        rpcEndpoint: process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x...',
        
        cacheTTL: 3600,
        maxFileSize: 10485760,
        enableCDN: false,
        cdnUrl: ''
      }
      
      setSettings(defaultSettings)
      
      // 加载系统状态
      const statusResponse = await apiService.get('/admin/system-status')
      if (statusResponse.success) {
        setSystemStatus((statusResponse.data as any) || {
          database: 'healthy',
          storage: 'healthy',
          api: 'healthy',
          blockchain: 'warning',
          ipfs: 'healthy',
          email: 'warning'
        })
      }
      
    } catch (error) {
      console.error('加载系统设置失败:', error)
      toast({
        title: t('loadError'),
        description: t('loadErrorDesc'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 保存设置
  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      
      // 在实际项目中这里会调用API保存设置
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: t('saveSuccess'),
        description: t('saveSuccessDesc')
      })
    } catch (error) {
      console.error('保存设置失败:', error)
      toast({
        title: t('saveError'),
        description: t('saveErrorDesc'),
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  // 获取状态颜色和图标
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'healthy':
        return { 
          color: 'text-green-500', 
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          icon: CheckCircle,
          text: t('status.healthy')
        }
      case 'warning':
        return { 
          color: 'text-yellow-500', 
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          icon: AlertTriangle,
          text: t('status.warning')
        }
      case 'error':
        return { 
          color: 'text-red-500', 
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          icon: AlertTriangle,
          text: t('status.error')
        }
      default:
        return { 
          color: 'text-gray-500', 
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          icon: Info,
          text: t('status.unknown')
        }
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('description')}
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? t('saving') : t('saveSettings')}
        </Button>
      </div>

      {/* 系统状态概览 */}
      {systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('systemStatus.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(systemStatus).map(([key, status]) => {
                const config = getStatusConfig(status)
                const Icon = config.icon
                return (
                  <div key={key} className={`p-4 rounded-lg ${config.bgColor}`}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${config.color}`} />
                      <div>
                        <div className="font-medium">{t(`systemStatus.${key}`)}</div>
                        <div className={`text-sm ${config.color}`}>{config.text}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 设置标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('tabs.general')}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('tabs.security')}
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            {t('tabs.integrations')}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t('tabs.appearance')}
          </TabsTrigger>
        </TabsList>

        {/* 基础设置 */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t('general.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">{t('general.siteName')}</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName || ''}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">{t('general.siteUrl')}</Label>
                  <Input
                    id="siteUrl"
                    value={settings.siteUrl || ''}
                    onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">{t('general.siteDescription')}</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription || ''}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">{t('general.adminEmail')}</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={settings.adminEmail || ''}
                  onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('general.features')}</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="registrationEnabled">{t('general.registrationEnabled')}</Label>
                      <p className="text-sm text-muted-foreground">{t('general.registrationEnabledDesc')}</p>
                    </div>
                    <Switch
                      id="registrationEnabled"
                      checked={settings.registrationEnabled || false}
                      onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="hackathonCreationEnabled">{t('general.hackathonCreationEnabled')}</Label>
                      <p className="text-sm text-muted-foreground">{t('general.hackathonCreationEnabledDesc')}</p>
                    </div>
                    <Switch
                      id="hackathonCreationEnabled"
                      checked={settings.hackathonCreationEnabled || false}
                      onCheckedChange={(checked) => setSettings({ ...settings, hackathonCreationEnabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="web3Enabled">{t('general.web3Enabled')}</Label>
                      <p className="text-sm text-muted-foreground">{t('general.web3EnabledDesc')}</p>
                    </div>
                    <Switch
                      id="web3Enabled"
                      checked={settings.web3Enabled || false}
                      onCheckedChange={(checked) => setSettings({ ...settings, web3Enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ipfsEnabled">{t('general.ipfsEnabled')}</Label>
                      <p className="text-sm text-muted-foreground">{t('general.ipfsEnabledDesc')}</p>
                    </div>
                    <Switch
                      id="ipfsEnabled"
                      checked={settings.ipfsEnabled || false}
                      onCheckedChange={(checked) => setSettings({ ...settings, ipfsEnabled: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全设置 */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>{t('security.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireEmailVerification">{t('security.requireEmailVerification')}</Label>
                    <p className="text-sm text-muted-foreground">{t('security.requireEmailVerificationDesc')}</p>
                  </div>
                  <Switch
                    id="requireEmailVerification"
                    checked={settings.requireEmailVerification || false}
                    onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableCaptcha">{t('security.enableCaptcha')}</Label>
                    <p className="text-sm text-muted-foreground">{t('security.enableCaptchaDesc')}</p>
                  </div>
                  <Switch
                    id="enableCaptcha"
                    checked={settings.enableCaptcha || false}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableCaptcha: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">{t('security.maxLoginAttempts')}</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxLoginAttempts || 5}
                    onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-muted-foreground">{t('security.maxLoginAttemptsDesc')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">{t('security.sessionTimeout')}</Label>
                  <Select
                    value={settings.sessionTimeout?.toString() || '7200'}
                    onValueChange={(value) => setSettings({ ...settings, sessionTimeout: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1800">30 {t('security.minutes')}</SelectItem>
                      <SelectItem value="3600">1 {t('security.hour')}</SelectItem>
                      <SelectItem value="7200">2 {t('security.hours')}</SelectItem>
                      <SelectItem value="14400">4 {t('security.hours')}</SelectItem>
                      <SelectItem value="28800">8 {t('security.hours')}</SelectItem>
                      <SelectItem value="86400">24 {t('security.hours')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">{t('security.sessionTimeoutDesc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 集成设置 */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            {/* 邮件设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {t('integrations.email.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emailFromAddress">{t('integrations.email.fromAddress')}</Label>
                    <Input
                      id="emailFromAddress"
                      type="email"
                      value={settings.emailFromAddress || ''}
                      onChange={(e) => setSettings({ ...settings, emailFromAddress: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailFromName">{t('integrations.email.fromName')}</Label>
                    <Input
                      id="emailFromName"
                      value={settings.emailFromName || ''}
                      onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">{t('integrations.email.smtpHost')}</Label>
                    <Input
                      id="smtpHost"
                      value={settings.smtpHost || ''}
                      onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">{t('integrations.email.smtpPort')}</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.smtpPort || 587}
                      onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">{t('integrations.email.smtpUser')}</Label>
                    <Input
                      id="smtpUser"
                      value={settings.smtpUser || ''}
                      onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">{t('integrations.email.smtpPassword')}</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={settings.smtpPassword || ''}
                    onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 通知设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  {t('integrations.notifications.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('integrations.notifications.emailEnabled')}</Label>
                    <p className="text-sm text-muted-foreground">{t('integrations.notifications.emailEnabledDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.enableEmailNotifications || false}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableEmailNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('integrations.notifications.pushEnabled')}</Label>
                    <p className="text-sm text-muted-foreground">{t('integrations.notifications.pushEnabledDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.enablePushNotifications || false}
                    onCheckedChange={(checked) => setSettings({ ...settings, enablePushNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('integrations.notifications.slackEnabled')}</Label>
                      <p className="text-sm text-muted-foreground">{t('integrations.notifications.slackEnabledDesc')}</p>
                    </div>
                    <Switch
                      checked={settings.enableSlackIntegration || false}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableSlackIntegration: checked })}
                    />
                  </div>

                  {settings.enableSlackIntegration && (
                    <div className="space-y-2">
                      <Label htmlFor="slackWebhookUrl">{t('integrations.notifications.slackWebhookUrl')}</Label>
                      <Input
                        id="slackWebhookUrl"
                        value={settings.slackWebhookUrl || ''}
                        onChange={(e) => setSettings({ ...settings, slackWebhookUrl: e.target.value })}
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Web3 & IPFS 设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  {t('integrations.web3.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultChainId">{t('integrations.web3.chainId')}</Label>
                    <Select
                      value={settings.defaultChainId?.toString() || '97'}
                      onValueChange={(value) => setSettings({ ...settings, defaultChainId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Ethereum Mainnet (1)</SelectItem>
                        <SelectItem value="56">BSC Mainnet (56)</SelectItem>
                        <SelectItem value="97">BSC Testnet (97)</SelectItem>
                        <SelectItem value="137">Polygon (137)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rpcEndpoint">{t('integrations.web3.rpcEndpoint')}</Label>
                    <Input
                      id="rpcEndpoint"
                      value={settings.rpcEndpoint || ''}
                      onChange={(e) => setSettings({ ...settings, rpcEndpoint: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractAddress">{t('integrations.web3.contractAddress')}</Label>
                  <Input
                    id="contractAddress"
                    value={settings.contractAddress || ''}
                    onChange={(e) => setSettings({ ...settings, contractAddress: e.target.value })}
                    placeholder="0x..."
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">{t('integrations.ipfs.title')}</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ipfsGateway">{t('integrations.ipfs.gateway')}</Label>
                    <Input
                      id="ipfsGateway"
                      value={settings.ipfsGateway || ''}
                      onChange={(e) => setSettings({ ...settings, ipfsGateway: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pinataApiKey">{t('integrations.ipfs.pinataApiKey')}</Label>
                      <Input
                        id="pinataApiKey"
                        type="password"
                        value={settings.pinataApiKey || ''}
                        onChange={(e) => setSettings({ ...settings, pinataApiKey: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pinataSecretKey">{t('integrations.ipfs.pinataSecretKey')}</Label>
                      <Input
                        id="pinataSecretKey"
                        type="password"
                        value={settings.pinataSecretKey || ''}
                        onChange={(e) => setSettings({ ...settings, pinataSecretKey: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 外观设置 */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t('appearance.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">{t('appearance.primaryColor')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor || '#007bff'}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.primaryColor || '#007bff'}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">{t('appearance.secondaryColor')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.secondaryColor || '#6c757d'}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.secondaryColor || '#6c757d'}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('appearance.darkModeEnabled')}</Label>
                  <p className="text-sm text-muted-foreground">{t('appearance.darkModeEnabledDesc')}</p>
                </div>
                <Switch
                  checked={settings.darkModeEnabled || false}
                  onCheckedChange={(checked) => setSettings({ ...settings, darkModeEnabled: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="customCss">{t('appearance.customCss')}</Label>
                <Textarea
                  id="customCss"
                  value={settings.customCss || ''}
                  onChange={(e) => setSettings({ ...settings, customCss: e.target.value })}
                  rows={8}
                  placeholder="/* 在这里添加自定义CSS样式 */\n.custom-class {\n  /* 你的样式 */\n}"
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">{t('appearance.customCssDesc')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
