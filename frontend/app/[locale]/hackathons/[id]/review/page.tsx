'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Star, Trophy, Users, Clock, CheckCircle, AlertCircle, Eye, MessageSquare, Award, Target } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

interface Project {
  id: string
  name: string
  description: string
  team: string
  track: string
  technologies: string[]
  demoUrl?: string
  githubUrl?: string
  videoUrl?: string
  submittedAt: string
  reviewed: boolean
  averageScore?: number
  reviews: Review[]
}

interface Review {
  id: string
  judgeId: string
  judgeName: string
  judgeAvatar: string
  scores: {
    innovation: number
    technical: number
    design: number
    business: number
    presentation: number
  }
  totalScore: number
  feedback: string
  submittedAt: string
}

interface JudgingCriteria {
  name: string
  description: string
  weight: number
  maxScore: number
}

export default function ReviewPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [hackathon, setHackathon] = useState<any>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isJudge, setIsJudge] = useState(false)
  const [currentReview, setCurrentReview] = useState({
    scores: {
      innovation: 0,
      technical: 0,
      design: 0,
      business: 0,
      presentation: 0
    },
    feedback: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('projects')

  const judgingCriteria: JudgingCriteria[] = [
    {
      name: '创新性',
      description: '项目的创新程度和独特性',
      weight: 30,
      maxScore: 10
    },
    {
      name: '技术实现',
      description: '技术方案的完整性和质量',
      weight: 25,
      maxScore: 10
    },
    {
      name: '用户体验',
      description: '产品的易用性和设计质量',
      weight: 20,
      maxScore: 10
    },
    {
      name: '商业价值',
      description: '项目的市场潜力和商业可行性',
      weight: 15,
      maxScore: 10
    },
    {
      name: '演示效果',
      description: '项目展示和演讲质量',
      weight: 10,
      maxScore: 10
    }
  ]

  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      setHackathon({
        id: params.id,
        title: 'Web3 DeFi 创新挑战赛',
        status: 'reviewing',
        judges: [
          { id: '1', name: 'Vitalik Buterin', avatar: '/vitalik.png' },
          { id: '2', name: 'Hayden Adams', avatar: '/hayden.png' },
          { id: '3', name: 'Andre Cronje', avatar: '/andre.png' }
        ]
      })

      setProjects([
        {
          id: '1',
          name: 'DeFi 聚合器 Pro',
          description: '一个创新的DeFi协议聚合器，帮助用户在多个协议间找到最优收益率',
          team: 'DeFi Innovators',
          track: 'DeFi 协议',
          technologies: ['Solidity', 'React', 'NodeJS'],
          demoUrl: 'https://demo1.com',
          githubUrl: 'https://github.com/team1/project',
          submittedAt: '2024-01-15T10:00:00Z',
          reviewed: true,
          averageScore: 8.5,
          reviews: [
            {
              id: '1',
              judgeId: '1',
              judgeName: 'Vitalik Buterin',
              judgeAvatar: '/vitalik.png',
              scores: {
                innovation: 9,
                technical: 8,
                design: 8,
                business: 9,
                presentation: 8
              },
              totalScore: 8.4,
              feedback: '非常创新的解决方案，技术实现扎实，用户体验良好。建议进一步优化gas费用。',
              submittedAt: '2024-01-16T14:30:00Z'
            }
          ]
        },
        {
          id: '2',
          name: 'AI 驱动的智能合约审计工具',
          description: '使用机器学习技术自动检测智能合约中的安全漏洞',
          team: 'AI Security Labs',
          track: 'AI + 区块链',
          technologies: ['Python', 'TensorFlow', 'Solidity'],
          demoUrl: 'https://demo2.com',
          githubUrl: 'https://github.com/team2/project',
          submittedAt: '2024-01-15T11:30:00Z',
          reviewed: false,
          reviews: []
        }
      ])

      // 检查当前用户是否为评委
      setIsJudge(user?.id === '1' || user?.id === '2' || user?.id === '3')
    }, 1000)
  }, [params.id, user])

  const handleScoreChange = (criteria: string, score: number) => {
    setCurrentReview(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [criteria]: score
      }
    }))
  }

  const calculateTotalScore = () => {
    const { scores } = currentReview
    const totalWeightedScore = 
      (scores.innovation * 30 + 
       scores.technical * 25 + 
       scores.design * 20 + 
       scores.business * 15 + 
       scores.presentation * 10) / 100
    return Math.round(totalWeightedScore * 10) / 10
  }

  const handleSubmitReview = async () => {
    if (!selectedProject) return

    const totalScore = calculateTotalScore()
    if (totalScore === 0) {
      toast({
        title: '请完成评分',
        description: '请为所有评审标准打分',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 模拟提交评审
      await new Promise(resolve => setTimeout(resolve, 2000))

      const newReview: Review = {
        id: Date.now().toString(),
        judgeId: user?.id || '1',
        judgeName: user?.username || 'Judge',
        judgeAvatar: user?.avatarUrl || '/placeholder.svg',
        scores: currentReview.scores,
        totalScore,
        feedback: currentReview.feedback,
        submittedAt: new Date().toISOString()
      }

      // 更新项目评审状态
      setProjects(prev => prev.map(p => 
        p.id === selectedProject.id 
          ? { 
              ...p, 
              reviewed: true,
              reviews: [...p.reviews, newReview],
              averageScore: (p.reviews.reduce((sum, r) => sum + r.totalScore, 0) + totalScore) / (p.reviews.length + 1)
            }
          : p
      ))

      setCurrentReview({
        scores: {
          innovation: 0,
          technical: 0,
          design: 0,
          business: 0,
          presentation: 0
        },
        feedback: ''
      })

      toast({
        title: '评审提交成功',
        description: '你的评审已成功提交',
      })

      setActiveTab('projects')
    } catch (error) {
      toast({
        title: '提交失败',
        description: '评审提交时出现错误，请重试',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hackathon) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!isJudge) {
    return (
      <div className="container py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            你没有权限访问此评审页面。只有指定的评委才能进行项目评审。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const reviewedCount = projects.filter(p => p.reviewed).length
  const totalProjects = projects.length
  const reviewProgress = totalProjects > 0 ? (reviewedCount / totalProjects) * 100 : 0

  return (
    <div className="container py-8">
      <div className="space-y-8">
        {/* 页面头部 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">项目评审</h1>
              <p className="text-muted-foreground mt-2">
                {hackathon.title} - 评委评审界面
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Trophy className="h-4 w-4 mr-2" />
              评委专用
            </Badge>
          </div>

          {/* 评审进度 */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">评审进度</h3>
                  <span className="text-sm text-muted-foreground">
                    {reviewedCount} / {totalProjects} 项目已评审
                  </span>
                </div>
                <Progress value={reviewProgress} className="h-2" />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-500">{totalProjects}</div>
                    <div className="text-sm text-muted-foreground">总项目数</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-500">{reviewedCount}</div>
                    <div className="text-sm text-muted-foreground">已评审</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-500">{totalProjects - reviewedCount}</div>
                    <div className="text-sm text-muted-foreground">待评审</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 主要内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects">项目列表</TabsTrigger>
            <TabsTrigger value="review">评审项目</TabsTrigger>
            <TabsTrigger value="criteria">评审标准</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <div className="grid gap-6">
              {projects.map((project) => (
                <Card key={project.id} className={`${project.reviewed ? 'border-green-200' : 'border-orange-200'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold">{project.name}</h3>
                          {project.reviewed ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              已评审
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-orange-500 text-orange-500">
                              <Clock className="h-3 w-3 mr-1" />
                              待评审
                            </Badge>
                          )}
                          {project.averageScore && (
                            <Badge variant="secondary">
                              <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                              {project.averageScore.toFixed(1)}
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
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(project.submittedAt).toLocaleDateString('zh-CN')}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech) => (
                            <Badge key={tech} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          {project.demoUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-3 w-3 mr-1" />
                                演示
                              </a>
                            </Button>
                          )}
                          {project.githubUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                                代码
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => {
                            setSelectedProject(project)
                            setActiveTab('review')
                          }}
                          disabled={project.reviewed}
                        >
                          {project.reviewed ? '查看评审' : '开始评审'}
                        </Button>
                        
                        {project.reviews.length > 0 && (
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">
                              {project.reviews.length} 个评审
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 评审历史 */}
                    {project.reviews.length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-medium mb-3">评审记录</h4>
                        <div className="space-y-3">
                          {project.reviews.map((review) => (
                            <div key={review.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={review.judgeAvatar || "/placeholder.svg"} />
                                <AvatarFallback>{review.judgeName[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{review.judgeName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {review.totalScore.toFixed(1)} 分
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(review.submittedAt).toLocaleDateString('zh-CN')}
                                  </span>
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

          <TabsContent value="review" className="space-y-6">
            {selectedProject ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 项目信息 */}
                <Card>
                  <CardHeader>
                    <CardTitle>项目信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedProject.name}</h3>
                      <p className="text-muted-foreground mt-1">{selectedProject.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">团队：</span>
                        <span className="text-muted-foreground">{selectedProject.team}</span>
                      </div>
                      <div>
                        <span className="font-medium">赛道：</span>
                        <span className="text-muted-foreground">{selectedProject.track}</span>
                      </div>
                    </div>

                    <div>
                      <span className="font-medium text-sm">技术栈：</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedProject.technologies.map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {selectedProject.demoUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedProject.demoUrl} target="_blank" rel="noopener noreferrer">
                            查看演示
                          </a>
                        </Button>
                      )}
                      {selectedProject.githubUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedProject.githubUrl} target="_blank" rel="noopener noreferrer">
                            查看代码
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 评分表单 */}
                <Card>
                  <CardHeader>
                    <CardTitle>项目评分</CardTitle>
                    <CardDescription>
                      请根据评审标准为项目打分（1-10分）
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {judgingCriteria.map((criteria) => (
                      <div key={criteria.name} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">{criteria.name}</Label>
                            <p className="text-xs text-muted-foreground">{criteria.description}</p>
                          </div>
                          <Badge variant="outline">权重 {criteria.weight}%</Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                            <Button
                              key={score}
                              variant={
                                currentReview.scores[criteria.name.toLowerCase() as keyof typeof currentReview.scores] === score
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => handleScoreChange(criteria.name.toLowerCase(), score)}
                            >
                              {score}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <Separator />

                    <div>
                      <Label htmlFor="feedback">评审反馈</Label>
                      <Textarea
                        id="feedback"
                        value={currentReview.feedback}
                        onChange={(e) => setCurrentReview(prev => ({ ...prev, feedback: e.target.value }))}
                        placeholder="请提供详细的评审反馈和建议..."
                        className="mt-2 min-h-[100px]"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <span className="font-medium">总分：</span>
                      <span className="text-2xl font-bold text-primary">
                        {calculateTotalScore().toFixed(1)} 分
                      </span>
                    </div>

                    <Button
                      onClick={handleSubmitReview}
                      disabled={isSubmitting || calculateTotalScore() === 0}
                      className="w-full"
                    >
                      {isSubmitting ? '提交中...' : '提交评审'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  请先从项目列表中选择一个项目进行评审。
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="criteria" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>评审标准说明</CardTitle>
                <CardDescription>
                  了解详细的评审标准和权重分配
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {judgingCriteria.map((criteria, index) => (
                    <div key={criteria.name} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Award className="h-5 w-5 text-primary" />
                          {criteria.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">权重 {criteria.weight}%</Badge>
                          <Badge variant="secondary">满分 {criteria.maxScore} 分</Badge>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground">{criteria.description}</p>
                      
                      <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-medium mb-2">评分指导：</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-green-600">优秀 (8-10分)：</span>
                            <p className="text-muted-foreground">
                              {criteria.name === '创新性' && '具有突破性创新，解决方案独特且有价值'}
                              {criteria.name === '技术实现' && '技术方案完整，代码质量高，架构合理'}
                              {criteria.name === '用户体验' && '界面美观，交互流畅，用户体验优秀'}
                              {criteria.name === '商业价值' && '市场潜力巨大，商业模式清晰可行'}
                              {criteria.name === '演示效果' && '演示清晰有力，展示效果出色'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-orange-600">一般 (5-7分)：</span>
                            <p className="text-muted-foreground">
                              {criteria.name === '创新性' && '有一定创新性，但不够突出'}
                              {criteria.name === '技术实现' && '技术实现基本完整，存在改进空间'}
                              {criteria.name === '用户体验' && '用户体验可接受，但有待优化'}
                              {criteria.name === '商业价值' && '有一定商业价值，但需要进一步验证'}
                              {criteria.name === '演示效果' && '演示基本清楚，但不够吸引人'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {index < judgingCriteria.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>评审流程</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">查看项目</h4>
                      <p className="text-sm text-muted-foreground">
                        仔细阅读项目描述，查看演示和代码
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">评分打分</h4>
                      <p className="text-sm text-muted-foreground">
                        根据评审标准为每个维度打分（1-10分）
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">撰写反馈</h4>
                      <p className="text-sm text-muted-foreground">
                        提供详细的评审反馈和改进建议
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">提交评审</h4>
                      <p className="text-sm text-muted-foreground">
                        确认评分和反馈后提交评审结果
                      </p>
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
