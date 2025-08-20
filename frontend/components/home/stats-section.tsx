'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Trophy, Code, Globe } from 'lucide-react'

interface Stat {
  icon: React.ReactNode
  value: string
  label: string
  description: string
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

  useEffect(() => {
    // Animate numbers
    const targetValues = [2500000, 150, 8500, 85]
    const duration = 2000
    const steps = 60
    const stepDuration = duration / steps

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setStats(prevStats => 
        prevStats.map((stat, index) => ({
          ...stat,
          value: Math.floor(targetValues[index] * progress).toLocaleString()
        }))
      )

      if (currentStep >= steps) {
        clearInterval(interval)
        setStats(prevStats => 
          prevStats.map((stat, index) => ({
            ...stat,
            value: targetValues[index].toLocaleString() + (index === 0 ? '+' : index === 3 ? '+' : '')
          }))
        )
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [])

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
            <Card key={index} className="text-center">
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
