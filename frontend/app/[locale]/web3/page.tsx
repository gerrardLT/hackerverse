'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { WalletConnect } from '@/components/web3/wallet-connect'
import { DAOGovernance } from '@/components/web3/dao-governance'
import { TokenStaking } from '@/components/web3/token-staking'
import { NFTCertificates } from '@/components/web3/nft-certificates'
import { Wallet, Vote, Coins, Award, Zap, Shield, Globe, Users } from 'lucide-react'

export default function Web3Page() {
  const [activeTab, setActiveTab] = useState('wallet')

  const features = [
    {
      icon: <Wallet className="h-6 w-6" />,
      title: '去中心化身份',
      description: '使用钱包进行安全的身份认证，无需传统的用户名密码'
    },
    {
      icon: <Vote className="h-6 w-6" />,
      title: 'DAO 治理',
      description: '参与社区治理投票，共同决定平台的发展方向'
    },
    {
      icon: <Coins className="h-6 w-6" />,
      title: '代币经济',
      description: '质押 HXT 代币获得收益，同时获得治理投票权'
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: 'NFT 证书',
      description: '获奖项目将获得独特的 NFT 证书，永久记录在区块链上'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: '透明公正',
      description: '所有交易和投票记录都在区块链上，完全透明可验证'
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: '全球访问',
      description: '无地域限制，全球开发者都可以平等参与'
    }
  ]

  return (
    <div className="container py-8">
      <div className="space-y-8">
        {/* 页面头部 */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Web3 功能中心</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            体验完整的 Web3 功能，包括钱包连接、DAO 治理、代币质押和 NFT 证书管理
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary">去中心化</Badge>
            <Badge variant="secondary">透明公正</Badge>
            <Badge variant="secondary">社区驱动</Badge>
          </div>
        </div>

        {/* 功能特色 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Web3 特色
            </CardTitle>
            <CardDescription>
              HackX 平台的 Web3 功能为用户提供完整的去中心化体验
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Web3 功能标签 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              钱包连接
            </TabsTrigger>
            <TabsTrigger value="dao" className="flex items-center gap-2">
              <Vote className="h-4 w-4" />
              DAO 治理
            </TabsTrigger>
            <TabsTrigger value="staking" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              代币质押
            </TabsTrigger>
            <TabsTrigger value="nft" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              NFT 证书
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WalletConnect />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">钱包功能</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>安全的身份认证</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>多网络支持</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dao" className="space-y-6">
            <DAOGovernance />
          </TabsContent>

          <TabsContent value="staking" className="space-y-6">
            <TokenStaking />
          </TabsContent>

          <TabsContent value="nft" className="space-y-6">
            <NFTCertificates />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
