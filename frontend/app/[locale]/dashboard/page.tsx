'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Trophy, Calendar, Users, Star, Plus, Settings, Code, HelpCircle, Edit, Save, X, Upload, Bookmark, Heart, MessageSquare, TrendingUp, Activity, Target, Zap, Sparkles, Award, Clock, BarChart3, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { AchievementDisplay } from '@/components/dashboard/achievement-display'
import { ActivityTimeline } from '@/components/dashboard/activity-timeline'
import { ReputationChart } from '@/components/dashboard/reputation-chart'
import { EnhancedStats } from '@/components/dashboard/enhanced-stats'
import { CredentialsManagement } from '@/components/dashboard/credentials-management'

interface DashboardStats {
  participatedHackathons: number
  submittedProjects: number
  wonPrizes: number
  reputationScore: number
}

interface RecentActivity {
  id: string
  type: 'hackathon_joined' | 'project_submitted' | 'prize_won' | 'team_joined'
  title: string
  description: string
  date: string
  hackathonName?: string
}

interface UserHackathon {
  id: string
  name: string
  description?: string
  status: string
  role: string
  relationshipType: 'participant' | 'organizer' // participant or organizer
  joinedAt: string
  date: string
  prizePool?: number
  categories: string[]
  participationStatus: string
}

interface UserProject {
  id: string
  name: string
  description?: string
  hackathon: string
  hackathonId: string
  status: string
  score?: string
  rank?: string
  role: string
  teamName?: string
  teamMembers: number
  createdAt: string
  updatedAt: string
  ipfsHash?: string
  repositoryUrl?: string
  demoUrl?: string
}

interface UserTeam {
  id: string
  name: string
  description?: string
  hackathon: string
  hackathonId: string
  status: string
  role: string
  members: number
  membersList: Array<{
    id: string
    username: string
    avatarUrl?: string
    role: string
  }>
  projects: Array<{
    id: string
    title: string
    status: string
  }>
  createdAt: string
  maxMembers?: number
  skills: string[]
  isPublic: boolean
}

interface RecommendedHackathon {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  registrationDeadline?: string
  prizePool?: number
  categories: string[]
  tags: string[]
  participantCount: number
  maxParticipants?: number
  organizer: {
    username: string
    avatarUrl?: string
  }
  daysUntilStart: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const dashboardRef = useRef<HTMLDivElement>(null)
  
  // 格式化钱包地址显示
  const formatWalletAddress = (address: string | undefined): string => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  const [isVisible, setIsVisible] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [stats, setStats] = useState<DashboardStats>({
    participatedHackathons: 0,
    submittedProjects: 0,
    wonPrizes: 0,
    reputationScore: 0,
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [userHackathons, setUserHackathons] = useState<UserHackathon[]>([])
  const [userProjects, setUserProjects] = useState<UserProject[]>([])
  const [userTeams, setUserTeams] = useState<UserTeam[]>([])
  const [recommendedHackathons, setRecommendedHackathons] = useState<RecommendedHackathon[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTabs, setLoadingTabs] = useState({
    hackathons: false,
    projects: false,
    teams: false,
    recommendations: false
  })
  
  // Edit user profile states
  const [isEditing, setIsEditing] = useState(false)
  // My community overview
  const [communityOverview, setCommunityOverview] = useState<null | {
    counts: { bookmarks: number; likes: number; myPosts: number; following: number }
    previews: { 
      bookmarks: { id: string; title: string }[]
      likes: { id: string; title: string }[]
      myPosts: { id: string; title: string }[]
      following: { id: string; name: string; avatar?: string }[]
    }
  }>(null)
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    avatarUrl: user?.avatarUrl || '',
    skills: Array.isArray(user?.skills) ? user.skills : []
  })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 页面进入动画
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // 鼠标跟踪
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dashboardRef.current) {
        const rect = dashboardRef.current.getBoundingClientRect()
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        })
      }
    }

    const dashboard = dashboardRef.current
    if (dashboard) {
      dashboard.addEventListener('mousemove', handleMouseMove)
      return () => dashboard.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Sync user info to edit form
  useEffect(() => {
    if (user) {
      setEditForm({
        username: user.username || '',
        avatarUrl: user.avatarUrl || '',
        skills: Array.isArray(user.skills) ? user.skills : []
      })
    }
  }, [user?.id]) // 只依赖user.id避免重复渲染

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        const response = await apiService.getUserStats()
        
        if (response.success && response.data) {
          setStats(response.data.stats)
          // 确保类型匹配
          const activities = response.data.recentActivities.map(activity => ({
            ...activity,
            type: activity.type as 'hackathon_joined' | 'project_submitted' | 'prize_won' | 'team_joined'
          }))
          setRecentActivities(activities)
        } else {
          console.error(t('errors.getUserStats'), response.error)
          // 如果API失败，显示默认数据
          setStats({
            participatedHackathons: 0,
            submittedProjects: 0,
            wonPrizes: 0,
            reputationScore: user.reputationScore || 0,
          })
        }
      } catch (error) {
        console.error(t('errors.getUserStats'), error)
        // 显示默认数据
        setStats({
          participatedHackathons: 0,
          submittedProjects: 0,
          wonPrizes: 0,
          reputationScore: user.reputationScore || 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserStats()
    fetchRecommendedHackathons()
  }, [user?.id]) // 只依赖user.id避免重复渲染

  // 获取推荐黑客松
  const fetchRecommendedHackathons = async () => {
    try {
      setLoadingTabs(prev => ({ ...prev, recommendations: true }))
      const response = await apiService.getRecommendedHackathons(3)
      
      if (response.success && response.data) {
        setRecommendedHackathons(response.data.hackathons)
      }
    } catch (error) {
      console.error(t('errors.getRecommendations'), error)
    } finally {
      setLoadingTabs(prev => ({ ...prev, recommendations: false }))
    }
  }

  // 获取用户黑客松数据
  const fetchUserHackathons = async () => {
    if (!user) return
    
    try {
      setLoadingTabs(prev => ({ ...prev, hackathons: true }))
      const response = await apiService.getUserHackathons()
      
      if (response.success && response.data) {
        setUserHackathons(response.data.hackathons)
      }
    } catch (error) {
      console.error(t('errors.getUserHackathons'), error)
    } finally {
      setLoadingTabs(prev => ({ ...prev, hackathons: false }))
    }
  }

  // 获取用户项目数据
  const fetchUserProjects = async () => {
    if (!user) return
    
    try {
      setLoadingTabs(prev => ({ ...prev, projects: true }))
      const response = await apiService.getUserProjects()
      
      if (response.success && response.data) {
        setUserProjects(response.data.projects)
      }
    } catch (error) {
      console.error(t('errors.getUserProjects'), error)
    } finally {
      setLoadingTabs(prev => ({ ...prev, projects: false }))
    }
  }

  // 获取用户团队数据
  const fetchUserTeams = async () => {
    if (!user) return
    
    try {
      setLoadingTabs(prev => ({ ...prev, teams: true }))
      const response = await apiService.getUserTeams()
      
      if (response.success && response.data) {
        setUserTeams(response.data.teams)
      }
    } catch (error) {
      console.error(t('errors.getUserTeams'), error)
    } finally {
      setLoadingTabs(prev => ({ ...prev, teams: false }))
    }
  }

  // 上传头像到Pinata
  const handleAvatarUpload = async (file: File) => {
    try {
      setUploading(true)
      
      // 检查token
      const token = localStorage.getItem('hackx-token')
      if (!token) {
        toast({
          title: t('toasts.authRequired'),
          description: t('toasts.reloginRequired'),
          variant: "destructive"
        })
        return
      }
      
      const formData = new FormData()
      formData.append('file', file)
      
      console.log('🔄 开始上传头像，token前缀:', token.substring(0, 10))
      
      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log('✅ Avatar upload success, setting new URL:', data.data.url)
          // 添加时间戳防止缓存
          const newAvatarUrl = `${data.data.url}?t=${Date.now()}`
          setEditForm(prev => ({ 
            ...prev, 
            avatarUrl: newAvatarUrl 
          }))
          toast({
            title: t('toasts.avatarUploadSuccess'),
            description: t('toasts.avatarUploadSuccessDesc')
          })
        } else {
          console.error('Avatar upload failed:', data.error)
          toast({
            title: t('toasts.avatarUploadFailed'),
            description: data.error || t('toasts.avatarUploadRetry'),
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: t('toasts.avatarUploadFailed'),
          description: t('toasts.avatarUploadServerError'),
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast({
        title: t('toasts.avatarUploadFailed'),
        description: t('toasts.avatarUploadNetworkError'),
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  // 保存用户信息
  const handleSaveProfile = async () => {
    try {
      setUploading(true)
      
      const response = await apiService.updateUser({
        username: editForm.username,
        avatarUrl: editForm.avatarUrl,
        skills: editForm.skills
      })
      
      if (response.success) {
        // 更新本地用户信息 - 这里需要更新认证状态
        setIsEditing(false)
        toast({
          title: t('toasts.saveSuccess'),
          description: t('toasts.saveSuccessDesc')
        })
        // 可以考虑刷新页面或更新用户状态
        window.location.reload()
      } else {
        console.error('Save failed:', response.error)
        toast({
          title: t('toasts.saveFailed'),
          description: response.error || t('toasts.saveFailedRetry'),
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Save user info error:', error)
      toast({
        title: t('toasts.saveFailed'),
        description: t('toasts.saveNetworkError'),
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditForm({
      username: user?.username || '',
      avatarUrl: user?.avatarUrl || '',
      skills: Array.isArray(user?.skills) ? user.skills : []
    })
    setIsEditing(false)
  }

  // 触发文件选择
  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  // 文件选择变化
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('toasts.fileFormatError'),
          description: t('toasts.fileFormatDesc'),
          variant: "destructive"
        })
        return
      }
      
      // 检查文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('toasts.fileTooLarge'),
          description: t('toasts.fileTooLargeDesc'),
          variant: "destructive"
        })
        return
      }
      
      handleAvatarUpload(file)
    }
  }

  if (!user) {
    return (
      <div className="relative min-h-screen">
        {/* 动态背景 */}
        <div className="absolute inset-0 gradient-mesh opacity-20 -z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background -z-10" />
        
        <div className="container py-8 relative">
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="relative">
              <div className="glass border border-primary/20 rounded-3xl p-12 text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-primary rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <Users className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-gradient">{t('pleaseLogin')}</h1>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('pleaseLoginDesc')}
                  </p>
                  <div className="pt-4">
                    <Button className="bg-primary hover:bg-primary/90 hover-lift hover-glow" asChild>
                      <Link href="/auth/signin">
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t('login')}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
              {/* 装饰光环 */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/10 to-secondary/10 animate-pulse-slow -z-10" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={dashboardRef} className="relative min-h-screen">
      {/* 动态背景 */}
      <div className="absolute inset-0 gradient-mesh opacity-15 -z-10" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/90 to-background -z-10" />
      
      {/* 交互式浮动元素 */}
      <div className="absolute inset-0 -z-10">
        <div 
          className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float"
          style={{
            top: '10%',
            left: `${15 + mousePosition.x * 0.03}%`,
            animationDelay: '0s'
          }}
        />
        <div 
          className="absolute w-80 h-80 rounded-full bg-secondary/5 blur-3xl animate-float"
          style={{
            bottom: '15%',
            right: `${20 + mousePosition.y * 0.02}%`,
            animationDelay: '1.5s'
          }}
        />
      </div>

      {/* 装饰性元素 */}
      <div className="absolute top-32 left-10 w-2 h-2 bg-primary/30 rounded-full animate-pulse-slow" />
      <div className="absolute top-48 right-20 w-1 h-1 bg-secondary/40 rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />

      <div className="container py-8 relative">
        {/* 开发调试信息 */}
        
        <div className="space-y-8">
          {/* 现代化用户信息头部 */}
          <div className={`transition-all duration-1000 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
            <div className="glass border border-primary/10 rounded-3xl p-8 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {isEditing ? (
                    // 编辑模式的头像
                    <div className="relative">
                      <Avatar className="h-20 w-20 ring-2 ring-primary/30 hover:ring-primary/50 transition-all">
                        <AvatarImage 
                          src={editForm.avatarUrl} 
                          alt={t('profile.userAvatar')}
                          className="object-cover"
                          onLoad={() => {}}
                          onError={(e) => {}}
                        />
                        <AvatarFallback className="text-xl bg-gradient-primary text-primary-foreground">
                          {editForm.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full p-0 glass hover-lift border-primary/30"
                        onClick={handleFileSelect}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      {/* 编辑模式装饰光环 */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse-slow -z-10" />
                    </div>
                  ) : (
                    // 正常显示模式的头像
                    <div className="relative">
                      <Avatar className="h-20 w-20 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="text-xl bg-gradient-primary text-primary-foreground">
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {/* 声望等级指示器 */}
                      <div className="absolute -bottom-1 -right-1 bg-gradient-primary text-white text-xs px-2 py-1 rounded-full">
                        {Math.floor(stats.reputationScore / 100)}{t('level')}
                      </div>
                    </div>
                  )}
            
            <div>
              {isEditing ? (
                // 编辑模式的用户名和技术栈
                <div className="space-y-3">
                  <Input
                    value={editForm.username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    className="text-2xl font-bold h-auto p-1 bg-transparent border-dashed"
                    placeholder={t('profile.enterUsername')}
                  />
                  <p className="text-muted-foreground text-sm font-mono">{formatWalletAddress(user.walletAddress)}</p>
                  
                  {/* 技术栈编辑 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('profile.techStack')}</label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border rounded-md">
                        {Array.isArray(editForm.skills) && editForm.skills.length > 0 ? (
                          editForm.skills.map((skill: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                              {skill}
                              <button
                                type="button"
                                onClick={() => {
                                  const newSkills = editForm.skills.filter((_: string, i: number) => i !== index)
                                  setEditForm(prev => ({ ...prev, skills: newSkills }))
                                }}
                                className="ml-1 hover:text-red-500 text-xs"
                                aria-label={`Delete skill ${skill}`}
                              >
                                ×
                              </button>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">{t('profile.noTechStack')}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="skill-input"
                          placeholder={t('profile.addTechStack')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const value = e.currentTarget.value.trim()
                              if (value && value.length <= 50) {
                                const currentSkills = Array.isArray(editForm.skills) ? editForm.skills : []
                                if (!currentSkills.includes(value) && currentSkills.length < 20) {
                                  setEditForm(prev => ({ 
                                    ...prev, 
                                    skills: [...currentSkills, value] 
                                  }))
                                  e.currentTarget.value = ''
                                } else if (currentSkills.includes(value)) {
                                  // 技能已存在，给用户提示
                                  e.currentTarget.value = ''
                                  toast({
                                    title: t('profile.skillExists'),
                                    description: t('profile.skillExistsDesc'),
                                    variant: "destructive"
                                  })
                                } else if (currentSkills.length >= 20) {
                                  toast({
                                    title: t('profile.skillLimit'),
                                    description: t('profile.skillLimitDesc'),
                                    variant: "destructive"
                                  })
                                }
                              } else if (value.length > 50) {
                                toast({
                                  title: t('profile.skillTooLong'),
                                  description: t('profile.skillTooLongDesc'),
                                  variant: "destructive"
                                })
                              }
                            }
                          }}
                          className="flex-1"
                          maxLength={50}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById('skill-input') as HTMLInputElement
                            if (input) {
                              const value = input.value.trim()
                              if (value && value.length <= 50) {
                                const currentSkills = Array.isArray(editForm.skills) ? editForm.skills : []
                                if (!currentSkills.includes(value) && currentSkills.length < 20) {
                                  setEditForm(prev => ({ 
                                    ...prev, 
                                    skills: [...currentSkills, value] 
                                  }))
                                  input.value = ''
                                } else if (currentSkills.includes(value)) {
                                  input.value = ''
                                  toast({
                                    title: t('profile.skillExists'),
                                    description: t('profile.skillExistsDesc'),
                                    variant: "destructive"
                                  })
                                } else if (currentSkills.length >= 20) {
                                  toast({
                                    title: t('profile.skillLimit'), 
                                    description: t('profile.skillLimitDesc'),
                                    variant: "destructive"
                                  })
                                }
                              } else if (value.length > 50) {
                                toast({
                                  title: t('profile.skillTooLong'),
                                  description: t('profile.skillTooLongDesc'),
                                  variant: "destructive"
                                })
                              }
                            }
                          }}
                        >
                          {t('profile.addButton')}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('profile.skillInstructions')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // 正常显示模式
            <div>
              <h2 className="text-2xl font-bold">{user.username}</h2>
              <p className="text-muted-foreground font-mono">{formatWalletAddress(user.walletAddress)}</p>
                  {/* 技术栈展示 */}
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(user.skills) && user.skills.length > 0 ? (
                        user.skills.map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">{t('profile.notSetYet')}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
                  {/* 编辑/保存按钮 */}
                  <div className="flex gap-3">
                    {isEditing ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={uploading}
                          className="glass hover-lift border-destructive/30"
                        >
                          <X className="h-4 w-4 mr-2" />
                          {t('profile.cancel')}
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleSaveProfile}
                          disabled={uploading || !editForm.username.trim()}
                          className="bg-primary hover:bg-primary/90 hover-lift hover-glow"
                        >
                          {uploading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {t('profile.save')}
                        </Button>
                      </>
                    ) : (
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            console.log('🔧 点击编辑按钮，当前用户信息:', {
                              username: user.username,
                              avatarUrl: user.avatarUrl
                            })
                            setEditForm({
                              username: user.username || '',
                              avatarUrl: user.avatarUrl || '',
                              skills: Array.isArray(user.skills) ? user.skills : []
                            })
                            setIsEditing(true)
                          }}
                          className="glass hover-lift border-primary/30"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {t('profile.edit')}
                        </Button>
                        <Button 
                          className="bg-primary hover:bg-primary/90 hover-lift hover-glow"
                          asChild
                        >
                          <Link href="/hackathons">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('actions.joinNewHackathon')}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 背景装饰效果 */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-3xl" />
            </div>
          </div>

          {/* 现代化统计卡片 */}
          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: t('statistics.participatedHackathons'),
                    value: stats.participatedHackathons,
                    desc: t('statistics.participatedDesc'),
                    icon: Calendar,
                    gradient: 'from-blue-500 to-cyan-500',
                    delay: '0.1s'
                  },
                  {
                    title: t('statistics.submittedProjects'),
                    value: stats.submittedProjects,
                    desc: t('statistics.submittedDesc'),
                    icon: Code,
                    gradient: 'from-green-500 to-emerald-500',
                    delay: '0.2s'
                  },
                  {
                    title: t('statistics.wonPrizes'),
                    value: stats.wonPrizes,
                    desc: t('statistics.wonPrizesDesc'),
                    icon: Trophy,
                    gradient: 'from-yellow-500 to-orange-500',
                    delay: '0.3s',
                    tooltip: {
                      title: t('statistics.prizesTooltip.title'),
                      rules: [
                        t('statistics.prizesTooltip.rule1'),
                        t('statistics.prizesTooltip.rule2'),
                        t('statistics.prizesTooltip.rule3')
                      ]
                    }
                  },
                  {
                    title: t('statistics.reputationScore'),
                    value: stats.reputationScore,
                    desc: t('statistics.reputationScoreDesc'),
                    icon: Star,
                    gradient: 'from-purple-500 to-pink-500',
                    delay: '0.4s',
                    progress: (stats.reputationScore / 1000) * 100,
                    tooltip: {
                      title: t('statistics.reputationTooltip.title'),
                      rules: [
                        t('statistics.reputationTooltip.rule1'),
                        t('statistics.reputationTooltip.rule2'),
                        t('statistics.reputationTooltip.rule3'),
                        t('statistics.reputationTooltip.rule4')
                      ],
                      current: t('statistics.reputationTooltip.current', {
                        participated: stats.participatedHackathons,
                        projects: stats.submittedProjects,
                        prizes: stats.wonPrizes,
                        total: stats.reputationScore
                      })
                    }
                  }
                ].map((stat, index) => (
                  <div
                    key={stat.title}
                    className="animate-scale-in"
                    style={{ animationDelay: stat.delay }}
                  >
                    <div className="group relative glass border border-primary/10 hover:border-primary/30 rounded-2xl p-6 hover-lift hover-glow transition-all duration-500">
                      {/* 背景渐变效果 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-2xl" />
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            {stat.title}
                          </h3>
                          {stat.tooltip && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs glass border border-primary/20">
                                <div className="space-y-2">
                                  <p className="font-medium">{stat.tooltip.title}</p>
                                  <ul className="text-xs space-y-1">
                                    {stat.tooltip.rules.map((rule, i) => (
                                      <li key={i}>{rule}</li>
                                    ))}
                                  </ul>
                                  {stat.tooltip.current && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {stat.tooltip.current}
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.gradient} group-hover:scale-110 transition-transform duration-300`}>
                          <stat.icon className="h-5 w-5 text-white" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-gradient animate-shimmer">
                          {stat.value.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {stat.desc}
                        </p>
                        {stat.progress !== undefined && (
                          <div className="space-y-1">
                            <Progress 
                              value={stat.progress} 
                              className="mt-3 h-2 bg-muted/50"
                            />
                            <p className="text-xs text-muted-foreground text-right">
                              {Math.round(stat.progress)}% {t('toNextLevel')}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 装饰性边框光效 */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 animate-pulse-slow" />
                    </div>
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* 现代化主要内容区域 */}
          <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'}`}>
            <Tabs defaultValue="overview" className="space-y-6" onValueChange={async (value) => {
              // 当切换到对应tab时才加载数据，优化性能
              if (value === 'hackathons' && userHackathons.length === 0) {
                fetchUserHackathons()
              } else if (value === 'projects' && userProjects.length === 0) {
                fetchUserProjects()
              } else if (value === 'teams' && userTeams.length === 0) {
                fetchUserTeams()
              } else if (value === 'community' && !communityOverview) {
                console.log('🔍 [Dashboard] 开始加载我的社区概览...')
                try {
                  const me = await apiService.getCurrentUser()
                  console.log('🔍 [Dashboard] getCurrentUser响应:', {
                    success: me.success,
                    hasUser: !!me.data?.user,
                    hasCommunityOverview: !!me.data?.communityOverview
                  })
                  if (me.success && me.data?.communityOverview) {
                    console.log('🔍 [Dashboard] 设置社区概览数据:', me.data.communityOverview)
                    setCommunityOverview(me.data.communityOverview)
                  } else {
                    console.warn('⚠️ [Dashboard] 未获取到社区概览数据')
                  }
                } catch (e) {
                  console.error('❌ [Dashboard] 加载我的社区概览失败', e)
                }
              }
            }}>
              {/* 现代化标签导航 */}
              <div className="glass border border-primary/10 rounded-2xl p-2">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 bg-transparent gap-1">
                  {[
                    { value: 'overview', label: t('tabs.overview'), icon: Activity },
                    { value: 'enhanced', label: t('tabs.enhanced'), icon: BarChart3 },
                    { value: 'achievements', label: t('tabs.achievements'), icon: Award },
                    { value: 'activity', label: t('tabs.activity'), icon: Clock },
                    { value: 'reputation', label: t('tabs.reputation'), icon: Star },
                    { value: 'credentials', label: t('tabs.credentials'), icon: Shield },
                    { value: 'community', label: t('tabs.community'), icon: MessageSquare }
                  ].map((tab) => (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value}
                      className="glass hover-lift transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white"
                    >
                      <tab.icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* 现代化概览标签页 */}
              <TabsContent value="overview" className="space-y-6 animate-fade-in">
                {/* 快捷操作区域 */}
                <div className="glass border border-primary/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-primary rounded-xl">
                      <Zap className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{t('quickActions.title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('quickActions.description')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="glass hover-lift h-auto p-4 flex-col gap-2" asChild>
                      <Link href="/projects">
                        <Code className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{t('quickActions.projects')}</span>
                      </Link>
                    </Button>
                    <Button variant="outline" className="glass hover-lift h-auto p-4 flex-col gap-2" asChild>
                      <Link href="/hackathons">
                        <Trophy className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{t('quickActions.hackathons')}</span>
                      </Link>
                    </Button>
                    <Button variant="outline" className="glass hover-lift h-auto p-4 flex-col gap-2" asChild>
                      <Link href="/teams">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{t('quickActions.teams')}</span>
                      </Link>
                    </Button>
                    <Button variant="outline" className="glass hover-lift h-auto p-4 flex-col gap-2" asChild>
                      <Link href="/community">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{t('quickActions.community')}</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 现代化最近活动 */}
                  <div className="glass border border-primary/10 rounded-2xl p-6 relative overflow-hidden">
                    {/* 背景装饰 */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full -translate-y-6 translate-x-6" />
                    
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-primary rounded-xl">
                          <Activity className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{t('recentActivity.title')}</h3>
                          <p className="text-sm text-muted-foreground">{t('recentActivity.description')}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                          <div key={activity.id} className="flex items-start gap-4 p-3 glass rounded-xl border border-primary/10 hover:border-primary/30 transition-all duration-300">
                            <div className="mt-1">
                              {activity.type === 'project_submitted' && (
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                                  <Code className="h-4 w-4 text-white" />
                                </div>
                              )}
                              {activity.type === 'hackathon_joined' && (
                                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                                  <Calendar className="h-4 w-4 text-white" />
                                </div>
                              )}
                              {activity.type === 'prize_won' && (
                                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                                  <Trophy className="h-4 w-4 text-white" />
                                </div>
                              )}
                              {activity.type === 'team_joined' && (
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                                  <Users className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{activity.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-8">
                            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground">{t('recentActivity.noActivities')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 现代化推荐黑客松 */}
                  <div className="glass border border-primary/10 rounded-2xl p-6 relative overflow-hidden">
                    {/* 背景装饰 */}
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full translate-y-6 -translate-x-6" />
                    
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-primary rounded-xl">
                          <TrendingUp className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{t('recommendations.title')}</h3>
                          <p className="text-sm text-muted-foreground">{t('recommendations.description')}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {loadingTabs.recommendations ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
                            <p className="text-sm text-muted-foreground">{t('recommendations.loading')}</p>
                          </div>
                        ) : recommendedHackathons.length > 0 ? (
                          <div className="space-y-4">
                            {recommendedHackathons.map((hackathon, index) => (
                              <div key={hackathon.id} className="group p-4 glass rounded-xl border border-primary/10 hover:border-primary/30 transition-all duration-300">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-2 flex-1">
                                      <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">
                                        {hackathon.title}
                                      </h4>
                                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        {hackathon.description}
                                      </p>
                                    </div>
                                    <Button size="sm" variant="outline" className="glass hover-lift ml-3" asChild>
                                      <Link href={`/hackathons/${hackathon.id}`}>
                                        <Target className="w-3 h-3 mr-1" />
                                        {t('recommendations.view')}
                                      </Link>
                                    </Button>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {hackathon.categories.slice(0, 2).map(category => (
                                      <Badge key={category} variant="secondary" className="text-xs">
                                        {category}
                                      </Badge>
                                    ))}
                                    {hackathon.prizePool && (
                                      <Badge variant="outline" className="text-xs">
                                        <Zap className="w-3 h-3 mr-1" />
                                        ${hackathon.prizePool.toLocaleString()}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <p className="text-xs text-muted-foreground">
                                    {hackathon.daysUntilStart > 0 
                                      ? t('recommendations.daysUntilStart', { days: hackathon.daysUntilStart })
                                      : t('recommendations.inProgress')
                                    }
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground mb-4">{t('recommendations.noRecommendations')}</p>
                            <Button size="sm" variant="outline" className="glass hover-lift" asChild>
                              <Link href="/hackathons">
                                <Sparkles className="w-3 h-3 mr-1" />
                                {t('recommendations.browseAll')}
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* 其他标签页保持现有设计 */}
              <TabsContent value="hackathons" className="space-y-6 animate-fade-in">
            {/* 参与的黑客松 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('hackathons.participated')}</CardTitle>
                <CardDescription>{t('hackathons.participatedDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTabs.hackathons ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">{t('common.loading')}</p>
                  </div>
                ) : userHackathons.filter(h => h.relationshipType === 'participant').length > 0 ? (
                <div className="space-y-4">
                    {userHackathons.filter(h => h.relationshipType === 'participant').map((hackathon) => (
                      <div key={hackathon.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{hackathon.name}</h4>
                        <p className="text-sm text-muted-foreground">{hackathon.date}</p>
                          <div className="flex gap-2 flex-wrap">
                          <Badge variant={hackathon.status === t('hackathons.inProgress') ? 'default' : 'secondary'}>
                            {hackathon.status}
                          </Badge>
                          <Badge variant="outline">{hackathon.role}</Badge>
                            {hackathon.categories.slice(0, 2).map(category => (
                              <Badge key={category} variant="secondary" className="text-xs">{category}</Badge>
                            ))}
                            {hackathon.prizePool && (
                              <Badge variant="outline" className="text-xs">
                                奖金池: ${hackathon.prizePool.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/hackathons/${hackathon.id}`}>{t('hackathons.viewDetails')}</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('hackathons.noParticipated')}</p>
                    <Button className="mt-4" asChild>
                      <Link href="/hackathons">{t('hackathons.joinHackathons')}</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 创建的黑客松 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('hackathons.created')}</CardTitle>
                <CardDescription>{t('hackathons.createdDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTabs.hackathons ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">{t('common.loading')}</p>
                  </div>
                ) : userHackathons.filter(h => h.relationshipType === 'organizer').length > 0 ? (
                  <div className="space-y-4">
                    {userHackathons.filter(h => h.relationshipType === 'organizer').map((hackathon) => (
                      <div key={hackathon.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium">{hackathon.name}</h4>
                          <p className="text-sm text-muted-foreground">{hackathon.date}</p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant={hackathon.status === t('hackathons.inProgress') ? 'default' : 'secondary'}>
                              {hackathon.status}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">{t('hackathons.organizer')}</Badge>
                            {hackathon.categories.slice(0, 2).map(category => (
                              <Badge key={category} variant="secondary" className="text-xs">{category}</Badge>
                            ))}
                            {hackathon.prizePool && (
                              <Badge variant="outline" className="text-xs">
                                奖金池: ${hackathon.prizePool.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/hackathons/${hackathon.id}`}>{t('hackathons.viewDetails')}</Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/hackathons/${hackathon.id}/manage`}>{t('hackathons.manage')}</Link>
                          </Button>
                        </div>
                    </div>
                  ))}
                </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('hackathons.noCreated')}</p>
                    <Button className="mt-4" asChild>
                      <Link href="/hackathons/create">{t('hackathons.createHackathon')}</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('projects.title')}</CardTitle>
                <CardDescription>{t('projects.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTabs.projects ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">{t('common.loading')}</p>
                  </div>
                ) : userProjects.length > 0 ? (
                <div className="space-y-4">
                    {userProjects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">{project.hackathon}</p>
                          <div className="flex gap-2 flex-wrap">
                          <Badge variant={project.status === t('projects.status.submitted') ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                            <Badge variant="outline">{project.role}</Badge>
                          {project.score && <Badge variant="outline">{t('projects.score', { score: project.score })}</Badge>}
                          {project.rank && <Badge variant="outline">{project.rank}</Badge>}
                            {project.teamName && (
                              <Badge variant="secondary" className="text-xs">
                                {t('projects.team', { name: project.teamName, count: project.teamMembers })}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {project.repositoryUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={project.repositoryUrl} target="_blank">{t('projects.code')}</Link>
                            </Button>
                          )}
                          {project.demoUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={project.demoUrl} target="_blank">{t('projects.demo')}</Link>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/projects/${project.id}`}>{t('projects.viewProject')}</Link>
                          </Button>
                      </div>
                    </div>
                  ))}
                </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('projects.noProjects')}</p>
                    <Button className="mt-4" asChild>
                      <Link href="/hackathons">{t('projects.joinAndSubmit')}</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('teams.title')}</CardTitle>
                <CardDescription>{t('teams.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTabs.teams ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">{t('common.loading')}</p>
                  </div>
                ) : userTeams.length > 0 ? (
                <div className="space-y-4">
                    {userTeams.map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{team.name}</h4>
                        <p className="text-sm text-muted-foreground">{team.hackathon}</p>
                          <div className="flex gap-2 flex-wrap">
                          <Badge variant={team.status === t('teams.status.active') ? 'default' : 'secondary'}>
                            {team.status}
                          </Badge>
                          <Badge variant="outline">{team.role}</Badge>
                          <Badge variant="outline">{t('teams.members', { count: team.members })}</Badge>
                            {team.projects.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {t('teams.projects', { count: team.projects.length })}
                              </Badge>
                            )}
                          </div>
                          {team.description && (
                            <p className="text-xs text-muted-foreground">{team.description}</p>
                          )}
                          {team.skills.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {team.skills.slice(0, 3).map(skill => (
                                <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/teams/${team.id}`}>{t('teams.viewTeam')}</Link>
                          </Button>
                          {team.role === t('teams.teamLeader') && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/teams/${team.id}/manage`}>{t('teams.manageTeam')}</Link>
                            </Button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('teams.noTeams')}</p>
                    <Button className="mt-4" asChild>
                      <Link href="/teams">{t('teams.findTeams')}</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 我的社区标签页 */}
          <TabsContent value="community" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 我的收藏 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bookmark className="w-5 h-5" />
                    {t('community.myBookmarks')} {communityOverview ? `(${communityOverview.counts.bookmarks})` : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{t('community.viewBookmarksDesc')}</p>
                    <Button asChild>
                      <Link href="/community/bookmarks">{t('community.viewBookmarks')}</Link>
                    </Button>
                    {communityOverview?.previews.bookmarks?.length ? (
                      <ul className="mt-4 text-left text-sm space-y-2">
                        {communityOverview.previews.bookmarks.map(p => (
                          <li key={p.id} className="truncate">• {p.title}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              {/* 我的点赞 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    {t('community.myLikes')} {communityOverview ? `(${communityOverview.counts.likes})` : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{t('community.viewLikesDesc')}</p>
                    <Button asChild>
                      <Link href="/community/liked">{t('community.viewLikes')}</Link>
                    </Button>
                    {communityOverview?.previews.likes?.length ? (
                      <ul className="mt-4 text-left text-sm space-y-2">
                        {communityOverview.previews.likes.map(p => (
                          <li key={p.id} className="truncate">• {p.title}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              {/* 我的帖子 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {t('community.myPosts')} {communityOverview ? `(${communityOverview.counts.myPosts})` : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{t('community.managePosts')}</p>
                    <Button asChild>
                      <Link href="/community?author=me">{t('community.viewMyPosts')}</Link>
                    </Button>
                    {communityOverview?.previews.myPosts?.length ? (
                      <ul className="mt-4 text-left text-sm space-y-2">
                        {communityOverview.previews.myPosts.map(p => (
                          <li key={p.id} className="truncate">• {p.title}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              {/* 我的关注 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {t('community.myFollowing')} {communityOverview ? `(${communityOverview.counts.following})` : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{t('community.manageFollowing')}</p>
                    <Button asChild>
                      <Link href="/community/following">{t('community.viewFollowing')}</Link>
                    </Button>
                    {communityOverview?.previews.following?.length ? (
                      <ul className="mt-4 text-left text-sm space-y-2">
                        {communityOverview.previews.following.map(u => (
                          <li key={u.id} className="flex items-center gap-2 truncate">
                            <span className="inline-block w-4 h-4 rounded-full bg-muted" /> {u.name}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 增强统计标签页 */}
          <TabsContent value="enhanced" className="space-y-6">
            <EnhancedStats />
          </TabsContent>

          {/* 成就标签页 */}
          <TabsContent value="achievements" className="space-y-6">
            <AchievementDisplay />
          </TabsContent>

          {/* 活动记录标签页 */}
          <TabsContent value="activity" className="space-y-6">
            <ActivityTimeline />
          </TabsContent>

          {/* 声誉分析标签页 */}
          <TabsContent value="reputation" className="space-y-6">
            <ReputationChart />
          </TabsContent>

          {/* 凭证管理标签页 */}
          <TabsContent value="credentials" className="space-y-6">
            <CredentialsManagement />
          </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* 底部装饰性浮动元素 */}
        <div className="absolute bottom-20 right-10 w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse-slow" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-secondary/30 rounded-full animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>
    )
  }
