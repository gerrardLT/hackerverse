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
import { Star, Users, Trophy, ExternalLink, Github, Play, Heart, Share2, Calendar, Code, Award, CheckCircle, Eye, Download, MessageCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

interface Project {
  id: string
  name: string
  description: string
  longDescription: string
  team: string
  members: Array<{
    name: string
    avatar: string
    role: string
    github?: string
    twitter?: string
  }>
  hackathon: {
    id: string
    name: string
    organizer: string
  }
  track: string
  technologies: string[]
  status: 'submitted' | 'winner' | 'featured'
  prize?: string
  rank?: number
  rating: number
  votes: number
  views: number
  createdAt: string
  updatedAt: string
  demoUrl?: string
  githubUrl?: string
  videoUrl?: string
  presentationUrl?: string
  images: string[]
  features: string[]
  problemStatement: string
  solution: string
  technicalDetails: string
  challenges: string
  futureWork: string
  comments: Array<{
    id: string
    user: {
      name: string
      avatar: string
    }
    content: string
    createdAt: string
    rating?: number
  }>
}

export default function ProjectDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    // 模拟加载项目详情
    setTimeout(() => {
      setProject({
        id: params.id as string,
        name: 'DeFi 聚合器 Pro',
        description: '一个创新的DeFi协议聚合器，帮助用户在多个协议间找到最优收益率',
        longDescription: `
          DeFi 聚合器 Pro 是一个革命性的去中心化金融协议聚合器，旨在为用户提供最优的收益率和最佳的用户体验。

          我们的平台整合了多个主流DeFi协议，包括Uniswap、SushiSwap、Curve、Compound等，通过智能算法自动为用户找到最优的交易路径和收益策略。

          项目的核心创新在于我们的智能路由算法和风险评估系统，能够实时分析市场状况，为用户提供个性化的投资建议。
        `,
        team: 'DeFi Innovators',
        members: [
          { 
            name: 'Alice Chen', 
            avatar: '/alice.png', 
            role: 'Team Leader & Product Manager',
            github: 'https://github.com/alice-chen',
            twitter: 'https://twitter.com/alice_chen'
          },
          { 
            name: 'Bob Wang', 
            avatar: '/bob.png', 
            role: 'Smart Contract Developer',
            github: 'https://github.com/bob-wang'
          },
          { 
            name: 'Carol Li', 
            avatar: '/carol.png', 
            role: 'Frontend Developer',
            github: 'https://github.com/carol-li'
          },
          { 
            name: 'David Zhang', 
            avatar: '/david.png', 
            role: 'UI/UX Designer'
          }
        ],
        hackathon: {
          id: '1',
          name: 'Web3 DeFi 创新挑战赛',
          organizer: 'DeFi Labs'
        },
        track: 'DeFi 协议',
        technologies: ['Solidity', 'React', 'Node.js', 'Web3.js', 'TypeScript', 'Hardhat'],
        status: 'winner',
        prize: '$20,000',
        rank: 1,
        rating: 4.8,
        votes: 156,
        views: 2340,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
        demoUrl: 'https://defi-aggregator-pro.demo.com',
        githubUrl: 'https://github.com/defi-innovators/aggregator-pro',
        videoUrl: 'https://youtube.com/watch?v=demo1',
        presentationUrl: 'https://docs.google.com/presentation/d/demo1',
        images: [
          '/project1-1.png',
          '/project1-2.png', 
          '/project1-3.png',
          '/project1-4.png'
        ],
        features: [
          '多协议收益率比较',
          '智能风险评估',
          '自动化投资策略',
          '实时市场数据',
          '一键投资组合',
          '收益历史追踪'
        ],
        problemStatement: '当前DeFi生态系统中存在协议分散、收益率不透明、风险难以评估等问题，用户需要在多个平台间切换才能找到最优收益，这大大降低了用户体验和资金效率。',
        solution: '我们开发了一个智能聚合器，通过算法自动比较各协议收益率，提供风险评估，并支持一键投资。用户只需要在我们的平台上操作，就能享受到整个DeFi生态的最优收益。',
        technicalDetails: `
          技术架构：
          - 智能合约层：使用Solidity开发，部署在以太坊主网
          - 聚合算法：实时抓取各协议数据，计算最优路径
          - 前端界面：React + TypeScript，响应式设计
          - 后端服务：Node.js + Express，提供API服务
          - 数据存储：IPFS存储用户配置，链上存储交易记录
        `,
        challenges: '主要挑战包括：1) 实时数据同步的性能优化；2) 多协议兼容性处理；3) 智能合约安全性保证；4) 用户界面的简洁性与功能性平衡。',
        futureWork: '未来计划：1) 支持更多Layer2网络；2) 增加更多DeFi协议；3) 开发移动端应用；4) 引入DAO治理机制；5) 推出代币激励系统。',
        comments: [
          {
            id: '1',
            user: {
              name: 'Vitalik Buterin',
              avatar: '/vitalik.png'
            },
            content: '非常创新的解决方案！聚合器的算法设计很巧妙，用户体验也很出色。期待看到更多的协议集成。',
            createdAt: '2024-01-16T09:30:00Z',
            rating: 5
          },
          {
            id: '2',
            user: {
              name: 'Hayden Adams',
              avatar: '/hayden.png'
            },
            content: '技术实现很扎实，特别是智能路由算法。建议考虑集成更多的AMM协议。',
            createdAt: '2024-01-17T14:15:00Z',
            rating: 4
          },
          {
            id: '3',
            user: {
              name: 'Andre Cronje',
              avatar: '/andre.png'
            },
            content: '风险评估功能很实用，这是很多聚合器缺少的功能。代码质量也很高。',
            createdAt: '2024-01-18T11:45:00Z',
            rating: 5
          }
        ]
      })
      setIsLoading(false)
    }, 1000)
  }, [params.id])

  const handleLike = () => {
    setIsLiked(!isLiked)
    if (project) {
      setProject({
        ...project,
        votes: isLiked ? project.votes - 1 : project.votes + 1
      })
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: '链接已复制',
      description: '项目链接已复制到剪贴板',
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

  if (!project) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">项目不存在</h1>
          <Button asChild>
            <Link href="/projects">返回项目列表</Link>
          </Button>
        </div>
      </div>
    )
  }

  const getStatusBadge = () => {
    switch (project.status) {
      case 'winner':
        return (
          <Badge className="bg-yellow-500 text-white text-lg px-4 py-2">
            <Trophy className="h-4 w-4 mr-2" />
            {project.rank ? `第${project.rank}名` : '获奖项目'}
          </Badge>
        )
      case 'featured':
        return (
          <Badge className="bg-blue-500 text-white text-lg px-4 py-2">
            <Star className="h-4 w-4 mr-2" />
            精选项目
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="container py-8">
      <div className="space-y-8">
        {/* 项目头部 */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/projects" className="hover:text-foreground">项目</Link>
            <span>/</span>
            <Link href={`/hackathons/${project.hackathon.id}`} className="hover:text-foreground">
              {project.hackathon.name}
            </Link>
            <span>/</span>
            <span>{project.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                {getStatusBadge()}
                {project.prize && (
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    奖金: {project.prize}
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl font-bold">{project.name}</h1>
              <p className="text-xl text-muted-foreground">{project.description}</p>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {project.rating} ({project.votes} 票)
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {project.views.toLocaleString()} 浏览
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(project.createdAt)}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant={isLiked ? "default" : "outline"}
                  onClick={handleLike}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {project.votes}
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  分享
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/hackathons/${project.hackathon.id}`}>
                    查看黑客松
                  </Link>
                </Button>
              </div>
            </div>

            <div className="lg:w-80">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    {project.demoUrl && (
                      <Button className="w-full" asChild>
                        <Link href={project.demoUrl} target="_blank">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          查看演示
                        </Link>
                      </Button>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      {project.githubUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={project.githubUrl} target="_blank">
                            <Github className="h-4 w-4 mr-1" />
                            代码
                          </Link>
                        </Button>
                      )}
                      {project.videoUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={project.videoUrl} target="_blank">
                            <Play className="h-4 w-4 mr-1" />
                            视频
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold">项目信息</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">团队</span>
                        <span>{project.team}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">赛道</span>
                        <span>{project.track}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">成员</span>
                        <span>{project.members.length} 人</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">更新时间</span>
                        <span>{formatDate(project.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* 项目图片 */}
        {project.images.length > 0 && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={project.images[currentImageIndex] || "/placeholder.svg"}
                alt={`${project.name} - 图片 ${currentImageIndex + 1}`}
                className="w-full h-96 object-cover rounded-lg"
              />
              {project.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {project.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {project.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {project.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                      index === currentImageIndex ? 'border-primary' : 'border-muted'
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`缩略图 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容 */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">项目概览</TabsTrigger>
                <TabsTrigger value="technical">技术详情</TabsTrigger>
                <TabsTrigger value="team">团队介绍</TabsTrigger>
                <TabsTrigger value="comments">评论反馈</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>项目介绍</CardTitle>
                  </CardHeader>
                  <CardContent className="prose max-w-none">
                    {project.longDescription.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-muted-foreground">
                        {paragraph.trim()}
                      </p>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>问题陈述</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{project.problemStatement}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>解决方案</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{project.solution}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>主要功能</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {project.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="technical" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>技术栈</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>技术架构</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      {project.technicalDetails.split('\n').map((line, index) => (
                        <p key={index} className="mb-2 text-muted-foreground">
                          {line.trim()}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>开发挑战</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{project.challenges}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>未来规划</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{project.futureWork}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>团队成员</CardTitle>
                    <CardDescription>
                      {project.team} 团队共有 {project.members.length} 名成员
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      {project.members.map((member, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-lg">{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{member.name}</h4>
                            <p className="text-muted-foreground mb-2">{member.role}</p>
                            <div className="flex gap-2">
                              {member.github && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={member.github} target="_blank">
                                    <Github className="h-3 w-3 mr-1" />
                                    GitHub
                                  </Link>
                                </Button>
                              )}
                              {member.twitter && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={member.twitter} target="_blank">
                                    Twitter
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      评论反馈 ({project.comments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {project.comments.map((comment) => (
                        <div key={comment.id} className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={comment.user.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-semibold">{comment.user.name}</h5>
                                {comment.rating && (
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: comment.rating }).map((_, i) => (
                                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    ))}
                                  </div>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-muted-foreground">{comment.content}</p>
                            </div>
                          </div>
                          <Separator />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 相关项目 */}
            <Card>
              <CardHeader>
                <CardTitle>相关项目</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'DeFi Dashboard Pro', team: 'Analytics Team', rating: 4.5 },
                    { name: 'Yield Optimizer', team: 'Yield Hunters', rating: 4.3 },
                    { name: 'Cross-Chain Bridge', team: 'Bridge Builders', rating: 4.7 }
                  ].map((relatedProject, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h5 className="font-medium text-sm">{relatedProject.name}</h5>
                        <p className="text-xs text-muted-foreground">{relatedProject.team}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{relatedProject.rating}</span>
                      </div>
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
