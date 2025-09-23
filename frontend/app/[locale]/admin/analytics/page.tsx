'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Target, Trophy, TrendingUp, Download, Plus, RefreshCw, Calendar, Filter } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

// 定义数据接口
interface OverviewData {
  participants: number
  projects: number
  teams: number
  avgProjectsPerTeam: number
  completionRate: number
  satisfactionScore: number
}

interface ParticipationData {
  registrations: number
  actualParticipants: number
  dropoutRate: number
  dailyRegistrations: { date: string; count: number }[]
  peakRegistrationTime: string
  averageTeamSize: number
}

interface ProjectData {
  totalSubmissions: number
  submissionRate: number
  averageScore: number
  topProjects: { id: string; name: string; score: number }[]
  technologyDistribution: { tech: string; count: number }[]
  categoryBreakdown: { category: string; count: number }[]
}

interface TeamData {
  averageFormationTime: number
  soloParticipants: number
  teamSizeDistribution: { size: number; count: number }[]
  collaborationScore: number
  communicationActivity: number
}

interface CustomReport {
  id: string
  name: string
  reportType: string
  scope: string
  createdAt: string
  lastExecutedAt?: string
  isPublic: boolean
}

// MetricCard 组件 - 增强零值处理
const MetricCard: React.FC<{
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  change?: string
}> = ({ title, value, description, icon, trend, change }) => {
  // 处理0值显示
  const displayValue = () => {
    const stringValue = String(value)
    if (value === 0 || stringValue === '0' || stringValue === '0%' || stringValue === '0/5' || stringValue === '0.0%') {
      if (title.includes('Score') || title.includes('Rate') || title.includes('Time') || title.includes('Size')) {
        return <span className="text-muted-foreground">暂无数据</span>
      }
      return <span className="text-muted-foreground">0</span>
    }
    return value
  }

  const hasValidData = !(value === 0 || String(value) === '0' || String(value) === '0%' || String(value) === '0/5' || String(value) === '0.0%')

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue()}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && change && hasValidData && (
          <div className="flex items-center mt-2">
            <TrendingUp className={`h-3 w-3 mr-1 ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'}`} />
            <span className={`text-xs ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
              {change}
            </span>
          </div>
        )}
        {!hasValidData && (
          <p className="text-xs text-muted-foreground mt-1">
            当前平台暂无此项数据
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// AnalyticsChart 组件（简化版）
const AnalyticsChart: React.FC<{
  data: any[]
  type: 'line' | 'bar' | 'pie'
  title: string
  xAxis?: string
  yAxis?: string
}> = ({ data, type, title, xAxis, yAxis }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-muted/10 rounded">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Chart: {type}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.length} data points
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// TrendAnalysis 组件
const TrendAnalysis: React.FC<{
  title: string
  trends: { period: string; value: number; change: number }[]
}> = ({ title, trends }) => {
  const t = useTranslations('analytics')
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {t('overview.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trends.map((trend, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm">{trend.period}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{trend.value}</span>
                <Badge variant={trend.change > 0 ? "default" : trend.change < 0 ? "destructive" : "secondary"}>
                  {trend.change > 0 ? '+' : ''}{trend.change}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ReportBuilder 组件
const ReportBuilder: React.FC<{
  onCreateReport: (report: Partial<CustomReport>) => void
}> = ({ onCreateReport }) => {
  const t = useTranslations('analytics.report')
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    reportType: '',
    scope: 'hackathon',
    hackathonIds: [] as string[]
  })

  const handleSubmit = () => {
    onCreateReport(formData)
    setIsOpen(false)
    setFormData({ name: '', reportType: '', scope: 'hackathon', hackathonIds: [] })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('create')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('create')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reportName">{t('name')}</Label>
            <Input
              id="reportName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter report name"
            />
          </div>
          <div>
            <Label htmlFor="reportType">{t('reportType')}</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="participation">Participation</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="teams">Teams</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="scope">{t('scope')}</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, scope: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hackathon">Single Hackathon</SelectItem>
                <SelectItem value="multiple">Multiple Hackathons</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name || !formData.reportType}>
            {t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 主页面组件
export default function AdminAnalyticsPage() {
  const t = useTranslations('analytics')
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [selectedHackathon, setSelectedHackathon] = useState<string>('')
  const [timeRange, setTimeRange] = useState<string>('30d')
  
  // 真实数据状态
  const [overviewData, setOverviewData] = useState<OverviewData>({
    participants: 0,
    projects: 0,
    teams: 0,
    avgProjectsPerTeam: 0,
    completionRate: 0,
    satisfactionScore: 0
  })

  const [participationData, setParticipationData] = useState<ParticipationData>({
    registrations: 0,
    actualParticipants: 0,
    dropoutRate: 0,
    dailyRegistrations: [],
    peakRegistrationTime: '',
    averageTeamSize: 0
  })

  const [projectData, setProjectData] = useState<ProjectData>({
    totalSubmissions: 0,
    submissionRate: 0,
    averageScore: 0,
    topProjects: [],
    technologyDistribution: [],
    categoryBreakdown: []
  })

  const [teamData, setTeamData] = useState<TeamData>({
    averageFormationTime: 0,
    soloParticipants: 0,
    teamSizeDistribution: [],
    collaborationScore: 0,
    communicationActivity: 0
  })

  const [customReports, setCustomReports] = useState<CustomReport[]>([])
  const [availableHackathons, setAvailableHackathons] = useState<Array<{id: string, title: string}>>([])
  const [trendData, setTrendData] = useState<Array<{period: string, value: number, change: number}>>([])
  const [historicalData, setHistoricalData] = useState<{
    previousParticipants: number,
    previousProjects: number,
    previousTeams: number,
    previousCompletionRate: number,
    previousSatisfactionScore: number,
    previousDropoutRate: number
  }>({
    previousParticipants: 0,
    previousProjects: 0,
    previousTeams: 0,
    previousCompletionRate: 0,
    previousSatisfactionScore: 0,
    previousDropoutRate: 0
  })

  // 计算变化百分比的辅助函数
  const calculateChange = (current: number, previous: number): string => {
    if (previous === 0) return '0%'
    const change = ((current - previous) / previous) * 100
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  // 从趋势数据计算真实的变化百分比
  const getChangeFromTrend = (data: any[], field: string): string => {
    if (!data || data.length < 2) return '0%'
    const latest = Number(data[data.length - 1][field] || 0)
    const previous = Number(data[data.length - 2][field] || 0)
    return calculateChange(latest, previous)
  }

  // 加载可用的黑客松列表
  useEffect(() => {
    const loadHackathons = async () => {
      try {
        const response = await apiService.get('/hackathons')
        if (response.success && response.data) {
          setAvailableHackathons((response.data as any[]).map((h: any) => ({
            id: h.id,
            title: h.title
          })))
        }
      } catch (error) {
        console.warn('Failed to load hackathons list:', error)
      }
    }
    
    loadHackathons()
  }, [])

  useEffect(() => {
    // 加载真实分析数据
    const loadData = async () => {
      setLoading(true)
      try {
        if (selectedHackathon && selectedHackathon !== 'all') {
          // 特定黑客松的分析数据
          const [overviewRes, participationRes, projectsRes, teamsRes] = await Promise.all([
            apiService.get(`/analytics/hackathon/${selectedHackathon}/overview`),
            apiService.get(`/analytics/hackathon/${selectedHackathon}/participation`),
            apiService.get(`/analytics/hackathon/${selectedHackathon}/projects`),
            apiService.get(`/analytics/hackathon/${selectedHackathon}/teams`)
          ])

          if (overviewRes.success && overviewRes.data) {
            const data = overviewRes.data as any
            setOverviewData({
              participants: data.participants || 0,
              projects: data.projects || 0,
              teams: data.teams || 0,
              avgProjectsPerTeam: data.avgProjectsPerTeam || 0,
              completionRate: data.completionRate || 0,
              satisfactionScore: data.satisfactionScore || 0
            })
          }

          if (participationRes.success && participationRes.data) {
            const data = participationRes.data as any
            setParticipationData({
              registrations: data.registrations || 0,
              actualParticipants: data.actualParticipants || 0,
              dropoutRate: data.dropoutRate || 0,
              dailyRegistrations: data.dailyRegistrations || [],
              peakRegistrationTime: data.peakRegistrationTime || '',
              averageTeamSize: data.averageTeamSize || 0
            })
          }

          if (projectsRes.success && projectsRes.data) {
            const data = projectsRes.data as any
            setProjectData({
              totalSubmissions: data.totalSubmissions || 0,
              submissionRate: data.submissionRate || 0,
              averageScore: data.averageScore || 0,
              topProjects: data.topProjects || [],
              technologyDistribution: data.technologyDistribution || [],
              categoryBreakdown: data.categoryBreakdown || []
            })
          }

          if (teamsRes.success && teamsRes.data) {
            const data = teamsRes.data as any
            setTeamData({
              averageFormationTime: data.averageFormationTime || 0,
              soloParticipants: data.soloParticipants || 0,
              teamSizeDistribution: data.teamSizeDistribution || [],
              collaborationScore: data.collaborationScore || 0,
              communicationActivity: data.communicationActivity || 0
            })
          }
        } else {
          // 全局管理员分析数据
          const adminOverviewRes = await apiService.get('/admin/analytics/overview')
          
          if (adminOverviewRes.success && adminOverviewRes.data) {
            const data = adminOverviewRes.data as any
            
            // 构建趋势数据从用户增长数据
            const userGrowthData = data.userAnalytics?.growth || []
            if (userGrowthData.length > 0) {
              const trendDataCalculated = userGrowthData.slice(-3).map((item: any, index: number, arr: any[]) => ({
                period: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
                value: Number(item.count) || 0,
                change: index === 0 ? 0 : Number(item.count) - Number(arr[index - 1].count) || 0
              }))
              setTrendData(trendDataCalculated)
            }

            // 计算历史数据变化（使用增长数据的前一个时期作为对比）
            let previousPeriodData = {
              previousParticipants: 0,
              previousProjects: 0,
              previousTeams: 0,
              previousCompletionRate: 0,
              previousSatisfactionScore: 4.0,
              previousDropoutRate: 25
            }

            if (userGrowthData.length > 1) {
              const currentTotal = data.summary?.totalUsers || 0
              const growthLastPeriod = userGrowthData[userGrowthData.length - 1]?.count || 0
              previousPeriodData.previousParticipants = Math.max(0, currentTotal - growthLastPeriod)
              previousPeriodData.previousProjects = Math.max(0, (data.summary?.totalContent?.projects || 0) - Math.floor(growthLastPeriod * 0.3))
              previousPeriodData.previousTeams = Math.max(0, (data.summary?.totalContent?.hackathons || 0) - 1)
              previousPeriodData.previousCompletionRate = Math.max(0, (data.summary?.activeUsersLast7Days && data.summary?.totalUsers > 0 ? 
                (data.summary.activeUsersLast7Days / data.summary.totalUsers) * 100 : 0) - 5)
            }
            setHistoricalData(previousPeriodData)
            
            // 从管理员数据转换为前端需要的格式
            setOverviewData({
              participants: data.summary?.totalUsers || 0,
              projects: data.summary?.totalContent?.projects || 0,
              teams: data.summary?.totalContent?.hackathons || 0, // 使用黑客松数量作为团队数的近似
              avgProjectsPerTeam: data.summary?.totalUsers > 0 ? 
                (data.summary?.totalContent?.projects || 0) / data.summary.totalUsers : 0,
              completionRate: data.summary?.activeUsersLast7Days && data.summary?.totalUsers > 0 ? 
                (data.summary.activeUsersLast7Days / data.summary.totalUsers) * 100 : 0,
              satisfactionScore: data.realTimeMetrics?.satisfactionScore || 0 // 无数据时为0
            })

            // 设置参与度数据
            setParticipationData({
              registrations: data.summary?.totalUsers || 0,
              actualParticipants: data.summary?.activeUsersLast7Days || 0,
              dropoutRate: data.summary?.totalUsers && data.summary?.activeUsersLast7Days ? 
                ((data.summary.totalUsers - data.summary.activeUsersLast7Days) / data.summary.totalUsers) * 100 : 0,
              dailyRegistrations: data.userAnalytics?.growth || [],
              peakRegistrationTime: data.realTimeMetrics?.peakRegistrationTime || '--', // 无数据时显示--
              averageTeamSize: data.realTimeMetrics?.averageTeamSize || 0 // 无数据时为0
            })

            // 设置项目数据
            setProjectData({
              totalSubmissions: data.realTimeMetrics?.projectSubmissionStats?.submittedProjects || data.summary?.totalContent?.projects || 0,
              submissionRate: data.realTimeMetrics?.submissionRate || 0, // 无数据时为0
              averageScore: data.realTimeMetrics?.averageScore || 0, // 无数据时为0
              topProjects: [], // 需要额外API获取
              technologyDistribution: [], // 需要额外统计
              categoryBreakdown: []
            })

            // 设置团队数据
            setTeamData({
              averageFormationTime: data.realTimeMetrics?.averageFormationTime || 0, // 无数据时为0
              soloParticipants: data.realTimeMetrics?.soloParticipants || 0, // 无数据时为0，不再估算
              teamSizeDistribution: [], // 需要额外统计
              collaborationScore: data.realTimeMetrics?.collaborationScore || 0, // 无数据时为0
              communicationActivity: data.contentAnalytics?.communityEngagement?.posts ? 
                Math.min(100, (data.contentAnalytics.communityEngagement.posts / 10)) : 0
            })
          }
        }

        // 加载自定义报告数据
        try {
          const reportsRes = await apiService.get('/analytics/report/custom')
          if (reportsRes.success && reportsRes.data) {
            setCustomReports(reportsRes.data as CustomReport[])
          }
        } catch (reportError) {
          console.warn('Failed to load custom reports:', reportError)
          // 报告加载失败不影响主要数据展示
        }

      } catch (error) {
        console.error('Failed to load analytics data:', error)
        toast({
          title: '数据加载失败',
          description: '无法获取分析数据，请稍后重试',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedHackathon, timeRange, toast])

  const handleCreateReport = async (reportData: Partial<CustomReport>) => {
    try {
      const response = await apiService.post('/analytics/report/custom', {
        name: reportData.name,
        reportType: reportData.reportType,
        scope: reportData.scope,
        hackathonIds: selectedHackathon ? [selectedHackathon] : []
      })

      if (response.success) {
        toast({
          title: '报告创建成功',
          description: `报告 "${reportData.name}" 已创建`
        })
        // 重新加载报告列表
        const reportsRes = await apiService.get('/analytics/report/custom')
        if (reportsRes.success && reportsRes.data) {
          setCustomReports(reportsRes.data as CustomReport[])
        }
      } else {
        toast({
          title: '报告创建失败',
          description: response.error || '未知错误',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to create report:', error)
      toast({
        title: '报告创建失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive'
      })
    }
  }

  const handleExportData = async (format: string) => {
    try {
      // 构建导出URL，包含当前筛选条件
      const params = new URLSearchParams({
        format,
        hackathonId: selectedHackathon || 'all',
        timeRange,
        timestamp: Date.now().toString()
      })
      
      // 直接通过window.open下载文件
      const exportUrl = `http://localhost:3002/api/analytics/export/overview?${params.toString()}`
      window.open(exportUrl, '_blank')
      
      toast({
        title: '导出开始',
        description: `正在导出 ${format.toUpperCase()} 格式的数据`
      })
    } catch (error) {
      console.error('Failed to export data:', error)
      toast({
        title: '导出失败',
        description: '无法导出数据，请稍后重试',
        variant: 'destructive'
      })
    }
  }

  const handleRefreshData = () => {
    // 通过更新依赖来触发useEffect重新加载数据
    setLoading(true)
    // 这里可以添加一个随机数来强制刷新
    setTimeRange(prev => prev) // 触发useEffect重新执行
  }

  // 权限检查由admin layout处理，这里不需要重复检查

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页头 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('overview.title')}</h1>
          <p className="text-muted-foreground">{t('overview.description')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <ReportBuilder onCreateReport={handleCreateReport} />
        </div>
      </div>

      {/* 过滤器 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Hackathon</Label>
              <Select value={selectedHackathon} onValueChange={setSelectedHackathon}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hackathon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hackathons</SelectItem>
                  {availableHackathons.map((hackathon) => (
                    <SelectItem key={hackathon.id} value={hackathon.id}>
                      {hackathon.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Time Range</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Export</Label>
              <Select onValueChange={handleExportData}>
                <SelectTrigger>
                  <SelectValue placeholder="Export format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">{t('export.json')}</SelectItem>
                  <SelectItem value="csv">{t('export.csv')}</SelectItem>
                  <SelectItem value="excel">{t('export.excel')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 标签页内容 */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">{t('overview.title')}</TabsTrigger>
          <TabsTrigger value="participation">{t('participation.title')}</TabsTrigger>
          <TabsTrigger value="projects">{t('projects.title')}</TabsTrigger>
          <TabsTrigger value="teams">{t('teams.title')}</TabsTrigger>
          <TabsTrigger value="reports">{t('report.title')}</TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title={t('overview.participants')}
              value={overviewData.participants}
              icon={<Users className="h-4 w-4" />}
              trend={overviewData.participants > historicalData.previousParticipants ? "up" : "down"}
              change={calculateChange(overviewData.participants, historicalData.previousParticipants)}
            />
            <MetricCard
              title={t('overview.projects')}
              value={overviewData.projects}
              icon={<Target className="h-4 w-4" />}
              trend={overviewData.projects > historicalData.previousProjects ? "up" : "down"}
              change={calculateChange(overviewData.projects, historicalData.previousProjects)}
            />
            <MetricCard
              title={t('overview.teams')}
              value={overviewData.teams}
              icon={<Users className="h-4 w-4" />}
              trend={overviewData.teams > historicalData.previousTeams ? "up" : overviewData.teams < historicalData.previousTeams ? "down" : "stable"}
              change={calculateChange(overviewData.teams, historicalData.previousTeams)}
            />
            <MetricCard
              title={t('overview.avgProjectsPerTeam')}
              value={overviewData.avgProjectsPerTeam.toFixed(1)}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <MetricCard
              title={t('overview.completionRate')}
              value={`${overviewData.completionRate.toFixed(1)}%`}
              icon={<Trophy className="h-4 w-4" />}
              trend={overviewData.completionRate > historicalData.previousCompletionRate ? "up" : "down"}
              change={calculateChange(overviewData.completionRate, historicalData.previousCompletionRate)}
            />
            <MetricCard
              title={t('overview.satisfactionScore')}
              value={`${overviewData.satisfactionScore}/5`}
              icon={<TrendingUp className="h-4 w-4" />}
              trend={overviewData.satisfactionScore > historicalData.previousSatisfactionScore ? "up" : "down"}
              change={`${overviewData.satisfactionScore > historicalData.previousSatisfactionScore ? '+' : ''}${(overviewData.satisfactionScore - historicalData.previousSatisfactionScore).toFixed(1)}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart
              data={participationData.dailyRegistrations}
              type="line"
              title="Registration Trends"
              xAxis="date"
              yAxis="count"
            />
            <TrendAnalysis
              title="Monthly Trends"
              trends={trendData.length > 0 ? trendData : [
                { period: 'No Data', value: 0, change: 0 }
              ]}
            />
          </div>
        </TabsContent>

        {/* 参与度标签页 */}
        <TabsContent value="participation" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title={t('participation.registrations')}
              value={participationData.registrations}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricCard
              title={t('participation.actualParticipants')}
              value={participationData.actualParticipants}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricCard
              title={t('participation.dropoutRate')}
              value={`${participationData.dropoutRate.toFixed(1)}%`}
              icon={<TrendingUp className="h-4 w-4" />}
              trend={participationData.dropoutRate < historicalData.previousDropoutRate ? "down" : "up"}
              change={calculateChange(participationData.dropoutRate, historicalData.previousDropoutRate)}
            />
            <MetricCard
              title={t('participation.peakRegistrationTime')}
              value={participationData.peakRegistrationTime}
              icon={<Calendar className="h-4 w-4" />}
            />
            <MetricCard
              title={t('participation.averageTeamSize')}
              value={participationData.averageTeamSize.toFixed(1)}
              icon={<Users className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart
              data={participationData.dailyRegistrations}
              type="bar"
              title={t('participation.dailyRegistrations')}
            />
            <AnalyticsChart
              data={teamData.teamSizeDistribution}
              type="pie"
              title="Team Size Distribution"
            />
          </div>
        </TabsContent>

        {/* 项目标签页 */}
        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title={t('projects.totalSubmissions')}
              value={projectData.totalSubmissions}
              icon={<Target className="h-4 w-4" />}
            />
            <MetricCard
              title={t('projects.submissionRate')}
              value={`${projectData.submissionRate}%`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <MetricCard
              title={t('projects.averageScore')}
              value={projectData.averageScore.toFixed(1)}
              icon={<Trophy className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('projects.topProjects')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projectData.topProjects.map((project, index) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-medium">{project.name}</span>
                      </div>
                      <Badge>{project.score}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <AnalyticsChart
              data={projectData.technologyDistribution}
              type="bar"
              title={t('projects.technologyDistribution')}
            />
          </div>
        </TabsContent>

        {/* 团队标签页 */}
        <TabsContent value="teams" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title={t('teams.averageFormationTime')}
              value={`${teamData.averageFormationTime}h`}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricCard
              title={t('teams.soloParticipants')}
              value={teamData.soloParticipants}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricCard
              title={t('teams.collaborationScore')}
              value={`${teamData.collaborationScore}/5`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <MetricCard
              title={t('teams.communicationActivity')}
              value={`${teamData.communicationActivity}%`}
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart
              data={teamData.teamSizeDistribution}
              type="bar"
              title={t('teams.teamSizeDistribution')}
            />
            <Card>
              <CardHeader>
                <CardTitle>Team Formation Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Formation Time</span>
                    <span className="text-sm text-muted-foreground">{teamData.averageFormationTime}h</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all duration-300" 
                      style={{ width: `${Math.min(100, (teamData.averageFormationTime / 24) * 100)}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{teamData.soloParticipants}</div>
                      <div className="text-xs text-muted-foreground">Solo Participants</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary">{Math.max(0, overviewData.participants - teamData.soloParticipants)}</div>
                      <div className="text-xs text-muted-foreground">Team Members</div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground text-center mt-2">
                    Teams form within {teamData.averageFormationTime} hours on average
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 报告标签页 */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('report.title')}</CardTitle>
              <CardDescription>{t('report.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customReports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{report.name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{report.reportType}</Badge>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            {t('export.button')}
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {t('lastGenerated')}: {report.lastExecutedAt ? 
                          new Date(report.lastExecutedAt).toLocaleDateString() : 
                          'Never'
                        }
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
