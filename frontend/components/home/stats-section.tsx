'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Trophy, Code, Globe, Loader2, AlertCircle } from 'lucide-react'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Stat {
  icon: React.ReactNode
  value: string
  label: string
  description: string
}

interface StatsData {
  users: { total: number; label: string; description: string }
  hackathons: { total: number; label: string; description: string }
  projects: { total: number; label: string; description: string }
  countries: { total: number; label: string; description: string }
}

export function StatsSection() {
  const [stats, setStats] = useState<Stat[]>([
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      value: '0',
      label: '注册开发者',
      description: '来自全球的开发者社区'
    },
    {
      icon: <Trophy className="h-8 w-8 text-primary" />,
      value: '0',
      label: '举办黑客松',
      description: '成功举办的黑客松活动'
    },
    {
      icon: <Code className="h-8 w-8 text-primary" />,
      value: '0',
      label: '提交项目',
      description: '创新项目和解决方案'
    },
    {
      icon: <Globe className="h-8 w-8 text-primary" />,
      value: '0',
      label: '覆盖国家',
      description: '全球范围的影响力'
    }
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // 加载真实统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await apiService.request('/stats/public', { method: 'GET' })
        
        if (!response.success) {
          throw new Error(response.error || '获取统计数据失败')
        }
        
        const statsData: StatsData = response.data
        
        // 使用真实数据更新stats
        const realStats = [
          {
            icon: <Users className="h-8 w-8 text-primary" />,
            value: statsData.users.total.toLocaleString() + '+',
            label: statsData.users.label,
            description: statsData.users.description
          },
          {
            icon: <Trophy className="h-8 w-8 text-primary" />,
            value: statsData.hackathons.total.toLocaleString(),
            label: statsData.hackathons.label,
            description: statsData.hackathons.description
          },
          {
            icon: <Code className="h-8 w-8 text-primary" />,
            value: statsData.projects.total.toLocaleString(),
            label: statsData.projects.label,
            description: statsData.projects.description
          },
          {
            icon: <Globe className="h-8 w-8 text-primary" />,
            value: statsData.countries.total.toString() + '+',
            label: statsData.countries.label,
            description: statsData.countries.description
          }
        ]
        
        // 动画更新数值
        animateNumbers(realStats)
        
      } catch (error) {
        console.error('获取统计数据失败:', error)
        setError(error instanceof Error ? error.message : '获取统计数据失败')
        toast({
          title: '数据加载失败',
          description: '无法获取最新的统计数据，请稍后重试',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [])
  
  // 数字动画函数
  const animateNumbers = (targetStats: Stat[]) => {
    const duration = 2000
    const steps = 60
    const stepDuration = duration / steps
    
    // 提取目标数值
    const targetValues = targetStats.map(stat => {
      const numStr = stat.value.replace(/[^0-9]/g, '')
      return parseInt(numStr) || 0
    })
    
    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      
      setStats(prevStats => 
        prevStats.map((stat, index) => {
          const targetValue = targetValues[index]
          const currentValue = Math.floor(targetValue * progress)
          const suffix = targetStats[index].value.includes('+') ? '+' : ''
          
          return {
            ...targetStats[index],
            value: currentValue.toLocaleString() + suffix
          }
        })
      )
      
      if (currentStep >= steps) {
        clearInterval(interval)
        setStats(targetStats)
      }
    }, stepDuration)
    
    return () => clearInterval(interval)
  }

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">平台数据</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              HackX 正在成为全球最大的去中心化黑客松平台！
            </p>
          </div>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="ml-2 text-muted-foreground">加载统计数据中...</span>
          </div>
        </div>
      </section>
    )
  }
  
  if (error) {
    return (
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">平台数据</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              HackX 正在成为全球最大的去中心化黑客松平台！
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <p className="text-lg font-medium mb-2">数据加载失败</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">平台数据</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            HackX 正在成为全球最大的去中心化黑客松平台！
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-center">
                  {stat.icon}
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="font-semibold">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.description}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
