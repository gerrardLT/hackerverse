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
import { 
  Github, 
  Globe, 
  Video, 
  FileText, 
  Users, 
  Star, 
  Heart, 
  Share2, 
  Trophy,
  Code,
  Database,
  ArrowLeft,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { dataService } from '@/lib/data-service'
import { apiService } from '@/lib/api'

interface Project {
  id: string
  name: string
  description: string
  hackathonId: string
  hackathonTitle: string
  track: string
  team: {
    name: string
    members: Array<{
      name: string
      role: string
      avatar: string
    }>
  }
  technologies: string[]
  problemStatement: string
  solution: string
  features: string[]
  technicalArchitecture: string
  challenges: string
  futureWork: string
  links: {
    github?: string
    demo?: string
    video?: string
    presentation?: string
  }
  ipfsHash?: string
  ipfsFiles: Array<{
    name: string
    hash: string
    size: number
    type: string
  }>
  submittedAt: string
  status: 'submitted' | 'under_review' | 'winner' | 'finalist'
  likes: number
  isLiked: boolean
  score?: {
    technical: number
    innovation: number
    design: number
    business: number
    total: number
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLiking, setIsLiking] = useState(false)

  useEffect(() => {
    const loadProjectDetail = async () => {
      try {
        setIsLoading(true)
        console.log('🔍 加载项目详情:', params.projectId)
        
        // 从数据服务获取项目详情
        const projectData = await dataService.getProjectDetail(params.projectId as string)
        
        if (projectData) {
          // 转换数据格式以匹配组件期望的格式
          setProject({
            id: projectData.id,
            name: projectData.title,
            description: projectData.description || '',
            hackathonId: params.id as string,
            hackathonTitle: 'Web3 DeFi 创新挑战赛', // 可以从黑客松数据获取
            track: 'DeFi Protocol', // 可以从项目数据获取
            team: {
              name: 'Team', // 可以从团队数据获取
              members: [
                { name: 'Team Leader', role: '团队领导', avatar: '/placeholder.svg' }
              ]
            },
            technologies: Array.isArray(projectData.technologies) ? projectData.technologies : [],
            problemStatement: projectData.problemStatement || '问题陈述信息暂未提供',
            solution: projectData.solution || '解决方案信息暂未提供',
            features: Array.isArray(projectData.features) ? projectData.features : [],
            technicalArchitecture: projectData.technicalArchitecture || '技术架构信息暂未提供',
            challenges: projectData.challenges || '开发挑战信息暂未提供',
            futureWork: projectData.futureWork || '未来规划信息暂未提供',
            links: {
              github: projectData.githubUrl,
              demo: projectData.demoUrl,
              video: projectData.videoUrl,
              presentation: projectData.presentationUrl
            },
            ipfsHash: projectData.ipfsHash,
            ipfsFiles: projectData.ipfsFiles || [],
            submittedAt: projectData.createdAt || new Date().toISOString(),
            status: 'submitted',
            likes: 0,
            isLiked: false
          })
        } else {
          toast({
            title: '项目不存在',
            description: '未找到指定的项目',
            variant: 'destructive',
          })
        }
      } catch (error) {
        console.error('加载项目详情失败:', error)
        toast({
          title: '加载失败',
          description: '无法加载项目详情',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProjectDetail()
  }, [params.id, params.projectId]) // 移除toast依赖

  const handleLike = async () => {
    if (!user) {
      toast({
        title: '请先登录',
        description: '需要登录后才能点赞项目',
        variant: 'destructive',
      })
      return
    }

    setIsLiking(true)
    try {
      // 模拟点赞API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setProject(prev => prev ? {
        ...prev,
        isLiked: !prev.isLiked,
        likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1
      } : null)

      toast({
        title: project?.isLiked ? '取消点赞' : '点赞成功',
        description: project?.isLiked ? '已取消点赞该项目' : '感谢你的支持！',
      })
    } catch (error) {
      toast({
        title: '操作失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: project?.name,
        text: project?.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: '链接已复制',
        description: '项目链接已复制到剪贴板',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { label: '已提交', variant: 'secondary' as const },
      under_review: { label: '评审中', variant: 'default' as const },
      winner: { label: '获奖项目', variant: 'default' as const },
      finalist: { label: '决赛项目', variant: 'secondary' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading || !project) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2">加载项目详情...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        {/* 面包屑导航 */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/hackathons/${project.hackathonId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回黑客松
            </Link>
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <Link href={`/hackathons/${project.hackathonId}`} className="hover:text-foreground">
              {project.hackathonTitle}
            </Link>
            <span className="mx-2">•</span>
            <span>{project.track}</span>
            <span className="mx-2">•</span>
            <span>项目详情</span>
          </div>
        </div>

        {/* 项目头部 */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold">{project.name}</h1>
                {getStatusBadge(project.status)}
                {project.status === 'winner' && <Trophy className="h-6 w-6 text-yellow-500" />}
              </div>
              
              <p className="text-lg text-muted-foreground mb-4">{project.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {project.technologies.map((tech) => (
                  <Badge key={tech} variant="outline">{tech}</Badge>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{project.team.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <span className="text-sm">{project.track}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="text-sm">IPFS 存储</span>
                </div>
              </div>
            </div>

            <div className="lg:w-80">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <Button
                        variant={project.isLiked ? "default" : "outline"}
                        onClick={handleLike}
                        disabled={isLiking}
                        className="flex-1"
                      >
                        <Heart className={`mr-2 h-4 w-4 ${project.isLiked ? 'fill-current' : ''}`} />
                        {project.likes}
                      </Button>
                      <Button variant="outline" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* 项目链接 */}
                    <div className="space-y-2">
                      {project.links.github && (
                        <Button variant="outline" asChild className="w-full justify-start">
                          <Link href={project.links.github} target="_blank">
                            <Github className="mr-2 h-4 w-4" />
                            查看代码
                            <ExternalLink className="ml-auto h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                      
                      {project.links.demo && (
                        <Button variant="outline" asChild className="w-full justify-start">
                          <Link href={project.links.demo} target="_blank">
                            <Globe className="mr-2 h-4 w-4" />
                            在线演示
                            <ExternalLink className="ml-auto h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                      
                      {project.links.video && (
                        <Button variant="outline" asChild className="w-full justify-start">
                          <Link href={project.links.video} target="_blank">
                            <Video className="mr-2 h-4 w-4" />
                            演示视频
                            <ExternalLink className="ml-auto h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                      
                      {project.links.presentation && (
                        <Button variant="outline" asChild className="w-full justify-start">
                          <Link href={project.links.presentation} target="_blank">
                            <FileText className="mr-2 h-4 w-4" />
                            项目文档
                            <ExternalLink className="ml-auto h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </div>

                    {/* 评分信息 */}
                    {project.score && (
                      <div>
                        <Separator className="my-4" />
                        <h4 className="font-medium mb-3">评审评分</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>技术实现</span>
                            <span className="font-mono">{project.score.technical}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>创新性</span>
                            <span className="font-mono">{project.score.innovation}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>设计体验</span>
                            <span className="font-mono">{project.score.design}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>商业价值</span>
                            <span className="font-mono">{project.score.business}/10</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>总分</span>
                            <span className="font-mono">{project.score.total}/10</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* 项目详情标签页 */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">项目概述</TabsTrigger>
            <TabsTrigger value="technical">技术详情</TabsTrigger>
            <TabsTrigger value="team">团队信息</TabsTrigger>
            <TabsTrigger value="files">IPFS 文件</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>问题陈述</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{project.problemStatement}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>解决方案</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{project.solution}</p>
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
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>技术架构</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{project.technicalArchitecture}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>开发挑战</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{project.challenges}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>未来规划</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{project.futureWork}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>技术栈</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{project.team.name}</CardTitle>
                <CardDescription>
                  团队共 {project.team.members.length} 人
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {project.team.members.map((member, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Avatar>
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  IPFS 文件存储
                </CardTitle>
                <CardDescription>
                  项目文件已永久存储在 IPFS 网络中
                </CardDescription>
              </CardHeader>
              <CardContent>
                {project.ipfsHash && (
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-2">项目元数据哈希</p>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <code className="text-xs font-mono flex-1">{project.ipfsHash}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(project.ipfsHash!)}
                      >
                        复制
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {project.ipfsFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)} • {file.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {file.hash.slice(0, 12)}...
                        </code>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`https://gateway.pinata.cloud/ipfs/${file.hash}`} target="_blank">
                            查看
                          </Link>
                        </Button>
                      </div>
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
