'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Star, 
  Award, 
  Crown, 
  Gem,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReputationBadgeProps {
  /** 用户总声誉积分 */
  totalPoints: number
  /** 当前等级 */
  level: number
  /** 到下一级的积分 */
  pointsToNextLevel?: number
  /** 下一级总积分 */
  nextLevelPoints?: number
  /** 声誉变化趋势 */
  trend?: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
    recentPoints: number
  }
  /** 显示变体 */
  variant?: 'default' | 'compact' | 'minimal' | 'card'
  /** 显示大小 */
  size?: 'sm' | 'md' | 'lg'
  /** 是否显示进度条 */
  showProgress?: boolean
  /** 是否显示趋势 */
  showTrend?: boolean
  /** 自定义类名 */
  className?: string
  /** 是否可点击 */
  interactive?: boolean
  /** 点击回调 */
  onClick?: () => void
}

// 等级配置
const LEVEL_CONFIG = {
  1: { name: 'Newbie', icon: Star, color: 'text-gray-400', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
  2: { name: 'Rookie', icon: Star, color: 'text-blue-400', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  3: { name: 'Developer', icon: Star, color: 'text-green-400', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  4: { name: 'Advanced', icon: Award, color: 'text-purple-400', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  5: { name: 'Expert', icon: Award, color: 'text-orange-400', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  6: { name: 'Master', icon: Crown, color: 'text-red-400', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  7: { name: 'Grandmaster', icon: Crown, color: 'text-pink-400', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  8: { name: 'Legend', icon: Gem, color: 'text-violet-400', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
  9: { name: 'Mythical', icon: Gem, color: 'text-indigo-400', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  10: { name: 'Godlike', icon: Gem, color: 'text-yellow-400', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' }
}

function getLevelConfig(level: number) {
  const maxLevel = Math.max(...Object.keys(LEVEL_CONFIG).map(Number))
  if (level <= maxLevel) {
    return LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG]
  }
  // 超过最大等级的情况
  return {
    name: 'Transcendent',
    icon: Gem,
    color: 'text-gradient-to-r from-purple-400 to-pink-400',
    bgColor: 'bg-gradient-to-r from-purple-50 to-pink-50',
    borderColor: 'border-gradient-to-r from-purple-200 to-pink-200'
  }
}

function formatPoints(points: number): string {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`
  }
  return points.toString()
}

export function ReputationBadge({
  totalPoints,
  level,
  pointsToNextLevel,
  nextLevelPoints,
  trend,
  variant = 'default',
  size = 'md',
  showProgress = true,
  showTrend = true,
  className,
  interactive = false,
  onClick
}: ReputationBadgeProps) {
  const t = useTranslations('reputation.badge')
  const levelConfig = getLevelConfig(level)
  const Icon = levelConfig.icon

  // 计算进度百分比
  const progressPercentage = nextLevelPoints && pointsToNextLevel !== undefined
    ? ((nextLevelPoints - pointsToNextLevel) / nextLevelPoints) * 100
    : 0

  // 尺寸配置
  const sizeConfig = {
    sm: {
      container: 'p-2',
      icon: 'w-4 h-4',
      text: 'text-xs',
      badge: 'text-xs px-1.5 py-0.5',
      progress: 'h-1'
    },
    md: {
      container: 'p-3',
      icon: 'w-5 h-5',
      text: 'text-sm',
      badge: 'text-sm px-2 py-1',
      progress: 'h-2'
    },
    lg: {
      container: 'p-4',
      icon: 'w-6 h-6',
      text: 'text-base',
      badge: 'text-base px-3 py-1.5',
      progress: 'h-3'
    }
  }

  const config = sizeConfig[size]

  // 趋势图标
  const TrendIcon = trend?.direction === 'up' ? TrendingUp :
                   trend?.direction === 'down' ? TrendingDown : Minus

  const trendColor = trend?.direction === 'up' ? 'text-green-500' :
                    trend?.direction === 'down' ? 'text-red-500' : 'text-gray-500'

  // 渲染内容的基础组件
  const renderContent = () => (
    <>
      <div className="flex items-center gap-2">
        <div className={cn(
          'flex items-center justify-center rounded-full p-1.5',
          levelConfig.bgColor,
          levelConfig.borderColor,
          'border'
        )}>
          <Icon className={cn(config.icon, levelConfig.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={cn(config.badge, levelConfig.color)}
            >
              Lv.{level}
            </Badge>
            <span className={cn('font-medium', config.text)}>
              {t(`levels.${levelConfig.name.toLowerCase()}`) || levelConfig.name}
            </span>
          </div>
          <div className={cn('text-muted-foreground', config.text)}>
            {formatPoints(totalPoints)} {t('points')}
          </div>
        </div>
        {showTrend && trend && (
          <div className={cn('flex items-center gap-1', config.text)}>
            <TrendIcon className={cn('w-3 h-3', trendColor)} />
            <span className={cn(trendColor, 'font-medium')}>
              {trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {showProgress && pointsToNextLevel !== undefined && nextLevelPoints && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('nextLevel')}</span>
            <span>{formatPoints(pointsToNextLevel)} {t('needed')}</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className={cn(config.progress, 'bg-gray-100')}
            // @ts-ignore
            indicatorClassName={cn('transition-all', levelConfig.color.replace('text-', 'bg-'))}
          />
        </div>
      )}
    </>
  )

  // 根据变体渲染不同的样式
  if (variant === 'minimal') {
    return (
      <div 
        className={cn(
          'flex items-center gap-2',
          interactive && 'cursor-pointer hover:opacity-80 transition-opacity',
          className
        )}
        onClick={onClick}
      >
        <Icon className={cn(config.icon, levelConfig.color)} />
        <Badge variant="secondary" className={cn(config.badge, levelConfig.color)}>
          Lv.{level}
        </Badge>
        <span className={cn('text-muted-foreground', config.text)}>
          {formatPoints(totalPoints)}
        </span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                'flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50',
                interactive && 'cursor-pointer hover:bg-muted transition-colors',
                className
              )}
              onClick={onClick}
            >
              <Icon className={cn(config.icon, levelConfig.color)} />
              <Badge variant="secondary" className={config.badge}>
                Lv.{level}
              </Badge>
              <span className={cn('font-medium', config.text)}>
                {formatPoints(totalPoints)}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-medium">{levelConfig.name}</div>
              <div className="text-sm text-muted-foreground">
                {totalPoints} {t('totalPoints')}
              </div>
              {pointsToNextLevel !== undefined && (
                <div className="text-sm text-muted-foreground">
                  {pointsToNextLevel} {t('toNextLevel')}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (variant === 'card') {
    return (
      <Card 
        className={cn(
          levelConfig.borderColor,
          'border-2',
          interactive && 'cursor-pointer hover:shadow-md transition-shadow',
          className
        )}
        onClick={onClick}
      >
        <CardContent className={config.container}>
          {renderContent()}
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <div 
      className={cn(
        'p-3 rounded-lg border',
        levelConfig.borderColor,
        levelConfig.bgColor,
        interactive && 'cursor-pointer hover:shadow-sm transition-shadow',
        className
      )}
      onClick={onClick}
    >
      {renderContent()}
    </div>
  )
}
