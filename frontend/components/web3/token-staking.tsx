'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Coins, TrendingUp, Gift, Lock, Unlock, Zap, Target, Calendar, Award, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { smartContractService } from '@/lib/smart-contracts'
import { useAuth } from '@/hooks/use-auth'
import { apiService } from '@/lib/api'

interface StakingInfo {
  totalBalance: number
  stakedAmount: number
  pendingRewards: number
  apy: number
  totalStaked: number
  stakingPeriod: number
  lastRewardTime: number
}

export function TokenStaking() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [stakingInfo, setStakingInfo] = useState<StakingInfo>({
    totalBalance: 0,
    stakedAmount: 0,
    pendingRewards: 0,
    apy: 0,
    totalStaked: 0,
    stakingPeriod: 30, // 30天
    lastRewardTime: Date.now() - 24 * 60 * 60 * 1000 // 1天前
  })
  
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('stake')

  useEffect(() => {
    if (user?.walletAddress) {
      loadStakingInfo()
    }
  }, [user])

  const loadStakingInfo = async () => {
    if (!user?.walletAddress) return

    setIsLoading(true)
    try {
      const response = await apiService.getStakingInfo()
      
      if (response.success && response.data) {
        const stakingData = response.data
        setStakingInfo({
          totalBalance: stakingData.userStaked + (Math.random() * 1000), // 模拟可用余额
          stakedAmount: stakingData.userStaked,
          pendingRewards: stakingData.rewards,
          apy: stakingData.apy,
          totalStaked: stakingData.totalStaked,
          stakingPeriod: 30, // 30天
          lastRewardTime: Date.now() - 24 * 60 * 60 * 1000 // 1天前
        })
      } else {
        toast({
          title: '加载失败',
          description: response.error || '无法加载质押信息',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error loading staking info:', error)
      toast({
        title: '加载失败',
        description: '无法加载质押信息',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStake = async () => {
    if (!user?.walletAddress) {
      toast({
        title: '请先连接钱包',
        description: '需要连接钱包才能质押',
        variant: 'destructive',
      })
      return
    }

    const amount = parseFloat(stakeAmount)
    if (!amount || amount <= 0) {
      toast({
        title: '请输入有效金额',
        description: '质押金额必须大于0',
        variant: 'destructive',
      })
      return
    }

    if (amount > stakingInfo.totalBalance) {
      toast({
        title: '余额不足',
        description: '质押金额不能超过可用余额',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsLoading(true)
      
      const response = await apiService.stakeTokens(amount)
      
      if (response.success) {
        toast({
          title: '质押成功',
          description: `已成功质押 ${amount} HXT`,
        })
        
        setStakeAmount('')
        loadStakingInfo()
      } else {
        toast({
          title: '质押失败',
          description: response.error || '无法完成质押',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('Error staking:', error)
      toast({
        title: '质押失败',
        description: error.message || '无法完成质押',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnstake = async () => {
    if (!user?.walletAddress) {
      toast({
        title: '请先连接钱包',
        description: '需要连接钱包才能解质押',
        variant: 'destructive',
      })
      return
    }

    const amount = parseFloat(unstakeAmount)
    if (!amount || amount <= 0) {
      toast({
        title: '请输入有效金额',
        description: '解质押金额必须大于0',
        variant: 'destructive',
      })
      return
    }

    if (amount > stakingInfo.stakedAmount) {
      toast({
        title: '质押余额不足',
        description: '解质押金额不能超过已质押金额',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsLoading(true)
      
      const response = await apiService.unstakeTokens(amount)
      
      if (response.success) {
        toast({
          title: '解质押成功',
          description: `已成功解质押 ${amount} HXT`,
        })
        
        setUnstakeAmount('')
        loadStakingInfo()
      } else {
        toast({
          title: '解质押失败',
          description: response.error || '无法完成解质押',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('Error unstaking:', error)
      toast({
        title: '解质押失败',
        description: error.message || '无法完成解质押',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaimRewards = async () => {
    if (!user?.walletAddress) {
      toast({
        title: '请先连接钱包',
        description: '需要连接钱包才能领取奖励',
        variant: 'destructive',
      })
      return
    }

    if (stakingInfo.pendingRewards <= 0) {
      toast({
        title: '暂无奖励',
        description: '当前没有可领取的奖励',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsLoading(true)
      
      const response = await apiService.claimRewards()
      
      if (response.success) {
        toast({
          title: '领取成功',
          description: `已成功领取 ${stakingInfo.pendingRewards} HXT 奖励`,
        })
        
        loadStakingInfo()
      } else {
        toast({
          title: '领取失败',
          description: response.error || '无法领取奖励',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('Error claiming rewards:', error)
      toast({
        title: '领取失败',
        description: error.message || '无法领取奖励',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateProjectedRewards = (amount: number, days: number) => {
    return (amount * stakingInfo.apy / 100 / 365 * days)
  }

  const getStakingProgress = () => {
    const daysSinceLastReward = Math.floor((Date.now() - stakingInfo.lastRewardTime) / (24 * 60 * 60 * 1000))
    return Math.min((daysSinceLastReward / stakingInfo.stakingPeriod) * 100, 100)
  }

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10">
                <Coins className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stakingInfo.totalBalance.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">可用余额</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10">
                <Lock className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stakingInfo.stakedAmount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">已质押</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/10">
                <Gift className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stakingInfo.pendingRewards.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">待领取奖励</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stakingInfo.apy}%</p>
                <p className="text-sm text-muted-foreground">年化收益率</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 质押操作 */}
      <Card>
        <CardHeader>
          <CardTitle>HXT 代币质押</CardTitle>
          <CardDescription>质押 HXT 代币获得奖励，同时获得 DAO 治理投票权</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stake">质押</TabsTrigger>
              <TabsTrigger value="unstake">解质押</TabsTrigger>
              <TabsTrigger value="rewards">奖励</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stake" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="stakeAmount">质押数量</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="stakeAmount"
                        type="number"
                        placeholder="输入质押数量"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={() => setStakeAmount(stakingInfo.totalBalance.toString())}
                      >
                        最大
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      可用余额: {stakingInfo.totalBalance.toLocaleString()} HXT
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleStake} 
                    disabled={isLoading || !stakeAmount}
                    className="w-full"
                  >
                    {isLoading ? '质押中...' : '质押代币'}
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">预期收益</h4>
                  <div className="space-y-3">
                    {[7, 30, 90, 365].map((days) => (
                      <div key={days} className="flex justify-between items-center p-3 border rounded-lg">
                        <span className="text-sm">{days} 天</span>
                        <span className="font-medium">
                          +{calculateProjectedRewards(parseFloat(stakeAmount) || 0, days).toFixed(2)} HXT
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="unstake" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="unstakeAmount">解质押数量</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="unstakeAmount"
                        type="number"
                        placeholder="输入解质押数量"
                        value={unstakeAmount}
                        onChange={(e)=>setUnstakeAmount(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={() => setUnstakeAmount(stakingInfo.stakedAmount.toString())}
                      >
                        最大
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      已质押 {stakingInfo.stakedAmount.toLocaleString()} HXT
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleUnstake} 
                    disabled={isLoading || !unstakeAmount}
                    variant="outline"
                    className="w-full"
                  >
                    {isLoading ? '解质押中...' : '解质押代币'}
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">解质押说明</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• 解质押需要等待 7 天冷却期</p>
                    <p>• 冷却期内代币无法转移</p>
                    <p>• 解质押后将失去对应的投票权</p>
                    <p>• 建议先领取待领取的奖励</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="rewards" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">待领取奖励</span>
                      <Badge variant="secondary">
                        <Gift className="h-3 w-3 mr-1" />
                        可领取
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      {stakingInfo.pendingRewards.toFixed(2)} HXT
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>奖励进度</span>
                      <span>{getStakingProgress().toFixed(1)}%</span>
                    </div>
                    <Progress value={getStakingProgress()} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      下次奖励分发: {stakingInfo.stakingPeriod - Math.floor((Date.now() - stakingInfo.lastRewardTime) / (24 * 60 * 60 * 1000))} 天后
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleClaimRewards} 
                    disabled={isLoading || stakingInfo.pendingRewards <= 0}
                    className="w-full"
                  >
                    {isLoading ? '领取中...' : '领取奖励'}
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">奖励统计</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">当前 APY</span>
                      </div>
                      <span className="font-medium">{stakingInfo.apy}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-500" />
                        <span className="text-sm">质押天数</span>
                      </div>
                      <span className="font-medium">
                        {Math.floor((Date.now() - stakingInfo.lastRewardTime) / (24 * 60 * 60 * 1000))} 天
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">累计奖励</span>
                      </div>
                      <span className="font-medium">
                        {(stakingInfo.pendingRewards * 5).toFixed(2)} HXT
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 全网统计 */}
      <Card>
        <CardHeader>
          <CardTitle>全网质押统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mx-auto mb-3">
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{stakingInfo.totalStaked.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">总质押量</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mx-auto mb-3">
                <Users className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-2xl font-bold">1,234</p>
              <p className="text-sm text-muted-foreground">质押用户数</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">65.2%</p>
              <p className="text-sm text-muted-foreground">质押率</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
