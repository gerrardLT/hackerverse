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
import { Calendar, Users, Trophy, Clock, MapPin, ExternalLink, Share2, Heart, Star, Code, Award, Target, CheckCircle, AlertCircle, Timer, Gavel } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { getIPFSImageUrl, formatPrizeAmount } from '@/lib/utils'
import { formatDate, getDaysUntil } from '@/lib/utils'
import { apiService } from '@/lib/api'
import { ProjectFilter, type FilterOptions, type FilterValues } from '@/components/projects/project-filter'
import { LikeButtonWithCount } from '@/components/projects/like-button'
import { CommentSystem } from '@/components/projects/comment-system'
import { InteractionStats } from '@/components/projects/interaction-stats'

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
    title: string
    description?: string
    team: string
    members: number
    track: string
    technologies?: string[]
    tags?: string[]
    likes: number
    comments: number
    feedbacks: number
    creator?: {
      id: string
      username: string
      avatarUrl?: string
    }
    githubUrl?: string
    demoUrl?: string
    videoUrl?: string
    createdAt: string
    updatedAt: string
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
  
  // 项目过滤状态
  const [projectFilters, setProjectFilters] = useState<FilterOptions>({
    tracks: [],
    tags: [],
    technologies: []
  })
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    tags: [],
    technologies: [],
    tracks: [],
    sortBy: 'created',
    sortOrder: 'desc'
  })
  const [filteredProjects, setFilteredProjects] = useState<Hackathon['projects']>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)

  // 加载项目数据
  const loadProjects = useCallback(async (hackathonId: string, filters?: FilterValues) => {
    try {
      setIsLoadingProjects(true)
      
      // 构建查询参数
      const params = new URLSearchParams()
      if (filters?.search) params.append('search', filters.search)
      if (filters?.tags.length) params.append('tags', filters.tags.join(','))
      if (filters?.technologies.length) params.append('technologies', filters.technologies.join(','))
      if (filters?.tracks.length) params.append('tracks', filters.tracks.join(','))
      if (filters?.sortBy) params.append('sortBy', filters.sortBy)
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
      
      const url = `/hackathons/${hackathonId}/projects${params.toString() ? `?${params.toString()}` : ''}`
      const response = await apiService.get(url)
      
      if (response.success && response.data) {
        const data = response.data as { projects?: any[], filters?: FilterOptions }
        setFilteredProjects(data.projects || [])
        setProjectFilters(data.filters || { tracks: [], tags: [], technologies: [] })
      } else {
        throw new Error(response.error || '加载项目失败')
      }
    } catch (error) {
      console.error('加载项目失败:', error)
      toast({
        title: '加载项目失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingProjects(false)
    }
  }, [toast])

  // 处理过滤器变化
  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilterValues(newFilters)
    if (hackathon) {
      loadProjects(hackathon.id, newFilters)
    }
  }, [hackathon, loadProjects])

  // Check user participation status
  const checkUserParticipation = async (hackathonId: string, organizerId?: string) => {
    if (!user) return
    
    // Creator is never considered "participated"
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
      console.error('[HACKATHON] Failed to check participation status:', error)
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
          title: project.title,
          team: project.team?.name || project.creator?.username || t('project.individual'),
          members: project.team?._count?.members || 1,
          track: project.category || t('project.uncategorized'),
          likes: project._count?.likes || 0,
          comments: project._count?.comments || 0,
          feedbacks: project._count?.feedbacks || 0,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        }))
        
        // Update projects in hackathon
        setHackathon(prev => prev ? { ...prev, projects } as Hackathon : null)
      }
    } catch (error) {
      console.error('[HACKATHON] Failed to get project list:', error)
    }
  }

  // Helper function: Determine hackathon status based on dates
  const getHackathonStatus = (startDate: string, endDate: string): 'upcoming' | 'ongoing' | 'ended' => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (now < start) return 'upcoming'
    if (now >= start && now <= end) return 'ongoing'
    return 'ended'
  }

  // Check if registration is allowed
  const canRegister = (hackathon: Hackathon) => {
    const now = new Date()
    const registrationStart = hackathon.registrationStartDate ? new Date(hackathon.registrationStartDate) : null
    const registrationEnd = new Date(hackathon.registrationDeadline)
    
    // If registration start time is set, check if registration time has arrived
    if (registrationStart && now < registrationStart) {
      return { canRegister: false, reason: t('registration.notStarted') }
    }
    
    // Check if registration deadline has passed
    if (now > registrationEnd) {
      return { canRegister: false, reason: t('registration.expired') }
    }
    
    return { canRegister: true, reason: '' }
  }

  // Check if project submission is allowed
  const canSubmitProject = (hackathon: Hackathon) => {
    const now = new Date()
    const hackathonStart = new Date(hackathon.startDate)
    const hackathonEnd = new Date(hackathon.endDate)
    
    // Project submission must be after hackathon starts
    if (now < hackathonStart) {
      return { canSubmit: false, reason: t('submission.notStarted') }
    }
    
    // Project submission must be before hackathon ends
    if (now > hackathonEnd) {
      return { canSubmit: false, reason: t('submission.ended') }
    }
    
    return { canSubmit: true, reason: '' }
  }

  // Extract fetchHackathon function to component level for other functions to call
  const fetchHackathon = useCallback(async () => {
      // Prevent duplicate calls
      if (isFetchingRef.current) {
        console.log('[HACKATHON] ⏳ Fetching in progress, skipping duplicate call')
        return
      }
      
      try {
        isFetchingRef.current = true
        setIsLoading(true)
        console.log('[HACKATHON] 🔍 Fetching hackathon details:', params.id)
        const response = await apiService.getHackathon(params.id as string)
        console.log('[HACKATHON] 📡 API response:', response)
        
        if (response.success && response.data) {
          const hackathonData = response.data.hackathon
          
          // Convert API data to the format required by the page
          const formattedHackathon: Hackathon = {
            id: hackathonData.id,
            title: hackathonData.title,
            description: hackathonData.description,
            longDescription: hackathonData.description, // 可以从metadata中获取更详细描述
            startDate: hackathonData.startDate,
            endDate: hackathonData.endDate,
            registrationStartDate: (hackathonData as any).registrationStartDate,
            registrationDeadline: hackathonData.registrationDeadline || hackathonData.startDate,
            status: getHackathonStatus(hackathonData.startDate, hackathonData.endDate),
            participants: hackathonData._count?.participations || 0,
            maxParticipants: hackathonData.maxParticipants,
            totalPrize: hackathonData.prizePool ? `$${hackathonData.prizePool.toLocaleString()}` : t('prize.pending'),
            location: t('location.globalOnline'), // 可以从metadata中获取
            organizer: {
              name: hackathonData.organizer?.username || 'Unknown',
              avatar: hackathonData.organizer?.avatarUrl || '/placeholder.svg',
              description: t('organizer.description') // bio字段不在API返回中
            },
            organizerId: hackathonData.organizer?.id || '', // 添加组织者ID用于权限判断
            tags: hackathonData.tags || [],
            coverImage: getIPFSImageUrl(hackathonData.metadata?.coverImage, '/placeholder.svg?height=400&width=800'),
            // ⭐ 使用真实的奖项数据
            prizes: hackathonData.metadata?.prizes && Array.isArray(hackathonData.metadata.prizes) 
              ? hackathonData.metadata.prizes.map((prize: any) => {
                  const singleAmount = prize.amount || 0
                  const winnerCount = prize.winnerCount || 1
                  const totalAmount = singleAmount * winnerCount // ⭐ 计算该奖项的总金额
                  
                  return {
                    name: prize.name || t('prize.rankName', { rank: prize.rank }), // ⭐ 使用正确的name字段
                    amount: formatPrizeAmount(singleAmount, winnerCount), // ⭐ 使用工具函数格式化金额
                    description: prize.description || t('prize.rankDescription', { rank: prize.rank }),
                    winnerCount: winnerCount // ⭐ 添加获奖人数
                  }
                })
              : [{
                  name: t('prize.firstPrize'),
                  amount: hackathonData.prizePool ? `$${Math.floor(hackathonData.prizePool * 0.5).toLocaleString()}` : '$10,000',
                  description: t('prize.bestProject')
                }],
            // ⭐ 使用真实的赛道数据
            tracks: hackathonData.metadata?.tracks && Array.isArray(hackathonData.metadata.tracks)
              ? hackathonData.metadata.tracks.map((track: any) => ({
                  name: track.name || t('track.unnamed'),
                  description: track.description || t('track.noDescription')
                }))
              : hackathonData.categories.map((category: string) => ({
                  name: category,
                  description: t('track.categoryRelated', { category })
                })) || [{
                  name: t('track.open'),
                  description: t('track.openDescription')
                }],
            rules: typeof hackathonData.rules === 'string' 
              ? hackathonData.rules.split('\n').filter(rule => rule.trim()) 
              : (Array.isArray(hackathonData.rules) ? hackathonData.rules : [t('rules.default')]),
            requirements: typeof hackathonData.requirements === 'string'
              ? hackathonData.requirements.split('\n').filter(req => req.trim())
              : (Array.isArray(hackathonData.requirements) ? hackathonData.requirements : [t('requirements.none')]),
            // ⭐ 使用真实的评审标准
            judgingCriteria: hackathonData.metadata?.judgingCriteria && Array.isArray(hackathonData.metadata.judgingCriteria)
              ? hackathonData.metadata.judgingCriteria.map((criteria: any) => 
                  typeof criteria === 'string' ? criteria : (criteria.description || criteria.category || t('criteria.unnamed'))
                )
              : [
                  t('criteria.innovation'),
                  t('criteria.completion'), 
                  t('criteria.userExperience'),
                  t('criteria.businessValue')
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
                    title: t('timeline.hackingStart'),
                    description: t('timeline.hackingStartDesc'),
                    completed: false
                  },
                  {
                    date: hackathonData.endDate,
                    title: t('timeline.hackingEnd'),
                    description: t('timeline.submissionDeadline'),
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
                  company: judge.bio || t('judge.defaultTitle')
                }))
              : [],
            // ⭐ 使用真实的社交链接数据
            socialLinks: (hackathonData as any).metadata?.socialLinks || {},
            projects: [] // 将在fetchProjects中填充
          }
          
          setHackathon(formattedHackathon)
          
          // Fetch project data with new API
          await loadProjects(hackathonData.id, filterValues)
          
          // Check if current user has joined
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
        console.error('[HACKATHON] Failed to get hackathon details:', error)
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
        title: t('auth.loginRequired'),
        description: t('auth.loginToJoin'),
        variant: 'destructive',
      })
      return
    }

    if (!hackathon) return

    // Creator cannot join their own hackathon
    if (user.id === hackathon.organizerId) {
      toast({
        title: t('auth.cannotJoin'),
        description: t('auth.creatorRestriction'),
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await apiService.joinHackathon(hackathon.id)
      
      if (response.success) {
        setIsJoined(true)
        toast({
          title: t('actions.joinSuccess'),
          description: t('actions.joinSuccessDesc'),
        })
        
        // Reload hackathon data to update participant count
        fetchHackathon()
      } else {
        throw new Error(response.error || t('actions.joinFailedError'))
      }
    } catch (error) {
      console.error('[HACKATHON] Join hackathon failed:', error)
      toast({
        title: t('actions.joinFailed'),
        description: error instanceof Error ? error.message : t('actions.networkError'),
        variant: 'destructive',
      })
    }
  }


  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: t('actions.linkCopied'),
      description: t('actions.linkCopiedDesc'),
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
    <div className="min-h-screen bg-background">
      {/* 顶部横幅 - 140px 紧凑高度 - Flat Design 2.0 */}
      <div className="relative h-[140px] border-b border-border/50 overflow-hidden">
        {/* 背景图片层 */}
        <div className="absolute inset-0">
          <img
            src={hackathon.coverImage || "/placeholder.svg"}
            alt={hackathon.title}
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/95" />
        </div>
        
        {/* 内容层 */}
        <div className="container max-w-[1280px] mx-auto h-full relative px-4 md:px-6">
          <div className="h-full flex items-center justify-between gap-4">
            {/* 左侧：信息 */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* 小封面图 - 仅桌面显示 */}
              <div className="h-[90px] w-[120px] rounded-lg overflow-hidden border border-border/50 shrink-0 hidden lg:block">
                <img
                  src={hackathon.coverImage || "/placeholder.svg"}
                  alt={hackathon.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* 标题和元数据 */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* 状态徽章行 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${getStatusColor(hackathon.status)} text-xs h-6`}>
                    {getStatusText(hackathon.status)}
                  </Badge>
                  {hackathon.status === 'upcoming' && (
                    <Badge variant="secondary" className="text-xs h-6">
                      <Timer className="h-3 w-3 mr-1" />
                      {getDaysUntil(hackathon.startDate)}d left
                    </Badge>
                  )}
                  {hackathon.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs h-6 hidden md:inline-flex">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                {/* 标题 */}
                <h1 className="text-xl md:text-2xl font-bold text-foreground line-clamp-1">
                  {hackathon.title}
                </h1>
                
                {/* 快速统计信息 */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span className="hidden sm:inline">{formatDate(hackathon.startDate)}</span>
                    <span className="sm:hidden">{new Date(hackathon.startDate).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{hackathon.participants}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-amber-500" />
                    <span className="font-semibold">{hackathon.totalPrize}</span>
                  </div>
                  {hackathon.location && (
                    <div className="flex items-center gap-1 hidden md:flex">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{hackathon.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 右侧：操作区 */}
            <div className="flex items-center gap-2 shrink-0">
              {/* 评委头像组 - 仅大屏显示 */}
              {hackathon.judges.length > 0 && (
                <div className="hidden xl:flex items-center -space-x-2">
                  {hackathon.judges.slice(0, 3).map((judge, index) => (
                    <Avatar key={index} className="h-7 w-7 border-2 border-background">
                      <AvatarImage src={judge.avatar} />
                      <AvatarFallback className="text-xs">{judge.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                  {hackathon.judges.length > 3 && (
                    <div className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
                      +{hackathon.judges.length - 3}
                    </div>
                  )}
                </div>
              )}
              
              {/* 分享按钮 */}
              <Button variant="outline" size="sm" onClick={handleShare} className="h-8 w-8 p-0">
                <Share2 className="h-3 w-3" />
              </Button>
              
              {/* 加入/已加入按钮 */}
              {user && user.id !== hackathon.organizerId && (() => {
                const registrationStatus = canRegister(hackathon)
                return registrationStatus.canRegister || isJoined ? (
                  <Button 
                    size="sm"
                    onClick={handleJoinHackathon}
                    disabled={isJoined || !registrationStatus.canRegister}
                    className="h-8 px-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                  >
                    {isJoined ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('status.joined')}
                      </>
                    ) : (
                      t('actions.joinNow')
                    )}
                  </Button>
                ) : null
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 - max-width 1280px */}
      <div className="container max-w-[1280px] mx-auto px-4 md:px-6 py-6">
        <div className="space-y-6">

        {/* 双栏布局：主内容 + 侧边栏(320px) */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 主内容区 - 自适应宽度 */}
          <div className="flex-1 min-w-0">
            {/* 紧凑Tab系统 - 48px高度 */}
            <Tabs defaultValue="overview" className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-1">
                <TabsList className="h-[48px] w-full grid grid-cols-5 bg-transparent border-0">
                  <TabsTrigger value="overview" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    {t('tabs.overview')}
                  </TabsTrigger>
                  <TabsTrigger value="prizes" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    {t('tabs.prizes')}
                  </TabsTrigger>
                  <TabsTrigger value="rules" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    {t('tabs.rules')}
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    {t('tabs.timeline')}
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    {t('tabs.projects')}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-6">
                {/* 时间安排信息 */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('schedule.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {hackathon.registrationStartDate && (
                        <div className="text-center p-4 border rounded-lg">
                          <div className="flex items-center justify-center mb-2">
                            <Timer className="h-5 w-5 text-green-600" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{t('schedule.registrationStart')}</p>
                          <p className="font-semibold text-sm">{formatDate(hackathon.registrationStartDate)}</p>
                        </div>
                      )}
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{t('schedule.registrationDeadline')}</p>
                        <p className="font-semibold text-sm">{formatDate(hackathon.registrationDeadline)}</p>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{t('schedule.eventStart')}</p>
                        <p className="font-semibold text-sm">{formatDate(hackathon.startDate)}</p>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <CheckCircle className="h-5 w-5 text-purple-600" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{t('schedule.eventEnd')}</p>
                        <p className="font-semibold text-sm">{formatDate(hackathon.endDate)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('sections.introduction')}</CardTitle>
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
                    <CardTitle>{t('sections.tracks')}</CardTitle>
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
                    <CardTitle>{t('sections.techStack')}</CardTitle>
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
                                <p className="text-sm text-muted-foreground">{t('prize.winnerCount', { count: (prize as any).winnerCount })}</p>
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
                    <CardTitle>{t('sections.rules')}</CardTitle>
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
                    <CardTitle>{t('sections.requirements')}</CardTitle>
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
                    <CardTitle>{t('sections.criteria')}</CardTitle>
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
                    <CardTitle>{t('sections.timeline')}</CardTitle>
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
                      <div className="text-2xl font-bold text-primary">{filteredProjects.length}</div>
                      <div className="text-sm text-muted-foreground">{t('stats.submittedProjects')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {new Set(filteredProjects.map(p => p.track)).size}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('stats.activeTracks')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {filteredProjects.reduce((sum, p) => sum + p.likes, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('stats.totalLikes')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {filteredProjects.reduce((sum, p) => sum + p.comments, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('stats.totalComments')}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* 项目过滤器 */}
                <ProjectFilter
                  filters={projectFilters}
                  values={filterValues}
                  onChange={handleFilterChange}
                  isLoading={isLoadingProjects}
                  totalResults={filteredProjects.length}
                />

                {/* 按赛道分组的项目 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{t('sections.projects')}</CardTitle>
                        <CardDescription>
                          {t('sections.projectsDescription')}
                        </CardDescription>
                      </div>
                      {/* 提交项目按钮 */}
                      {user && user.id !== hackathon.organizerId && isJoined && (() => {
                        const submitStatus = canSubmitProject(hackathon)
                        return submitStatus.canSubmit ? (
                          <Button asChild>
                            <Link href={`/hackathons/${hackathon.id}/submit`}>
                              <Code className="w-4 h-4 mr-2" />
                              {t('actions.submitProject')}
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
                    {isLoadingProjects ? (
                      <div className="text-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-muted-foreground">{tCommon('loading')}</p>
                      </div>
                    ) : filteredProjects.length > 0 ? (
                      <div className="space-y-6">
                        {hackathon.tracks.map((track) => {
                          const trackProjects = filteredProjects.filter(p => p.track === track.name)
                          if (trackProjects.length === 0) return null
                          
                          return (
                            <div key={track.name}>
                              <div className="flex items-center gap-2 mb-3">
                                <h4 className="font-semibold">{track.name}</h4>
                                <Badge variant="secondary">{t('stats.projectCount', { count: trackProjects.length })}</Badge>
                              </div>
                              <div className="grid gap-3">
                                {trackProjects.map((project) => (
                                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-medium">{project.name}</h5>
                                        <Badge variant="outline">
                                          {t('project.teamMembers', { count: project.members })}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {t('project.team', { name: project.team })}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <LikeButtonWithCount
                                        projectId={project.id}
                                        initialCount={project.likes || 0}
                                        className="text-sm"
                                      />
                                      <Button variant="outline" size="sm" asChild>
                                        <Link href={`/hackathons/${hackathon.id}/projects/${project.id}`}>
                                          {tCommon('viewDetails')}
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
                        <h3 className="text-lg font-semibold mb-2">{t('project.noProjects')}</h3>
                        <p className="text-muted-foreground mb-6">
                          {t('project.beFirst')}
                        </p>
                        {user && user.id !== hackathon.organizerId && isJoined && (() => {
                          const submitStatus = canSubmitProject(hackathon)
                          return submitStatus.canSubmit ? (
                            <Button asChild>
                              <Link href={`/hackathons/${hackathon.id}/submit`}>
                                {t('actions.submitProjectNow')}
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

          {/* 侧边栏 - 320px固定宽度 */}
          <aside className="lg:w-[320px] shrink-0">
            <div className="lg:sticky lg:top-20 space-y-4">
            {/* 快速操作卡片 - 紧凑设计 */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* 创建者身份提示 */}
                  {user && user.id === hackathon.organizerId && (
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        🎯 {t('creator.title')}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {t('creator.description')}
                      </div>
                    </div>
                  )}
                  
                  {/* 提交项目按钮 - 仅已加入的用户在提交期内可见 */}
                  {user && user.id !== hackathon.organizerId && isJoined && (() => {
                    const submitStatus = canSubmitProject(hackathon)
                    return submitStatus.canSubmit ? (
                      <Button className="w-full" size="lg" asChild>
                        <Link href={`/hackathons/${hackathon.id}/submit`}>
                          {t('actions.submitProject')}
                        </Link>
                      </Button>
                    ) : (
                      <Button className="w-full" size="lg" disabled>
                        {submitStatus.reason}
                      </Button>
                    )
                  })()}

                  {/* 评委仪表盘入口 - 仅JUDGE、ADMIN、MODERATOR角色可见 */}
                  {user && ['JUDGE', 'ADMIN', 'MODERATOR'].includes(user.role) && (
                    <Button asChild className="w-full" size="lg" variant="secondary">
                      <Link href="/judging/dashboard">
                        <Gavel className="h-4 w-4 mr-2" />
                        {t('actions.judgePanel')}
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 关键数据卡片 - 紧凑设计 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('stats.participation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {/* 参与进度 */}
                {hackathon.maxParticipants && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{t('stats.participants')}</span>
                      <span className="font-semibold">{hackathon.participants} / {hackathon.maxParticipants}</span>
                    </div>
                    <Progress value={participationProgress} className="h-1.5" />
                  </div>
                )}
                
                {/* 快速统计 */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{hackathon.projects.length}</div>
                    <div className="text-xs text-muted-foreground">{t('stats.projects')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{hackathon.tracks.length}</div>
                    <div className="text-xs text-muted-foreground">{t('stats.tracks')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{hackathon.prizes.length}</div>
                    <div className="text-xs text-muted-foreground">{t('stats.prizes')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 组织者信息 - 紧凑设计 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('organizer.title')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-start gap-2.5">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={hackathon.organizer.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{hackathon.organizer.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{hackathon.organizer.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {hackathon.organizer.description}
                    </p>
                    
                    {/* 社交链接 */}
                    {hackathon.socialLinks && Object.keys(hackathon.socialLinks).length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">{t('organizer.contact')}</p>
                        <div className="flex flex-wrap gap-2">
                          {hackathon.socialLinks.website && (
                            <a 
                              href={hackathon.socialLinks.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              🌐 {t('organizer.website')}
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

            {/* 评委团 - 紧凑设计 */}
            {hackathon.judges.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{t('judges.title')}</span>
                    <Badge variant="secondary" className="text-xs">{hackathon.judges.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2.5">
                    {hackathon.judges.slice(0, 5).map((judge, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={judge.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{judge.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">{judge.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {judge.title}
                          </p>
                        </div>
                      </div>
                    ))}
                    {hackathon.judges.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center pt-1">
                        +{hackathon.judges.length - 5} more
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 赞助商 - 紧凑设计 */}
            {hackathon.sponsors.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{t('sponsors.title')}</span>
                    <Badge variant="secondary" className="text-xs">{hackathon.sponsors.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2">
                    {hackathon.sponsors.slice(0, 6).map((sponsor, index) => (
                      <div key={index} className="text-center p-2 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                        <img
                          src={sponsor.logo || "/placeholder.svg"}
                          alt={sponsor.name}
                          className="h-6 w-auto mx-auto mb-1"
                        />
                        <p className="text-xs font-medium truncate">{sponsor.name}</p>
                        <Badge variant="outline" className="text-xs mt-0.5 h-4 px-1">
                          {sponsor.tier}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {hackathon.sponsors.length > 6 && (
                    <div className="text-xs text-muted-foreground text-center pt-2">
                      +{hackathon.sponsors.length - 6} more sponsors
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            </div>
          </aside>
        </div>
        </div>
      </div>
    </div>
  )
}
