'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Github, Twitter, DiscIcon as Discord, MessageCircle, ArrowRight, Users, Globe, Sparkles } from 'lucide-react'

export function CommunitySection() {
  const t = useTranslations('home.community')
  const [isVisible, setIsVisible] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const sectionRef = useRef<HTMLElement>(null)

  // 进入动画
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // 鼠标跟踪
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect()
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        })
      }
    }

    const section = sectionRef.current
    if (section) {
      section.addEventListener('mousemove', handleMouseMove)
      return () => section.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative py-16 md:py-24 overflow-hidden">
      {/* 动态背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-background to-muted/20" />
      <div className="absolute inset-0 gradient-mesh opacity-10" />
      
      {/* 交互式浮动元素 */}
      <div className="absolute inset-0">
        <div 
          className="absolute w-64 h-64 rounded-full bg-primary/5 blur-2xl animate-float"
          style={{
            top: '20%',
            left: `${20 + mousePosition.x * 0.03}%`,
            animationDelay: '0s'
          }}
        />
        <div 
          className="absolute w-48 h-48 rounded-full bg-secondary/5 blur-2xl animate-float"
          style={{
            bottom: '20%',
            right: `${15 + mousePosition.y * 0.02}%`,
            animationDelay: '1s'
          }}
        />
      </div>

      <div className="container relative">
        {/* 现代化标题区域 */}
        <div className={`text-center space-y-6 mb-16 transition-all duration-1000 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
          <div className="space-y-4">
            <h2 className="text-responsive-lg font-bold tracking-tight">
              <span className="text-gradient animate-shimmer">{t('title')}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('subtitle')}
            </p>
          </div>
        </div>

        {/* 现代化社区平台卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              icon: Github,
              title: 'GitHub',
              description: t('github.description'),
              action: t('github.action'),
              href: 'https://github.com',
              gradient: 'from-gray-600 to-gray-800',
              delay: '0.2s'
            },
            {
              icon: Discord,
              title: 'Discord',
              description: t('discord.description'),
              action: t('discord.action'),
              href: 'https://discord.com',
              gradient: 'from-indigo-500 to-purple-600',
              delay: '0.4s'
            },
            {
              icon: Twitter,
              title: 'Twitter',
              description: t('twitter.description'),
              action: t('twitter.action'),
              href: 'https://twitter.com',
              gradient: 'from-blue-400 to-blue-600',
              delay: '0.6s'
            },
            {
              icon: MessageCircle,
              title: t('forum.title'),
              description: t('forum.description'),
              action: t('forum.action'),
              href: '/community',
              gradient: 'from-green-500 to-teal-600',
              delay: '0.8s'
            }
          ].map((platform, index) => (
            <div
              key={platform.title}
              className={`transition-all duration-1000 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}
              style={{ animationDelay: platform.delay }}
            >
              <div className="group relative glass border border-primary/10 hover:border-primary/30 rounded-2xl p-6 hover-lift hover-glow transition-all duration-500 text-center">
                {/* 背景渐变效果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-2xl" />
                
                <div className="space-y-4">
                  {/* 图标 */}
                  <div className="relative mx-auto">
                    <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${platform.gradient} p-4 group-hover:scale-110 transition-transform duration-300`}>
                      <platform.icon className="w-8 h-8 text-white" />
                    </div>
                    {/* 装饰性光环 */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${platform.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse-slow`} />
                  </div>

                  {/* 标题和描述 */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {platform.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {platform.description}
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="glass hover-lift border-primary/20 group-hover:border-primary/40" 
                    asChild
                  >
                    <Link href={platform.href}>
                      <span className="mr-2">{platform.action}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>

                {/* 装饰性边框光效 */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 animate-pulse-slow" />
              </div>
            </div>
          ))}
        </div>

        {/* 现代化行动号召区域 */}
        <div className={`transition-all duration-1000 delay-1000 ${isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'}`}>
          <div className="relative max-w-4xl mx-auto">
            <div className="glass border border-primary/20 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
              {/* 背景装饰 */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-60" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full translate-y-6 -translate-x-6" />
              
              <div className="relative space-y-6">
                {/* 标题区域 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-6 h-6 text-primary" />
                    <Globe className="w-6 h-6 text-secondary" />
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gradient">
                    {t('cta.title')}
                  </h3>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {t('cta.description')}
                  </p>
                </div>

                {/* 行动按钮 */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                  <Button 
                    size="lg" 
                    className="group bg-gradient-primary hover-lift hover-glow px-8 py-3 text-base"
                    asChild
                  >
                    <Link href="/auth/signin">
                      <Users className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
                      {t('cta.joinButton')}
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="group glass hover-lift border-primary/30 px-8 py-3 text-base"
                    asChild
                  >
                    <Link href="/hackathons/create">
                      <Sparkles className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
                      {t('cta.createButton')}
                    </Link>
                  </Button>
                </div>

                {/* 底部统计信息 */}
                <div className="pt-6 border-t border-primary/20">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gradient">10K+</div>
                      <div className="text-sm text-muted-foreground">活跃开发者</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gradient">500+</div>
                      <div className="text-sm text-muted-foreground">项目讨论</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gradient">24/7</div>
                      <div className="text-sm text-muted-foreground">社区支持</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 装饰性边框光效 */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 animate-pulse-slow" />
            </div>
          </div>
        </div>

        {/* 装饰性浮动元素 */}
        <div className="absolute bottom-10 right-10 w-2 h-2 bg-primary/30 rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/4 w-1 h-1 bg-secondary/40 rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>
    </section>
  )
}
