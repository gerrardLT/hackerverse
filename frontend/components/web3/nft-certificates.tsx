'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Award, Download, Share2, ExternalLink, Trophy, Star, Medal, Crown, Zap, Calendar, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { smartContractService } from '@/lib/smart-contracts'
import { useAuth } from '@/hooks/use-auth'
import { apiService } from '@/lib/api'

interface Certificate {
  tokenId: number
  tokenURI: string
  hackathonId: number
  hackathonName: string
  rank: number
  mintTime: number
  metadata: {
    name: string
    description: string
    image: string
    attributes: Array<{
      trait_type: string
      value: string | number
    }>
  }
}

export function NFTCertificates() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [showMintDialog, setShowMintDialog] = useState(false)

  useEffect(() => {
    if (user?.walletAddress) {
      loadCertificates()
    }
  }, [user])

  const loadCertificates = async () => {
    if (!user?.walletAddress) return

    setIsLoading(true)
    try {
      const response = await apiService.getNFTs({
        page: 1,
        limit: 20,
        category: 'certificate',
        sortBy: 'mintTime',
        sortOrder: 'desc'
      })
      
      if (response.success && response.data) {
        // 转换 API 数据为组件需要的格式
        const certificateData = response.data.nfts.map((nft: any) => ({
          tokenId: nft.tokenId,
          tokenURI: nft.tokenURI,
          hackathonId: nft.hackathonId,
          hackathonName: nft.hackathonName,
          rank: nft.rank,
          mintTime: new Date(nft.mintTime).getTime(),
          metadata: {
            name: nft.metadata.name,
            description: nft.metadata.description,
            image: nft.metadata.image,
            attributes: nft.metadata.attributes || []
          }
        }))
        
        setCertificates(certificateData)
      } else {
        toast({
          title: '加载失败',
          description: response.error || '无法加载证书列表',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error loading certificates:', error)
      toast({
        title: '加载失败',
        description: '无法加载证书列表',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMintCertificate = async (hackathonId: number, rank: number) => {
    if (!user?.walletAddress) {
      toast({
        title: '请先连接钱包',
        description: '需要连接钱包才能铸造证书',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsLoading(true)
      
      // 创建证书元数据
      const metadata = {
        name: `HackX 证书 - ${rank === 1 ? '冠军' : rank === 2 ? '亚军' : '季军'}`,
        description: `恭喜您在黑客松中获得第${rank}名！`,
        imageUrl: '/generic-certificate.png',
        category: 'certificate',
        metadata: {
          attributes: [
            { trait_type: 'Rank', value: rank },
            { trait_type: 'Hackathon', value: hackathonId },
            { trait_type: 'MintTime', value: new Date().toISOString() }
          ]
        }
      }

      const response = await apiService.mintNFT(metadata)
      
      if (response.success) {
        toast({
          title: '铸造成功',
          description: '证书 NFT 已成功铸造',
        })
        
        setShowMintDialog(false)
        loadCertificates() // 重新加载证书列表
      } else {
        toast({
          title: '铸造失败',
          description: response.error || '无法铸造证书',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('Error minting certificate:', error)
      toast({
        title: '铸造失败',
        description: error.message || '无法铸造证书',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <Trophy className="h-6 w-6 text-blue-500" />
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500 text-white">🥇 冠军</Badge>
      case 2:
        return <Badge className="bg-gray-400 text-white">🥈 亚军</Badge>
      case 3:
        return <Badge className="bg-amber-600 text-white">🥉 季军</Badge>
      default:
        return <Badge variant="secondary">🏆 获奖</Badge>
    }
  }

  const handleShare = (certificate: Certificate) => {
    const shareText = `我在 ${certificate.hackathonName} 中获得了第${certificate.rank}名！🎉 查看我的 NFT 证书：`
    const shareUrl = `${window.location.origin}/certificates/${certificate.tokenId}`
    
    if (navigator.share) {
      navigator.share({
        title: certificate.metadata.name,
        text: shareText,
        url: shareUrl,
      })
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      toast({ title: '链接已复制', description: '证书分享链接已复制到剪贴板', })
    }
  }

  const handleDownload = (certificate: Certificate) => {
    // 模拟下载证书图片
    const link = document.createElement('a')
    link.href = certificate.metadata.image
    link.download = `${certificate.metadata.name}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: '下载成功',
      description: '证书图片已下载到本地',
    })
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getAchievementStats = () => {
    const totalCertificates = certificates.length
    const firstPlaces = certificates.filter(c => c.rank === 1).length
    const topThree = certificates.filter(c => c.rank <= 3).length
    const totalPrize = certificates.reduce((sum, cert) => {
      const prizeAttr = cert.metadata.attributes.find(attr => attr.trait_type === 'Prize')
      if (prizeAttr && typeof prizeAttr.value === 'string') {
        const prizeValue = parseFloat(prizeAttr.value.replace(/[$,]/g, ''))
        return sum + prizeValue
      }
      return sum
    }, 0)

    return { totalCertificates, firstPlaces, topThree, totalPrize }
  }

  const stats = getAchievementStats()

  if (!user?.walletAddress) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Award className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>NFT 获奖证书</CardTitle>
          <CardDescription>
            连接钱包查看您的获奖证书收藏
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 成就统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10">
                <Award className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCertificates}</p>
                <p className="text-sm text-muted-foreground">获奖证书</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/10">
                <Crown className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.firstPlaces}</p>
                <p className="text-sm text-muted-foreground">冠军次数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10">
                <Trophy className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.topThree}</p>
                <p className="text-sm text-muted-foreground">前三名次数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10">
                <Zap className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.totalPrize.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">累计奖金</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 证书展示 */}
      <Card>
        <CardHeader>
          <CardTitle>我的 NFT 证书</CardTitle>
          <CardDescription>
            您在各个黑客松中获得的成就展示
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-64 bg-muted rounded-lg mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无获奖证书</h3>
              <p className="text-muted-foreground mb-4">
                参加黑客松并获奖后，您的 NFT 证书将显示在这里
              </p>
              <Button asChild>
                <a href="/hackathons">浏览黑客松</a>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((certificate) => (
                <Card key={certificate.tokenId} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={certificate.metadata.image || "/placeholder.svg"}
                      alt={certificate.metadata.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      {getRankBadge(certificate.rank)}
                    </div>
                    <div className="absolute top-3 left-3">
                      {getRankIcon(certificate.rank)}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">
                      {certificate.hackathonName}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {certificate.metadata.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3" />
                      {formatDate(certificate.mintTime)}
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-3 w-3 mr-1" />
                            查看
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{certificate.metadata.name}</DialogTitle>
                            <DialogDescription>
                              Token ID: #{certificate.tokenId}
                            </DialogDescription>
                          </DialogHeader>
                          <CertificateDetail certificate={certificate} />
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare(certificate)}
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(certificate)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CertificateDetail({ certificate }: { certificate: Certificate }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <img
          src={certificate.metadata.image || "/placeholder.svg"}
          alt={certificate.metadata.name}
          className="w-full max-w-md mx-auto rounded-lg shadow-lg"
        />
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">证书信息</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">黑客松</span>
              <p className="font-medium">第{certificate.rank} 名</p>
            </div>
            <div>
              <span className="text-muted-foreground">铸造时间</span>
              <p className="font-medium">{new Date(certificate.mintTime).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Token ID:</span>
              <p className="font-medium">#{certificate.tokenId}</p>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">属性</h4>
          <div className="grid grid-cols-2 gap-2">
            {certificate.metadata.attributes.map((attr, index) => (
              <div key={index} className="p-2 border rounded text-sm">
                <span className="text-muted-foreground">{attr.trait_type}:</span>
                <span className="ml-1 font-medium">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button asChild className="flex-1">
            <a href={`https://opensea.io/assets/ethereum/${certificate.tokenId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              在 OpenSea 查看
            </a>
          </Button>
          <Button variant="outline" className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            查看元数据
          </Button>
        </div>
      </div>
    </div>
  )
}
