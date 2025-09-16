'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Search, Plus, Users, MapPin, Calendar, Star, UserPlus, Bell, Filter, Loader2, Crown, Shield, Zap, Activity, Target, Sparkles, TrendingUp } from 'lucide-react'
import { apiService, type Team } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { AuthGuard } from '@/components/auth/auth-guard'

interface TeamInvitation {
  id: string
  teamId: string
  teamName: string
  inviterName: string
  inviterAvatar: string
  message: string
  createdAt: Date
}

export default function TeamsPage() {
  const t = useTranslations('teams')
  const tCommon = useTranslations('common')
  const { user } = useAuth()
  const teamsPageRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [teams, setTeams] = useState<Team[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [hackathons, setHackathons] = useState<Array<{id: string, title: string}>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [hackathonFilter, setHackathonFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joiningTeams, setJoiningTeams] = useState<Set<string>>(new Set())
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [applicationSkills, setApplicationSkills] = useState('')
  const { toast } = useToast()

  // 页面进入动画
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // 鼠标跟踪
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (teamsPageRef.current) {
        const rect = teamsPageRef.current.getBoundingClientRect()
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        })
      }
    }

    const teamsPage = teamsPageRef.current
    if (teamsPage) {
      teamsPage.addEventListener('mousemove', handleMouseMove)
      return () => teamsPage.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // 加载黑客松列表
  const loadHackathons = async () => {
    try {
      const response = await apiService.getHackathons({
        page: 1,
        limit: 100 // 获取所有黑客松用于筛选
      })
      
      if (response.success && response.data) {
        setHackathons(response.data.hackathons.map(h => ({
          id: h.id,
          title: h.title
        })))
      }
    } catch (error) {
      console.error(t('loading.hackathons'), error)
      // 不显示错误提示，因为这是辅助功能
    }
  }

  // 加载团队列表
  const loadTeams = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {
        page: 1,
        limit: 50
      }
      
      if (searchQuery) {
        params.search = searchQuery
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      
      if (hackathonFilter !== 'all') {
        params.hackathonId = hackathonFilter
      }

      const response = await apiService.getTeams(params)
      
      if (response.success && response.data) {
        setTeams(response.data.teams)
      } else {
        setError(response.error || t('loading.getTeamsFailed'))
        toast({
          title: t('loading.failed'),
          description: response.error || t('loading.getTeamsFailed'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('加载团队列表错误:', error)
      setError(t('loading.networkError'))
      toast({
        title: t('loading.networkError'),
        description: t('loading.networkError'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Load team invitations
  const loadInvitations = async () => {
    // Only load invitations when user is logged in
    if (!user) {
      setInvitations([])
      return
    }

    try {
      const response = await apiService.getTeamInvitations()
      
      if (response.success && response.data) {
        setInvitations(response.data.invitations.map((inv: any) => ({
          id: inv.id,
          teamId: inv.teamId,
          teamName: inv.teamName,
          inviterName: inv.inviterName,
          inviterAvatar: inv.inviterAvatar,
          message: inv.message,
          createdAt: new Date(inv.createdAt)
        })))
      }
    } catch (error) {
      console.error(t('loading.invitations'), error)
      // 不显示错误提示，因为可能是未登录导致的
    }
  }

  // 接受邀请
  const acceptInvitation = async (invitationId: string) => {
    if (!user) {
      toast({
        title: t('toasts.loginRequired'),
        description: t('toasts.loginRequiredDesc'),
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await apiService.acceptTeamInvitation(invitationId)
      
      if (response.success) {
        toast({
          title: t('toasts.invitationAccepted'),
          description: t('toasts.invitationAcceptedDesc')
        })
        // 重新加载数据
        loadTeams()
        loadInvitations()
      } else {
        toast({
          title: t('toasts.operationFailed'),
          description: response.error || t('toasts.acceptInvitationFailed'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('接受邀请失败:', error)
      toast({
        title: t('toasts.operationFailed'),
        description: t('toasts.acceptInvitationFailed'),
        variant: 'destructive'
      })
    }
  }

  // 拒绝邀请
  const declineInvitation = async (invitationId: string) => {
    if (!user) {
      toast({
        title: t('toasts.loginRequired'),
        description: t('toasts.loginRequiredToDecline'),
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await apiService.declineTeamInvitation(invitationId)
      
      if (response.success) {
        toast({
          title: t('toasts.invitationDeclined'),
          description: t('toasts.invitationDeclinedDesc')
        })
        // 重新加载邀请列表
        loadInvitations()
      } else {
        toast({
          title: t('toasts.operationFailed'),
          description: response.error || t('toasts.declineInvitationFailed'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('拒绝邀请失败:', error)
      toast({
        title: t('toasts.operationFailed'),
        description: t('toasts.declineInvitationFailed'),
        variant: 'destructive'
      })
    }
  }

  // 处理加入团队 - 打开申请弹窗
  const handleJoinTeam = (team: Team) => {
    if (!user) {
      toast({
        title: tCommon('error'),
        description: t('toasts.loginRequiredToApply'),
        variant: 'destructive'
      })
      return
    }

    setSelectedTeam(team)
    setApplicationMessage('')
    setApplicationSkills('')
    setShowJoinDialog(true)
  }

  // 提交申请
  const handleSubmitApplication = async () => {
    if (!selectedTeam || !user) return

    const teamId = selectedTeam.id
    
    // 防止重复提交
    if (joiningTeams.has(teamId)) return

    setJoiningTeams(prev => new Set([...prev, teamId]))
    
    try {
      const skillsArray = applicationSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0)
      
      const response = await apiService.joinTeam(teamId, {
        message: applicationMessage.trim() || undefined,
        skills: skillsArray.length > 0 ? skillsArray : undefined
      })
      
      if (response.success) {
        toast({
          title: t('toasts.applicationSubmitted'),
          description: t('toasts.applicationSubmittedDesc')
        })
        
        // 关闭弹窗
        setShowJoinDialog(false)
        setSelectedTeam(null)
        setApplicationMessage('')
        setApplicationSkills('')
        
        // 重新加载团队列表
        loadTeams()
      } else {
        throw new Error(response.error || t('toasts.applicationFailed'))
      }
    } catch (error) {
      console.error('申请提交失败:', error)
      toast({
        title: t('toasts.applicationFailed'),
        description: error instanceof Error ? error.message : t('toasts.applicationFailedDesc'),
        variant: 'destructive'
      })
    } finally {
      setJoiningTeams(prev => {
        const newSet = new Set(prev)
        newSet.delete(teamId)
        return newSet
      })
    }
  }

  // 初始加载
  useEffect(() => {
    loadTeams()
    loadInvitations()
    loadHackathons()
  }, [])

  // 搜索和筛选
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTeams()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, statusFilter, hackathonFilter])

  const filteredTeams = teams.filter(team => {
    if (activeTab === 'my-teams') {
      // 过滤出用户创建的团队或用户是成员的团队
      if (!user) return false
      return team.leader?.id === user.id || team.members?.some(member => member.id === user.id)
    }
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECRUITING':
        return (
          <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 animate-pulse-slow">
            <Target className="w-3 h-3 mr-1" />
            {t('status.recruiting')}
          </Badge>
        )
      case 'FULL':
        return (
          <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
            <Shield className="w-3 h-3 mr-1" />
            {t('status.full')}
          </Badge>
        )
      case 'COMPETING':
        return (
          <Badge variant="outline" className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-0">
            <Zap className="w-3 h-3 mr-1" />
            {t('status.competing')}
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <Star className="w-3 h-3 mr-1" />
            {t('status.completed')}
          </Badge>
        )
      case 'DISBANDED':
        return (
          <Badge variant="destructive" className="bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0">
            <Activity className="w-3 h-3 mr-1" />
            {t('status.disbanded')}
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <Target className="w-3 h-3 mr-1" />
            {t('status.recruiting')}
          </Badge>
        )
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECRUITING':
        return 'border-green-200 bg-green-50 dark:bg-green-950/20'
      case 'FULL':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20'
      case 'COMPETING':
        return 'border-orange-200 bg-orange-50 dark:bg-orange-950/20'
      case 'COMPLETED':
        return 'border-gray-200 bg-gray-50 dark:bg-gray-950/20'
      case 'DISBANDED':
        return 'border-red-200 bg-red-50 dark:bg-red-950/20'
      default:
        return 'border-green-200 bg-green-50 dark:bg-green-950/20'
    }
  }

  return (
    <AuthGuard>
      <div ref={teamsPageRef} className="relative min-h-screen">
        {/* 动态背景 */}
        <div className="absolute inset-0 gradient-mesh opacity-15 -z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/90 to-background -z-10" />
        
        {/* 交互式浮动元素 */}
        <div className="absolute inset-0 -z-10">
          <div 
            className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float"
            style={{
              top: '15%',
              left: `${20 + mousePosition.x * 0.03}%`,
              animationDelay: '0s'
            }}
          />
          <div 
            className="absolute w-80 h-80 rounded-full bg-secondary/5 blur-3xl animate-float"
            style={{
              bottom: '20%',
              right: `${25 + mousePosition.y * 0.02}%`,
              animationDelay: '2s'
            }}
          />
        </div>

        {/* 装饰性元素 */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary/30 rounded-full animate-pulse-slow" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-secondary/40 rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />

        <div className="container py-8 relative">
          <div className="space-y-8">
            {/* 现代化页面头部 */}
            <div className={`transition-all duration-1000 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-primary rounded-2xl">
                      <Users className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-responsive-lg font-bold text-gradient animate-shimmer">
                        {t('pageTitle')}
                      </h1>
                      <p className="text-muted-foreground leading-relaxed">
                        {t('pageDescription')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="glass hover-lift border-primary/30" asChild>
                    <Link href="/teams/create">
                      <Plus className="w-4 h-4 mr-2" />
                      {t('createTeam')}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* 现代化搜索和筛选 */}
            <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
              <div className="glass border border-primary/10 rounded-2xl p-6 relative overflow-hidden">
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full -translate-y-6 translate-x-6" />
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-primary rounded-xl">
                      <Search className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">搜索团队</h3>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder={t('search.placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 glass border-primary/20 focus:border-primary/40 focus:shadow-glow"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-48 glass border-primary/20">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder={t('search.statusFilter')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" />
                            {t('search.allStatuses')}
                          </div>
                        </SelectItem>
                        <SelectItem value="recruiting">
                          <div className="flex items-center gap-2">
                            <Target className="w-3 h-3" />
                            {t('status.recruiting')}
                          </div>
                        </SelectItem>
                        <SelectItem value="full">
                          <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3" />
                            {t('status.full')}
                          </div>
                        </SelectItem>
                        <SelectItem value="competing">
                          <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            {t('status.competing')}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={hackathonFilter} onValueChange={setHackathonFilter}>
                      <SelectTrigger className="w-full md:w-48 glass border-primary/20">
                        <Calendar className="w-4 h-4 mr-2" />
                        <SelectValue placeholder={t('search.hackathonFilter')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {t('search.allHackathons')}
                          </div>
                        </SelectItem>
                        {hackathons.map(hackathon => (
                          <SelectItem key={hackathon.id} value={hackathon.id}>
                            {hackathon.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* 现代化标签页 */}
            <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'}`}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                {/* 现代化标签导航 */}
                <div className="glass border border-primary/10 rounded-2xl p-2">
                  <TabsList className="grid w-full grid-cols-3 bg-transparent gap-1">
                    {[
                      { value: 'all', label: t('tabs.allTeams'), icon: Users },
                      { value: 'my-teams', label: t('tabs.myTeams'), icon: Crown },
                      { value: 'invitations', label: t('tabs.invitations'), icon: Bell, count: invitations.length }
                    ].map((tab) => (
                      <TabsTrigger 
                        key={tab.value} 
                        value={tab.value}
                        className="glass hover-lift transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white relative"
                      >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                        {tab.count && tab.count > 0 && (
                          <Badge variant="destructive" className="ml-2 animate-bounce-gentle">
                            {tab.count}
                          </Badge>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* 所有团队标签页 */}
                <TabsContent value="all" className="space-y-6 animate-fade-in">
                  {loading ? (
                    <div className="glass border border-primary/10 rounded-2xl p-12 text-center">
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-primary rounded-2xl w-fit mx-auto">
                          <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
                        </div>
                        <p className="text-muted-foreground">{t('loading.teams')}</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="glass border border-destructive/20 rounded-2xl p-12 text-center">
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl w-fit mx-auto">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                        <p className="text-destructive mb-4">{error}</p>
                        <Button onClick={loadTeams} className="bg-primary hover:bg-primary/90 hover-lift hover-glow">
                          <Sparkles className="w-4 h-4 mr-2" />
                          {t('actions.retry')}
                        </Button>
                      </div>
                    </div>
                  ) : filteredTeams.length === 0 ? (
                    <div className="glass border border-primary/10 rounded-2xl p-12 text-center">
                      <div className="space-y-6">
                        <div className="p-4 bg-gradient-primary rounded-2xl w-fit mx-auto">
                          <Users className="h-12 w-12 text-primary-foreground" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">{t('empty.noTeamsFound')}</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {t('empty.adjustSearchCriteria')}
                          </p>
                        </div>
                        <Button className="bg-primary hover:bg-primary/90 hover-lift hover-glow" asChild>
                          <Link href="/teams/create">
                            <Plus className="w-4 h-4 mr-2" />
                            {t('createTeam')}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTeams.map((team, index) => (
                        <div
                          key={team.id}
                          className="animate-scale-in"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="group relative glass border border-primary/10 hover:border-primary/30 rounded-2xl p-6 hover-lift hover-glow transition-all duration-500 overflow-hidden">
                            {/* 背景渐变效果 */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-2xl" />
                            
                            <div className="space-y-4">
                              {/* 团队头部信息 */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
                                    {team.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                    {team.description}
                                  </p>
                                </div>
                                <div className="ml-3">
                                  {getStatusBadge(team.status)}
                                </div>
                              </div>

                              {/* 黑客松信息 */}
                              <div className="flex items-center gap-2 p-2 glass rounded-xl border border-primary/10">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-foreground">
                                  {team.hackathon?.title || t('unknownHackathon')}
                                </span>
                              </div>

                              {/* 成员信息和角色 */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 p-2 glass rounded-xl border border-primary/10">
                                  <Users className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium">
                                    {t('memberCount', { current: team._count?.members || 0, max: team.maxMembers })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {user && user.id === team.leader?.id ? (
                                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                                      <Crown className="w-3 h-3 mr-1" />
                                      {t('roleLeader')}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-primary/30">
                                      {t('roleRecruiting')}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* 成员头像展示 */}
                              {team.members && team.members.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">成员:</span>
                                  <div className="flex -space-x-2">
                                    {team.members.slice(0, 4).map((member, idx) => (
                                      <Avatar key={member.id} className="w-8 h-8 ring-2 ring-background">
                                        <AvatarImage src={member.avatarUrl || "/placeholder.svg"} />
                                        <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                                          {member.username?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    ))}
                                    {team.members.length > 4 && (
                                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                        <span className="text-xs text-muted-foreground">+{team.members.length - 4}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 操作按钮 */}
                              <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" className="flex-1 glass hover-lift border-primary/30" asChild>
                                  <Link href={`/teams/${team.id}`}>
                                    <Activity className="h-4 w-4 mr-2" />
                                    {t('actions.viewDetails')}
                                  </Link>
                                </Button>
                                {user && user.id !== team.leader?.id && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleJoinTeam(team)}
                                    disabled={joiningTeams.has(team.id)}
                                    className="bg-primary hover:bg-primary/90 hover-lift hover-glow"
                                  >
                                    {joiningTeams.has(team.id) ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <UserPlus className="h-4 w-4 mr-2" />
                                    )}
                                    {t('actions.applyToJoin')}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* 装饰性边框光效 */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 animate-pulse-slow" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* 我的团队标签页 */}
                <TabsContent value="my-teams" className="space-y-6 animate-fade-in">
                  {filteredTeams.length === 0 ? (
                    <div className="glass border border-primary/10 rounded-2xl p-12 text-center">
                      <div className="space-y-6">
                        <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl w-fit mx-auto">
                          <Crown className="h-12 w-12 text-white" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">还没有加入任何团队</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            探索精彩的团队，开始你的协作之旅
                          </p>
                        </div>
                        <Button className="bg-primary hover:bg-primary/90 hover-lift hover-glow" asChild>
                          <Link href="/teams/create">
                            <Plus className="w-4 h-4 mr-2" />
                            {t('createTeam')}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTeams.map((team, index) => (
                        <div
                          key={team.id}
                          className="animate-scale-in"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="group relative glass border border-yellow-200/30 hover:border-yellow-300/50 rounded-2xl p-6 hover-lift hover-glow transition-all duration-500 overflow-hidden bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20">
                            {/* 特殊的我的团队背景效果 */}
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-2xl" />
                            
                            {/* 我的团队标识 */}
                            <div className="absolute top-4 right-4">
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 animate-pulse-slow">
                                <Crown className="w-3 h-3 mr-1" />
                                我的团队
                              </Badge>
                            </div>
                            
                            <div className="space-y-4 mt-8">
                              {/* 团队头部信息 */}
                              <div className="space-y-2">
                                <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
                                  {team.name}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                  {team.description}
                                </p>
                              </div>

                              {/* 状态标识 */}
                              <div className="flex justify-start">
                                {getStatusBadge(team.status)}
                              </div>

                              {/* 黑客松信息 */}
                              <div className="flex items-center gap-2 p-2 glass rounded-xl border border-yellow-200/30">
                                <Calendar className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm font-medium text-foreground">
                                  {team.hackathon?.title || t('unknownHackathon')}
                                </span>
                              </div>

                              {/* 成员信息 */}
                              <div className="flex items-center gap-2 p-2 glass rounded-xl border border-yellow-200/30">
                                <Users className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm font-medium">
                                  {t('memberCount', { current: team._count?.members || 0, max: team.maxMembers })}
                                </span>
                                <Badge className="ml-auto bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                                  {user && user.id === team.leader?.id ? (
                                    <>
                                      <Crown className="w-3 h-3 mr-1" />
                                      {t('roleLeader')}
                                    </>
                                  ) : (
                                    t('roleMember')
                                  )}
                                </Badge>
                              </div>

                              {/* 操作按钮 */}
                              <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" className="flex-1 glass hover-lift border-yellow-300/30" asChild>
                                  <Link href={`/teams/${team.id}`}>
                                    <Shield className="h-4 w-4 mr-2" />
                                    {t('actions.manageTeam')}
                                  </Link>
                                </Button>
                              </div>
                            </div>

                            {/* 装饰性边框光效 */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 animate-pulse-slow" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* 邀请标签页 */}
                <TabsContent value="invitations" className="space-y-6 animate-fade-in">
                  {invitations.length === 0 ? (
                    <div className="glass border border-primary/10 rounded-2xl p-12 text-center">
                      <div className="space-y-6">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl w-fit mx-auto">
                          <Bell className="h-12 w-12 text-white" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">{t('empty.noInvitations')}</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {t('empty.noInvitationsDesc')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {invitations.map((invitation, index) => (
                        <div
                          key={invitation.id}
                          className="animate-slide-in"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="group glass border border-primary/10 hover:border-primary/30 rounded-2xl p-6 hover-lift hover-glow transition-all duration-500 relative overflow-hidden">
                            {/* 背景渐变效果 */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-2xl" />
                            
                            <div className="flex items-start gap-6">
                              {/* 邀请者头像 */}
                              <div className="relative">
                                <Avatar className="h-16 w-16 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                                  <AvatarImage src={invitation.inviterAvatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-lg bg-gradient-primary text-primary-foreground">
                                    {invitation.inviterName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                {/* 邀请指示器 */}
                                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full animate-bounce-gentle">
                                  新邀请
                                </div>
                              </div>
                              
                              <div className="flex-1 space-y-4">
                                {/* 邀请信息头部 */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <h4 className="text-lg font-bold group-hover:text-primary transition-colors">
                                      {invitation.teamName}
                                    </h4>
                                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 animate-pulse-slow">
                                      <Bell className="w-3 h-3 mr-1" />
                                      {t('invitations.teamInvitation')}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    来自 <span className="font-medium text-foreground">{invitation.inviterName}</span> 的邀请
                                  </p>
                                </div>
                                
                                {/* 邀请消息 */}
                                <div className="p-3 glass rounded-xl border border-primary/10">
                                  <p className="text-sm leading-relaxed">
                                    {invitation.message || "诚邀您加入我们的团队，一起创造精彩项目！"}
                                  </p>
                                </div>
                                
                                {/* 操作区域 */}
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                  <div className="flex items-center gap-3">
                                    <Button 
                                      size="sm" 
                                      onClick={() => acceptInvitation(invitation.id)}
                                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover-lift hover-glow text-white border-0"
                                    >
                                      <Sparkles className="w-4 h-4 mr-2" />
                                      {t('invitations.acceptInvitation')}
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => declineInvitation(invitation.id)}
                                      className="glass hover-lift border-destructive/30 hover:border-destructive/50"
                                    >
                                      {t('invitations.decline')}
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {new Date(invitation.createdAt).toLocaleDateString('zh-CN')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 装饰性边框光效 */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 animate-pulse-slow" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* 底部装饰性浮动元素 */}
          <div className="absolute bottom-20 right-10 w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse-slow" style={{ animationDelay: '5s' }} />
          <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-secondary/30 rounded-full animate-pulse-slow" style={{ animationDelay: '6s' }} />
        </div>
      </div>

      {/* 现代化申请加入团队弹窗 */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="sm:max-w-[600px] glass border border-primary/20 rounded-3xl p-0 overflow-hidden">
          {/* 弹窗背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 -z-10" />
          
          <div className="p-8">
            {/* 现代化弹窗头部 */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-primary rounded-2xl">
                  <UserPlus className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gradient">{t('joinDialog.title')}</h3>
                  <p className="text-muted-foreground">
                    {selectedTeam && t('joinDialog.description', { teamName: selectedTeam.name })}
                  </p>
                </div>
              </div>
              
              {/* 团队信息卡片 */}
              {selectedTeam && (
                <div className="glass border border-primary/10 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-primary rounded-xl">
                      <Users className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{selectedTeam.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedTeam.description}</p>
                    </div>
                    {getStatusBadge(selectedTeam.status)}
                  </div>
                </div>
              )}
            </div>
            
            {/* 申请表单 */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="skills" className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {t('joinDialog.skillsLabel')}
                </Label>
                <Input
                  id="skills"
                  placeholder={t('joinDialog.skillsPlaceholder')}
                  value={applicationSkills}
                  onChange={(e) => setApplicationSkills(e.target.value)}
                  className="glass border-primary/20 focus:border-primary/40 focus:shadow-glow"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {t('joinDialog.skillsHelp')}
                </p>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="message" className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {t('joinDialog.messageLabel')}
                </Label>
                <Textarea
                  id="message"
                  placeholder={t('joinDialog.messagePlaceholder')}
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  className="glass border-primary/20 focus:border-primary/40 focus:shadow-glow min-h-[120px] resize-none"
                  maxLength={500}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    展示你的热情和能力
                  </span>
                  <span className={`${applicationMessage.length > 450 ? 'text-destructive' : ''}`}>
                    {applicationMessage.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* 现代化操作按钮 */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-primary/10">
              <Button
                variant="outline"
                onClick={() => setShowJoinDialog(false)}
                disabled={selectedTeam ? joiningTeams.has(selectedTeam.id) : false}
                className="glass hover-lift border-primary/30"
              >
                {t('actions.cancel')}
              </Button>
              <Button
                onClick={handleSubmitApplication}
                disabled={selectedTeam ? joiningTeams.has(selectedTeam.id) : false}
                className="bg-primary hover:bg-primary/90 hover-lift hover-glow"
              >
                {selectedTeam && joiningTeams.has(selectedTeam.id) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('loading.submitting')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('loading.submitApplication')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  )
}
