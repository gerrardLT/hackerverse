'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Shield, CheckCircle, XCircle, Eye, Search, Filter, Clock, User, MessageSquare } from 'lucide-react'
import { securityService, type SecurityViolation } from '@/lib/security'
import { useToast } from '@/hooks/use-toast'

export function ContentModerationPanel() {
  const { toast } = useToast()
  const [violations, setViolations] = useState<SecurityViolation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved'>('all')
  const [testContent, setTestContent] = useState('')
  const [testResult, setTestResult] = useState<any>(null)

  useEffect(() => {
    loadViolations()
  }, [])

  const loadViolations = () => {
    const allViolations = securityService.getViolations()
    setViolations(allViolations)
  }

  const handleTestContent = () => {
    if (!testContent.trim()) return

    const result = securityService.moderateContent(testContent, 'test-user', 'post')
    setTestResult(result)
  }

  const handleResolveViolation = (violationId: string, action: 'approve' | 'reject') => {
    securityService.batchProcessViolations([violationId], action, 'admin-user')
    loadViolations()
    
    toast({
      title: '处理成功',
      description: `违规内容已${action === 'approve' ? '批准' : '拒绝'}`,
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'content_removal': return 'bg-orange-100 text-orange-800'
      case 'temporary_ban': return 'bg-red-100 text-red-800'
      case 'permanent_ban': return 'bg-red-200 text-red-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredViolations = violations.filter(violation => {
    const matchesSearch = violation.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         violation.userId.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'pending' && !violation.resolvedAt) ||
                         (filterStatus === 'resolved' && violation.resolvedAt)
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{violations.filter(v => !v.resolvedAt).length}</p>
                <p className="text-sm text-muted-foreground">待处理违规</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{violations.filter(v => v.resolvedAt).length}</p>
                <p className="text-sm text-muted-foreground">已处理违规</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{violations.filter(v => v.severity === 'critical').length}</p>
                <p className="text-sm text-muted-foreground">严重违规</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {violations.filter(v => 
                    Date.now() - v.createdAt.getTime() < 24 * 60 * 60 * 1000
                  ).length}
                </p>
                <p className="text-sm text-muted-foreground">今日新增</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="violations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="violations">违规管理</TabsTrigger>
          <TabsTrigger value="test">内容测试</TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>违规内容管理</CardTitle>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索违规内容..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setFilterStatus(filterStatus === 'all' ? 'pending' : 'all')}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {filterStatus === 'all' ? '全部' : '待处理'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>违规类型</TableHead>
                    <TableHead>严重程度</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead>处理动作</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredViolations.map((violation) => (
                    <TableRow key={violation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{violation.userId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {violation.type === 'spam' ? '垃圾信息' :
                           violation.type === 'harassment' ? '骚扰' :
                           violation.type === 'inappropriate' ? '不当内容' :
                           violation.type === 'malicious' ? '恶意行为' :
                           violation.type === 'fraud' ? '欺诈' : violation.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(violation.severity)}>
                          {violation.severity === 'low' ? '低' :
                           violation.severity === 'medium' ? '中' :
                           violation.severity === 'high' ? '高' : '严重'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm">
                          {violation.content}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(violation.action)}>
                          {violation.action === 'warning' ? '警告' :
                           violation.action === 'content_removal' ? '删除内容' :
                           violation.action === 'temporary_ban' ? '临时封禁' :
                           violation.action === 'permanent_ban' ? '永久封禁' : violation.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {violation.createdAt.toLocaleDateString('zh-CN')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {violation.resolvedAt ? (
                          <Badge className="bg-green-100 text-green-800">已处理</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">待处理</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!violation.resolvedAt && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveViolation(violation.id, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveViolation(violation.id, 'reject')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredViolations.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无违规记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>内容安全测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">测试内容</label>
                <Textarea
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                  placeholder="输入要测试的内容..."
                  className="mt-1"
                  rows={4}
                />
              </div>
              
              <Button onClick={handleTestContent} disabled={!testContent.trim()}>
                <Shield className="h-4 w-4 mr-2" />
                开始检测
              </Button>

              {testResult && (
                <Alert className={testResult.isAllowed ? 'border-green-200' : 'border-red-200'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">检测结果</span>
                        <Badge className={testResult.isAllowed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {testResult.action === 'approve' ? '通过' : 
                           testResult.action === 'review' ? '需要审核' : '拒绝'}
                        </Badge>
                        <span className="text-sm">风险分数: {testResult.riskScore}</span>
                      </div>
                      
                      {testResult.violations.length > 0 && (
                        <div>
                          <p className="font-medium mb-2">检测到的问题</p>
                          <ul className="space-y-1">
                            {testResult.violations.map((violation: any, index: number) => (
                              <li key={index} className="text-sm">
                                <Badge className={getSeverityColor(violation.severity)} variant="outline">
                                  {violation.ruleName}
                                </Badge>
                                <span className="ml-2">{violation.suggestion}</span>
                                <span className="text-muted-foreground ml-2">匹配: {violation.matched}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
