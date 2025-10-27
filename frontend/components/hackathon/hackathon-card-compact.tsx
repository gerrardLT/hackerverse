'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, Trophy, ArrowRight } from 'lucide-react'

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
  } | null
}

interface HackathonCardCompactProps {
  hackathon: Hackathon
}

/**
 * HackathonCardCompact - Flat Design 2.0
 * 紧凑卡片，高度220px，4列网格布局
 */
export function HackathonCardCompact({ hackathon }: HackathonCardCompactProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'ongoing': return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'completed': return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysLeft = getDaysUntil(hackathon.startDate)
  const isOngoing = hackathon.status === 'ongoing'
  const isCompleted = hackathon.status === 'completed'

  return (
    <Link href={`/hackathons/${hackathon.id}`} className="group block">
      <Card className="h-[220px] overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover-lift hover:shadow-lg">
        {/* 顶部渐变条 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="p-4 h-full flex flex-col">
          {/* 头部：状态徽章 + 标题 */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="text-base font-bold line-clamp-2 flex-1 group-hover:text-primary transition-colors">
              {hackathon.title}
            </h3>
            <Badge 
              variant="outline" 
              className={`text-xs shrink-0 px-2 py-0.5 ${getStatusColor(hackathon.status)}`}
            >
              {isCompleted ? 'Ended' : isOngoing ? 'Live' : 'Upcoming'}
            </Badge>
          </div>

          {/* 关键信息行 */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {isCompleted 
                  ? 'Completed'
                  : isOngoing 
                  ? 'Ongoing' 
                  : daysLeft > 0 
                  ? `${daysLeft}d left` 
                  : 'Today'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{hackathon.participants}</span>
            </div>
          </div>

          {/* 技术栈标签 - 只显示前3个 */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {hackathon.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs px-2 py-0 h-5 border-primary/20 hover:border-primary/40 transition-colors"
              >
                {tag}
              </Badge>
            ))}
            {hackathon.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                +{hackathon.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* 底部：奖金 + 查看详情 */}
          <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold">
                {hackathon.totalPrize}
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              View
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>

          {/* 用户参与状态指示器 */}
          {hackathon.userParticipation?.isParticipating && (
            <div className="absolute top-2 left-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}

