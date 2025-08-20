'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Users, Code, Trophy } from 'lucide-react'

const steps = [
  {
    icon: <Search className="h-8 w-8 text-primary" />,
    title: '发现黑客松',
    description: '浏览和搜索适合你的黑客松活动，筛选技术栈和奖金'
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: '组建团队',
    description: '找到志同道合的队友，或者加入现有团队开始协作'
  },
  {
    icon: <Code className="h-8 w-8 text-primary" />,
    title: '开发项目',
    description: '在规定时间内开发创新项目，所有文件存储在 IPFS 上'
  },
  {
    icon: <Trophy className="h-8 w-8 text-primary" />,
    title: '获得奖励',
    description: '接受专业评委评审，获得奖金、投资机会和职业发展'
  }
]

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">如何参与</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            四个简单步骤，开启你的黑客松之旅
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="relative">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {step.icon}
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground text-sm">
                  {step.description}
                </p>
              </CardContent>
              
              {/* Step number */}
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-0.5 bg-border" />
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
