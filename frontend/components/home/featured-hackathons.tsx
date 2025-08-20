'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Users, Trophy, Clock, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { apiService, type Hackathon } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export function FeaturedHackathons() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchFeaturedHackathons = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await apiService.getHackathons({
          featured: true,
          limit: 3,
          sortBy: 'startDate',
          sortOrder: 'asc'
        })
        
        if (response.success && response.data) {
          setHackathons(response.data.hackathons)
        } else {
          setError(response.error || '获取特色黑客松失败')
          toast({
            title: '加载失败',
            description: response.error || '无法获取特色黑客松',
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('获取特色黑客松错误:', error)
        setError('网络错误，请检查网络连接')
        toast({
          title: '网络错误',
          description: '请检查网络连接并重试',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedHackathons()
  }, [toast])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500'
      case 'ongoing': return 'bg-green-500'
      case 'ended': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return '即将开始'
      case 'ongoing': return '进行中'
      case 'ended': return '已结束'
      default: return '未知状态'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">加载特色黑客松中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">加载失败</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          重试
        </Button>
      </div>
    )
  }

  if (hackathons.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">🏆</span>
        </div>
        <h3 className="text-lg font-medium mb-2">暂无特色黑客松</h3>
        <p className="text-muted-foreground">目前没有特色黑客松，请稍后再来查看</p>
      </div>
    )
  }

  return (
    <section className="py-12">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">特色黑客松</h2>
            <p className="text-muted-foreground">
              发现最热门、最有价值的黑客松活动
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/hackathons">
              查看全部
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((hackathon) => (
            <Card key={hackathon.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative">
                <img
                  src="/placeholder.svg?height=200&width=400"
                  alt={hackathon.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className={`${getStatusColor(hackathon.status)} text-white`}>
                    {getStatusText(hackathon.status)}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-white/90">
                    <Trophy className="h-3 w-3 mr-1" />
                    特色
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      <Link href={`/hackathons/${hackathon.id}`}>
                        {hackathon.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {hackathon.description}
                    </p>
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={hackathon.organizer?.avatarUrl} />
                    <AvatarFallback>
                      {hackathon.organizer?.username?.charAt(0) || 'O'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(hackathon.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{hackathon._count?.participations || 0} 参与</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(hackathon.tags) && hackathon.tags.slice(0, 3).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {Array.isArray(hackathon.tags) && hackathon.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{hackathon.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
              
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/hackathons/${hackathon.id}`}>
                    查看详情
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
