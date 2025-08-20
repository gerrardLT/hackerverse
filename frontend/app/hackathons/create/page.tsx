'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { CalendarIcon, Plus, X, Upload, DollarSign, Users, Clock } from 'lucide-react'
import { cn, formatValidationError } from '@/lib/utils'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'
import Link from 'next/link'

interface Prize {
  id: string
  name: string
  amount: string
  description: string
}

interface Track {
  id: string
  name: string
  description: string
}

export default function CreateHackathonPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 基本信息
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>()
  const [location, setLocation] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  
  // 奖项设置
  const [prizes, setPrizes] = useState<Prize[]>([
    { id: '1', name: '一等奖', amount: '', description: '' }
  ])
  
  // 赛道设置
  const [tracks, setTracks] = useState<Track[]>([
    { id: '1', name: '主赛道', description: '' }
  ])
  
  // 技术栈
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([])
  const availableTechnologies = [
    'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java',
    'Solidity', 'Rust', 'Go', 'TypeScript', 'JavaScript',
    'AI/ML', 'Blockchain', 'DeFi', 'NFT', 'Web3', 'IPFS'
  ]
  
  // 规则和要求
  const [rules, setRules] = useState('')
  const [requirements, setRequirements] = useState<string[]>([''])
  const [judgingCriteria, setJudgingCriteria] = useState<string[]>([''])

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

  const addPrize = () => {
    const newPrize: Prize = {
      id: Date.now().toString(),
      name: '',
      amount: '',
      description: ''
    }
    setPrizes([...prizes, newPrize])
  }

  const removePrize = (id: string) => {
    setPrizes(prizes.filter(prize => prize.id !== id))
  }

  const updatePrize = (id: string, field: keyof Prize, value: string) => {
    setPrizes(prizes.map(prize => 
      prize.id === id ? { ...prize, [field]: value } : prize
    ))
  }

  const addTrack = () => {
    const newTrack: Track = {
      id: Date.now().toString(),
      name: '',
      description: ''
    }
    setTracks([...tracks, newTrack])
  }

  const removeTrack = (id: string) => {
    setTracks(tracks.filter(track => track.id !== id))
  }

  const updateTrack = (id: string, field: keyof Track, value: string) => {
    setTracks(tracks.map(track => 
      track.id === id ? { ...track, [field]: value } : track
    ))
  }

  const toggleTechnology = (tech: string) => {
    setSelectedTechnologies(prev => 
      prev.includes(tech) 
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    )
  }

  const addRequirement = () => {
    setRequirements([...requirements, ''])
  }

  const updateRequirement = (index: number, value: string) => {
    const newRequirements = [...requirements]
    newRequirements[index] = value
    setRequirements(newRequirements)
  }

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index))
  }

  const addJudgingCriteria = () => {
    setJudgingCriteria([...judgingCriteria, ''])
  }

  const updateJudgingCriteria = (index: number, value: string) => {
    const newCriteria = [...judgingCriteria]
    newCriteria[index] = value
    setJudgingCriteria(newCriteria)
  }

  const removeJudgingCriteria = (index: number) => {
    setJudgingCriteria(judgingCriteria.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // 验证必填字段
      if (!title || !description || !startDate || !endDate) {
        toast({
          title: '信息不完整',
          description: '请填写所有必填字段',
          variant: 'destructive',
        })
        return
      }

      // 验证日期逻辑
      if (startDate >= endDate) {
        toast({
          title: '日期错误',
          description: '结束日期必须晚于开始日期',
          variant: 'destructive',
        })
        return
      }

      if (registrationDeadline && registrationDeadline >= startDate) {
        toast({
          title: '日期错误',
          description: '注册截止日期必须早于开始日期',
          variant: 'destructive',
        })
        return
      }

      // 准备提交数据
      const hackathonData = {
        title: title.trim(),
        description: description.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        registrationDeadline: registrationDeadline ? registrationDeadline.toISOString() : startDate.toISOString(),
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        prizePool: prizes.reduce((total, prize) => {
          const amount = parseInt(prize.amount.replace(/[^0-9]/g, '')) || 0
          return total + amount
        }, 0),
        categories: selectedTechnologies.length > 0 ? selectedTechnologies : ['General'],
        tags: selectedTechnologies,
        requirements: requirements.filter(r => r.trim()).join('\n'),
        rules: rules.trim(),
        isPublic: true,
        featured: false,
        prizes: prizes.map((prize, index) => ({
          rank: index + 1,
          amount: parseInt(prize.amount.replace(/[^0-9]/g, '')) || 0,
          description: prize.description.trim() || prize.name.trim()
        })),
        tracks: tracks.map(track => ({
          name: track.name.trim(),
          description: track.description.trim(),
          requirements: ''
        })),
        judgingCriteria: judgingCriteria.filter(c => c.trim()).map((criteria, index) => ({
          category: `标准${index + 1}`,
          weight: 1,
          description: criteria.trim()
        }))
      }

      // 调用API创建黑客松
      const response = await apiService.createHackathon(hackathonData)

      if (response.success && response.data) {
        toast({
          title: '黑客松创建成功！',
          description: '你的黑客松已经创建并等待审核',
        })
        
        // 跳转到新创建的黑客松详情页
        router.push(`/hackathons/${response.data.hackathon.id}`)
      } else {
        // 处理具体的验证错误
        const errorMessage = formatValidationError(response)
        
        toast({
          title: '创建失败',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('创建黑客松错误:', error)
      toast({
        title: '创建失败',
        description: '网络错误，请检查网络连接并重试',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { id: 1, name: '基本信息', description: '设置黑客松的基本信息' },
    { id: 2, name: '奖项设置', description: '配置奖项和赛道' },
    { id: 3, name: '技术要求', description: '选择技术栈和要求' },
    { id: 4, name: '规则说明', description: '设置规则和评审标准' },
    { id: 5, name: '预览发布', description: '预览并发布黑客松' }
  ]

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">创建黑客松</h1>
          <p className="text-muted-foreground mt-2">创建你的黑客松活动，吸引全球开发者参与</p>
        </div>

        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                  currentStep >= step.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {step.id}
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
            {/* 步骤 1: 基本信息 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">基本信息</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">黑客松名称 *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="输入黑客松名称"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">活动描述 *</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="详细描述你的黑客松活动..."
                        className="mt-1 min-h-[120px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>开始时间 *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal mt-1",
                                !startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP", { locale: zhCN }) : "选择开始时间"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label>结束时间 *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal mt-1",
                                !endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP", { locale: zhCN }) : "选择结束时间"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div>
                      <Label>报名截止时间</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !registrationDeadline && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {registrationDeadline ? format(registrationDeadline, "PPP", { locale: zhCN }) : "选择报名截止时间"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={registrationDeadline}
                            onSelect={setRegistrationDeadline}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">活动地点</Label>
                        <Input
                          id="location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="线上/线下地点"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="maxParticipants">最大参与人数</Label>
                        <Input
                          id="maxParticipants"
                          type="number"
                          value={maxParticipants}
                          onChange={(e) => setMaxParticipants(e.target.value)}
                          placeholder="不限制请留空"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 2: 奖项设置 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">奖项设置</h3>
                  
                  <div className="space-y-4">
                    {prizes.map((prize, index) => (
                      <Card key={prize.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">奖项 {index + 1}</h4>
                            {prizes.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePrize(prize.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>奖项名称</Label>
                              <Input
                                value={prize.name}
                                onChange={(e) => updatePrize(prize.id, 'name', e.target.value)}
                                placeholder="例如：一等奖"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>奖金金额</Label>
                              <Input
                                value={prize.amount}
                                onChange={(e) => updatePrize(prize.id, 'amount', e.target.value)}
                                placeholder="例如：10,000"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <Label>奖项描述</Label>
                            <Textarea
                              value={prize.description}
                              onChange={(e) => updatePrize(prize.id, 'description', e.target.value)}
                              placeholder="描述这个奖项..."
                              className="mt-1"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button variant="outline" onClick={addPrize} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      添加奖项
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">赛道设置</h3>
                  
                  <div className="space-y-4">
                    {tracks.map((track, index) => (
                      <Card key={track.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">赛道 {index + 1}</h4>
                            {tracks.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTrack(track.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <Label>赛道名称</Label>
                              <Input
                                value={track.name}
                                onChange={(e) => updateTrack(track.id, 'name', e.target.value)}
                                placeholder="例如：DeFi 赛道"
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label>赛道描述</Label>
                              <Textarea
                                value={track.description}
                                onChange={(e) => updateTrack(track.id, 'description', e.target.value)}
                                placeholder="描述这个赛道的重点和要求..."
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button variant="outline" onClick={addTrack} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      添加赛道
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 3: 技术要求 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">技术栈选择</h3>
                  <p className="text-sm text-muted-foreground mb-4">选择推荐的技术栈，帮助参与者了解活动重点</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableTechnologies.map((tech) => (
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
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">已选择的技术栈</p>
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
            )}

            {/* 步骤 4: 规则说明 */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">活动规则</h3>
                  
                  <div>
                    <Label htmlFor="rules">详细规则</Label>
                    <Textarea
                      id="rules"
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                      placeholder="详细描述黑客松的规则和注意事项..."
                      className="mt-1 min-h-[120px]"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">参与要求</h4>
                  <div className="space-y-3">
                    {requirements.map((requirement, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={requirement}
                          onChange={(e) => updateRequirement(index, e.target.value)}
                          placeholder="输入参与要求..."
                          className="flex-1"
                        />
                        {requirements.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRequirement(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" onClick={addRequirement} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      添加要求
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">评审标准</h4>
                  <div className="space-y-3">
                    {judgingCriteria.map((criteria, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={criteria}
                          onChange={(e) => updateJudgingCriteria(index, e.target.value)}
                          placeholder="输入评审标准..."
                          className="flex-1"
                        />
                        {judgingCriteria.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeJudgingCriteria(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" onClick={addJudgingCriteria} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      添加标准
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 5: 预览发布 */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">预览黑客松</h3>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>{title || '黑客松名称'}</CardTitle>
                      <CardDescription>{description || '黑客松描述'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {startDate && endDate 
                              ? `${format(startDate, 'MM/dd')} - ${format(endDate, 'MM/dd')}`
                              : '时间待定'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            总奖金池: {prizes.reduce((total, prize) => {
                              const amount = parseInt(prize.amount.replace(/[^0-9]/g, '')) || 0
                              return total + amount
                            }, 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {maxParticipants ? `最多 ${maxParticipants} 人` : '不限人数'}
                          </span>
                        </div>
                      </div>

                      {selectedTechnologies.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">技术栈</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedTechnologies.map((tech) => (
                              <Badge key={tech} variant="secondary">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {prizes.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">奖项设置</p>
                          <div className="space-y-2">
                            {prizes.map((prize, index) => (
                              <div key={prize.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                <span className="font-medium">{prize.name || `奖项 ${index + 1}`}</span>
                                <span className="text-primary">{prize.amount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
                上一页              </Button>
              
              {currentStep < 5 ? (
                <Button
                  onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                  disabled={
                    (currentStep === 1 && (!title || !description || !startDate || !endDate)) ||
                    (currentStep === 2 && prizes.some(p => !p.name || !p.amount))
                  }
                >
                  下一页                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '创建中...' : '创建黑客松'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
