'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Trophy, Calendar, Users, Code, Star, Plus, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { apiService } from '@/lib/api'

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

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    participatedHackathons: 0,
    submittedProjects: 0,
    wonPrizes: 0,
    reputationScore: 0,
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        const response = await apiService.getUserStats()
        
        if (response.success && response.data) {
          setStats(response.data.stats)
          setRecentActivities(response.data.recentActivities)
        } else {
          console.error('获取用户统计数据失败:', response.error)
          // 如果API失败，显示默认数据
          setStats({
            participatedHackathons: 0,
            submittedProjects: 0,
            wonPrizes: 0,
            reputationScore: user.reputationScore || 0,
          })
        }
      } catch (error) {
        console.error('获取用户统计数据错误:', error)
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
  }, [user])

  if (!user) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">请先登录</h1>
          <Button asChild>
            <Link href="/auth/signin">登录</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="space-y-8">
                {/* 用户信息头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatarUrl || '/placeholder.svg'} />
              <AvatarFallback className="text-lg">{user.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user.username}</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4 mr-2" />
              设置
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">欢迎回来，{user.username}</h1>
            <p className="text-muted-foreground">继续你的黑客松之旅</p>
          </div>
          <Button asChild>
            <Link href="/hackathons">
              <Plus className="mr-2 h-4 w-4" />
              参加新的黑客松
            </Link>
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">参与黑客松</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.participatedHackathons}</div>
              <p className="text-xs text-muted-foreground">+2 相比上月</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">提交项目</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.submittedProjects}</div>
              <p className="text-xs text-muted-foreground">+1 相比上月</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">获得奖项</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.wonPrizes}</div>
              <p className="text-xs text-muted-foreground">+1 相比上月</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">声誉分数</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reputationScore}</div>
              <Progress value={85} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* 主要内容区域 */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="hackathons">我的黑客松</TabsTrigger>
            <TabsTrigger value="projects">我的项目</TabsTrigger>
            <TabsTrigger value="teams">我的团队</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 最近活动 */}
              <Card>
                <CardHeader>
                  <CardTitle>最近活动</CardTitle>
                  <CardDescription>你的最新动态</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="mt-1">
                        {activity.type === 'project_submitted' && <Code className="h-4 w-4 text-blue-500" />}
                        {activity.type === 'hackathon_joined' && <Calendar className="h-4 w-4 text-green-500" />}
                        {activity.type === 'prize_won' && <Trophy className="h-4 w-4 text-yellow-500" />}
                        {activity.type === 'team_joined' && <Users className="h-4 w-4 text-purple-500" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleDateString('zh-CN')}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 推荐黑客松 */}
              <Card>
                <CardHeader>
                  <CardTitle>推荐黑客松</CardTitle>
                  <CardDescription>基于你的技能和兴趣</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Web3 安全挑战赛</h4>
                        <p className="text-xs text-muted-foreground">专注于区块链安全的创新解决方案</p>
                        <div className="flex gap-1">
                          <Badge variant="secondary" className="text-xs">Solidity</Badge>
                          <Badge variant="secondary" className="text-xs">Security</Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">查看</Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">绿色科技创新大赛</h4>
                        <p className="text-xs text-muted-foreground">利用技术解决环境问题</p>
                        <div className="flex gap-1">
                          <Badge variant="secondary" className="text-xs">IoT</Badge>
                          <Badge variant="secondary" className="text-xs">Sustainability</Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">查看</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="hackathons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>我参与的黑客松</CardTitle>
                <CardDescription>你参加过的所有黑客松活动</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Web3 DeFi 创新挑战赛', status: '进行中', role: '参与者', date: '2024-01-15 - 2024-01-28' },
                    { name: 'AI × 区块链融合大赛', status: '已完成', role: '团队领导', date: '2023-12-01 - 2023-12-15' },
                    { name: 'NFT 创作者工具挑战赛', status: '已完成', role: '参与者', date: '2023-11-10 - 2023-11-24' },
                  ].map((hackathon, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{hackathon.name}</h4>
                        <p className="text-sm text-muted-foreground">{hackathon.date}</p>
                        <div className="flex gap-2">
                          <Badge variant={hackathon.status === '进行中' ? 'default' : 'secondary'}>
                            {hackathon.status}
                          </Badge>
                          <Badge variant="outline">{hackathon.role}</Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">查看详情</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>我的项目</CardTitle>
                <CardDescription>你提交的所有项目</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'DeFi 聚合器', hackathon: 'Web3 DeFi 创新挑战赛', status: '已提交', score: '85/100', rank: '第 3 名' },
                    { name: 'AI 驱动的智能合约审计工具', hackathon: 'AI × 区块链融合大赛', status: '已完成', score: '92/100', rank: '第 1 名' },
                    { name: 'NFT 创作平台', hackathon: 'NFT 创作者工具挑战赛', status: '已完成', score: '78/100', rank: '第 5 名' },
                  ].map((project, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">{project.hackathon}</p>
                        <div className="flex gap-2">
                          <Badge variant={project.status === '已提交' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                          {project.score && <Badge variant="outline">评分: {project.score}</Badge>}
                          {project.rank && <Badge variant="outline">{project.rank}</Badge>}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">查看项目</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>我的团队</CardTitle>
                <CardDescription>你参与的团队</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'DeFi Innovators', members: 4, role: '团队领导', hackathon: 'Web3 DeFi 创新挑战赛', status: '活跃' },
                    { name: 'AI Blockchain Pioneers', members: 3, role: '开发者', hackathon: 'AI × 区块链融合大赛', status: '已完成' },
                  ].map((team, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{team.name}</h4>
                        <p className="text-sm text-muted-foreground">{team.hackathon}</p>
                        <div className="flex gap-2">
                          <Badge variant={team.status === '活跃' ? 'default' : 'secondary'}>
                            {team.status}
                          </Badge>
                          <Badge variant="outline">{team.role}</Badge>
                          <Badge variant="outline">{team.members} 成员</Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">管理团队</Button>
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
