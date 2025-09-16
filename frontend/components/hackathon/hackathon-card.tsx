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
        return { text: '已参加', color: 'bg-blue-500', textColor: 'text-white' }
      case 'SUBMITTED':
        return { text: '已提交', color: 'bg-green-500', textColor: 'text-white' }
      case 'COMPLETED':
        return { text: '已完成', color: 'bg-purple-500', textColor: 'text-white' }
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
      className="group relative overflow-hidden hover-lift hover-glow glass border border-primary/10 hover:border-primary/30 transition-all duration-500 flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 背景渐变效果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
      
      {/* 图片区域 */}
      <div className="relative overflow-hidden">
        <div className="relative h-48 overflow-hidden">
          <img
            src={hackathon.coverImage || "/placeholder.jpg"}
            alt={hackathon.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* 图片遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        
        {/* 顶部状态徽章 */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <Badge className={`${getStatusColor(hackathon.status)} shadow-lg animate-slide-in`}>
            {getStatusIcon(hackathon.status)}
            {getStatusText(hackathon.status)}
          </Badge>
          {(() => {
            const participationStatus = getParticipationStatus(hackathon.userParticipation)
            return participationStatus ? (
              <Badge className={`${participationStatus.color} ${participationStatus.textColor} shadow-lg animate-slide-in`} style={{ animationDelay: '0.1s' }}>
                <Star className="h-3 w-3 mr-1" />
                {participationStatus.text}
              </Badge>
            ) : null
          })()}
        </div>

        {/* 右上角操作按钮 */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 glass hover:bg-white/20 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            onClick={toggleBookmark}
          >
            <Bookmark className={`h-4 w-4 transition-colors ${isBookmarked ? 'fill-current text-yellow-500' : 'text-white'}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 glass hover:bg-white/20 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            style={{ transitionDelay: '0.1s' }}
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 text-white" />
          </Button>
        </div>

        {/* 倒计时信息 */}
        {hackathon.status === 'upcoming' && (
          <div className="absolute bottom-4 right-4 glass rounded-lg px-3 py-1 text-white text-sm animate-pulse-slow">
            <Clock className="inline h-3 w-3 mr-1" />
            {getDaysUntil(hackathon.startDate)} 天后开始
          </div>
        )}

        {/* 热度指示器 */}
        {hackathon.participants > 100 && (
          <div className="absolute bottom-4 left-4 flex items-center gap-1 glass rounded-lg px-2 py-1 text-white text-xs">
            <TrendingUp className="h-3 w-3 text-orange-400" />
            <span>热门</span>
          </div>
        )}
      </div>
      
      {/* 卡片头部 */}
      <CardHeader className="space-y-3 pb-4">
        {/* 组织者信息 */}
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
            <AvatarImage src={hackathon.organizer.avatar || "/placeholder.jpg"} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
              {hackathon.organizer.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              {hackathon.organizer.name}
            </span>
          </div>
        </div>
        
        {/* 标题和描述 */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors duration-300">
            <Link href={`/hackathons/${hackathon.id}`} className="hover:underline">
              {hackathon.title}
            </Link>
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
            {hackathon.description}
          </p>
        </div>
      </CardHeader>

      {/* 卡片内容 */}
      <CardContent className="space-y-4 flex-1">
        {/* 技术栈标签 */}
        <div className="flex flex-wrap gap-2">
          {(() => {
            const allTags = Array.isArray(hackathon.tags) ? hackathon.tags : []
            const categories = (hackathon as any).categories || []
            const combinedTags = [...new Set([...allTags, ...categories])]
            const displayTags = combinedTags.slice(0, 3)
            
            return (
              <>
                {displayTags.map((tag, index) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-xs hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {tag}
                  </Badge>
                ))}
                {combinedTags.length > 3 && (
                  <Badge variant="outline" className="text-xs border-dashed hover:border-primary transition-colors">
                    +{combinedTags.length - 3}
                  </Badge>
                )}
              </>
            )
          })()}
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{hackathon.participants.toLocaleString()}</span>
            <span>参与者</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{hackathon.totalPrize}</span>
          </div>
        </div>

        {/* 日期信息 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          <Calendar className="h-4 w-4 text-green-500" />
          <span className="text-xs">
            {new Date(hackathon.startDate).toLocaleDateString('zh-CN')} - {new Date(hackathon.endDate).toLocaleDateString('zh-CN')}
          </span>
        </div>
      </CardContent>

      {/* 卡片底部 */}
      <CardFooter className="mt-auto pt-6">
        <Button asChild className="w-full group/btn bg-primary hover:bg-primary/90 hover:shadow-glow transition-all duration-300">
          <Link href={`/hackathons/${hackathon.id}`}>
            <span>{t('viewDetails')}</span>
            <div className="flex items-center ml-2 transition-transform group-hover/btn:translate-x-1">
              <ArrowRight className="h-4 w-4" />
              <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            </div>
          </Link>
        </Button>
      </CardFooter>

      {/* 装饰性边框光效 */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 animate-pulse-slow" />
    </Card>
  )
}
