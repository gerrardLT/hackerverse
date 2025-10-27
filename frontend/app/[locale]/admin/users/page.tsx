'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Filter, UserPlus, Shield, Clock, Mail, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'

interface User {
  id: string
  username: string
  email: string
  role: 'ADMIN' | 'MODERATOR' | 'USER' | 'JUDGE'
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING'
  avatarUrl?: string
  reputationScore: number
  emailVerified: boolean
  lastLoginAt?: string
  createdAt: string
  _count: {
    participations: number
    projects: number
    organizedHackathons: number
  }
}

interface UserFilters {
  search: string
  role: string
  status: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

export default function AdminUsersPage() {
  const t = useTranslations('admin.users')
  const tCommon = useTranslations('common')
  const { toast } = useToast()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20
  })

  // 加载用户列表
  const loadUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...filters,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      })

      // 移除 'all' 值
      if (filters.role === 'all') params.delete('role')
      if (filters.status === 'all') params.delete('status')

      const response = await apiService.get(`/admin/users?${params}`)
      
      if (response.success) {
        setUsers((response.data as any)?.users || [])
        setTotal((response.data as any)?.pagination?.total || 0)
      } else {
        toast({
          title: t('loadError'),
          description: response.error || t('unknownError'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('加载用户列表失败:', error)
      toast({
        title: t('loadError'),
        description: t('unknownError'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 更新用户角色
  const handleUpdateRole = async (userId: string, newRole: string) => {
    console.log('🔄 开始更新角色:', userId, '新角色:', newRole, '当前时间:', new Date().toLocaleTimeString())
    try {
      setUpdating(true)
      const response = await apiService.put(`/admin/users/${userId}/role`, {
        role: newRole
      })
      
      if (response.success) {
        toast({
          title: t('roleUpdateSuccess'),
          description: t('roleUpdateSuccessDesc'),
        })
        loadUsers()
        console.log('🧹 清理selectedUser状态 (角色更新后)')
        
        // 延迟关闭弹窗，避免Select组件状态冲突
        setTimeout(() => {
          setSelectedUser(null) // 清理过时的用户对象引用
          setEditDialogOpen(false)
          console.log('⏰ 延迟关闭弹窗完成')
        }, 100)
      } else {
        toast({
          title: t('roleUpdateError'),
          description: response.error || t('unknownError'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('更新用户角色失败:', error)
      toast({
        title: t('roleUpdateError'),
        description: t('unknownError'),
        variant: 'destructive'
      })
    } finally {
      setUpdating(false)
    }
  }

  // 更新用户状态
  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      setUpdating(true)
      const response = await apiService.put(`/admin/users/${userId}/status`, {
        status: newStatus
      })
      
      if (response.success) {
        toast({
          title: t('statusUpdateSuccess'),
          description: t('statusUpdateSuccessDesc'),
        })
        loadUsers()
        console.log('🧹 清理selectedUser状态 (状态更新后)')
        
        // 延迟关闭弹窗，避免Select组件状态冲突
        setTimeout(() => {
          setSelectedUser(null) // 清理过时的用户对象引用
          setEditDialogOpen(false)
          console.log('⏰ 延迟关闭弹窗完成 (状态更新)')
        }, 100)
      } else {
        toast({
          title: t('statusUpdateError'),
          description: response.error || t('unknownError'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('更新用户状态失败:', error)
      toast({
        title: t('statusUpdateError'),
        description: t('unknownError'),
        variant: 'destructive'
      })
    } finally {
      setUpdating(false)
    }
  }

  // 获取角色显示文本
  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN': return t('roles.admin')
      case 'MODERATOR': return t('roles.moderator')
      case 'JUDGE': return t('roles.judge')
      case 'USER': return t('roles.user')
      default: return role
    }
  }

  // 获取状态显示文本和样式
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { text: t('status.active'), variant: 'default' as const, color: 'bg-green-500' }
      case 'SUSPENDED':
        return { text: t('status.suspended'), variant: 'secondary' as const, color: 'bg-yellow-500' }
      case 'BANNED':
        return { text: t('status.banned'), variant: 'destructive' as const, color: 'bg-red-500' }
      case 'PENDING':
        return { text: t('status.pending'), variant: 'outline' as const, color: 'bg-gray-500' }
      default:
        return { text: status, variant: 'outline' as const, color: 'bg-gray-500' }
    }
  }

  // 获取角色颜色
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
      case 'MODERATOR': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'JUDGE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'USER': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
    }
  }

  // 格式化时间
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    loadUsers()
  }, [filters])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 紧凑页面标题 - 80px高度 */}
      <div className="glass-light border border-border/50 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <UserPlus className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-xs text-muted-foreground">{t('totalUsers')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 紧凑搜索和筛选 - 60px高度 */}
      <Card className="glass-light border-border/50">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t('filters')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="pl-10"
              />
            </div>

            {/* 角色筛选 */}
            <Select
              value={filters.role}
              onValueChange={(value) => setFilters({ ...filters, role: value, page: 1 })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon('all')}</SelectItem>
                <SelectItem value="ADMIN">{t('roles.admin')}</SelectItem>
                <SelectItem value="MODERATOR">{t('roles.moderator')}</SelectItem>
                <SelectItem value="JUDGE">{t('roles.judge')}</SelectItem>
                <SelectItem value="USER">{t('roles.user')}</SelectItem>
              </SelectContent>
            </Select>

            {/* 状态筛选 */}
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon('all')}</SelectItem>
                <SelectItem value="ACTIVE">{t('status.active')}</SelectItem>
                <SelectItem value="SUSPENDED">{t('status.suspended')}</SelectItem>
                <SelectItem value="BANNED">{t('status.banned')}</SelectItem>
                <SelectItem value="PENDING">{t('status.pending')}</SelectItem>
              </SelectContent>
            </Select>

            {/* 排序 */}
            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-')
                setFilters({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc', page: 1 })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">{t('sortOptions.newest')}</SelectItem>
                <SelectItem value="createdAt-asc">{t('sortOptions.oldest')}</SelectItem>
                <SelectItem value="username-asc">{t('sortOptions.usernameAZ')}</SelectItem>
                <SelectItem value="username-desc">{t('sortOptions.usernameZA')}</SelectItem>
                <SelectItem value="reputationScore-desc">{t('sortOptions.highestReputation')}</SelectItem>
                <SelectItem value="lastLoginAt-desc">{t('sortOptions.recentlyActive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 紧凑用户列表 - 表格化 48px/行 */}
      <Card className="glass-light border-border/50">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-base">{t('usersList')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs">{t('table.user')}</TableHead>
                    <TableHead className="text-xs">{t('table.role')}</TableHead>
                    <TableHead className="text-xs">{t('table.status')}</TableHead>
                    <TableHead className="text-xs">{t('table.reputation')}</TableHead>
                    <TableHead className="text-xs">{t('table.activity')}</TableHead>
                    <TableHead className="text-xs">{t('table.lastLogin')}</TableHead>
                    <TableHead className="text-xs text-right">{t('table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {users.map((user, index) => {
                      const statusConfig = getStatusConfig(user.status)
                      // 使用包含角色和状态的复合key强制重新渲染
                      const forceRenderKey = `${user.id}-${user.role}-${user.status}-v${Math.floor(Date.now()/1000)}`
                      return (
                       <TableRow key={forceRenderKey} className="h-12 border-border/50 hover:bg-muted/30 transition-colors">
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatarUrl} />
                              <AvatarFallback className="text-xs">
                                {user.username?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">{user.username || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                {user.emailVerified ? (
                                  <Mail className="h-2.5 w-2.5 text-green-500" />
                                ) : (
                                  <Mail className="h-2.5 w-2.5 text-gray-400" />
                                )}
                                <span className="truncate max-w-[150px]">{user.email}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge className={`${getRoleColor(user.role)} text-xs px-1.5 py-0`}>
                            {getRoleText(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.color}`} />
                            <Badge variant={statusConfig.variant} className="text-xs px-1.5 py-0">
                              {statusConfig.text}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            {user.reputationScore}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-xs text-muted-foreground">
                            <span>{user._count.participations}H</span>
                            <span className="mx-1">•</span>
                            <span>{user._count.projects}P</span>
                            <span className="mx-1">•</span>
                            <span>{user._count.organizedHackathons}O</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span className="truncate max-w-[100px]">
                              {user.lastLoginAt 
                                ? new Date(user.lastLoginAt).toLocaleDateString()
                                : t('table.neverLoggedIn')
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => console.log('🎯 DropdownMenuTrigger被点击:', user.id, user.username)}
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                 onClick={() => {
                                   console.log('📝 点击编辑用户:', user.id, user.username, '当前时间:', new Date().toLocaleTimeString())
                                   setSelectedUser(user)
                                   setEditDialogOpen(true)
                                 }}
                              >
                                {t('actions.edit')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* 分页 */}
              {total > filters.limit && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    {t('pagination.showing', {
                      start: (filters.page - 1) * filters.limit + 1,
                      end: Math.min(filters.page * filters.limit, total),
                      total
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page <= 1}
                      onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    >
                      {tCommon('previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page * filters.limit >= total}
                      onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    >
                      {tCommon('next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 编辑用户对话框 */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            console.log('🧹 清理selectedUser状态 (弹窗关闭)')
            setSelectedUser(null) // 弹窗关闭时清理用户状态
          }
        }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editUser.title')}</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4 pr-2">
              {/* 用户信息 */}
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Avatar>
                  <AvatarImage src={selectedUser.avatarUrl} />
                  <AvatarFallback>
                    {selectedUser.username?.charAt(0)?.toUpperCase() || selectedUser.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedUser.username || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                </div>
              </div>

              {/* 角色管理 */}
              <div className="space-y-2">
                <Label htmlFor="user-role" className="text-sm font-medium">{t('editUser.role')}</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => handleUpdateRole(selectedUser.id, value)}
                  disabled={updating}
                >
                  <SelectTrigger id="user-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" side="bottom">
                    <SelectItem value="USER">{t('roles.user')}</SelectItem>
                    <SelectItem value="JUDGE">{t('roles.judge')}</SelectItem>
                    <SelectItem value="MODERATOR">{t('roles.moderator')}</SelectItem>
                    <SelectItem value="ADMIN">{t('roles.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 状态管理 */}
              <div className="space-y-2">
                <Label htmlFor="user-status" className="text-sm font-medium">{t('editUser.status')}</Label>
                <Select
                  value={selectedUser.status}
                  onValueChange={(value) => handleUpdateStatus(selectedUser.id, value)}
                  disabled={updating}
                >
                  <SelectTrigger id="user-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" side="bottom">
                    <SelectItem value="ACTIVE">{t('status.active')}</SelectItem>
                    <SelectItem value="SUSPENDED">{t('status.suspended')}</SelectItem>
                    <SelectItem value="BANNED">{t('status.banned')}</SelectItem>
                    <SelectItem value="PENDING">{t('status.pending')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 用户统计 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">{selectedUser.reputationScore}</div>
                  <div className="text-sm text-muted-foreground">{t('editUser.reputation')}</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">{selectedUser._count.participations}</div>
                  <div className="text-sm text-muted-foreground">{t('editUser.participations')}</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">{selectedUser._count.projects}</div>
                  <div className="text-sm text-muted-foreground">{t('editUser.projects')}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
