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
import { Calendar, Users, Trophy, Clock, MapPin, ExternalLink, Share2, Heart, Star, Code, Award, Target, CheckCircle, AlertCircle, Timer } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { formatDate, getDaysUntil } from '@/lib/utils'

interface Hackathon {
  id: string
  title: string
  description: string
  longDescription: string
  startDate: string
  endDate: string
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
  }>
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
  
  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoined, setIsJoined] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    // 模拟加载黑客松详情
    setTimeout(() => {
      setHackathon({
        id: params.id as string,
        title: 'Web3 DeFi 创新挑战赛',
        description: '构建下一代去中心化金融应用，重新定义金融服务的未来',
        longDescription: `
          Web3 DeFi 创新挑战赛是一个为期两周的全球性黑客松活动，旨在推动去中心化金融（DeFi）领域的创新发展。
          
          我们邀请全球的开发者、设计师、产品经理和区块链爱好者共同参与，构建能够解决现实金融问题的创新DeFi应用。
          
          无论你是经验丰富的区块链开发者，还是刚刚进入Web3世界的新手，这里都有适合你的赛道和挑战。
          
          加入我们，一起构建金融的未来！
        `,
        startDate: '2024-02-15T00:00:00Z',
        endDate: '2024-02-28T23:59:59Z',
        registrationDeadline: '2024-02-14T23:59:59Z',
        status: 'upcoming',
        participants: 1250,
        maxParticipants: 2000,
        totalPrize: '$50,000',
        location: '全球线上',
        organizer: {
          name: 'DeFi Labs',
          avatar: '/defi-labs.png',
          description: 'DeFi Labs 是领先的去中心化金融研究和开发机构，致力于推动DeFi生态的创新发展。'
        },
        tags: ['DeFi', 'Solidity', 'React', 'Web3', 'Ethereum', 'Smart Contracts'],
        coverImage: '/defi-hackathon.png',
        prizes: [
          {
            name: '一等奖',
            amount: '$20,000',
            description: '最具创新性和实用性的DeFi应用'
          },
          {
            name: '二等奖',
            amount: '$15,000',
            description: '技术实现优秀的DeFi解决方案'
          },
          {
            name: '三等奖',
            amount: '$10,000',
            description: '最佳用户体验DeFi产品'
          },
          {
            name: '最佳新手奖',
            amount: '$5,000',
            description: '新手团队的最佳作品'
          }
        ],
        tracks: [
          {
            name: 'DeFi 协议',
            description: '开发新的DeFi协议，如借贷、交易、保险等'
          },
          {
            name: '交易工具',
            description: '构建DeFi交易相关的工具和平台'
          },
          {
            name: '收益农场',
            description: '创新的流动性挖矿和收益优化方案'
          },
          {
            name: '跨链桥',
            description: '实现不同区块链之间的资产跨链'
          }
        ],
        rules: [
          '团队规模：1-5人',
          '项目必须是原创作品',
          '必须使用区块链技术',
          '代码必须开源',
          '提交完整的演示视频',
          '遵守平台使用条款'
        ],
        requirements: [
          '具备基本的区块链开发知识',
          '熟悉Solidity或其他智能合约语言',
          '了解DeFi基本概念',
          '能够在规定时间内完成项目开发'
        ],
        judgingCriteria: [
          '创新性 (30%)',
          '技术实现 (25%)',
          '用户体验 (20%)',
          '商业价值 (15%)',
          '演示效果 (10%)'
        ],
        timeline: [
          {
            date: '2024-02-10',
            title: '报名开始',
            description: '开放报名，组建团队',
            completed: true
          },
          {
            date: '2024-02-14',
            title: '报名截止',
            description: '报名通道关闭',
            completed: false
          },
          {
            date: '2024-02-15',
            title: '黑客松开始',
            description: '正式开始开发',
            completed: false
          },
          {
            date: '2024-02-28',
            title: '项目提交截止',
            description: '所有项目必须在此前提交',
            completed: false
          },
          {
            date: '2024-03-05',
            title: '评审结果公布',
            description: '公布获奖名单',
            completed: false
          }
        ],
        sponsors: [
          {
            name: 'Ethereum Foundation',
            logo: '/ethereum-foundation.png',
            tier: 'gold'
          },
          {
            name: 'Chainlink',
            logo: '/chainlink.png',
            tier: 'gold'
          },
          {
            name: 'Uniswap',
            logo: '/uniswap.png',
            tier: 'silver'
          }
        ],
        judges: [
          {
            name: 'Vitalik Buterin',
            avatar: '/vitalik.png',
            title: 'Co-founder',
            company: 'Ethereum'
          },
          {
            name: 'Hayden Adams',
            avatar: '/hayden.png',
            title: 'Founder',
            company: 'Uniswap'
          },
          {
            name: 'Sergey Nazarov',
            avatar: '/sergey.png',
            title: 'Co-founder',
            company: 'Chainlink'
          }
        ],
        projects: [
          {
            id: '1',
            name: 'DeFi Aggregator Pro',
            team: 'DeFi Innovators',
            members: 4,
            track: 'DeFi 协议'
          },
          {
            id: '2',
            name: 'Cross-Chain Bridge',
            team: 'Bridge Builders',
            members: 3,
            track: '跨链桥'
          }
        ]
      })
      setIsLoading(false)
      setLikeCount(Math.floor(Math.random() * 500) + 100)
    }, 1000)
  }, [params.id])

  const handleJoinHackathon = async () => {
    if (!user) {
      toast({
        title: '请先登录',
        description: '登录后才能参加黑客松',
        variant: 'destructive',
      })
      return
    }

    try {
      // 模拟加入黑客松
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsJoined(true)
      toast({
        title: '参加成功！',
        description: '你已成功参加这个黑客松',
      })
    } catch (error) {
      toast({
        title: '参加失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
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
          <h1 className="text-2xl font-bold mb-4">黑客松不存在</h1>
          <Button asChild>
            <Link href="/hackathons">返回黑客松列表</Link>
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
      case 'upcoming': return '即将开始'
      case 'ongoing': return '进行中'
      case 'ended': return '已结束'
      default: return '未知'
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
                    <p className="text-sm text-muted-foreground">开始时间</p>
                    <p className="font-semibold">{formatDate(hackathon.startDate)}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">持续时间</p>
                    <p className="font-semibold">14 天</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">总奖金</p>
                    <p className="font-semibold">{hackathon.totalPrize}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">地点</p>
                    <p className="font-semibold">{hackathon.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 详细信息标签页 */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">概览</TabsTrigger>
                <TabsTrigger value="prizes">奖项</TabsTrigger>
                <TabsTrigger value="rules">规则</TabsTrigger>
                <TabsTrigger value="timeline">时间线</TabsTrigger>
                <TabsTrigger value="projects">项目</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
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

              <TabsContent value="projects" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>已提交项目</CardTitle>
                    <CardDescription>
                      当前已有 {hackathon.projects.length} 个项目提交
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {hackathon.projects.length > 0 ? (
                      <div className="grid gap-4">
                        {hackathon.projects.map((project) => (
                          <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-semibold">{project.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                团队：{project.team} • {project.members} 人 • {project.track}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/projects/${project.id}`}>
                                查看项目
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">还没有项目提交</p>
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
                  {hackathon.status === 'upcoming' && (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleJoinHackathon}
                      disabled={isJoined}
                    >
                      {isJoined ? '已参加' : '立即参加'}
                    </Button>
                  )}
                  
                  {hackathon.status === 'ongoing' && user && (
                    <Button className="w-full" size="lg" asChild>
                      <Link href={`/hackathons/${hackathon.id}/submit`}>
                        提交项目
                      </Link>
                    </Button>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={handleLike}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      {likeCount}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
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
