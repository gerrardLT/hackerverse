import Link from 'next/link'
import { Github, Twitter, DiscIcon as Discord } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">H</span>
              </div>
              <span className="font-bold">HackX</span>
            </div>
            <p className="text-sm text-muted-foreground">
              基于 IPFS 的去中心化黑客松平台，连接全球开发者，构建 Web3 未来�?            </p>
            <div className="flex space-x-4">
              <Link href="https://github.com" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="https://twitter.com" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="https://discord.com" className="text-muted-foreground hover:text-foreground">
                <Discord className="h-5 w-5" />
              </Link>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">平台</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/hackathons" className="text-muted-foreground hover:text-foreground">黑客松</Link></li>
              <li><Link href="/projects" className="text-muted-foreground hover:text-foreground">项目展示</Link></li>
              <li><Link href="/community" className="text-muted-foreground hover:text-foreground">开发者社区</Link></li>
              <li><Link href="/leaderboard" className="text-muted-foreground hover:text-foreground">排行榜</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">资源</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/docs" className="text-muted-foreground hover:text-foreground">开发文档</Link></li>
              <li><Link href="/api" className="text-muted-foreground hover:text-foreground">API 文档</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-foreground">博客</Link></li>
              <li><Link href="/help" className="text-muted-foreground hover:text-foreground">帮助中心</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">关于</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-foreground">关于我们</Link></li>
              <li><Link href="/careers" className="text-muted-foreground hover:text-foreground">加入我们</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">隐私政策</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">服务条款</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2024 HackX. All rights reserved. Built with ❤️ for the global developer community.</p>
        </div>
      </div>
    </footer>
  )
}
