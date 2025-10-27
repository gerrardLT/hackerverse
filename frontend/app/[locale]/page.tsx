import { useTranslations } from 'next-intl';
import { HeroSection } from '@/components/home/hero-section'
import { FeaturedHackathons } from '@/components/home/featured-hackathons'
import { StatsSidebar } from '@/components/home/stats-sidebar'
import Image from 'next/image'

/**
 * HomePage - Flat Design 2.0 重构 + 科技感增强
 * 布局：Hero(200px) + 侧边栏(240px) + 网格(3×2)
 * 容器：max-width 1280px，左右留白
 * 科技感：动态网格背景、粒子效果、渐变动画
 */
export default function HomePage() {
  return (
    <div className="flex flex-col w-full bg-background min-h-screen relative overflow-hidden">
      {/* 科技感背景层 */}
      <div className="fixed inset-0 pointer-events-none">
        {/* 动态网格背景 */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]" />
        
        {/* 渐变光晕 */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        {/* 科技线条 */}
        <div className="absolute top-0 left-0 w-full h-full">
          <svg className="w-full h-full opacity-[0.02] dark:opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="tech-lines" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 0 50 L 100 50 M 50 0 L 50 100" stroke="currentColor" strokeWidth="0.5" className="text-primary"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tech-lines)" />
          </svg>
        </div>
      </div>

      {/* Hero Section - 200px高度 */}
      <div className="relative z-10">
        <HeroSection />
      </div>
      
      {/* 主内容区 - 侧边栏+网格布局 */}
      <div className="container max-w-[1280px] mx-auto px-4 md:px-6 py-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧：统计侧边栏 - 240px */}
          <aside className="lg:w-[240px] shrink-0">
            <div className="lg:sticky lg:top-20">
              <StatsSidebar />
            </div>
          </aside>
          
          {/* 右侧：精选黑客松网格 */}
          <main className="flex-1 min-w-0">
            <FeaturedHackathons />
          </main>
        </div>
      </div>
    </div>
  )
}