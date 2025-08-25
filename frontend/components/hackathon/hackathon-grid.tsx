'use client'

import { useState, useEffect } from 'react'
import { HackathonCard } from './hackathon-card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'
import { dataService } from '@/lib/data-service'
import { HackathonData } from '@/lib/ipfs-data-service'
import { useToast } from '@/hooks/use-toast'

interface HackathonGridProps {
  searchQuery: string
  filters: {
    status: string
    technologies: string[]
    prizeRange: string
    dateRange: string
  }
}

export function HackathonGrid({ searchQuery, filters }: HackathonGridProps) {
  const [hackathons, setHackathons] = useState<HackathonData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const { toast } = useToast()

  // 获取黑客松数据
  const fetchHackathons = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      // 构建参数
      const params: any = {
        page: pageNum,
        limit: 12,
        search: searchQuery || undefined,
        sortBy: 'createdAt'
      }

      // 处理状态筛选
      if (filters.status !== 'all') {
        params.status = filters.status
      }

      // 处理技术栈筛选
      if (filters.technologies.length > 0) {
        // 可以将技术栈作为分类筛选
        params.category = filters.technologies[0]
      }

      // 调用统一数据服务
      const result = await dataService.getHackathons(params)
      
      const newHackathons = result.hackathons
      
      if (append) {
        setHackathons(prev => [...prev, ...newHackathons])
      } else {
        setHackathons(newHackathons)
      }

      setTotal(result.total)
      setHasMore(result.hasMore)
      
      console.log(`HackathonGrid: Loaded ${newHackathons.length} hackathons`)
    } catch (error) {
      console.error('获取黑客松列表错误:', error)
      setError('网络错误，请检查网络连接')
      toast({
        title: '网络错误',
        description: '请检查网络连接并重试',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // 初次加载和筛选条件变化时重新获取数据
  useEffect(() => {
    setPage(1)
    fetchHackathons(1, false)
  }, [searchQuery, filters])

  // 加载更多
  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchHackathons(nextPage, true)
  }

  // 重试加载
  const handleRetry = () => {
    fetchHackathons(1, false)
  }

  // 转换API数据格式以匹配组件期望的格式
  const formatHackathonForCard = (hackathon: Hackathon) => ({
    id: hackathon.id,
    title: hackathon.title,
    description: hackathon.description,
    startDate: hackathon.startDate,
    endDate: hackathon.endDate,
    status: getHackathonStatus(hackathon),
    participants: hackathon._count.participations,
    totalPrize: hackathon.prizePool ? `$${hackathon.prizePool.toLocaleString()}` : '待定',
    organizer: {
      name: hackathon.organizer.username,
      avatar: hackathon.organizer.avatarUrl || '/placeholder.svg?height=40&width=40'
    },
    // 确保tags是数组
    tags: Array.isArray(hackathon.tags) ? hackathon.tags : [],
    coverImage: '/placeholder.svg?height=200&width=400', // 可以后续添加封面图片字段
  })

  // 根据日期判断黑客松状态
  const getHackathonStatus = (hackathon: Hackathon): 'upcoming' | 'ongoing' | 'ended' => {
    const now = new Date()
    const startDate = new Date(hackathon.startDate)
    const endDate = new Date(hackathon.endDate)

    if (now < startDate) return 'upcoming'
    if (now > endDate) return 'ended'
    return 'ongoing'
  }

  if (error && hackathons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">加载失败</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button onClick={handleRetry} variant="outline">
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 黑客松网格 */}
      {hackathons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((hackathon) => (
            <HackathonCard
              key={hackathon.id}
              hackathon={formatHackathonForCard(hackathon)}
            />
          ))}
        </div>
      ) : !loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">暂无黑客松</h3>
            <p className="text-muted-foreground">
              {searchQuery || filters.status !== 'all' 
                ? '没有找到符合条件的黑客松' 
                : '还没有举办任何黑客松'}
            </p>
          </div>
        </div>
      ) : null}

      {/* 加载更多按钮 */}
      {hasMore && hackathons.length > 0 && (
        <div className="flex justify-center">
          <Button 
            onClick={handleLoadMore} 
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                加载中...
              </>
            ) : (
              '加载更多'
            )}
          </Button>
        </div>
      )}

      {/* 初次加载指示器 */}
      {loading && hackathons.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-muted-foreground">加载黑客松列表...</span>
          </div>
        </div>
      )}

      {/* 分页信息 */}
      {hackathons.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          已显示 {hackathons.length} 个黑客松
          {totalPages > 1 && ` (第 ${Math.min(page, totalPages)} / ${totalPages} 页)`}
        </div>
      )}
    </div>
  )
}
