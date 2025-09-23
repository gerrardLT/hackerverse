'use client'

import { useState } from 'react'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
import { cn, formatValidationError, calculateTotalPrizePool } from '@/lib/utils'
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
  winnerCount: string // 获奖人数
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
  const t = useTranslations('hackathons.createForm')
  const tCommon = useTranslations('common')
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 基本信息
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [registrationStartDate, setRegistrationStartDate] = useState<Date>()
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>()
  const [location, setLocation] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  
  // 奖项设置
  const [prizes, setPrizes] = useState<Prize[]>([
    { id: '1', name: t('defaults.firstPrize'), amount: '', description: '', winnerCount: '1' }
  ])
  
  // 赛道设置
  const [tracks, setTracks] = useState<Track[]>([
    { id: '1', name: t('defaults.mainTrack'), description: '' }
  ])
  
  // 技术栈
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([])
  const availableTechnologies = [
    'React', 'VueJS', 'Angular', 'NodeJS', 'Python', 'Java',
    'Solidity', 'Rust', 'Go', 'TypeScript', 'JavaScript',
    'AI/ML', 'Blockchain', 'DeFi', 'NFT', 'Web3', 'IPFS'
  ]
  
  // 规则和要求
  const [rules, setRules] = useState('')
  const [requirements, setRequirements] = useState<string[]>([''])
  const [judgingCriteria, setJudgingCriteria] = useState<string[]>([''])
  
  // 评委团
  const [judges, setJudges] = useState<Array<{id: string, name: string, title: string, bio: string, avatarUrl: string}>>([])
  
  // 赞助商
  const [sponsors, setSponsors] = useState<Array<{id: string, name: string, logoUrl: string, logoFile?: File, websiteUrl: string, tier: string}>>([])
  
  // 社交账号链接
  const [socialLinks, setSocialLinks] = useState({
    website: '',
    twitter: '',
    discord: '',
    telegram: '',
    github: '',
    linkedin: '',
  })
  
  // 时间线
  const [timeline, setTimeline] = useState<Array<{id: string, date: Date | undefined, title: string, description: string}>>([
    { id: '1', date: undefined, title: t('defaults.registrationDeadline'), description: t('defaults.registrationDeadlineDesc') },
    { id: '2', date: undefined, title: t('defaults.competitionBegins'), description: t('defaults.competitionBeginsDesc') },
    { id: '3', date: undefined, title: t('defaults.submissionDeadline'), description: t('defaults.submissionDeadlineDesc') }
  ])

  // 当日期状态变化时更新时间线
  React.useEffect(() => {
    setTimeline(prev => prev.map(event => {
      if (event.title === t('defaults.registrationDeadline')) return { ...event, date: registrationDeadline }
      if (event.title === t('defaults.competitionBegins')) return { ...event, date: startDate }
      if (event.title === t('defaults.submissionDeadline')) return { ...event, date: endDate }
      return event
    }))
  }, [registrationDeadline, startDate, endDate, t])

  if (!user) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('auth.loginRequired')}</h1>
          <Button asChild>
            <Link href="/auth/signin">{t('auth.login')}</Link>
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
      description: '',
      winnerCount: '1'
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      console.log('📷 未选择封面图片')
      return
    }

    // 📷 打印详细的图片信息
    console.log('📷 封面图片上传开始:', {
      name: file.name,
      size: file.size,
      sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleString(),
      webkitRelativePath: file.webkitRelativePath || 'N/A'
    })

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      console.error('❌ 文件类型不支持:', file.type)
      toast({
        title: t('toasts.fileTypeError'),
        description: t('toasts.selectImageFile'),
        variant: 'destructive',
      })
      return
    }

    // 验证文件大小 (最大5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ 文件过大:', `${(file.size / 1024 / 1024).toFixed(2)} MB > 5 MB`)
      toast({
        title: t('toasts.fileTooLarge'),
        description: t('toasts.imageSizeLimit'),
        variant: 'destructive',
      })
      return
    }

    console.log('✅ 图片验证通过，开始处理预览')
    setCoverImage(file)
    
    // 创建预览
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setCoverImagePreview(result)
      console.log('✅ 图片预览生成成功:', {
        previewLength: result.length,
        previewPrefix: result.substring(0, 50) + '...'
      })
    }
    reader.onerror = (e) => {
      console.error('❌ 图片预览生成失败:', e)
    }
    reader.readAsDataURL(file)
  }

  const removeCoverImage = () => {
    setCoverImage(null)
    setCoverImagePreview('')
  }

  // 评委管理函数
  const addJudge = () => {
    const newJudge = {
      id: Date.now().toString(),
      name: '',
      title: '',
      bio: '',
      avatarUrl: ''
    }
    setJudges([...judges, newJudge])
  }

  const updateJudge = (id: string, field: string, value: string) => {
    setJudges(judges.map(judge => 
      judge.id === id ? { ...judge, [field]: value } : judge
    ))
  }

  const removeJudge = (id: string) => {
    setJudges(judges.filter(judge => judge.id !== id))
  }

  // 赞助商管理函数
  const addSponsor = () => {
    const newSponsor = {
      id: Date.now().toString(),
      name: '',
      logoUrl: '',
      websiteUrl: '',
      tier: 'bronze'
    }
    setSponsors([...sponsors, newSponsor])
  }

  const updateSponsor = (id: string, field: string, value: string) => {
    setSponsors(sponsors.map(sponsor => 
      sponsor.id === id ? { ...sponsor, [field]: value } : sponsor
    ))
  }

  const removeSponsor = (id: string) => {
    setSponsors(sponsors.filter(sponsor => sponsor.id !== id))
  }

  // 赞助商Logo上传
  const handleSponsorLogoUpload = async (sponsorId: string, file: File) => {
    if (!file) return

    try {
      console.log('📤 开始上传赞助商Logo:', {
        sponsorId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })

      const uploadResult = await apiService.uploadFile(file)
      
      if (uploadResult.success && uploadResult.data) {
        const fileData = uploadResult.data
        // 直接使用Pinata专用网关显示图片
        const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'plum-deliberate-peacock-875.mypinata.cloud'
        const logoUrl = `https://${pinataGateway}/ipfs/${fileData.hash}`
        
        console.log('✅ 赞助商Logo上传成功:', {
          sponsorId,
          originalFileName: file.name,
          ipfsHash: fileData.hash,
          logoUrl
        })
        
        // 更新赞助商信息
        setSponsors(sponsors.map(sponsor => 
          sponsor.id === sponsorId 
            ? { ...sponsor, logoUrl, logoFile: file }
            : sponsor
        ))
        
        toast({
          title: t('toasts.logoUploadSuccess'),
          description: t('toasts.logoUploadedToIPFS', { fileName: file.name }),
        })
      }
    } catch (error: any) {
      console.error('❌ 赞助商Logo上传失败:', {
        sponsorId,
        fileName: file.name,
        fileSize: file.size,
        error: error,
        errorMessage: error.message
      })
      
      toast({
        title: t('toasts.logoUploadFailed'),
        description: error.message || t('toasts.retryLater'),
        variant: "destructive",
      })
    }
  }

  // 时间线管理函数
  const addTimelineEvent = () => {
    const newEvent = {
      id: Date.now().toString(),
      date: undefined,
      title: '',
      description: ''
    }
    setTimeline([...timeline, newEvent])
  }

  const updateTimelineEvent = (id: string, field: string, value: any) => {
    setTimeline(timeline.map(event => 
      event.id === id ? { ...event, [field]: value } : event
    ))
  }

  const removeTimelineEvent = (id: string) => {
    setTimeline(timeline.filter(event => event.id !== id))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // 验证必填字段
      if (!title || !description || !startDate || !endDate) {
        toast({
          title: t('validation.incompleteInfo'),
          description: t('validation.fillAllRequired'),
          variant: 'destructive',
        })
        return
      }

      // 验证description长度
      if (description.trim().length < 10) {
        toast({
          title: t('validation.descriptionTooShort'),
          description: t('validation.descriptionMinLength'),
          variant: 'destructive',
        })
        return
      }

      // 验证日期逻辑
      if (startDate >= endDate) {
        toast({
          title: t('validation.dateError'),
          description: t('validation.endAfterStart'),
          variant: 'destructive',
        })
        return
      }

      // 允许注册截止时间等于或晚于开始时间，但不能超过开始后24小时
      if (registrationDeadline && startDate) {
        const maxRegistrationTime = new Date(startDate.getTime() + 24 * 60 * 60 * 1000) // 开始后24小时
        if (registrationDeadline > maxRegistrationTime) {
          toast({
            title: t('validation.dateError'),
            description: t('validation.registrationTooLate'),
            variant: 'destructive',
          })
          return
        }
      }

      if (registrationStartDate && registrationDeadline && registrationStartDate >= registrationDeadline) {
        toast({
          title: t('validation.dateError'),
          description: t('validation.registrationStartBeforeEnd'),
          variant: 'destructive',
        })
        return
      }

      // ⭐ 先上传封面图片（如果有的话）
      let coverImageUrl = null
      if (coverImage) {
        try {
          setIsUploadingImage(true)
          
          // 📷 打印上传前的图片信息
          console.log('📤 准备上传封面图片到IPFS:', {
            fileName: coverImage.name,
            fileSize: coverImage.size,
            fileSizeFormatted: `${(coverImage.size / 1024 / 1024).toFixed(2)} MB`,
            fileType: coverImage.type,
            lastModified: new Date(coverImage.lastModified).toLocaleString()
          })
          
          const uploadResult = await apiService.uploadFile(coverImage)
          
          console.log('📤 IPFS上传API响应:', {
            success: uploadResult.success,
            data: uploadResult.data,
            error: uploadResult.error
          })
          
          if (uploadResult.success && uploadResult.data) {
            // 使用后端返回的数据结构
            const fileData = uploadResult.data
            // 直接使用Pinata专用网关显示图片
            const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'plum-deliberate-peacock-875.mypinata.cloud'
            coverImageUrl = `https://${pinataGateway}/ipfs/${fileData.hash}`
            
            console.log('✅ 封面图片上传成功:', {
              originalFileName: coverImage.name,
              originalSize: coverImage.size,
              ipfsHash: fileData.hash,
              ipfsUrl: fileData.url,
              proxyUrl: coverImageUrl,
              uploadedName: fileData.name,
              uploadedSize: fileData.size
            })
          } else {
            throw new Error(uploadResult.error || '图片上传失败')
          }
        } catch (imageError) {
          console.error('❌ 封面图片上传失败:', {
            error: imageError,
            fileName: coverImage.name,
            fileSize: coverImage.size,
            errorMessage: imageError instanceof Error ? imageError.message : String(imageError)
          })
          toast({
            title: t('toasts.imageUploadFailed'),
            description: t('toasts.imageUploadFailedContinue'),
            variant: 'destructive',
          })
        } finally {
          setIsUploadingImage(false)
        }
      } else {
        console.log('📷 未选择封面图片，跳过上传')
      }

      // 准备提交数据
      const hackathonData = {
        title: title.trim(),
        description: description.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        registrationStartDate: registrationStartDate ? registrationStartDate.toISOString() : undefined,
        registrationDeadline: registrationDeadline ? registrationDeadline.toISOString() : startDate.toISOString(),
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        prizePool: calculateTotalPrizePool(prizes), // ⭐ 使用工具函数计算总奖金
        categories: selectedTechnologies.length > 0 ? selectedTechnologies : ['General'],
        tags: selectedTechnologies,
        requirements: requirements.filter(r => r.trim()).join('\n'),
        rules: rules.trim(),
        isPublic: true,
        featured: false,
        coverImage: coverImageUrl, // ⭐ 添加封面图片URL
        prizes: prizes.map((prize, index) => ({
          rank: index + 1,
          name: prize.name.trim(), // ⭐ 正确存储奖项名称
          amount: parseInt(prize.amount.replace(/[^0-9]/g, '')) || 0,
          description: prize.description.trim() || prize.name.trim(),
          winnerCount: parseInt(prize.winnerCount) || 1 // ⭐ 添加获奖人数
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
        })),
        judges: judges.filter(j => j.name.trim()).map(judge => ({
          name: judge.name.trim(),
          title: judge.title.trim(),
          bio: judge.bio.trim(),
          avatarUrl: judge.avatarUrl.trim() || '/placeholder.svg'
        })),
        sponsors: sponsors.filter(s => s.name.trim()).map(sponsor => ({
          name: sponsor.name.trim(),
          logoUrl: sponsor.logoUrl.trim() || '/placeholder.svg',
          websiteUrl: sponsor.websiteUrl.trim(),
          tier: sponsor.tier
        })),
        timeline: timeline.filter(t => t.title.trim() && t.date).map(event => ({
          date: event.date!.toISOString(),
          title: event.title.trim(),
          description: event.description.trim(),
          completed: false
        })),
        socialLinks: Object.fromEntries(
          Object.entries(socialLinks).filter(([_, value]) => value.trim())
        )
      }

      // 🚀 打印创建黑客松时的完整数据
      console.log('🚀 创建黑客松 - 完整数据:', {
        basicInfo: {
          title: hackathonData.title,
          description: hackathonData.description,
          startDate: hackathonData.startDate,
          endDate: hackathonData.endDate,
          maxParticipants: hackathonData.maxParticipants,
          prizePool: hackathonData.prizePool
        },
        coverImageInfo: {
          hasCoverImage: !!coverImageUrl,
          coverImageUrl: coverImageUrl,
          originalFile: coverImage ? {
            name: coverImage.name,
            size: coverImage.size,
            type: coverImage.type
          } : null
        },
        metadata: {
          prizesCount: hackathonData.prizes.length,
          tracksCount: hackathonData.tracks.length,
          judgesCount: hackathonData.judges.length,
          sponsorsCount: hackathonData.sponsors.length,
          timelineCount: hackathonData.timeline.length,
          judgingCriteriaCount: hackathonData.judgingCriteria.length
        },
        fullData: hackathonData
      })

      // 调用API创建黑客松
      const response = await apiService.createHackathon(hackathonData)

      if (response.success && response.data) {
        toast({
          title: t('toasts.hackathonCreated'),
          description: (
            <div className="space-y-1">
              <p>{t('toasts.pendingReview')}</p>
              <p className="text-xs text-muted-foreground">
                {t('toasts.reviewNotice')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('toasts.contractId', { contractId: response.data.hackathon.contractId })}
              </p>
              {response.data.hackathon.txHash && (
                <p className="text-xs text-muted-foreground">
                  {t('toasts.txHash', { txHash: response.data.hackathon.txHash?.slice(0, 10) + '...' })}
                </p>
              )}
            </div>
          ),
          duration: 6000, // 延长显示时间以便用户阅读审核提示
        })
        
        // ⭐ 创建成功后跳转回黑客松列表页
        router.push('/hackathons')
      } else {
        // 处理具体的验证错误
        const errorMessage = formatValidationError(response)
        
        toast({
          title: t('toasts.creationFailed'),
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('创建黑客松错误:', error)
      toast({
        title: t('toasts.creationFailed'),
        description: t('toasts.networkError'),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { id: 1, name: t('steps.basicInfo'), description: t('steps.basicInfoDesc') },
    { id: 2, name: t('steps.prizeSettings'), description: t('steps.prizeSettingsDesc') },
    { id: 3, name: t('steps.techRequirements'), description: t('steps.techRequirementsDesc') },
    { id: 4, name: t('steps.rulesExplanation'), description: t('steps.rulesExplanationDesc') },
    { id: 5, name: t('steps.judgeTeam'), description: t('steps.judgeTeamDesc') },
    { id: 6, name: t('steps.previewPublish'), description: t('steps.previewPublishDesc') }
  ]

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('description')}</p>
        </div>


        <Card>
          <CardContent className="p-6">
            {/* 步骤 1: 基本信息 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-bold">
                      1
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{steps[0].name}</h2>
                      <p className="text-sm text-muted-foreground">{steps[0].description}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('basicInfo.title')}</h3>
                  
                  <div className="space-y-4">
                    {/* 封面图片上传 - 移到最上方 */}
                    <div>
                      <Label>{t('basicInfo.coverImage')}</Label>
                      <p className="text-sm text-muted-foreground mb-2">{t('basicInfo.coverImageDesc')}</p>
                      
                      {!coverImagePreview ? (
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                          <div className="text-center">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <div className="mt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('cover-image-input')?.click()}
                                disabled={isUploadingImage}
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                {isUploadingImage ? t('basicInfo.uploading') : t('basicInfo.selectImage')}
                              </Button>
                              <input
                                id="cover-image-input"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {t('basicInfo.supportedFormats')}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={coverImagePreview}
                            alt="封面预览"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={removeCoverImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="title">{t('basicInfo.hackathonName')} *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('basicInfo.hackathonNamePlaceholder')}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">{t('basicInfo.eventDescription')} *</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('basicInfo.eventDescriptionPlaceholder')}
                        className={cn(
                          "mt-1 min-h-[120px]",
                          description.trim().length > 0 && description.trim().length < 10 
                            ? "border-destructive focus-visible:ring-destructive" 
                            : ""
                        )}
                      />
                      <div className="flex justify-between items-center mt-1">
                        <p className={cn(
                          "text-sm",
                          description.trim().length < 10 
                            ? "text-destructive" 
                            : "text-muted-foreground"
                        )}>
                          {description.trim().length < 10 
                            ? t('basicInfo.validationMinLength', { current: description.trim().length })
                            : t('basicInfo.validationEntered', { current: description.trim().length })
                          }
                        </p>
                        {description.trim().length >= 10 && (
                          <span className="text-sm text-green-600">{t('basicInfo.validationValid')}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>{t('basicInfo.startTime')} *</Label>
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
                              {startDate ? format(startDate, "PPP", { locale: zhCN }) : t('basicInfo.selectStartTime')}
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
                        <Label>{t('basicInfo.endTime')} *</Label>
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
                              {endDate ? format(endDate, "PPP", { locale: zhCN }) : t('basicInfo.selectEndTime')}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>{t('basicInfo.registrationStartTime')}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal mt-1",
                                !registrationStartDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {registrationStartDate ? format(registrationStartDate, "PPP", { locale: zhCN }) : t('basicInfo.selectRegistrationStartTime')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={registrationStartDate}
                              onSelect={setRegistrationStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label>{t('basicInfo.registrationDeadline')} *</Label>
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
                              {registrationDeadline ? format(registrationDeadline, "PPP", { locale: zhCN }) : t('basicInfo.selectRegistrationDeadline')}
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">{t('basicInfo.eventLocation')}</Label>
                        <Input
                          id="location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder={t('basicInfo.eventLocationPlaceholder')}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="maxParticipants">{t('basicInfo.maxParticipants')}</Label>
                        <Input
                          id="maxParticipants"
                          type="number"
                          value={maxParticipants}
                          onChange={(e) => setMaxParticipants(e.target.value)}
                          placeholder={t('basicInfo.maxParticipantsPlaceholder')}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* 时间线管理 - 移到基本信息中 */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4 mt-6">{t('basicInfo.timeSchedule')}</h4>
                      <p className="text-sm text-muted-foreground mb-4">{t('basicInfo.timeScheduleDesc')}</p>
                      
                      <div className="space-y-4">
                        {timeline.map((event, index) => (
                          <Card key={event.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium">{t('basicInfo.timelineEvent', { index: index + 1 })}</h5>
                                {timeline.length > 3 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTimelineEvent(event.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>{t('basicInfo.eventTitle')}</Label>
                                  <Input
                                    value={event.title}
                                    onChange={(e) => updateTimelineEvent(event.id, 'title', e.target.value)}
                                    placeholder={t('basicInfo.eventTitlePlaceholder')}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label>{t('basicInfo.time')}</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full justify-start text-left font-normal mt-1",
                                          !event.date && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {event.date ? format(event.date, "PPP", { locale: zhCN }) : t('basicInfo.selectTime')}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                      <Calendar
                                        mode="single"
                                        selected={event.date}
                                        onSelect={(date) => updateTimelineEvent(event.id, 'date', date)}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <Label>{t('basicInfo.eventDesc')}</Label>
                                <Input
                                  value={event.description}
                                  onChange={(e) => updateTimelineEvent(event.id, 'description', e.target.value)}
                                  placeholder={t('basicInfo.eventDescPlaceholder')}
                                  className="mt-1"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        
                        <Button variant="outline" onClick={addTimelineEvent} className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          {t('basicInfo.addTimelineEvent')}
                        </Button>
                      </div>
                    </div>

                    {/* 项目方社交账号 - 可选 */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4 mt-6">{t('basicInfo.socialLinks')}</h4>
                      <p className="text-sm text-muted-foreground mb-4">{t('basicInfo.socialLinksDesc')}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="website">{t('basicInfo.officialWebsite')}</Label>
                          <Input
                            id="website"
                            type="url"
                            value={socialLinks.website}
                            onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://example.com"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="twitter">{t('basicInfo.twitter')}</Label>
                          <Input
                            id="twitter"
                            type="url"
                            value={socialLinks.twitter}
                            onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                            placeholder="https://twitter.com/username"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="discord">{t('basicInfo.discord')}</Label>
                          <Input
                            id="discord"
                            type="url"
                            value={socialLinks.discord}
                            onChange={(e) => setSocialLinks(prev => ({ ...prev, discord: e.target.value }))}
                            placeholder="https://discord.gg/invite"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="telegram">{t('basicInfo.telegram')}</Label>
                          <Input
                            id="telegram"
                            type="url"
                            value={socialLinks.telegram}
                            onChange={(e) => setSocialLinks(prev => ({ ...prev, telegram: e.target.value }))}
                            placeholder="https://t.me/username"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="github">{t('basicInfo.github')}</Label>
                          <Input
                            id="github"
                            type="url"
                            value={socialLinks.github}
                            onChange={(e) => setSocialLinks(prev => ({ ...prev, github: e.target.value }))}
                            placeholder="https://github.com/organization"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="linkedin">{t('basicInfo.linkedin')}</Label>
                          <Input
                            id="linkedin"
                            type="url"
                            value={socialLinks.linkedin}
                            onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
                            placeholder="https://linkedin.com/company/name"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      {/* 社交链接预览 */}
                      {Object.values(socialLinks).some(link => link.trim()) && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                          <h5 className="font-medium mb-2">{t('basicInfo.socialLinksAdded')}</h5>
                          <div className="flex flex-wrap gap-2">
                            {socialLinks.website && (
                              <Badge variant="secondary">🌐 {t('basicInfo.website')}</Badge>
                            )}
                            {socialLinks.twitter && (
                              <Badge variant="secondary">🐦 {t('basicInfo.twitter')}</Badge>
                            )}
                            {socialLinks.discord && (
                              <Badge variant="secondary">💬 {t('basicInfo.discord')}</Badge>
                            )}
                            {socialLinks.telegram && (
                              <Badge variant="secondary">📱 {t('basicInfo.telegram')}</Badge>
                            )}
                            {socialLinks.github && (
                              <Badge variant="secondary">🐙 {t('basicInfo.github')}</Badge>
                            )}
                            {socialLinks.linkedin && (
                              <Badge variant="secondary">💼 {t('basicInfo.linkedin')}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* 步骤 2: 奖项设置 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-bold">
                      2
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{steps[1].name}</h2>
                      <p className="text-sm text-muted-foreground">{steps[1].description}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('prizes.title')}</h3>
                  
                  <div className="space-y-4">
                    {prizes.map((prize, index) => (
                      <Card key={prize.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{t('prizes.prize', { index: index + 1 })}</h4>
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
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label>{t('prizes.prizeName')}</Label>
                              <Input
                                value={prize.name}
                                onChange={(e) => updatePrize(prize.id, 'name', e.target.value)}
                                placeholder={t('prizes.prizeNamePlaceholder')}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>{t('prizes.prizeAmount')}</Label>
                              <div className="relative mt-1">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  value={prize.amount}
                                  onChange={(e) => updatePrize(prize.id, 'amount', e.target.value)}
                                  placeholder={t('prizes.prizeAmountPlaceholder')}
                                  className="pl-9"
                                />
                              </div>
                            </div>
                            <div>
                              <Label>{t('prizes.winnerCount')}</Label>
                              <Input
                                type="number"
                                min="1"
                                value={prize.winnerCount}
                                onChange={(e) => updatePrize(prize.id, 'winnerCount', e.target.value)}
                                placeholder="1"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <Label>{t('prizes.prizeDescription')}</Label>
                            <Textarea
                              value={prize.description}
                              onChange={(e) => updatePrize(prize.id, 'description', e.target.value)}
                              placeholder={t('prizes.prizeDescPlaceholder')}
                              className="mt-1"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button variant="outline" onClick={addPrize} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('prizes.addPrize')}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('prizes.tracks')}</h3>
                  
                  <div className="space-y-4">
                    {tracks.map((track, index) => (
                      <Card key={track.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{t('prizes.track', { index: index + 1 })}</h4>
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
                              <Label>{t('prizes.trackName')}</Label>
                              <Input
                                value={track.name}
                                onChange={(e) => updateTrack(track.id, 'name', e.target.value)}
                                placeholder={t('prizes.trackNamePlaceholder')}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label>{t('prizes.trackDescription')}</Label>
                              <Textarea
                                value={track.description}
                                onChange={(e) => updateTrack(track.id, 'description', e.target.value)}
                                placeholder={t('prizes.trackDescPlaceholder')}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button variant="outline" onClick={addTrack} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('prizes.addTrack')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 3: 技术要求 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-bold">
                      3
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{steps[2].name}</h2>
                      <p className="text-sm text-muted-foreground">{steps[2].description}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('tech.title')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t('tech.techDesc')}</p>
                  
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
                      <p className="text-sm font-medium mb-2">{t('tech.selectedTech')}</p>
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
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-bold">
                      4
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{steps[3].name}</h2>
                      <p className="text-sm text-muted-foreground">{steps[3].description}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('rules.title')}</h3>
                  
                  <div>
                    <Label htmlFor="rules">{t('rules.detailedRules')}</Label>
                    <Textarea
                      id="rules"
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                      placeholder={t('rules.detailedRulesPlaceholder')}
                      className="mt-1 min-h-[120px]"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">{t('rules.participationRequirements')}</h4>
                  <div className="space-y-3">
                    {requirements.map((requirement, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={requirement}
                          onChange={(e) => updateRequirement(index, e.target.value)}
                          placeholder={t('rules.requirementPlaceholder')}
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
                        {t('rules.addRequirement')}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">{t('rules.judgingCriteria')}</h4>
                  <div className="space-y-3">
                    {judgingCriteria.map((criteria, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={criteria}
                          onChange={(e) => updateJudgingCriteria(index, e.target.value)}
                          placeholder={t('rules.criteriaPlaceholder')}
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
                        {t('rules.addCriteria')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 5: 评委团队 */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-bold">
                      5
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{steps[4].name}</h2>
                      <p className="text-sm text-muted-foreground">{steps[4].description}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('judges.title')}</h3>
                  
                  <div className="space-y-4">
                    {judges.map((judge, index) => (
                      <Card key={judge.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{t('judges.judge', { index: index + 1 })}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeJudge(judge.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>{t('judges.judgeName')}</Label>
                              <Input
                                value={judge.name}
                                onChange={(e) => updateJudge(judge.id, 'name', e.target.value)}
                                placeholder={t('judges.judgeNamePlaceholder')}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>{t('judges.judgePosition')}</Label>
                              <Input
                                value={judge.title}
                                onChange={(e) => updateJudge(judge.id, 'title', e.target.value)}
                                placeholder={t('judges.judgePositionPlaceholder')}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <Label>{t('judges.judgeBio')}</Label>
                            <Textarea
                              value={judge.bio}
                              onChange={(e) => updateJudge(judge.id, 'bio', e.target.value)}
                              placeholder={t('judges.judgeBioPlaceholder')}
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="mt-4">
                            <Label>{t('judges.judgeAvatar')}</Label>
                            <Input
                              value={judge.avatarUrl}
                              onChange={(e) => updateJudge(judge.id, 'avatarUrl', e.target.value)}
                              placeholder={t('judges.judgeAvatarPlaceholder')}
                              className="mt-1"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button variant="outline" onClick={addJudge} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('judges.addJudge')}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('judges.sponsors')}</h3>
                  
                  <div className="space-y-4">
                    {sponsors.map((sponsor, index) => (
                      <Card key={sponsor.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{t('judges.sponsor', { index: index + 1 })}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSponsor(sponsor.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>{t('judges.companyName')}</Label>
                              <Input
                                value={sponsor.name}
                                onChange={(e) => updateSponsor(sponsor.id, 'name', e.target.value)}
                                placeholder={t('judges.companyNamePlaceholder')}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>{t('judges.sponsorTier')}</Label>
                              <Select
                                value={sponsor.tier}
                                onValueChange={(value) => updateSponsor(sponsor.id, 'tier', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder={t('judges.selectSponsorTier')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="platinum">{t('judges.platinum')}</SelectItem>
                                  <SelectItem value="gold">{t('judges.gold')}</SelectItem>
                                  <SelectItem value="silver">{t('judges.silver')}</SelectItem>
                                  <SelectItem value="bronze">{t('judges.bronze')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="space-y-4 mt-4">
                            {/* Logo上传区域 */}
                            <div>
                              <Label>{t('judges.companyLogo')}</Label>
                              <div className="mt-1">
                                {sponsor.logoUrl ? (
                                  <div className="space-y-2">
                                    <div className="relative w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                                      <img 
                                        src={sponsor.logoUrl} 
                                        alt={`${sponsor.name} Logo`}
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => document.getElementById(`sponsor-logo-${sponsor.id}`)?.click()}
                                      >
                                        <Upload className="mr-2 h-4 w-4" />
                                        {t('judges.changeLogo')}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => updateSponsor(sponsor.id, 'logoUrl', '')}
                                      >
                                        {t('judges.deleteLogo')}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div 
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                                    onClick={() => document.getElementById(`sponsor-logo-${sponsor.id}`)?.click()}
                                  >
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-600">
                                      {t('judges.clickUploadLogo')}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {t('judges.logoFormats')}
                                    </p>
                                  </div>
                                )}
                                
                                <input
                                  id={`sponsor-logo-${sponsor.id}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      handleSponsorLogoUpload(sponsor.id, file)
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            
                            {/* 其他字段 */}
                            <div>
                              <Label>{t('judges.websiteLink')}</Label>
                              <Input
                                value={sponsor.websiteUrl}
                                onChange={(e) => updateSponsor(sponsor.id, 'websiteUrl', e.target.value)}
                                placeholder="https://company.com"
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button variant="outline" onClick={addSponsor} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('judges.addSponsor')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 6: 预览发布 */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-bold">
                      6
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{steps[5].name}</h2>
                      <p className="text-sm text-muted-foreground">{steps[5].description}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('preview.title')}</h3>
                  
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
                              : t('preview.timeTBD')
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {t('preview.totalPrizePool', { amount: calculateTotalPrizePool(prizes).toLocaleString() })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {maxParticipants ? t('preview.maxPeople', { count: maxParticipants }) : t('preview.unlimited')}
                          </span>
                        </div>
                      </div>

                      {selectedTechnologies.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">{t('preview.techStack')}</p>
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
                          <p className="text-sm font-medium mb-2">{t('preview.prizeSettings')}</p>
                          <div className="space-y-2">
                            {prizes.map((prize, index) => (
                              <div key={prize.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                <div>
                                  <span className="font-medium">{prize.name || `奖项 ${index + 1}`}</span>
                                  <span className="text-sm text-muted-foreground ml-2">({prize.winnerCount || 1}人)</span>
                                </div>
                                <span className="text-primary">{prize.amount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {judges.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">{t('preview.judgeTeam')}</p>
                          <div className="space-y-2">
                            {judges.map((judge) => (
                              <div key={judge.id} className="flex items-center gap-3 p-2 bg-muted rounded">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium">{judge.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{judge.name}</p>
                                  <p className="text-xs text-muted-foreground">{judge.title}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sponsors.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">赞助商</p>
                          <div className="grid grid-cols-2 gap-2">
                            {sponsors.map((sponsor) => (
                              <div key={sponsor.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                                <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center overflow-hidden">
                                  {sponsor.logoUrl ? (
                                    <img 
                                      src={sponsor.logoUrl} 
                                      alt={`${sponsor.name} Logo`}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium">{sponsor.name.charAt(0)}</span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-medium">{sponsor.name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{sponsor.tier}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {timeline.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">{t('preview.schedule')}</p>
                          <div className="space-y-2">
                            {timeline.filter(t => t.date).map((event) => (
                              <div key={event.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                <span className="font-medium text-sm">{event.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {event.date ? format(event.date, 'MM/dd') : t('preview.tbd')}
                                </span>
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
                {t('navigation.previous')}
              </Button>
              
              {currentStep < 6 ? (
                <Button
                  onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
                  disabled={
                    (currentStep === 1 && (!title || !description || !startDate || !endDate)) ||
                    (currentStep === 2 && prizes.some(p => !p.name || !p.amount))
                  }
                >
                  {t('navigation.next')}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('navigation.creating') : t('navigation.createHackathon')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
