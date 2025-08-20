'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { securityService, type SecurityRule } from '@/lib/security'
import { useToast } from '@/hooks/use-toast'

export function SecurityRulesPanel() {
  const { toast } = useToast()
  const [rules, setRules] = useState<SecurityRule[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<SecurityRule | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'keyword' as SecurityRule['type'],
    pattern: '',
    severity: 'medium' as SecurityRule['severity'],
    action: 'review' as SecurityRule['action'],
    description: '',
    enabled: true
  })

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = () => {
    const allRules = securityService.getRules()
    setRules(allRules)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingRule) {
      securityService.updateRule(editingRule.id, formData)
      toast({
        title: '规则更新成功',
        description: '安全规则已更新',
      })
    } else {
      securityService.addRule(formData)
      toast({
        title: '规则创建成功',
        description: '新的安全规则已添加',
      })
    }
    
    loadRules()
    resetForm()
    setIsDialogOpen(false)
  }

  const handleEdit = (rule: SecurityRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      type: rule.type,
      pattern: rule.pattern,
      severity: rule.severity,
      action: rule.action,
      description: rule.description,
      enabled: rule.enabled
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (ruleId: string) => {
    if (confirm('确定要删除这个规则吗？')) {
      securityService.deleteRule(ruleId)
      loadRules()
      toast({
        title: '规则删除成功',
        description: '安全规则已删除',
      })
    }
  }

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    securityService.updateRule(ruleId, { enabled })
    loadRules()
    toast({
      title: enabled ? '规则已启用' : '规则已禁用',
      description: `安全规则已${enabled ? '启用' : '禁用'}`,
    })
  }

  const resetForm = () => {
    setEditingRule(null)
    setFormData({
      name: '',
      type: 'keyword',
      pattern: '',
      severity: 'medium',
      action: 'review',
      description: '',
      enabled: true
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
      case 'warn': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'block': return 'bg-orange-100 text-orange-800'
      case 'ban': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{rules.length}</p>
                <p className="text-sm text-muted-foreground">总规则数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{rules.filter(r => r.enabled).length}</p>
                <p className="text-sm text-muted-foreground">已启用</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{rules.filter(r => r.severity === 'critical').length}</p>
                <p className="text-sm text-muted-foreground">严重规则</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold">{rules.filter(r => !r.enabled).length}</p>
                <p className="text-sm text-muted-foreground">已禁用</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 规则管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>安全规则管理</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加规则
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingRule ? '编辑规则' : '添加新规则'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">规则名称</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">规则类型</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value as SecurityRule['type']})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keyword">关键词</SelectItem>
                          <SelectItem value="regex">正则表达式</SelectItem>
                          <SelectItem value="url">URL 检测</SelectItem>
                          <SelectItem value="behavior">行为检测</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pattern">匹配模式</Label>
                    <Input
                      id="pattern"
                      value={formData.pattern}
                      onChange={(e) => setFormData({...formData, pattern: e.target.value})}
                      placeholder={
                        formData.type === 'keyword' ? '关键词|关键词' :
                        formData.type === 'regex' ? '\\d{11}' :
                        formData.type === 'url' ? 'suspicious-site\\.com' :
                        '行为模式'
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="severity">严重程度</Label>
                      <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value as SecurityRule['severity']})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">低</SelectItem>
                          <SelectItem value="medium">中</SelectItem>
                          <SelectItem value="high">高</SelectItem>
                          <SelectItem value="critical">严重</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="action">处理动作</Label>
                      <Select value={formData.action} onValueChange={(value) => setFormData({...formData, action: value as SecurityRule['action']})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warn">警告</SelectItem>
                          <SelectItem value="review">人工审核</SelectItem>
                          <SelectItem value="block">阻止发布</SelectItem>
                          <SelectItem value="ban">封禁用户</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">规则描述</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="描述这个规则的用途.."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enabled"
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData({...formData, enabled: checked})}
                    />
                    <Label htmlFor="enabled">启用规则</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      取消
                    </Button>
                    <Button type="submit">
                      {editingRule ? '更新' : '创建'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>规则名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>模式</TableHead>
                <TableHead>严重程度</TableHead>
                <TableHead>处理动作</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-sm text-muted-foreground">{rule.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {rule.type === 'keyword' ? '关键词' :
                       rule.type === 'regex' ? '正则' :
                       rule.type === 'url' ? 'URL' : '行为'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {rule.pattern.length > 30 ? rule.pattern.substring(0, 30) + '...' : rule.pattern}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(rule.severity)}>
                      {rule.severity === 'low' ? '低' :
                       rule.severity === 'medium' ? '中' :
                       rule.severity === 'high' ? '高' : '严重'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionColor(rule.action)}>
                      {rule.action === 'warn' ? '警告' :
                       rule.action === 'review' ? '审核' :
                       rule.action === 'block' ? '阻止' : '封禁'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
