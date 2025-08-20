'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
import { Menu, User, Settings, LogOut, Wallet, Trophy, Users, Calendar, FolderOpen, Database, Bell, ChevronDown, MessageSquare } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const navigation = [
  { name: '首页', href: '/', icon: null },
  { name: '黑客松', href: '/hackathons', icon: Calendar },
  { name: '项目', href: '/projects', icon: FolderOpen },
  { name: '社区', href: '/community', icon: MessageSquare },
  { name: '团队', href: '/teams', icon: Users },
  { name: 'IPFS', href: '/ipfs', icon: Database },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  const handleSignOut = () => {
    signOut()
  }

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold">HX</span>
              </div>
              <span className="hidden font-bold sm:inline-block">HackX</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 transition-colors hover:text-foreground/80",
                      pathname === item.href
                        ? "text-foreground"
                        : "text-foreground/60"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* 根据登录状态显示不同内容 */}
            {user ? (
              // 用户已登录：显示用户头像和下拉菜单
              <div className="flex items-center gap-4">
                {/* 通知图标 */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    3
                  </Badge>
                </Button>

                {/* 用户头像和下拉菜单 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl || '/placeholder.svg'} alt={user.username} />
                        <AvatarFallback className="text-sm font-medium">
                          {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline-block font-medium">
                        {user.username || user.email}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.username || '用户'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        个人中心
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        设置
                      </Link>
                    </DropdownMenuItem>
                    {user.walletAddress && (
                      <DropdownMenuItem asChild>
                        <Link href="/wallet" className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          {formatWalletAddress(user.walletAddress)}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // 用户未登录：显示登录/注册按钮
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">登录</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">注册</Link>
              </Button>
            </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="md:hidden"
                  size="sm"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 text-lg font-medium transition-colors hover:text-foreground/80",
                          pathname === item.href
                            ? "text-foreground"
                            : "text-foreground/60"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {Icon && <Icon className="h-5 w-5" />}
                        {item.name}
                      </Link>
                    )
                  })}
                  
                  {/* 移动端用户菜单 */}
                  {user && (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatarUrl || '/placeholder.svg'} alt={user.username} />
                            <AvatarFallback className="text-sm font-medium">
                              {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.username || '用户'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-lg font-medium transition-colors hover:text-foreground/80"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <User className="h-5 w-5" />
                            个人中心
                          </Link>
                          <Link
                            href="/profile"
                            className="flex items-center gap-2 text-lg font-medium transition-colors hover:text-foreground/80"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Settings className="h-5 w-5" />
                            设置
                          </Link>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-lg font-medium text-destructive"
                            onClick={() => {
                              handleSignOut()
                              setMobileMenuOpen(false)
                            }}
                          >
                            <LogOut className="h-5 w-5 mr-2" />
                            退出登录
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}
