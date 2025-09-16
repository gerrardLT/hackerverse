'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Trophy, Medal, Award, Star, Users, Target, Calendar, Crown, Gift, TrendingUp } from 'lucide-react'

interface ProjectResult {
  id: string
  name: string
  description: string
  team: string
  members: Array<{
    name: string
    avatar: string
  }>
  track: string
  technologies: string[]
  demoUrl?: string
  githubUrl?: string
  finalScore: number
  rank: number
  prize?: {
    name: string
    amount: string
    description: string
  }
  scores: {
    innovation: number
    technical: number
    design: number
    business: number
    presentation: number
  }
  judgeReviews: Array<{
    judgeName: string
    judgeAvatar: string
    score: number
    feedback: string
  }>
}

export default function ResultsPage() {
  const params = useParams()
  const [hackathon, setHackathon] = useState<any>(null)
  const [results, setResults] = useState<ProjectResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTrack, setSelectedTrack] = useState('all')

  useEffect(() => {
    // 模拟加载评审结果
    setTimeout(() => {
      setHackathon({
        id: params.id,
        title: 'Web3 DeFi 创新挑战赛',
        status: 'completed',
        totalPrize: '$50,000',
        participants: 1250,
        projects: 45,
        tracks: ['DeFi 协议', 'Trading Tools', 'Yield Farming', 'Cross-chain']
      })

      setResults([
        {
          id: '1',
          name: 'DeFi 聚合器 Pro',
          description: '一个创新的DeFi协议聚合器，帮助用户在多个协议间找到最优收益率',
          team: 'DeFi Innovators',
          members: [
            { name: 'Alice Chen', avatar: '/alice.png' },
            { name: 'Bob Wang', avatar: '/bob.png' },
            { name: 'Carol Li', avatar: '/carol.png' }
          ],
          track: 'DeFi 协议',
          technologies: ['Solidity', 'React', 'NodeJS', 'Web3JS'],
          demoUrl: 'https://demo1.com',
          githubUrl: 'https://github.com/team1/project',
          finalScore: 8.7,
          rank: 1,
          prize: {
            name: '一等奖',
            amount: '$20,000',
            description: '最具创新性和实用性的DeFi应用'
          },
          scores: {
            innovation: 9.2,
            technical: 8.5,
            design: 8.3,
            business: 9.0,
            presentation: 8.5
          },
          judgeReviews: [
            {
              judgeName: 'Vitalik Buterin',
              judgeAvatar: '/vitalik.png',
              score: 8.8,
              feedback: '非常创新的解决方案，技术实现扎实，用户体验良好。'
            },
            {
              judgeName: 'Hayden Adams',
              judgeAvatar: '/hayden.png',
              score: 8.6,
              feedback: '优秀的聚合器设计，建议进一步优化gas费用。'
            }
          ]
        },
        {
          id: '2',
          name: 'AI 驱动的智能合约审计工具',
          description: '使用机器学习技术自动检测智能合约中的安全漏洞',
          team: 'AI Security Labs',
          members: [
            { name: 'Eva Martinez', avatar: '/eva.png' },
            { name: 'Frank Johnson', avatar: '/frank.png' }
          ],
          track: 'DeFi 协议',
          technologies: ['Python', 'TensorFlow', 'Solidity', 'FastAPI'],
          demoUrl: 'https://demo2.com',
          githubUrl: 'https://github.com/team2/project',
          finalScore: 8.3,
          rank: 2,
          prize: {
            name: '二等奖',
            amount: '$15,000',
            description: '技术实现优秀的DeFi解决方案'
          },
          scores: {
            innovation: 8.8,
            technical: 9.0,
            design: 7.5,
            business: 8.0,
            presentation: 8.2
          },
          judgeReviews: [
            {
              judgeName: 'Andre Cronje',
              judgeAvatar: '/andre.png',
              score: 8.5,
              feedback: '技术方案很有前景，AI模型训练得很好。'
            }
          ]
        },
        {
          id: '3',
          name: 'NFT 创作平台',
          description: '为艺术家和创作者提供的一站式NFT创作、铸造和交易平台',
          team: 'Creative Builders',
          members: [
            { name: 'Helen Wu', avatar: '/helen.png' },
            { name: 'Ivan Petrov', avatar: '/ivan.png' }
          ],
          track: 'Trading Tools',
          technologies: ['React', 'IPFS', 'Ethereum', 'Next.js'],
          demoUrl: 'https://demo3.com',
          githubUrl: 'https://github.com/team3/project',
          finalScore: 7.9,
          rank: 3,
          prize: {
            name: '三等奖',
            amount: '$10,000',
            description: '最佳用户体验DeFi产品'
          },
          scores: {
            innovation: 7.5,
            technical: 7.8,
            design: 9.0,
            business: 7.5,
            presentation: 8.0
          },
          judgeReviews: []
        }
      ])

      setLoading(false)
    }, 1000)
  }, [params.id])

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!hackathon) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">黑客松不存在</h1>
          <Button asChild>
            <Link href="/hackathons">返回黑客松列表</Link>
          </Button>
        </div>
      </div>
    )
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <Trophy className="h-6 w-6 text-muted-foreground" />
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500 text-white">🥇 冠军</Badge>
      case 2:
        return <Badge className="bg-gray-400 text-white">🥈 亚军</Badge>
      case 3:
        return <Badge className="bg-amber-600 text-white">🥉 季军</Badge>
      default:
        return <Badge variant="outline">第 {rank} 名</Badge>
    }
  }

  const filteredResults = selectedTrack === 'all' 
    ? results 
    : results.filter(r => r.track === selectedTrack)

  return (
    <div className="container py-8">
      <div className="space-y-8">
        {/* 页面头部 */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-4xl font-bold">评审结果</h1>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="text-xl text-muted-foreground">
            {hackathon.title} - 最终排名和获奖名单
          </p>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Gift className="h-4 w-4 mr-2" />
            总奖金池: {hackathon.totalPrize}
          </Badge>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <div className="text-2xl font-bold">{hackathon.participants}</div>
              <div className="text-sm text-muted-foreground">参与者</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <div className="text-2xl font-bold">{hackathon.projects}</div>
              <div className="text-sm text-muted-foreground">提交项目</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <div className="text-2xl font-bold">{results.filter(r => r.prize).length}</div>
              <div className="text-sm text-muted-foreground">获奖项目</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <div className="text-2xl font-bold">{results.length > 0 ? results[0].finalScore.toFixed(1) : '0'}</div>
              <div className="text-sm text-muted-foreground">最高分</div>
            </CardContent>
          </Card>
        </div>

        {/* 主要内容 */}
        <Tabs defaultValue="ranking" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ranking">项目排名</TabsTrigger>
            <TabsTrigger value="winners">获奖名单</TabsTrigger>
            <TabsTrigger value="statistics">评审统计</TabsTrigger>
          </TabsList>

          <TabsContent value="ranking" className="space-y-6">
            {/* 赛道筛选 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">筛选赛道：</span>
              <Button
                variant={selectedTrack === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTrack('all')}
              >
                全部
              </Button>
              {hackathon.tracks.map((track: string) => (
                <Button
                  key={track}
                  variant={selectedTrack === track ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTrack(track)}
                >
                  {track}
                </Button>
              ))}
            </div>

            {/* 项目排名列表 */}
            <div className="space-y-4">
              {filteredResults.map((project) => (
                <Card key={project.id} className={`${project.rank <= 3 ? 'border-yellow-200 bg-yellow-50/50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                          {getRankIcon(project.rank)}
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold">{project.name}</h3>
                            {getRankBadge(project.rank)}
                            {project.prize && (
                              <Badge className="bg-green-500">
                                <Gift className="h-3 w-3 mr-1" />
                                {project.prize.amount}
                              </Badge>
                            )}
                          </div>

                          <p className="text-muted-foreground">{project.description}</p>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {project.team}
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {project.track}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {project.technologies.map((tech) => (
                              <Badge key={tech} variant="secondary" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>

                          {/* 团队成员 */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">团队成员：</span>
                            <div className="flex -space-x-2">
                              {project.members.map((member, index) => (
                                <Avatar key={index} className="h-6 w-6 border-2 border-background">
                                  <AvatarImage src={member.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {project.members.map(m => m.name).join(', ')}
                            </span>
                          </div>

                          {/* 评分详情 */}
                          <div className="grid grid-cols-5 gap-4 p-4 bg-muted rounded-lg">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-500">{project.scores.innovation.toFixed(1)}</div>
                              <div className="text-xs text-muted-foreground">创新性</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-500">{project.scores.technical.toFixed(1)}</div>
                              <div className="text-xs text-muted-foreground">技术实现</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-purple-500">{project.scores.design.toFixed(1)}</div>
                              <div className="text-xs text-muted-foreground">用户体验</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-orange-500">{project.scores.business.toFixed(1)}</div>
                              <div className="text-xs text-muted-foreground">商业价值</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-red-500">{project.scores.presentation.toFixed(1)}</div>
                              <div className="text-xs text-muted-foreground">演示效果</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div className="text-3xl font-bold text-primary">
                          {project.finalScore.toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">总分</div>
                        
                        <div className="flex gap-2">
                          {project.demoUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                                演示
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/projects/${project.id}`}>
                              详情
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* 评委反馈 */}
                    {project.judgeReviews.length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-medium mb-3">评委反馈</h4>
                        <div className="space-y-3">
                          {project.judgeReviews.map((review, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={review.judgeAvatar || "/placeholder.svg"} />
                                <AvatarFallback>{review.judgeName[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{review.judgeName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {review.score.toFixed(1)} 分
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{review.feedback}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="winners" className="space-y-6">
            <div className="grid gap-6">
              {results.filter(r => r.prize).map((project) => (
                <Card key={project.id} className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <CardContent className="p-8">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-3">
                        {getRankIcon(project.rank)}
                        <h2 className="text-2xl font-bold">{project.prize?.name}</h2>
                        {getRankIcon(project.rank)}
                      </div>
                      
                      <div className="text-4xl font-bold text-primary">
                        {project.prize?.amount}
                      </div>
                      
                      <p className="text-muted-foreground">{project.prize?.description}</p>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold">{project.name}</h3>
                        <p className="text-muted-foreground">{project.description}</p>
                        
                        <div className="flex items-center justify-center gap-4">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">{project.team}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{project.finalScore.toFixed(1)} 分</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2">
                          {project.members.map((member, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={member.avatar || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{member.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>评分分布</CardTitle>
                  <CardDescription>各评审维度的平均分数</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: '创新性', score: 8.2, color: 'bg-blue-500' },
                    { name: '技术实现', score: 8.1, color: 'bg-green-500' },
                    { name: '用户体验', score: 7.9, color: 'bg-purple-500' },
                    { name: '商业价值', score: 7.7, color: 'bg-orange-500' },
                    { name: '演示效果', score: 8.0, color: 'bg-red-500' }
                  ].map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.score.toFixed(1)}/10</span>
                      </div>
                      <Progress value={item.score * 10} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>赛道统计</CardTitle>
                  <CardDescription>各赛道的项目数量和平均分</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hackathon.tracks.map((track: string) => {
                    const trackProjects = results.filter(r => r.track === track)
                    const avgScore = trackProjects.length > 0 
                      ? trackProjects.reduce((sum, p) => sum + p.finalScore, 0) / trackProjects.length 
                      : 0
                    
                    return (
                      <div key={track} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{track}</h4>
                          <p className="text-sm text-muted-foreground">
                            {trackProjects.length} 个项目
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{avgScore.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">平均分</div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>评审完成情况</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-6xl font-bold text-green-500">100%</div>
                  <p className="text-lg">所有项目评审已完成</p>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{results.length}</div>
                      <div className="text-sm text-muted-foreground">已评审项目</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">3</div>
                      <div className="text-sm text-muted-foreground">评委人数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {results.reduce((sum, r) => sum + r.judgeReviews.length, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">评审总数</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
