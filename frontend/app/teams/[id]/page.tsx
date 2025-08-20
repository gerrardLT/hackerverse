'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Users, MapPin, Calendar, Star, UserPlus, MessageCircle, ExternalLink, Github, Globe, Mail, Settings, Crown, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadTeam(params.id as string)
    }
  }, [params.id])

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recruiting':
        return <Badge variant="default">招募中</Badge>
      case 'full':
        return <Badge variant="secondary">已满员</Badge>
      case 'competing':
        return <Badge variant="outline">比赛中</Badge>
      case 'completed':
        return <Badge variant="destructive">已完成</Badge>
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
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
                {team.status === 'recruiting' && (
                  <Button onClick={handleJoinTeam} disabled={isJoining}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isJoining ? '申请中...' : '申请加入'}
                  </Button>
                )}
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="members">成员</TabsTrigger>
            <TabsTrigger value="project">项目</TabsTrigger>
            <TabsTrigger value="activity">动态</TabsTrigger>
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
                      {team.techStack.map(tech => (
                        <Badge key={tech} variant="secondary">{tech}</Badge>
                      ))}
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
              {team.members.map(member => (
                <Card key={member.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={member.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
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
              ))}
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
                  {team.activities && team.activities.map((activity, index) => (
                    <div key={activity.id}>
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
