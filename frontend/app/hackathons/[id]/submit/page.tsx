'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Github, Globe, Video, FileText, Users, Plus, X, Check, AlertCircle, Database, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { IPFSUpload } from '@/components/ipfs/ipfs-upload'
import { ipfsService, IPFSUploadResult } from '@/lib/ipfs'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  skills: string[]
}

export default function SubmitProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hackathon, setHackathon] = useState<any>(null)
  
  // 项目基本信息
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [selectedTrack, setSelectedTrack] = useState('')
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([])
  
  // 团队信息
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: user?.username || '',
      email: user?.email || '',
      role: 'Team Leader',
      skills: []
    }
  ])
  
  // 项目详情
  const [problemStatement, setProblemStatement] = useState('')
  const [solution, setSolution] = useState('')
  const [features, setFeatures] = useState<string[]>([''])
  const [technicalArchitecture, setTechnicalArchitecture] = useState('')
  const [challenges, setChallenges] = useState('')
  const [futureWork, setFutureWork] = useState('')
  
  // 项目资源
  const [githubUrl, setGithubUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [presentationUrl, setPresentationUrl] = useState('')
  
  // IPFS 相关
  const [ipfsFiles, setIpfsFiles] = useState<IPFSUploadResult[]>([])
  const [projectMetadataHash, setProjectMetadataHash] = useState('')
  
  // 提交确认
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [allowPublicView, setAllowPublicView] = useState(true)

  useEffect(() => {
    // 模拟加载黑客松信息
    setHackathon({
      id: params.id,
      title: 'Web3 DeFi 创新挑战赛',
      tracks: ['DeFi Protocol', 'Trading Tools', 'Yield Farming', 'Cross-chain'],
      technologies: ['Solidity', 'React', 'Node.js', 'Web3.js', 'Hardhat'],
      deadline: '2024-02-28T23:59:59Z'
    })
  }, [params.id])

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

  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: '',
      email: '',
      role: 'Developer',
      skills: []
    }
    setTeamMembers([...teamMembers, newMember])
  }

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id))
  }

  const updateTeamMember = (id: string, field: keyof TeamMember, value: any) => {
    setTeamMembers(teamMembers.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    ))
  }

  const addFeature = () => {
    setFeatures([...features, ''])
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features]
    newFeatures[index] = value
    setFeatures(newFeatures)
  }

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const toggleTechnology = (tech: string) => {
    setSelectedTechnologies(prev => 
      prev.includes(tech) 
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    )
  }

  const handleIPFSUpload = (results: IPFSUploadResult[]) => {
    setIpfsFiles(prev => [...prev, ...results])
    toast({
      title: 'IPFS 上传成功',
      description: `${results.length} 个文件已上传到 IPFS 网络`,
    })
  }

  const createProjectMetadata = async () => {
    try {
      const metadata = ipfsService.createProjectMetadata({
        name: projectName,
        description: projectDescription,
        team: teamMembers[0]?.name || 'Unknown Team',
        technologies: selectedTechnologies,
        demoUrl,
        githubUrl,
        videoUrl
      })

      // 通过后端API上传到IPFS
      const token = typeof window !== 'undefined' ? localStorage.getItem('hackx-token') : null
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      
      const response = await fetch('/api/ipfs/upload', {
        method: 'PUT', // JSON数据使用PUT方法
        headers,
        body: JSON.stringify({ data: metadata, metadata: { name: 'project-metadata.json' } })
      })
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || '上传失败')
      }
      
      setProjectMetadataHash(result.hash)
      
      toast({
        title: '元数据已上传',
        description: '项目元数据已存储到 IPFS',
      })

      return result.hash
    } catch (error) {
      console.error('Failed to create metadata:', error)
      toast({
        title: '元数据上传失败',
        description: '无法将项目元数据上传到 IPFS',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // 创建并上传项目元数据到 IPFS
      const metadataHash = await createProjectMetadata()
      
      // 模拟项目提交（包含 IPFS 哈希）
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: '项目提交成功！',
        description: `项目已提交，元数据存储在 IPFS: ${metadataHash}`,
      })
      
      router.push(`/hackathons/${params.id}`)
    } catch (error) {
      toast({
        title: '提交失败',
        description: '提交项目时出现错误，请重试',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { id: 1, name: '项目信息', description: '基本项目信息' },
    { id: 2, name: '团队组建', description: '团队成员信息' },
    { id: 3, name: '项目详情', description: '详细项目描述' },
    { id: 4, name: 'IPFS 存储', description: '去中心化文件存储' },
    { id: 5, name: '提交确认', description: '最终确认提交' }
  ]

  const getStepProgress = () => {
    return (currentStep / steps.length) * 100
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">提交项目</h1>
          <p className="text-muted-foreground mt-2">
            向 {hackathon?.title} 提交你的创新项目，所有文件将存储在 IPFS 网络中
          </p>
          <Progress value={getStepProgress()} className="mt-4" />
        </div>

        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                  currentStep > step.id 
                    ? "bg-green-500 text-white" 
                    : currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <div className="ml-2 hidden sm:block">
                  <p className={cn(
                    "text-sm font-medium",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-12 h-0.5 bg-muted mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* 步骤 1: 项目信息 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">项目基本信息</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="projectName">项目名称 *</Label>
                      <Input
                        id="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="输入你的项目名称"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="projectDescription">项目简介 *</Label>
                      <Textarea
                        id="projectDescription"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="简要描述你的项目..."
                        className="mt-1 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label>选择赛道 *</Label>
                      <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="选择参赛赛道" />
                        </SelectTrigger>
                        <SelectContent>
                          {hackathon?.tracks?.map((track: string) => (
                            <SelectItem key={track} value={track}>
                              {track}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>技术栈</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        选择你项目中使用的技术栈
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {hackathon?.technologies?.map((tech: string) => (
                          <div key={tech} className="flex items-center space-x-2">
                            <Checkbox
                              id={tech}
                              checked={selectedTechnologies.includes(tech)}
                              onCheckedChange={() => toggleTechnology(tech)}
                            />
                            <Label htmlFor={tech} className="text-sm">
                              {tech}
                            </Label>
                          </div>
                        ))}
                      </div>
                      
                      {selectedTechnologies.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2">
                            {selectedTechnologies.map((tech) => (
                              <Badge key={tech} variant="secondary">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 2: 团队组建 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">团队成员</h3>
                  
                  <div className="space-y-4">
                    {teamMembers.map((member, index) => (
                      <Card key={member.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">
                              成员 {index + 1} {index === 0 && '(团队领导)'}
                            </h4>
                            {index > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTeamMember(member.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>姓名 *</Label>
                              <Input
                                value={member.name}
                                onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                                placeholder="成员姓名"
                                className="mt-1"
                                disabled={index === 0}
                              />
                            </div>
                            <div>
                              <Label>邮箱 *</Label>
                              <Input
                                value={member.email}
                                onChange={(e) => updateTeamMember(member.id, 'email', e.target.value)}
                                placeholder="成员邮箱"
                                className="mt-1"
                                disabled={index === 0}
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <Label>角色</Label>
                            <Select 
                              value={member.role} 
                              onValueChange={(value) => updateTeamMember(member.id, 'role', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Team Leader">团队领导</SelectItem>
                                <SelectItem value="Frontend Developer">前端开发</SelectItem>
                                <SelectItem value="Backend Developer">后端开发</SelectItem>
                                <SelectItem value="Smart Contract Developer">智能合约开发</SelectItem>
                                <SelectItem value="UI/UX Designer">UI/UX 设计师</SelectItem>
                                <SelectItem value="Product Manager">产品经理</SelectItem>
                                <SelectItem value="Other">其他</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button variant="outline" onClick={addTeamMember} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      添加团队成员
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 3: 项目详情 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">项目详细描述</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="problemStatement">问题陈述 *</Label>
                      <Textarea
                        id="problemStatement"
                        value={problemStatement}
                        onChange={(e) => setProblemStatement(e.target.value)}
                        placeholder="描述你要解决的问题..."
                        className="mt-1 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="solution">解决方案 *</Label>
                      <Textarea
                        id="solution"
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        placeholder="详细描述你的解决方案..."
                        className="mt-1 min-h-[120px]"
                      />
                    </div>

                    <div>
                      <Label>主要功能特性</Label>
                      <div className="space-y-3 mt-2">
                        {features.map((feature, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={feature}
                              onChange={(e) => updateFeature(index, e.target.value)}
                              placeholder="输入功能特性..."
                              className="flex-1"
                            />
                            {features.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFeature(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button variant="outline" onClick={addFeature} size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          添加功能
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="technicalArchitecture">技术架构</Label>
                      <Textarea
                        id="technicalArchitecture"
                        value={technicalArchitecture}
                        onChange={(e) => setTechnicalArchitecture(e.target.value)}
                        placeholder="描述你的技术架构和实现方式..."
                        className="mt-1 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="challenges">遇到的挑战</Label>
                      <Textarea
                        id="challenges"
                        value={challenges}
                        onChange={(e) => setChallenges(e.target.value)}
                        placeholder="描述开发过程中遇到的挑战和如何解决..."
                        className="mt-1 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="futureWork">未来规划</Label>
                      <Textarea
                        id="futureWork"
                        value={futureWork}
                        onChange={(e) => setFutureWork(e.target.value)}
                        placeholder="描述项目的未来发展计划..."
                        className="mt-1 min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 4: IPFS 存储 */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    去中心化文件存储
                  </h3>
                  
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      所有文件将存储在 IPFS 网络中，确保数据的去中心化和永久性。
                      请上传项目相关的图片、文档、演示视频等文件。
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-6">
                    {/* 项目链接 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">项目链接</CardTitle>
                        <CardDescription>
                          提供项目的相关链接信息
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="githubUrl">GitHub 仓库 *</Label>
                            <div className="flex mt-1">
                              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                <Github className="h-4 w-4" />
                              </div>
                              <Input
                                id="githubUrl"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                                placeholder="https://github.com/username/repo"
                                className="rounded-l-none"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="demoUrl">演示链接</Label>
                            <div className="flex mt-1">
                              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                <Globe className="h-4 w-4" />
                              </div>
                              <Input
                                id="demoUrl"
                                value={demoUrl}
                                onChange={(e) => setDemoUrl(e.target.value)}
                                placeholder="https://your-demo.com"
                                className="rounded-l-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="videoUrl">演示视频</Label>
                            <div className="flex mt-1">
                              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                <Video className="h-4 w-4" />
                              </div>
                              <Input
                                id="videoUrl"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="rounded-l-none"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="presentationUrl">项目文档</Label>
                            <div className="flex mt-1">
                              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                <FileText className="h-4 w-4" />
                              </div>
                              <Input
                                id="presentationUrl"
                                value={presentationUrl}
                                onChange={(e) => setPresentationUrl(e.target.value)}
                                placeholder="https://docs.google.com/..."
                                className="rounded-l-none"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* IPFS 文件上传 */}
                    <IPFSUpload
                      onUploadComplete={handleIPFSUpload}
                      acceptedTypes={['image/*', 'video/*', '.pdf', '.doc', '.docx', '.txt', '.md', '.zip']}
                      maxFiles={20}
                      maxFileSize={100}
                      showPreview={true}
                    />

                    {/* 已上传文件统计 */}
                    {ipfsFiles.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">IPFS 存储统计</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-primary">{ipfsFiles.length}</div>
                              <div className="text-sm text-muted-foreground">文件数量</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-primary">
                                {(ipfsFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)}MB
                              </div>
                              <div className="text-sm text-muted-foreground">总大小</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-primary">
                                {ipfsFiles.filter(f => f.path.match(/\.(jpg|jpeg|png|gif)$/i)).length}
                              </div>
                              <div className="text-sm text-muted-foreground">图片文件</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-primary">
                                {ipfsFiles.filter(f => f.path.match(/\.(mp4|avi|mov)$/i)).length}
                              </div>
                              <div className="text-sm text-muted-foreground">视频文件</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 5: 提交确认 */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">提交确认</h3>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        项目信息确认
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">项目名称</p>
                          <p className="text-sm text-muted-foreground">{projectName || '未填写'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">参赛赛道</p>
                          <p className="text-sm text-muted-foreground">{selectedTrack || '未选择'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">团队成员</p>
                          <p className="text-sm text-muted-foreground">{teamMembers.length} 人</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">技术栈</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedTechnologies.length > 0 ? selectedTechnologies.join(', ') : '未选择'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">项目资源</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>• GitHub: {githubUrl || '未提供'}</p>
                          <p>• 演示链接: {demoUrl || '未提供'}</p>
                          <p>• 演示视频: {videoUrl || '未提供'}</p>
                          <p>• 项目文档: {presentationUrl || '未提供'}</p>
                          <p>• IPFS 文件: {ipfsFiles.length} 个</p>
                        </div>
                      </div>

                      {projectMetadataHash && (
                        <div>
                          <p className="text-sm font-medium mb-2">IPFS 元数据</p>
                          <div className="flex items-center gap-2 p-2 bg-muted rounded">
                            <code className="text-xs font-mono flex-1">
                              {projectMetadataHash}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(projectMetadataHash)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      />
                      <Label htmlFor="terms" className="text-sm">
                        我确认项目信息准确无误，同意遵守黑客松规则和条款，
                        并理解所有文件将永久存储在 IPFS 网络中
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="public"
                        checked={allowPublicView}
                        onCheckedChange={(checked) => setAllowPublicView(checked as boolean)}
                      />
                      <Label htmlFor="public" className="text-sm">
                        允许公开展示我的项目（推荐）
                      </Label>
                    </div>
                  </div>

                  <Alert>
                    <Database className="h-4 w-4" />
                    <AlertDescription>
                      <strong>IPFS 存储说明：</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• 所有文件将存储在去中心化的 IPFS 网络中</li>
                        <li>• 文件一旦上传将无法删除，请确保内容合规</li>
                        <li>• 项目元数据将自动生成并存储</li>
                        <li>• 你可以通过 IPFS 哈希永久访问文件</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}

            {/* 导航按钮 */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                上一步
              </Button>
              
              {currentStep < 5 ? (
                <Button
                  onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                  disabled={
                    (currentStep === 1 && (!projectName || !projectDescription || !selectedTrack)) ||
                    (currentStep === 2 && teamMembers.some(m => !m.name || !m.email)) ||
                    (currentStep === 4 && !githubUrl)
                  }
                >
                  下一步
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !agreedToTerms}
                >
                  {isSubmitting ? '提交中...' : '提交项目到 IPFS'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
