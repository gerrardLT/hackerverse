'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { 
  Github, 
  Twitter, 
  DiscIcon as Discord, 
  Code2, 
  Zap, 
  Users, 
  Mail,
  MapPin,
  ExternalLink,
  Heart,
  ArrowUp
} from 'lucide-react'
import HackerverseLogo from '@/components/ui/hackerverse-logo'

export function Footer() {
  const t = useTranslations('footer')
  const [showBackToTop, setShowBackToTop] = useState(false)

  // 监听滚动，显示回到顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 1000)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative mt-auto overflow-hidden">
      {/* 动态背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-secondary/10" />
      
      {/* 装饰性网格 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* 浮动装饰元素 */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl animate-pulse-slow" />
      <div className="absolute top-32 right-20 w-16 h-16 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-full blur-lg animate-float" />
      <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full blur-md animate-bounce-gentle" />

      {/* 主要内容 */}
      <div className="relative z-10">

        {/* 主要页脚内容 */}
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* 品牌区域 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="text-primary">
                    <HackerverseLogo className="h-10 w-10" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <span className="font-bold text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Hackerverse
                </span>
              </div>
              
              <p className="text-muted-foreground leading-relaxed max-w-md">
                {t('description')}
              </p>
              
              {/* 统计数据 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass p-4 rounded-xl border border-primary/10 hover-lift transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">{t('stats.projects')}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-1">12K+</p>
                </div>
                
                <div className="glass p-4 rounded-xl border border-primary/10 hover-lift transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-secondary" />
                    <span className="text-sm text-muted-foreground">{t('stats.developers')}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-1">50K+</p>
                </div>
              </div>

              {/* 社交媒体 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">{t('social.title')}</h4>
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: Github, href: "https://github.com", name: "GitHub", color: "hover:text-gray-900 dark:hover:text-gray-100" },
                    { icon: Twitter, href: "https://twitter.com", name: "Twitter", color: "hover:text-blue-500" },
                    { icon: Discord, href: "https://discord.com", name: "Discord", color: "hover:text-indigo-500" }
                  ].map(({ icon: Icon, href, name, color }) => (
                    <Link 
                      key={name}
                      href={href} 
                      className={`group glass p-3 rounded-xl border border-primary/10 text-muted-foreground ${color} transition-all duration-300 hover-lift hover-glow`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span className="sr-only">{name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 平台导航 */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                {t('platform')}
              </h4>
              <ul className="space-y-3">
                {[
                  { href: "/hackathons", label: t('hackathons') },
                  { href: "/projects", label: t('projects') },
                  { href: "/community", label: t('community') },
                  { href: "/teams", label: t('teams') }
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link 
                      href={href} 
                      className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300"
                    >
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* 资源 */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Code2 className="w-4 h-4 text-secondary" />
                {t('resources')}
              </h4>
              <ul className="space-y-3">
                {[
                  { href: "/docs", label: t('docs') },
                  { href: "/api", label: t('apiDocs') },
                  { href: "/blog", label: t('blog') },
                  { href: "/help", label: t('helpCenter') }
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link 
                      href={href} 
                      className="group flex items-center gap-2 text-muted-foreground hover:text-secondary transition-all duration-300"
                    >
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* 关于我们 */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                {t('about')}
              </h4>
              <ul className="space-y-3">
                {[
                  { href: "/about", label: t('aboutUs') },
                  { href: "/careers", label: t('careers') },
                  { href: "/privacy", label: t('privacy') },
                  { href: "/terms", label: t('terms') }
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link 
                      href={href} 
                      className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300"
                    >
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              {/* 联系方式 */}
              <div className="pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>hello@hackx.io</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{t('location')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 版权区域 */}
        <div className="glass border-t border-primary/10">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground text-center md:text-left">
                {t('copyright')}
              </p>
              
              <div className="flex items-center gap-6 text-sm">
                <Link 
                  href="/privacy" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('privacy')}
                </Link>
                <Link 
                  href="/terms" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('terms')}
                </Link>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>{t('madeWith')}</span>
                  <Heart className="w-3 h-3 text-red-500 animate-pulse" />
                  <span>{t('forCommunity')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 回到顶部按钮 */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 glass bg-primary/10 border border-primary/30 p-3 rounded-full hover-lift hover-glow transition-all duration-300 animate-fadeIn"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5 text-primary" />
        </button>
      )}
    </footer>
  )
}
