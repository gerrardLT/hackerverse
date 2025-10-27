'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Users, Trophy, Clock, ArrowRight, Star, Bookmark, Share2, ExternalLink, Zap, TrendingUp } from 'lucide-react'
import { useEnumTranslations } from '@/lib/enum-utils'
import { useTranslations } from 'next-intl'

interface Hackathon {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: 'upcoming' | 'ongoing' | 'completed'
  participants: number
  totalPrize: string
  organizer: {
    name: string
    avatar: string
  }
  tags: string[]
  coverImage: string
  userParticipation?: {
    isParticipating: boolean
    status: 'REGISTERED' | 'SUBMITTED' | 'COMPLETED'
    joinedAt: string
    hasSubmittedProject: boolean
    projectCount: number
  } | null
}

interface HackathonCardProps {
  hackathon: Hackathon
}

export function HackathonCard({ hackathon }: HackathonCardProps) {
  const enumT = useEnumTranslations()
  const t = useTranslations('hackathons.card')
  const [isHovered, setIsHovered] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500 text-white'
      case 'ongoing': return 'bg-green-500 text-white animate-pulse-slow'
      case 'completed': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusText = (status: string) => {
    return enumT.getHackathonStatusText(status)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="h-3 w-3 mr-1" />
      case 'ongoing': return <Zap className="h-3 w-3 mr-1" />
      case 'completed': return <Trophy className="h-3 w-3 mr-1" />
      default: return null
    }
  }

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getParticipationStatus = (userParticipation: Hackathon['userParticipation']) => {
    if (!userParticipation || !userParticipation.isParticipating) {
      return null
    }

    switch (userParticipation.status) {
      case 'REGISTERED':
        return { text: t('status.registered'), color: 'bg-blue-500', textColor: 'text-white' }
      case 'SUBMITTED':
        return { text: t('status.submitted'), color: 'bg-green-500', textColor: 'text-white' }
      case 'COMPLETED':
        return { text: t('status.completed'), color: 'bg-purple-500', textColor: 'text-white' }
      default:
        return null
    }
  }

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsBookmarked(!isBookmarked)
    // TODO: 实际的收藏功能
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // TODO: 实际的分享功能
    if (navigator.share) {
      navigator.share({
        title: hackathon.title,
        text: hackathon.description,
        url: `/hackathons/${hackathon.id}`
      })
    }
  }

  return (
    <Card 
      className="group relative overflow-hidden hover-lift hover-glow glass border border-primary/10 hover:border-primary/30 transition-all duration-500 flex flex-row h-[140px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 背景渐变效果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
      
      {/* 图片区域 - 左侧固定宽度 */}
      <div className="relative overflow-hidden w-[200px] shrink-0">
        <div className="relative h-full overflow-hidden">
          <img
            src={hackathon.coverImage || "/placeholder.jpg"}
            alt={hackathon.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* 图片遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        
        {/* 状态徽章 - 左上角 */}
        <div className="absolute top-2 left-2">
          <Badge className={`${getStatusColor(hackathon.status)} text-xs shadow-lg`}>
            {getStatusIcon(hackathon.status)}
            {getStatusText(hackathon.status)}
          </Badge>
        </div>
      </div>
      
      {/* 右侧内容区域 - 紧凑布局 */}
      <div className="flex-1 flex flex-col p-4 min-w-0">
        {/* 顶部：标题 + 组织者 + 操作按钮 */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
              <Link href={`/hackathons/${hackathon.id}`} className="hover:underline">
                {hackathon.title}
              </Link>
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="h-5 w-5 ring-1 ring-primary/20">
                <AvatarImage src={hackathon.organizer.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-[10px]">
                  {hackathon.organizer.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{hackathon.organizer.name}</span>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-primary/10"
              onClick={toggleBookmark}
            >
              <Bookmark className={`h-3 w-3 ${isBookmarked ? 'fill-current text-yellow-500' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-primary/10"
              onClick={handleShare}
            >
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 描述 */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {hackathon.description}
        </p>

        {/* 底部：标签 + 统计信息 + 按钮 */}
        <div className="flex items-center justify-between gap-3 mt-auto">
          {/* 标签 */}
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {(() => {
              const allTags = Array.isArray(hackathon.tags) ? hackathon.tags : []
              const categories = (hackathon as any).categories || []
              const combinedTags = [...new Set([...allTags, ...categories])]
              const displayTags = combinedTags.slice(0, 2)
              
              return (
                <>
                  {displayTags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-[10px] px-1.5 py-0 h-5"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {combinedTags.length > 2 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                      +{combinedTags.length - 2}
                    </Badge>
                  )}
                </>
              )
            })()}
          </div>

          {/* 统计信息 */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-blue-500" />
              <span>{hackathon.participants}</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-yellow-500" />
              <span className="font-medium">{hackathon.totalPrize}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-green-500" />
              <span className="text-[10px]">
                {new Date(hackathon.startDate).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* 查看详情按钮 */}
          <Button asChild size="sm" className="h-7 px-3 shrink-0 bg-primary hover:bg-primary/90">
            <Link href={`/hackathons/${hackathon.id}`} className="flex items-center gap-1">
              <span className="text-xs">{t('viewDetails')}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 装饰性边框光效 */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 animate-pulse-slow" />
    </Card>
  )
}
