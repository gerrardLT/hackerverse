'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Vote, Plus, Clock, CheckCircle, XCircle, Users, TrendingUp, Calendar, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'

interface Proposal {
  id: string
  title: string
  description: string
  proposer: string
  forVotes: number
  againstVotes: number
  endTime: number
  executed: boolean
  status: 'active' | 'passed' | 'failed' | 'executed'
  createdAt: string
  votingPeriod: number
}

export function DAOGovernance() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [votingPower, setVotingPower] = useState(0)
  const [totalVotingPower, setTotalVotingPower] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  // 创建提案表单
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    votingPeriod: 7 // 默认7天
  })

  useEffect(() => {
    loadProposals()
    loadVotingPower()
  }, [user])

  const loadProposals = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getDAOProposals({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      
      if (response.success && response.data) {
        setProposals(response.data.proposals)
        setTotalVotingPower(response.data.totalVotingPower)
      } else {
        setError(response.error || '获取提案列表失败')
        toast({
          title: '加载失败',
          description: response.error || '无法获取提案列表',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('获取提案列表错误:', error)
      setError('网络错误，请检查网络连接')
      toast({
        title: '网络错误',
        description: '请检查网络连接并重试',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadVotingPower = async () => {
    try {
      const response = await apiService.getUserVotingPower()
      
      if (response.success && response.data) {
        setVotingPower(response.data.votingPower)
      }
    } catch (error) {
      console.error('获取投票权重错误:', error)
    }
  }

  const handleCreateProposal = async () => {
    if (!newProposal.title || !newProposal.description) {
      toast({
        title: '表单错误',
        description: '请填写完整的提案信息',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await apiService.createDAOProposal(newProposal)
      
      if (response.success) {
        toast({
          title: '成功',
          description: '提案创建成功'
        })
        setShowCreateDialog(false)
        setNewProposal({ title: '', description: '', votingPeriod: 7 })
        loadProposals() // 重新加载提案列表
      } else {
        toast({
          title: '创建失败',
          description: response.error || '创建提案失败',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('创建提案错误:', error)
      toast({
        title: '创建失败',
        description: '创建提案失败',
        variant: 'destructive'
      })
    }
  }

  const handleVote = async (proposalId: string, vote: 'for' | 'against') => {
    try {
      const response = await apiService.voteOnProposal(proposalId, vote)
      
      if (response.success) {
        toast({
          title: '投票成功',
          description: `已投票${vote === 'for' ? '赞成' : '反对'}`
        })
        loadProposals() // 重新加载提案列表
      } else {
        toast({
          title: '投票失败',
          description: response.error || '投票失败',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('投票错误:', error)
      toast({
        title: '投票失败',
        description: '投票失败',
        variant: 'destructive'
      })
    }
  }

  const handleExecuteProposal = async (proposalId: string) => {
    try {
      const response = await apiService.executeProposal(proposalId)
      
      if (response.success) {
        toast({
          title: '执行成功',
          description: '提案已执行'
        })
        loadProposals() // 重新加载提案列表
      } else {
        toast({
          title: '执行失败',
          description: response.error || '执行提案失败',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('执行提案错误:', error)
      toast({
        title: '执行失败',
        description: '执行提案失败',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">进行中</Badge>
      case 'passed':
        return <Badge variant="secondary">已通过</Badge>
      case 'failed':
        return <Badge variant="destructive">已失败</Badge>
      case 'executed':
        return <Badge variant="outline">已执行</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTimeRemaining = (endTime: number) => {
    const now = Date.now()
    const remaining = endTime - now
    
    if (remaining <= 0) {
      return '已结束'
    }
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) {
      return `${days}天${hours}小时`
    }
    return `${hours}小时`
  }

  const getVotePercentage = (forVotes: number, againstVotes: number) => {
    const total = forVotes + againstVotes
    if (total === 0) return 0
    return Math.round((forVotes / total) * 100)
  }

  if (loading && proposals.length === 0) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">加载提案中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">加载失败</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadProposals}>
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">DAO 治理</h2>
          <p className="text-muted-foreground">
            参与社区决策，共同建设 HackX 生态
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">我的投票权重</p>
            <p className="text-lg font-semibold">{votingPower.toLocaleString()}</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                创建提案
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>创建新提案</DialogTitle>
                <DialogDescription>
                  创建一个新的治理提案，让社区参与决策
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">提案标题</Label>
                  <Input
                    id="title"
                    value={newProposal.title}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="输入提案标题"
                  />
                </div>
                <div>
                  <Label htmlFor="description">提案描述</Label>
                  <Textarea
                    id="description"
                    value={newProposal.description}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="详细描述提案内容"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="votingPeriod">投票周期（天）</Label>
                  <Input
                    id="votingPeriod"
                    type="number"
                    value={newProposal.votingPeriod}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, votingPeriod: parseInt(e.target.value) || 7 }))}
                    min="1"
                    max="30"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateProposal}>
                    创建提案
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 提案列表 */}
      <div className="space-y-4">
        {proposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🗳️</span>
            </div>
            <h3 className="text-lg font-medium mb-2">暂无提案</h3>
            <p className="text-muted-foreground">还没有治理提案，快来创建第一个吧！</p>
          </div>
        ) : (
          proposals.map((proposal) => (
            <Card key={proposal.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{proposal.title}</CardTitle>
                      {getStatusBadge(proposal.status)}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {proposal.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* 投票进度 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>赞成: {proposal.forVotes.toLocaleString()}</span>
                    <span>反对: {proposal.againstVotes.toLocaleString()}</span>
                  </div>
                  <Progress value={getVotePercentage(proposal.forVotes, proposal.againstVotes)} />
                  <div className="text-center text-sm text-muted-foreground">
                    {getVotePercentage(proposal.forVotes, proposal.againstVotes)}% 赞成
                  </div>
                </div>
                
                {/* 提案信息 */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>提议者: {proposal.proposer}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>创建于: {new Date(proposal.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                  
                  {proposal.status === 'active' && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>剩余: {getTimeRemaining(proposal.endTime)}</span>
                    </div>
                  )}
                </div>
                
                {/* 操作按钮 */}
                {proposal.status === 'active' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleVote(proposal.id, 'for')}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      赞成
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(proposal.id, 'against')}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      反对
                    </Button>
                  </div>
                )}
                
                {proposal.status === 'passed' && !proposal.executed && (
                  <Button
                    size="sm"
                    onClick={() => handleExecuteProposal(proposal.id)}
                    className="w-full"
                  >
                    执行提案
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
