'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Search, Shield, AlertTriangle, CheckCircle, User, Mail, Phone, CreditCard } from 'lucide-react'
import { securityService, type UserSecurityProfile } from '@/lib/security'

export function UserSecurityProfilePanel() {
  const [profiles, setProfiles] = useState<UserSecurityProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<UserSecurityProfile | null>(null)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = () => {
    const allProfiles = securityService.getAllUserProfiles()
    setProfiles(allProfiles)
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getVerificationIcon = (level: string) => {
    switch (level) {
      case 'email': return <Mail className="h-4 w-4 text-blue-600" />
      case 'phone': return <Phone className="h-4 w-4 text-green-600" />
      case 'kyc': return <CreditCard className="h-4 w-4 text-purple-600" />
      default: return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const filteredProfiles = profiles.filter(profile =>
    profile.userId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profiles.filter(p => p.riskLevel === 'low').length}</p>
                <p className="text-sm text-muted-foreground">低风险用户</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profiles.filter(p => p.riskLevel === 'medium').length}</p>
                <p className="text-sm text-muted-foreground">中风险用户</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profiles.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length}</p>
                <p className="text-sm text-muted-foreground">高风险用户</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profiles.filter(p => p.verificationLevel === 'kyc').length}</p>
                <p className="text-sm text-muted-foreground">KYC 认证用户</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 用户列表 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>用户安全档案</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>风险等级</TableHead>
                    <TableHead>信任分数</TableHead>
                    <TableHead>验证等级</TableHead>
                    <TableHead>违规次数</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>{profile.userId[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{profile.userId}</div>
                            <div className="text-sm text-muted-foreground">
                              账龄: {profile.accountAge} 天
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskLevelColor(profile.riskLevel)}>
                          {profile.riskLevel === 'low' ? '低风险' :
                           profile.riskLevel === 'medium' ? '中风险' :
                           profile.riskLevel === 'high' ? '高风险' : '严重风险'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${getTrustScoreColor(profile.trustScore)}`}>
                            {profile.trustScore}
                          </span>
                          <Progress value={profile.trustScore} className="w-16 h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getVerificationIcon(profile.verificationLevel)}
                          <span className="text-sm">
                            {profile.verificationLevel === 'none' ? '未验证' :
                             profile.verificationLevel === 'email' ? '邮箱' :
                             profile.verificationLevel === 'phone' ? '手机' : 'KYC'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{profile.violations.length}</div>
                          <div className="text-xs text-muted-foreground">
                            {profile.violations.filter(v => 
                              Date.now() - v.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000
                            ).length} 近30天
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProfile(profile)}
                        >
                          查看详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* 用户详情 */}
        <div>
          {selectedProfile ? (
            <Card>
              <CardHeader>
                <CardTitle>用户详情</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>{selectedProfile.userId[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedProfile.userId}</div>
                    <Badge className={getRiskLevelColor(selectedProfile.riskLevel)}>
                      {selectedProfile.riskLevel === 'low' ? '低风险' :
                       selectedProfile.riskLevel === 'medium' ? '中风险' :
                       selectedProfile.riskLevel === 'high' ? '高风险' : '严重风险'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>信任分数</span>
                      <span className={getTrustScoreColor(selectedProfile.trustScore)}>
                        {selectedProfile.trustScore}/100
                      </span>
                    </div>
                    <Progress value={selectedProfile.trustScore} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>行为分数</span>
                      <span className={getTrustScoreColor(selectedProfile.behaviorScore)}>
                        {selectedProfile.behaviorScore}/100
                      </span>
                    </div>
                    <Progress value={selectedProfile.behaviorScore} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">账龄</span>
                    <div className="font-medium">{selectedProfile.accountAge} 天</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">验证等级</span>
                    <div className="font-medium flex items-center gap-1">
                      {getVerificationIcon(selectedProfile.verificationLevel)}
                      {selectedProfile.verificationLevel === 'none' ? '未验证' :
                       selectedProfile.verificationLevel === 'email' ? '邮箱' :
                       selectedProfile.verificationLevel === 'phone' ? '手机' : 'KYC'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">总违规</span>
                    <div className="font-medium">{selectedProfile.violations.length}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">活跃限制</span>
                    <div className="font-medium">{selectedProfile.restrictions.filter(r => r.isActive).length}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">最近违规记录</h4>
                  <div className="space-y-2">
                    {selectedProfile.violations.slice(0, 3).map((violation) => (
                      <div key={violation.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex justify-between items-center">
                          <Badge className={getRiskLevelColor(violation.severity)} variant="outline">
                            {violation.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {violation.createdAt.toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground truncate">
                          {violation.content}
                        </div>
                      </div>
                    ))}
                    {selectedProfile.violations.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        暂无违规记录
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">活跃限制</h4>
                  <div className="space-y-2">
                    {selectedProfile.restrictions.filter(r => r.isActive).map((restriction) => (
                      <div key={restriction.id} className="p-2 bg-red-50 rounded text-sm">
                        <div className="flex justify-between items-center">
                          <Badge variant="destructive">
                            {restriction.type === 'post_limit' ? '发帖限制' :
                             restriction.type === 'comment_ban' ? '评论禁止' :
                             restriction.type === 'upload_ban' ? '上传禁止' : '全面封禁'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {restriction.endDate ? `至 ${restriction.endDate.toLocaleDateString('zh-CN')}` : '永久'}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {restriction.reason}
                        </div>
                      </div>
                    ))}
                    {selectedProfile.restrictions.filter(r => r.isActive).length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        暂无活跃限制
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">选择用户查看详细安全档案</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
