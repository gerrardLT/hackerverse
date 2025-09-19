'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, User, Settings, LogOut, Wallet, Trophy, Users, Calendar, Bell, ChevronDown, MessageSquare, X, Sparkles, Plus, Home } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import { useWeb3Auth } from '@/hooks/use-web3-auth'
import { WalletConnect } from '@/components/ui/wallet-connect'
import HackerverseLogo from '@/components/ui/hackerverse-logo'

export function Header() {
  const t = useTranslations('navigation')
  const tCommon = useTranslations('common')
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const { user, signOut, isAuthenticated } = useAuth()
  const { user: web3User, disconnectWallet } = useWeb3Auth()

  // Scroll detection for floating nav effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Entrance animation
  useEffect(() => {
    setIsVisible(true)
  }, [])

  const navigation = [
    { name: t('homeNav'), href: '/', icon: Home },
    { name: t('hackathons'), href: '/hackathons', icon: Trophy },
    { name: t('community'), href: '/community', icon: MessageSquare },
    { name: t('teams'), href: '/teams', icon: Users },
  ]

  const handleSignOut = async () => {
    // 使用 Web3Auth 的 disconnectWallet 来确保完全清理状态
    await disconnectWallet()
  }

  // 只有当真正认证且有用户信息时才显示用户菜单
  const shouldShowUserMenu = isAuthenticated && user

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <>
      {/* Floating Navigation */}
      <header 
        className={cn(
          "fixed top-4 left-1/2 z-50 transition-all duration-500 w-[calc(100%-2rem)] max-w-7xl",
          isScrolled 
            ? "glass border border-primary/20 shadow-glow" 
            : "bg-background border border-primary/20",
          "rounded-2xl backdrop-blur-xl"
        )}
        style={{
          transform: `translateX(-50%) translateY(${isVisible ? '0px' : '-16px'})`,
          opacity: isVisible ? 1 : 0
        }}
      >
        <div className="flex h-16 items-center justify-between px-6">
          {/* Enhanced Logo */}
          <Link 
            href="/" 
            className="group flex items-center space-x-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-[0_20px_25px_-5px] shadow-primary/70 group-hover:shadow-[0_35px_60px_-12px] group-hover:shadow-primary/90 transition-all duration-300 group-hover:scale-110 drop-shadow-2xl shadow-inner">
              <HackerverseLogo className="h-10 w-10" />
            </div>
            <span className="hidden sm:inline-block font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Hackerverse
            </span>
          </Link>

          {/* Enhanced Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 relative group hover-lift",
                    isActive
                      ? "text-primary bg-primary/10 shadow-inner"
                      : "text-foreground/70 hover:text-primary hover:shadow-lg"
                  )}
                  style={{
                    '--hover-bg': 'color-mix(in oklab, var(--primary) 10%, transparent)'
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'color-mix(in oklab, var(--primary) 10%, transparent)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {Icon && <Icon className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />}
                  <span className="transition-all duration-300 group-hover:font-semibold">{item.name}</span>
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 -z-10 animate-pulse-slow" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Enhanced Right Side */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle with Enhancement */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            
            {/* 根据登录状态显示不同内容 */}
            {shouldShowUserMenu ? (
              <div className="flex items-center gap-3">
                {/* Enhanced Notification */}
                <div className="relative">
                  <NotificationDropdown />
                </div>

                {/* Create Hackathon Button - Always visible when logged in */}
                <Button 
                  asChild
                  className="hidden lg:flex items-center gap-1.5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-4 py-2 rounded-lg hover-lift transition-all duration-300"
                >
                  <Link href="/hackathons/create">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Create</span>
                  </Link>
                </Button>


                {/* Enhanced User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-2 p-2 rounded-xl hover-lift hover:bg-muted/50 transition-all duration-300 group"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
                        <AvatarImage 
                          src={user.avatarUrl} 
                          alt={user.username || 'User Avatar'}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <AvatarFallback className="text-sm font-medium bg-gradient-to-r from-primary to-accent text-primary-foreground">
                          {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-64"
                  >
                    <DropdownMenuLabel>
                      <div className="flex items-center gap-3 p-2">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={user.avatarUrl} 
                            alt={user.username || 'User Avatar'}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                            {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold leading-none truncate">{user.username || 'User'}</p>
                          {user.walletAddress && (
                         <p className="text-xs text-muted-foreground font-mono">{formatWalletAddress(user.walletAddress)}</p>
                      )}
                          {web3User?.address && (
                            <div className="flex items-center gap-1 mt-1">
                              <Wallet className="h-3 w-3 text-primary" />
                              <p className="text-xs text-muted-foreground font-mono">
                                {formatWalletAddress(web3User.address)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                        <User className="h-4 w-4" />
                        {t('dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut} 
                      className="text-destructive p-3 hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      {t('disconnectWallet')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // Enhanced Wallet Connect
              <WalletConnect className="hover-lift" />
            )}

            {/* Enhanced Mobile Menu */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="relative h-10 w-10 rounded-xl hover:bg-muted/50 transition-all duration-300 group"
              >
                <div className="relative w-5 h-5">
                  <Menu 
                    className={cn(
                      "absolute inset-0 transition-all duration-300",
                      mobileMenuOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
                    )} 
                  />
                  <X 
                    className={cn(
                      "absolute inset-0 transition-all duration-300",
                      mobileMenuOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
                    )} 
                  />
                </div>
                <span className="sr-only">{t('toggleMenu')}</span>
                {/* Hover indicator */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/50 glass rounded-b-2xl animate-slide-down">
            <nav className="p-6 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl text-base font-medium transition-all duration-300 group relative hover-lift",
                      isActive
                        ? "text-primary bg-primary/10 shadow-inner"
                        : "text-foreground/80 hover:text-primary hover:shadow-lg"
                    )}
                    style={{
                      '--hover-bg': 'color-mix(in oklab, var(--primary) 10%, transparent)'
                    } as React.CSSProperties}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'color-mix(in oklab, var(--primary) 10%, transparent)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {Icon && <Icon className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />}
                    <span className="transition-all duration-300 group-hover:font-semibold">{item.name}</span>
                    {isActive && <Sparkles className="h-4 w-4 ml-auto text-primary animate-pulse-slow" />}
                  </Link>
                )
              })}
              
              {/* Mobile Theme Toggle */}
              <div className="flex items-center gap-3 p-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="text-base font-medium text-muted-foreground">Theme</span>
                <div className="ml-auto">
                  <ThemeToggle />
                </div>
              </div>
              
              {/* 移动端用户菜单 */}
              {shouldShowUserMenu && (
                <div className="border-t border-border/50 pt-4 mt-4 space-y-2">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarImage 
                        src={user.avatarUrl} 
                        alt={user.username || 'User Avatar'}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                        {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold leading-none truncate">{user.username || 'User'}</p>
                      {user.walletAddress && (
                         <p className="text-xs text-muted-foreground font-mono">{formatWalletAddress(user.walletAddress)}</p>
                      )}
                      {web3User?.address && (
                        <div className="flex items-center gap-1 mt-1">
                          <Wallet className="h-3 w-3 text-primary" />
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatWalletAddress(web3User.address)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Link
                    href="/hackathons/create"
                    className="flex items-center gap-3 p-3 rounded-xl text-base font-medium transition-all bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Plus className="h-5 w-5 transition-transform group-hover:scale-110" />
                    Create
                  </Link>
                  
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 p-3 rounded-xl text-base font-medium transition-all hover:bg-muted/50 group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5 transition-transform group-hover:scale-110" />
                    {t('dashboard')}
                  </Link>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-3 text-base font-medium text-destructive hover:bg-destructive/10 rounded-xl"
                    onClick={() => {
                      handleSignOut()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    {t('disconnectWallet')}
                  </Button>
                </div>
              )}
              
              {/* 移动端连接钱包按钮 */}
              {!shouldShowUserMenu && (
                <div className="border-t border-border/50 pt-4 mt-4">
                  <WalletConnect className="w-full h-12 text-base" />
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Spacer for floating nav */}
      <div className="h-24" />
    </>
  )
}
