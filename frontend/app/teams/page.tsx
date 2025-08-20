'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
import { Search, Plus, Users, MapPin, Calendar, Star, UserPlus, Bell, Filter, Loader2 } from 'lucide-react'
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
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [hackathonFilter, setHackathonFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

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
        setError(response.error || '获取团队列表失败')
        toast({
          title: '加载失败',
          description: response.error || '无法获取团队列表',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('加载团队列表错误:', error)
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

  // 加载团队邀请
  const loadInvitations = async () => {
    // 只在用户已登录时才加载邀请
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
      console.error('加载邀请失败:', error)
      // 不显示错误提示，因为可能是未登录导致的
    }
  }

  // 接受邀请
  const acceptInvitation = async (invitationId: string) => {
    if (!user) {
      toast({
        title: '请先登录',
        description: '需要登录才能接受邀请',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await apiService.acceptTeamInvitation(invitationId)
      
      if (response.success) {
        toast({
          title: '成功',
          description: '已接受团队邀请'
        })
        // 重新加载数据
        loadTeams()
        loadInvitations()
      } else {
        toast({
          title: '操作失败',
          description: response.error || '接受邀请失败',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('接受邀请失败:', error)
      toast({
        title: '操作失败',
        description: '接受邀请失败',
        variant: 'destructive'
      })
    }
  }

  // 拒绝邀请
  const declineInvitation = async (invitationId: string) => {
    if (!user) {
      toast({
        title: '请先登录',
        description: '需要登录才能拒绝邀请',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await apiService.declineTeamInvitation(invitationId)
      
      if (response.success) {
        toast({
          title: '成功',
          description: '已拒绝团队邀请'
        })
        // 重新加载邀请列表
        loadInvitations()
      } else {
        toast({
          title: '操作失败',
          description: response.error || '拒绝邀请失败',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('拒绝邀请失败:', error)
      toast({
        title: '操作失败',
        description: '拒绝邀请失败',
        variant: 'destructive'
      })
    }
  }

  // 初始加载
  useEffect(() => {
    loadTeams()
    loadInvitations()
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
      // 这里需要根据用户身份过滤，暂时显示所有团队
      return true
    }
    return true
  })

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
      default:
        return <Badge variant="secondary">招募中</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recruiting':
        return 'border-green-200 bg-green-50 dark:bg-green-950/20'
      case 'full':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20'
      case 'competing':
        return 'border-orange-200 bg-orange-50 dark:bg-orange-950/20'
      case 'completed':
        return 'border-gray-200 bg-gray-50 dark:bg-gray-950/20'
      default:
        return 'border-green-200 bg-green-50 dark:bg-green-950/20'
    }
  }

  return (
    <AuthGuard>
      <div className="container py-8">
        <div className="space-y-6">
          {/* 页面头部 */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">团队管理</h1>
              <p className="text-muted-foreground mt-2">
                发现团队、管理你的团队、处理邀请
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/teams/create">
                  <Plus className="w-4 h-4 mr-2" />
                  创建团队
                </Link>
              </Button>
            </div>
          </div>

          {/* 搜索和筛选 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="搜索团队..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="状态筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="recruiting">招募中</SelectItem>
                    <SelectItem value="full">已满员</SelectItem>
                    <SelectItem value="competing">比赛中</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={hackathonFilter} onValueChange={setHackathonFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="黑客松筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部黑客松</SelectItem>
                    <SelectItem value="web3-defi">Web3 DeFi 创新挑战赛</SelectItem>
                    <SelectItem value="ai-blockchain">AI × 区块链融合大赛</SelectItem>
                    <SelectItem value="nft-tools">NFT 创作者工具挑战赛</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 标签页 */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                全部团队
              </TabsTrigger>
              <TabsTrigger value="my-teams" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                我的团队
              </TabsTrigger>
              <TabsTrigger value="invitations" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                团队邀请
                {invitations.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {invitations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">加载团队中...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button onClick={loadTeams}>重试</Button>
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">没有找到团队</h3>
                  <p className="text-muted-foreground mb-4">
                    尝试调整搜索条件或创建新团队
                  </p>
                  <Button asChild>
                    <Link href="/teams/create">创建团队</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTeams.map((team) => (
                    <Card key={team.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">{team.name}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {team.description}
                            </CardDescription>
                          </div>
                          <Badge variant="default">招募中</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {team.hackathon?.title || '未知黑客松'}
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{team._count?.members || 0}/{team.maxMembers} 成员</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {team.leader?.id === 'alice' ? '队长' : '成员'}
                            </Badge>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" asChild className="flex-1">
                              <Link href={`/teams/${team.id}`}>
                                查看详情
                              </Link>
                            </Button>
                            <Button size="sm" asChild>
                              <Link href={`/teams/${team.id}/join`}>
                                <UserPlus className="h-4 w-4 mr-1" />
                                申请加入
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-teams" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeams.map((team) => (
                  <Card key={team.id} className="hover:shadow-md transition-shadow border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{team.name}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {team.description}
                          </CardDescription>
                        </div>
                        <Badge variant="default">招募中</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {team.hackathon?.title || '未知黑客松'}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{team._count?.members || 0}/{team.maxMembers} 成员</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {team.leader?.id === 'alice' ? '队长' : '成员'}
                          </Badge>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" asChild className="flex-1">
                            <Link href={`/teams/${team.id}`}>
                              管理团队
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="invitations" className="mt-6">
              {invitations.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">暂无邀请</h3>
                  <p className="text-muted-foreground">你目前没有收到任何团队邀请</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <Card key={invitation.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={invitation.inviterAvatar || "/placeholder.svg"} />
                            <AvatarFallback>{invitation.inviterName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{invitation.teamName}</h4>
                              <Badge variant="outline">团队邀请</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              来自 <span className="font-medium">{invitation.inviterName}</span> 的邀请
                            </p>
                            <p className="text-sm mb-4">{invitation.message}</p>
                            <div className="flex items-center gap-4">
                              <Button size="sm" onClick={() => acceptInvitation(invitation.id)}>接受邀请</Button>
                              <Button size="sm" variant="outline" onClick={() => declineInvitation(invitation.id)}>拒绝</Button>
                              <span className="text-xs text-muted-foreground">
                                {new Date(invitation.createdAt).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
