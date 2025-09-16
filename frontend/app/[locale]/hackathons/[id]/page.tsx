'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Calendar, Users, Trophy, Clock, MapPin, ExternalLink, Share2, Heart, Star, Code, Award, Target, CheckCircle, AlertCircle, Timer } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { getIPFSImageUrl, formatPrizeAmount } from '@/lib/utils'
import { formatDate, getDaysUntil } from '@/lib/utils'
import { apiService } from '@/lib/api'

interface Hackathon {
  id: string
  title: string
  description: string
  longDescription: string
  startDate: string
  endDate: string
  registrationStartDate?: string
  registrationDeadline: string
  status: 'upcoming' | 'ongoing' | 'ended'
  participants: number
  maxParticipants?: number
  totalPrize: string
  location: string
  organizer: {
    name: string
    avatar: string
    description: string
  }
  organizerId: string
  tags: string[]
  coverImage: string
  prizes: Array<{
    name: string
    amount: string
    description: string
  }>
  tracks: Array<{
    name: string
    description: string
  }>
  rules: string[]
  requirements: string[]
  judgingCriteria: string[]
  timeline: Array<{
    date: string
    title: string
    description: string
    completed: boolean
  }>
  sponsors: Array<{
    name: string
    logo: string
    tier: 'gold' | 'silver' | 'bronze'
    websiteUrl?: string
  }>
  socialLinks?: {
    website?: string
    twitter?: string
    discord?: string
    telegram?: string
    github?: string
    linkedin?: string
  }
  judges: Array<{
    name: string
    avatar: string
    title: string
    company: string
  }>
  projects: Array<{
    id: string
    name: string
    team: string
    members: number
    track: string
  }>
}

export default function HackathonDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('hackathons.detail')
  const tCommon = useTranslations('common')
  
  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoined, setIsJoined] = useState(false)
  const isFetchingRef = useRef(false)

  // 检查用户参与状态
  const checkUserParticipation = async (hackathonId: string, organizerId?: string) => {
    if (!user) return
    
    // 创建者永远不算"已参加"
    if (organizerId && user.id === organizerId) {
      setIsJoined(false)
      return
    }
    
    try {
      const response = await apiService.getUserHackathonParticipation(hackathonId)
      if (response.success && response.data) {
        setIsJoined(response.data.isParticipating)
      }
    } catch (error) {
      console.error('检查参与状态失败:', error)
    }
  }

  // 获取项目数据
  const fetchProjects = async (hackathonId: string) => {
    try {
      const response = await apiService.getHackathonProjects(hackathonId)
      if (response.success && response.data) {
        const projects = response.data.projects.map((project: any) => ({
          id: project.id,
          name: project.title,
          team: project.team?.name || project.creator?.username || '个人项目',
          members: project.team?._count?.members || 1,
          track: project.category || '未分类'
        }))
        
        // 更新hackathon中的projects
        setHackathon(prev => prev ? { ...prev, projects } : null)
      }
    } catch (error) {
      console.error('获取项目列表失败:', error)
    }
  }

  // 辅助函数：根据日期判断黑客松状态
  const getHackathonStatus = (startDate: string, endDate: string): 'upcoming' | 'ongoing' | 'ended' => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (now < start) return 'upcoming'
    if (now >= start && now <= end) return 'ongoing'
    return 'ended'
  }

  // 检查是否可以报名
  const canRegister = (hackathon: Hackathon) => {
    const now = new Date()
    const registrationStart = hackathon.registrationStartDate ? new Date(hackathon.registrationStartDate) : null
    const registrationEnd = new Date(hackathon.registrationDeadline)
    
    // 如果设置了报名开始时间，检查是否已到报名时间
    if (registrationStart && now < registrationStart) {
      return { canRegister: false, reason: '报名尚未开始' }
    }
    
    // 检查是否已过报名截止时间
    if (now > registrationEnd) {
      return { canRegister: false, reason: '报名已截止' }
    }
    
    return { canRegister: true, reason: '' }
  }

  // 检查是否可以提交项目
  const canSubmitProject = (hackathon: Hackathon) => {
    const now = new Date()
    const hackathonStart = new Date(hackathon.startDate)
    const hackathonEnd = new Date(hackathon.endDate)
    
    // 项目提交必须在黑客松开始后
    if (now < hackathonStart) {
      return { canSubmit: false, reason: '黑客松尚未开始' }
    }
    
    // 项目提交必须在黑客松结束前
    if (now > hackathonEnd) {
      return { canSubmit: false, reason: '黑客松已结束' }
    }
    
    return { canSubmit: true, reason: '' }
  }

  // 提取fetchHackathon函数到组件级别，让其他函数可以调用
  const fetchHackathon = useCallback(async () => {
      // 防止重复调用
      if (isFetchingRef.current) {
        console.log('⏳ 正在获取中，跳过重复调用')
        return
      }
      
      try {
        isFetchingRef.current = true
        setIsLoading(true)
        console.log('🔍 获取黑客松详情:', params.id)
        const response = await apiService.getHackathon(params.id as string)
        console.log('📡 API响应:', response)
        
        if (response.success && response.data) {
          const hackathonData = response.data.hackathon
          
          // 转换API数据为页面所需格式
          const formattedHackathon: Hackathon = {
            id: hackathonData.id,
            title: hackathonData.title,
            description: hackathonData.description,
            longDescription: hackathonData.description, // 可以从metadata中获取更详细描述
            startDate: hackathonData.startDate,
            endDate: hackathonData.endDate,
            registrationStartDate: hackathonData.registrationStartDate,
            registrationDeadline: hackathonData.registrationDeadline || hackathonData.startDate,
            status: getHackathonStatus(hackathonData.startDate, hackathonData.endDate),
            participants: hackathonData._count?.participations || 0,
            maxParticipants: hackathonData.maxParticipants,
            totalPrize: hackathonData.prizePool ? `$${hackathonData.prizePool.toLocaleString()}` : '待定',
            location: '全球线上', // 可以从metadata中获取
            organizer: {
              name: hackathonData.organizer?.username || 'Unknown',
              avatar: hackathonData.organizer?.avatarUrl || '/placeholder.svg',
              description: '黑客松组织者' // bio字段不在API返回中
            },
            organizerId: hackathonData.organizerId, // 添加组织者ID用于权限判断
            tags: hackathonData.tags || [],
            coverImage: getIPFSImageUrl(hackathonData.metadata?.coverImage, '/placeholder.svg?height=400&width=800'),
            // ⭐ 使用真实的奖项数据
            prizes: hackathonData.metadata?.prizes && Array.isArray(hackathonData.metadata.prizes) 
              ? hackathonData.metadata.prizes.map((prize: any) => {
                  const singleAmount = prize.amount || 0
                  const winnerCount = prize.winnerCount || 1
                  const totalAmount = singleAmount * winnerCount // ⭐ 计算该奖项的总金额
                  
                  return {
                    name: prize.name || `第${prize.rank}名`, // ⭐ 使用正确的name字段
                    amount: formatPrizeAmount(singleAmount, winnerCount), // ⭐ 使用工具函数格式化金额
                    description: prize.description || `第${prize.rank}名奖项`,
                    winnerCount: winnerCount // ⭐ 添加获奖人数
                  }
                })
              : [{
                  name: '一等奖',
                  amount: hackathonData.prizePool ? `$${Math.floor(hackathonData.prizePool * 0.5).toLocaleString()}` : '$10,000',
                  description: '最佳项目奖'
                }],
            // ⭐ 使用真实的赛道数据
            tracks: hackathonData.metadata?.tracks && Array.isArray(hackathonData.metadata.tracks)
              ? hackathonData.metadata.tracks.map((track: any) => ({
                  name: track.name || '未命名赛道',
                  description: track.description || '无描述'
                }))
              : hackathonData.categories.map((category: string) => ({
                  name: category,
                  description: `${category}相关项目`
                })) || [{
                  name: '开放赛道',
                  description: '不限制技术栈和项目类型'
                }],
            rules: typeof hackathonData.rules === 'string' 
              ? hackathonData.rules.split('\n').filter(rule => rule.trim()) 
              : (Array.isArray(hackathonData.rules) ? hackathonData.rules : ['遵守比赛规则']),
            requirements: typeof hackathonData.requirements === 'string'
              ? hackathonData.requirements.split('\n').filter(req => req.trim())
              : (Array.isArray(hackathonData.requirements) ? hackathonData.requirements : ['无特殊要求']),
            // ⭐ 使用真实的评审标准
            judgingCriteria: hackathonData.metadata?.judgingCriteria && Array.isArray(hackathonData.metadata.judgingCriteria)
              ? hackathonData.metadata.judgingCriteria.map((criteria: any) => 
                  typeof criteria === 'string' ? criteria : (criteria.description || criteria.category || '未命名标准')
                )
              : [
                  '技术创新性',
                  '产品完成度', 
                  '用户体验',
                  '商业价值'
                ],
            // ⭐ 使用真实的时间线数据
            timeline: hackathonData.metadata?.timeline && Array.isArray(hackathonData.metadata.timeline)
              ? hackathonData.metadata.timeline.map((event: any) => ({
                  date: event.date,
                  title: event.title,
                  description: event.description,
                  completed: event.completed || false
                }))
              : [
                  {
                    date: hackathonData.startDate,
                    title: '比赛开始',
                    description: '正式开始开发',
                    completed: false
                  },
                  {
                    date: hackathonData.endDate,
                    title: '比赛结束',
                    description: '提交截止',
                    completed: false
                  }
                ],
            // ⭐ 使用真实的赞助商数据
            sponsors: hackathonData.metadata?.sponsors && Array.isArray(hackathonData.metadata.sponsors)
              ? hackathonData.metadata.sponsors.map((sponsor: any) => ({
                  name: sponsor.name,
                  logo: getIPFSImageUrl(sponsor.logoUrl, '/placeholder.svg'), // ⭐ 使用IPFS图片处理函数
                  tier: sponsor.tier || 'bronze',
                  websiteUrl: sponsor.websiteUrl // ⭐ 添加网站链接
                }))
              : [],
            // ⭐ 使用真实的评委数据
            judges: hackathonData.metadata?.judges && Array.isArray(hackathonData.metadata.judges)
              ? hackathonData.metadata.judges.map((judge: any) => ({
                  name: judge.name,
                  avatar: judge.avatarUrl || '/placeholder.svg',
                  title: judge.title,
                  company: judge.bio || 'HackX评委'
                }))
              : [],
            // ⭐ 使用真实的社交链接数据
            socialLinks: hackathonData.metadata?.socialLinks || {},
            projects: [] // 将在fetchProjects中填充
          }
          
          setHackathon(formattedHackathon)
          
          // 获取项目数据
          await fetchProjects(hackathonData.id)
          
          // 检查当前用户是否已参加
          if (user) {
            checkUserParticipation(hackathonData.id, hackathonData.organizer.id)
          }
        } else {
          toast({
            title: t('error.title'),
            description: response.error || t('error.loadHackathonFailed'),
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('获取黑客松详情失败:', error)
        toast({
          title: t('error.title'), 
          description: t('error.loadHackathonFailed'),
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
        isFetchingRef.current = false
      }
  }, [params.id]) // useCallback依赖，移除toast避免重复渲染

  useEffect(() => {
    if (params.id) {
      fetchHackathon()
    }
  }, [params.id, fetchHackathon])

  const handleJoinHackathon = async () => {
    if (!user) {
      toast({
        title: '请先登录',
        description: '登录后才能参加黑客松',
        variant: 'destructive',
      })
      return
    }

    if (!hackathon) return

    // 创建者不能参加自己的黑客松
    if (user.id === hackathon.organizerId) {
      toast({
        title: '无法参加',
        description: '作为创建者，您无法参加自己创建的黑客松',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await apiService.joinHackathon(hackathon.id)
      
      if (response.success) {
        setIsJoined(true)
        toast({
          title: '参加成功！',
          description: '你已成功参加这个黑客松',
        })
        
        // 重新加载黑客松数据以更新参与人数
        fetchHackathon()
      } else {
        throw new Error(response.error || '参加失败')
      }
    } catch (error) {
      console.error('加入黑客松失败:', error)
      toast({
        title: '参加失败',
        description: error instanceof Error ? error.message : '网络错误，请稍后重试',
        variant: 'destructive',
      })
    }
  }


  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: '链接已复制',
      description: '黑客松链接已复制到剪贴板',
    })
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-muted rounded-lg" />
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    )
  }

  if (!hackathon) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('notFound')}</h1>
          <Button asChild>
            <Link href="/hackathons">{t('backToList')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500'
      case 'ongoing': return 'bg-green-500'
      case 'ended': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return t('status.upcoming')
      case 'ongoing': return t('status.ongoing')
      case 'ended': return t('status.ended')
      default: return t('status.unknown')
    }
  }

  const participationProgress = hackathon.maxParticipants 
    ? (hackathon.participants / hackathon.maxParticipants) * 100 
    : 0

  return (
    <div className="container py-8">
      <div className="space-y-8">
        {/* 头部横幅 */}
        <div className="relative">
          <div className="h-64 md:h-80 rounded-lg overflow-hidden">
            <img
              src={hackathon.coverImage || "/placeholder.svg"}
              alt={hackathon.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${getStatusColor(hackathon.status)} text-white`}>
                {getStatusText(hackathon.status)}
              </Badge>
              {hackathon.status === 'upcoming' && (
                <Badge variant="secondary" className="bg-white/20 text-white">
                  <Timer className="h-3 w-3 mr-1" />
                  {getDaysUntil(hackathon.startDate)} 天后开始
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{hackathon.title}</h1>
            <p className="text-lg opacity-90 max-w-2xl">{hackathon.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 快速信息 */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('startTime')}</p>
                    <p className="font-semibold">{formatDate(hackathon.startDate)}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('duration')}</p>
                    <p className="font-semibold">{t('days', { count: 14 })}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('totalPrize')}</p>
                    <p className="font-semibold">{hackathon.totalPrize}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('location')}</p>
                    <p className="font-semibold">{hackathon.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 详细信息标签页 */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
                <TabsTrigger value="prizes">{t('tabs.prizes')}</TabsTrigger>
                <TabsTrigger value="rules">{t('tabs.rules')}</TabsTrigger>
                <TabsTrigger value="timeline">{t('tabs.timeline')}</TabsTrigger>
                <TabsTrigger value="projects">{t('tabs.projects')}</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* 时间安排信息 */}
                <Card>
                  <CardHeader>
                    <CardTitle>时间安排</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {hackathon.registrationStartDate && (
                        <div className="text-center p-4 border rounded-lg">
                          <div className="flex items-center justify-center mb-2">
                            <Timer className="h-5 w-5 text-green-600" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">报名开始</p>
                          <p className="font-semibold text-sm">{formatDate(hackathon.registrationStartDate)}</p>
                        </div>
                      )}
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">报名截止</p>
                        <p className="font-semibold text-sm">{formatDate(hackathon.registrationDeadline)}</p>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">活动开始</p>
                        <p className="font-semibold text-sm">{formatDate(hackathon.startDate)}</p>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <CheckCircle className="h-5 w-5 text-purple-600" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">活动结束</p>
                        <p className="font-semibold text-sm">{formatDate(hackathon.endDate)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>活动介绍</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      {hackathon.longDescription.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4 text-muted-foreground">
                          {paragraph.trim()}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>赛道介绍</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {hackathon.tracks.map((track, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">{track.name}</h4>
                          <p className="text-sm text-muted-foreground">{track.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>技术栈</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(hackathon.tags) && hackathon.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prizes" className="space-y-4">
                <div className="grid gap-4">
                  {hackathon.prizes.map((prize, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                              <Award className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{prize.name}</h3>
                              <p className="text-2xl font-bold text-primary">{prize.amount}</p>
                              {(prize as any).winnerCount && (prize as any).winnerCount > 1 && (
                                <p className="text-sm text-muted-foreground">获奖人数: {(prize as any).winnerCount}人</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-lg px-3 py-1">
                            #{index + 1}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{prize.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="rules" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>参赛规则</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {hackathon.rules.map((rule, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>参与要求</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {hackathon.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>评审标准</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {hackathon.judgingCriteria.map((criteria, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{criteria}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>活动时间线</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {hackathon.timeline.map((event, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            event.completed ? 'bg-green-500' : 'bg-muted'
                          }`}>
                            {event.completed ? (
                              <CheckCircle className="h-4 w-4 text-white" />
                            ) : (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{event.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {formatDate(event.date)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="space-y-6">
                {/* 项目统计 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{hackathon.projects.length}</div>
                      <div className="text-sm text-muted-foreground">已提交项目</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {new Set(hackathon.projects.map(p => p.track)).size}
                      </div>
                      <div className="text-sm text-muted-foreground">参与赛道</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {hackathon.projects.reduce((sum, p) => sum + p.members, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">参与人数</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(hackathon.projects.reduce((sum, p) => sum + p.members, 0) / Math.max(hackathon.projects.length, 1))}
                      </div>
                      <div className="text-sm text-muted-foreground">平均团队规模</div>
                    </CardContent>
                  </Card>
                </div>

                {/* 按赛道分组的项目 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>参赛项目</CardTitle>
                        <CardDescription>
                          按赛道分组显示已提交的项目
                        </CardDescription>
                      </div>
                      {/* 提交项目按钮 */}
                      {user && user.id !== hackathon.organizerId && isJoined && (() => {
                        const submitStatus = canSubmitProject(hackathon)
                        return submitStatus.canSubmit ? (
                          <Button asChild>
                            <Link href={`/hackathons/${hackathon.id}/submit`}>
                              <Code className="w-4 h-4 mr-2" />
                              提交项目
                            </Link>
                          </Button>
                        ) : (
                          <Button disabled>
                            <Code className="w-4 h-4 mr-2" />
                            {submitStatus.reason}
                          </Button>
                        )
                      })()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {hackathon.projects.length > 0 ? (
                      <div className="space-y-6">
                        {hackathon.tracks.map((track) => {
                          const trackProjects = hackathon.projects.filter(p => p.track === track.name)
                          if (trackProjects.length === 0) return null
                          
                          return (
                            <div key={track.name}>
                              <div className="flex items-center gap-2 mb-3">
                                <h4 className="font-semibold">{track.name}</h4>
                                <Badge variant="secondary">{trackProjects.length} 个项目</Badge>
                              </div>
                              <div className="grid gap-3">
                                {trackProjects.map((project) => (
                                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-medium">{project.name}</h5>
                                        <Badge variant="outline">
                                          {project.members} 人团队
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        团队：{project.team}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button variant="ghost" size="sm">
                                        <Heart className="h-4 w-4" />
                                      </Button>
                                      <Button variant="outline" size="sm" asChild>
                                        <Link href={`/hackathons/${hackathon.id}/projects/${project.id}`}>
                                          查看详情
                                        </Link>
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">还没有项目提交</h3>
                        <p className="text-muted-foreground mb-6">
                          成为第一个提交项目的团队！
                        </p>
                        {user && user.id !== hackathon.organizerId && isJoined && (() => {
                          const submitStatus = canSubmitProject(hackathon)
                          return submitStatus.canSubmit ? (
                            <Button asChild>
                              <Link href={`/hackathons/${hackathon.id}/submit`}>
                                立即提交项目
                              </Link>
                            </Button>
                          ) : (
                            <Button disabled>
                              {submitStatus.reason}
                            </Button>
                          )
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 参与按钮 */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* 创建者身份提示 */}
                  {user && user.id === hackathon.organizerId && (
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        🎯 您是本次黑客松的创建者
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        创建者无法参加自己创建的比赛，但可以管理和查看所有参赛项目
                      </div>
                    </div>
                  )}
                  
                  {hackathon.status === 'upcoming' && user && user.id !== hackathon.organizerId && (() => {
                    const registrationStatus = canRegister(hackathon)
                    return (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleJoinHackathon}
                        disabled={isJoined || !registrationStatus.canRegister}
                      >
                        {isJoined ? '已参加' : (registrationStatus.canRegister ? '立即参加' : registrationStatus.reason)}
                      </Button>
                    )
                  })()}
                  
                  {user && user.id !== hackathon.organizerId && isJoined && (() => {
                    const submitStatus = canSubmitProject(hackathon)
                    return submitStatus.canSubmit ? (
                      <Button className="w-full" size="lg" asChild>
                        <Link href={`/hackathons/${hackathon.id}/submit`}>
                          提交项目
                        </Link>
                      </Button>
                    ) : (
                      <Button className="w-full" size="lg" disabled>
                        {submitStatus.reason}
                      </Button>
                    )
                  })()}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleShare} className="w-full">
                      <Share2 className="h-4 w-4 mr-2" />
                      分享
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 参与统计 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  参与统计
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>参与者</span>
                    <span>{hackathon.participants.toLocaleString()}</span>
                  </div>
                  {hackathon.maxParticipants && (
                    <>
                      <Progress value={participationProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        还有 {hackathon.maxParticipants - hackathon.participants} 个名额
                      </p>
                    </>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>已提交项目</span>
                    <span>{hackathon.projects.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>赛道数量</span>
                    <span>{hackathon.tracks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>奖项数量</span>
                    <span>{hackathon.prizes.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 组织者信息 */}
            <Card>
              <CardHeader>
                <CardTitle>组织者</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={hackathon.organizer.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{hackathon.organizer.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold">{hackathon.organizer.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hackathon.organizer.description}
                    </p>
                    
                    {/* 社交链接 */}
                    {hackathon.socialLinks && Object.keys(hackathon.socialLinks).length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">联系方式</p>
                        <div className="flex flex-wrap gap-2">
                          {hackathon.socialLinks.website && (
                            <a 
                              href={hackathon.socialLinks.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              🌐 官网
                            </a>
                          )}
                          {hackathon.socialLinks.twitter && (
                            <a 
                              href={hackathon.socialLinks.twitter} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              🐦 Twitter
                            </a>
                          )}
                          {hackathon.socialLinks.discord && (
                            <a 
                              href={hackathon.socialLinks.discord} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              💬 Discord
                            </a>
                          )}
                          {hackathon.socialLinks.telegram && (
                            <a 
                              href={hackathon.socialLinks.telegram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              📱 Telegram
                            </a>
                          )}
                          {hackathon.socialLinks.github && (
                            <a 
                              href={hackathon.socialLinks.github} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              🐙 GitHub
                            </a>
                          )}
                          {hackathon.socialLinks.linkedin && (
                            <a 
                              href={hackathon.socialLinks.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              💼 LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 评委团 */}
            <Card>
              <CardHeader>
                <CardTitle>评委团</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hackathon.judges.map((judge, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={judge.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{judge.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{judge.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {judge.title} @ {judge.company}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 赞助商 */}
            <Card>
              <CardHeader>
                <CardTitle>赞助商</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {hackathon.sponsors.map((sponsor, index) => (
                    <div key={index} className="text-center p-3 border rounded-lg">
                      <img
                        src={sponsor.logo || "/placeholder.svg"}
                        alt={sponsor.name}
                        className="h-8 w-auto mx-auto mb-2"
                      />
                      <p className="text-xs font-medium">{sponsor.name}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {sponsor.tier}
                      </Badge>
                      {sponsor.websiteUrl && (
                        <div className="mt-2">
                          <a
                            href={sponsor.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-3 h-3" />
                            访问官网
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
