'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Github, Twitter, DiscIcon as Discord, MessageCircle, ArrowRight } from 'lucide-react'

export function CommunitySection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">加入社区</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            与全球开发者连接，分享经验，获得支持，共同构建 Web3 未来
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex justify-center">
                <Github className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">GitHub</h3>
                <p className="text-sm text-muted-foreground">开源代码和贡献</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="https://github.com">
                  查看代码
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex justify-center">
                <Discord className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Discord</h3>
                <p className="text-sm text-muted-foreground">实时交流和讨论</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="https://discord.com">
                  加入服务器
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex justify-center">
                <Twitter className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Twitter</h3>
                <p className="text-sm text-muted-foreground">最新动态和公告</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="https://twitter.com">
                  关注我们
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex justify-center">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">论坛</h3>
                <p className="text-sm text-muted-foreground">深度讨论和问答</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/forum">
                  访问论坛
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold">准备好开始了吗？</h3>
              <p className="text-muted-foreground">
                立即注册 HackX，发现下一个改变世界的项目，或者创建你自己的黑客松活动！
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/auth/signup">
                    立即注册
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/hackathons/create">
                    创建黑客松
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
