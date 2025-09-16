'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEnumTranslations } from '@/lib/enum-utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Users, MapPin, Calendar, Star, UserPlus, MessageCircle, ExternalLink, Github, Globe, Mail, Settings, Crown, Loader2, AlertCircle, MessageSquare } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { apiService } from '@/lib/api'

interface TeamMember {
  id: string
  name: string
  avatar?: string
  role: string
  title?: string
  skills?: string[]
  bio?: string
  github?: string
  linkedin?: string
  joinedAt: Date
}

interface TeamActivity {
  id: string
  type: string
  message: string
  timestamp: Date
  user: { name: string; avatar?: string }
}

interface Team {
  id: string
  name: string
  description: string
  hackathonId: string
  hackathonName: string
  leaderId: string
  leaderName: string
  leaderAvatar?: string
  members: TeamMember[]
  maxMembers: number
  status: string
  techStack: string[]
  lookingFor?: string[]
  location?: string
  createdAt: Date
  isPublic: boolean
  projectIdea?: string
  contactInfo?: string
  socialLinks?: {
    github?: string
    website?: string
    twitter?: string
  }
  achievements?: Array<{
    name: string
    icon: string
    description: string
  }>
  activities?: TeamActivity[]
}

export default function TeamDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const { user } = useAuth()
  const t = useTranslations('teams.detail')
  const tCommon = useTranslations('common')
  const enumT = useEnumTranslations()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  
  // 邀请相关状态
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteUserId, setInviteUserId] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [applications, setApplications] = useState<any[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [reviewingApplications, setReviewingApplications] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (params.id) {
      loadTeam(params.id as string)
    }
  }, [params.id])

  // 当团队数据加载完成后，加载申请列表
  useEffect(() => {
    if (team && user && team.leaderId === user.id) {
      loadApplications()
    }
  }, [team, user])

  const loadTeam = async (teamId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getTeam(teamId)
      
      if (response.success && response.data) {
        const teamData = response.data.team
        // 转换数据格式以匹配组件期望的结构
        setTeam({
          id: teamData.id,
          name: teamData.name,
          description: teamData.description,
          hackathonId: teamData.hackathon.id,
          hackathonName: teamData.hackathon.title,
          leaderId: teamData.leader.id,
          leaderName: teamData.leader.username,
          leaderAvatar: teamData.leader.avatarUrl,
          members: teamData.members || [],
          maxMembers: teamData.maxMembers,
          status: 'recruiting', // 默认状态
          techStack: teamData.skills || [],
          createdAt: new Date(teamData.createdAt),
          isPublic: teamData.isPublic,
          activities: [],
          achievements: []
        })
      } else {
        setError(response.error || '获取团队信息失败')
        toast({
          title: '加载失败',
          description: response.error || '无法获取团队信息',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('获取团队信息错误:', error)
      setError('网络错误，请检查网络连接')
      toast({
        title: '网络错误',
        description: '请检查网络连接并重试',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleJoinTeam = async () => {
    if (!team) return
    
    setIsJoining(true)
    try {
      const response = await apiService.joinTeam(team.id)
      
      if (response.success) {
      toast({
        title: "申请已发送",
        description: "你的加入申请已发送给团队队长，请等待审核"
      })
        // 重新加载团队信息
        loadTeam(team.id)
      } else {
        toast({
          title: "申请失败",
          description: response.error || "发送申请时出现错误，请重试",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('加入团队错误:', error)
      toast({
        title: "申请失败",
        description: "发送申请时出现错误，请重试",
        variant: "destructive"
      })
    } finally {
      setIsJoining(false)
    }
  }

  // 邀请成员
  const handleInviteUser = async () => {
    if (!team || !inviteUserId.trim()) return
    
    setIsInviting(true)
    try {
      const response = await apiService.inviteToTeam(team.id, {
        userId: inviteUserId.trim(),
        message: inviteMessage.trim() || undefined
      })
      
      if (response.success) {
        toast({
          title: "邀请已发送",
          description: "已成功向用户发送团队邀请"
        })
        setInviteDialogOpen(false)
        setInviteUserId('')
        setInviteMessage('')
      } else {
        toast({
          title: "邀请失败",
          description: response.error || "发送邀请时出现错误",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('邀请用户错误:', error)
      toast({
        title: "邀请失败",
        description: "发送邀请时出现错误，请重试",
        variant: "destructive"
      })
    } finally {
      setIsInviting(false)
    }
  }

  // 加载申请列表
  const loadApplications = async () => {
    if (!team || !user || team.leaderId !== user.id) return

    setApplicationsLoading(true)
    try {
      const response = await apiService.getTeamApplications(team.id, {
        status: 'PENDING'
      })

      if (response.success && response.data) {
        setApplications(response.data.applications)
      }
    } catch (error) {
      console.error('加载申请列表失败:', error)
    } finally {
      setApplicationsLoading(false)
    }
  }

  // 审批申请
  const handleReviewApplication = async (applicationId: string, action: 'approve' | 'reject') => {
    if (!team || reviewingApplications.has(applicationId)) return

    setReviewingApplications(prev => new Set([...prev, applicationId]))

    try {
      const response = await apiService.reviewTeamApplication(team.id, applicationId, {
        action
      })

      if (response.success) {
        toast({
          title: action === 'approve' ? '申请已批准' : '申请已拒绝',
          description: response.message
        })

        // 重新加载申请列表和团队数据
        loadApplications()
        loadTeam(params.id as string)
      } else {
        throw new Error(response.error || '操作失败')
      }
    } catch (error) {
      console.error('审批申请失败:', error)
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '操作失败，请重试',
        variant: 'destructive'
      })
    } finally {
      setReviewingApplications(prev => {
        const newSet = new Set(prev)
        newSet.delete(applicationId)
        return newSet
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusText = enumT.getTeamStatusText(status)
    switch (status) {
      case 'recruiting':
        return <Badge variant="default">{statusText}</Badge>
      case 'full':
        return <Badge variant="secondary">{statusText}</Badge>
      case 'competing':
        return <Badge variant="outline">{statusText}</Badge>
      case 'completed':
        return <Badge variant="destructive">{statusText}</Badge>
      default:
        return <Badge variant="outline">{statusText}</Badge>
    }
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      return '无效日期'
    }
    return dateObj.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg">加载团队详情中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg">{error}</p>
          <Button onClick={() => loadTeam(params.id as string)} className="mt-4">
            重试
          </Button>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-lg">团队信息未找到</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        {/* 团队头部信息 */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">{team.name}</CardTitle>
                  {getStatusBadge(team.status)}
                </div>
                <CardDescription className="text-base mb-4">
                  {team.description}
                </CardDescription>
                
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {team.hackathonName}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {team.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {team.members.length}/{team.maxMembers} 成员
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {(() => {
                  if (!user) return null
                  
                  const isLeader = user.id === team.leaderId
                  const isMember = team.members?.some(member => member.id === user.id)
                  
                  if (isLeader) {
                    return (
                      <div className="space-y-2">
                        <Button variant="outline" disabled>
                          <Crown className="h-4 w-4 mr-2" />
                          团队创建者
                        </Button>
                        {team.status === 'recruiting' && team.members && team.members.length < team.maxMembers && (
                          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="default" size="sm">
                                <UserPlus className="h-4 w-4 mr-2" />
                                邀请成员
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>邀请成员加入团队</DialogTitle>
                                <DialogDescription>
                                  输入用户ID邀请其加入您的团队
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="userId">用户ID</Label>
                                  <Input
                                    id="userId"
                                    placeholder="输入要邀请的用户ID"
                                    value={inviteUserId}
                                    onChange={(e) => setInviteUserId(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="message">邀请消息 (可选)</Label>
                                  <Textarea
                                    id="message"
                                    placeholder="写一段邀请消息..."
                                    value={inviteMessage}
                                    onChange={(e) => setInviteMessage(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                                  取消
                                </Button>
                                <Button onClick={handleInviteUser} disabled={isInviting || !inviteUserId.trim()}>
                                  {isInviting ? '发送中...' : '发送邀请'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    )
                  }
                  
                  if (isMember) {
                    return (
                      <Button variant="outline" disabled>
                        <UserPlus className="h-4 w-4 mr-2" />
                        已加入团队
                      </Button>
                    )
                  }
                  
                  if (team.status === 'recruiting') {
                    return (
                      <Button onClick={handleJoinTeam} disabled={isJoining}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {isJoining ? '申请中...' : '申请加入'}
                      </Button>
                    )
                  }
                  
                  return null
                })()}
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  联系队长
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 标签页内容 */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className={`grid w-full ${user && team && team.leaderId === user.id ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
            <TabsTrigger value="members">{t('tabs.members')}</TabsTrigger>
            <TabsTrigger value="project">{t('tabs.project')}</TabsTrigger>
            <TabsTrigger value="activity">{t('tabs.activity')}</TabsTrigger>
            {user && team && team.leaderId === user.id && (
              <TabsTrigger value="applications">
                {t('tabs.applications')}
                {applications.length > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {applications.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 主要信息 */}
              <div className="lg:col-span-2 space-y-6">
                {/* 技术栈 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">技术栈</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {team.techStack && team.techStack.length > 0 ? (
                        team.techStack.map(tech => (
                          <Badge key={tech} variant="secondary">{tech}</Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">暂未设置技术栈</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 招募需求 */}
                {team.lookingFor && team.lookingFor.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">招募职位</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {team.lookingFor.map(role => (
                          <Badge key={role} variant="outline">{role}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 项目想法 */}
                {team.projectIdea && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">项目想法</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {team.projectIdea}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* 侧边栏信息 */}
              <div className="space-y-6">
                {/* 团队统计 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">团队统计</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">创建时间</span>
                      <span>{formatDate(team.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">团队规模</span>
                      <span>{team.members.length}/{team.maxMembers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">招募状态</span>
                      <span>{team.status === 'recruiting' ? '招募中' : '已满员'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* 社交链接 */}
                {team.socialLinks && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">社交链接</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {team.socialLinks.github && (
                        <a 
                          href={team.socialLinks.github} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm hover:text-primary"
                        >
                          <Github className="h-4 w-4" />
                          GitHub
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {team.socialLinks.website && (
                        <a 
                          href={team.socialLinks.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm hover:text-primary"
                        >
                          <Globe className="h-4 w-4" />
                          官网
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {team.contactInfo && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4" />
                          {team.contactInfo}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* 团队成就 */}
                {team.achievements && team.achievements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">团队成就</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {team.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-2xl">{achievement.icon}</span>
                          <div>
                            <div className="font-medium text-sm">{achievement.name}</div>
                            <div className="text-xs text-muted-foreground">{achievement.description}</div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {team.members && team.members.length > 0 ? team.members.map(member => (
                <Card key={member.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={member.avatar || "/placeholder.jpg"} />
                        <AvatarFallback>{member.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{member.name}</h3>
                          {member.id === team.leaderId && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{member.title}</p>
                        <p className="text-sm mb-3">{member.bio}</p>
                        
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {member.skills && member.skills.map(skill => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>加入时间: {formatDate(member.joinedAt)}</span>
                            {member.github && (
                              <a 
                                href={member.github} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-primary"
                              >
                                <Github className="h-3 w-3" />
                                GitHub
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-full text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">暂无团队成员</h3>
                  <p className="text-muted-foreground">团队还没有成员加入</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="project" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>项目信息</CardTitle>
                <CardDescription>
                  团队正在开发的项目详情
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🚧</div>
                  <h3 className="text-lg font-medium mb-2">项目开发中</h3>
                  <p className="text-muted-foreground">
                    团队正在努力开发项目，敬请期待！
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>团队动态</CardTitle>
                <CardDescription>
                  团队的最新活动和更新
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {team.activities && team.activities.length > 0 ? team.activities.map((activity, index) => (
                    <div key={activity.id}>
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.user.avatar || "/placeholder.jpg"} />
                          <AvatarFallback>{activity.user.name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.timestamp.toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      {index < (team.activities?.length || 0) - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">暂无团队动态</h3>
                      <p className="text-muted-foreground">团队还没有任何活动记录</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 申请管理标签页 - 只有团队领导可见 */}
          {user && team && team.leaderId === user.id && (
            <TabsContent value="applications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>申请管理</CardTitle>
                  <CardDescription>
                    管理用户的加入申请
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {applicationsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">暂无申请</h3>
                      <p className="text-muted-foreground">还没有用户申请加入团队</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((application) => (
                        <Card key={application.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={application.user.avatarUrl || "/placeholder.jpg"} />
                                  <AvatarFallback>{application.user.username?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium">{application.user.username}</h4>
                                    <Badge variant="outline">
                                      声誉: {application.user.reputationScore}
                                    </Badge>
                                  </div>
                                  {application.user.bio && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {application.user.bio}
                                    </p>
                                  )}
                                  {application.skills && application.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {application.skills.map((skill: string, index: number) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  {application.message && (
                                    <div className="mt-3 p-3 bg-muted rounded-md">
                                      <p className="text-sm">{application.message}</p>
                                    </div>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-2">
                                    申请时间: {new Date(application.createdAt).toLocaleString('zh-CN')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleReviewApplication(application.id, 'approve')}
                                  disabled={reviewingApplications.has(application.id)}
                                >
                                  {reviewingApplications.has(application.id) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    '批准'
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReviewApplication(application.id, 'reject')}
                                  disabled={reviewingApplications.has(application.id)}
                                >
                                  拒绝
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
