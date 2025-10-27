'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Rocket, Plus, Sparkles, Zap } from 'lucide-react'
import Image from 'next/image'

/**
 * HeroSection Component - Flat Design 2.0 + 科技感增强
 * 压缩至200px高度，精简内容，紧凑高效
 * 增加：动态粒子、渐变动画、科技感装饰
 */
export function HeroSection() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative h-[200px] overflow-hidden">
      {/* 多层渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-transparent animate-gradient" />
      
      {/* 动态网格背景 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      
      {/* 装饰元素 - 浮动图标 (仅保留中间区域) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 移除了左右两侧的装饰图标，保持简洁 */}
      </div>
      
      <div className="container h-full flex items-center justify-center relative z-10">
        <div className={`flex flex-col lg:flex-row items-center justify-between w-full max-w-6xl gap-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* 左侧：标题、Tagline 和按钮 */}
          <div className="flex-1 text-center lg:text-left space-y-4">
            {/* 标题 */}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center justify-center lg:justify-start gap-2 flex-wrap">
              <span className="inline-block animate-fade-in">Welcome to</span>
              <span className="text-gradient animate-gradient-x inline-block">HackerVerse</span>
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </h1>
            
            {/* Tagline */}
            <p className="text-base text-muted-foreground animate-fade-in-delay">
              Where Innovation Meets Decentralization 🚀
            </p>

            {/* CTA按钮组 - 三个一排 */}
            <div className="flex items-center justify-center lg:justify-start gap-3 animate-fade-in-delay-2 pt-2">
              <Button 
                size="default" 
                asChild 
                className="h-10 px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground transition-all shadow-lg hover:shadow-xl hover-lift group"
              >
                <Link href="/hackathons" className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 group-hover:animate-bounce" />
                  Explore
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button 
                size="default" 
                variant="outline" 
                asChild
                className="h-10 px-6 glass-light border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-all hover-lift backdrop-blur-sm group"
              >
                <Link href="/hackathons/create" className="flex items-center gap-2">
                  <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                  Create
                </Link>
              </Button>

              <Button 
                size="default" 
                variant="secondary" 
                asChild
                className="h-10 px-6 hidden sm:flex hover-lift group"
              >
                <Link href="/teams" className="flex items-center gap-1">
                  Find Team
                  <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Link>
              </Button>
            </div>
          </div>

          {/* 右侧：AI 生成赛博朋克 Web3 图片 */}
          <div className="hidden lg:block lg:w-[450px] h-[180px] animate-fade-in-delay-3">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* 背景光晕 */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 rounded-xl blur-xl" />
              
              <img
                src="https://image.pollinations.ai/prompt/cyberpunk%20hackathon%20competition%20web3%20blockchain%20developers%20coding%20together%20futuristic%20workspace%20neon%20lights%20holographic%20screens%20digital%20avatars%20team%20collaboration%20decentralized%20network%20metaverse%20dark%20background%20purple%20blue%20pink%20cyan%20glow%20tech%20atmosphere?width=800&height=400&nologo=true&enhance=true"
                alt="Cyberpunk Hackathon Web3 Developers"
                className="relative w-full h-full object-cover rounded-xl shadow-2xl"
                loading="eager"
              />
              
              {/* 渐变遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30 rounded-xl pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 底部装饰线 - 增强动画 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
      
      {/* 边角装饰 */}
      <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-primary/20" />
      <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-primary/20" />
      <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-accent/20" />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-accent/20" />
    </section>
  )
}