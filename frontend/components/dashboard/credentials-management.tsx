'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Award,
  Plus,
  Search,
  Filter,
  Eye,
  Share2,
  Download,
  RefreshCw,
  Upload,
  Star,
  Shield,
  Calendar,
  Tag,
  User,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { apiService } from '@/lib/api'
import { CredentialCard } from '@/components/credentials/credential-card'
import { CredentialViewer } from '@/components/credentials/credential-viewer'

interface Credential {
  id: string
  title: string
  description?: string
  credentialType: string
  category: string
  isVerified: boolean
  isRevoked: boolean
  verificationScore: number
  expiryDate?: string
  isPublic: boolean
  tags: string[]
  skillsProven: string[]
  viewCount: number
  downloadCount: number
  shareableLink?: string
  ipfsHash: string
  createdAt: string
  user: {
    id: string
    username: string
    email: string
  }
  issuer?: {
    id: string
    username: string
    role: string
  }
  template?: {
    id: string
    name: string
    version: string
  }
  verifications?: Array<{
    id: string
    status: string
    score?: number
    verifier: {
      username: string
      role: string
    }
    createdAt: string
  }>
}

interface CredentialTemplate {
  id: string
  name: string
  description?: string
  credentialType: string
  category: string
  version: string
  schema: any
  requiredFields: string[]
  optionalFields: string[]
  popularity: number
  createdAt: string
}

export function CredentialsManagement() {
  const t = useTranslations('credentials.management')
  const tCommon = useTranslations('common')
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [templates, setTemplates] = useState<CredentialTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  
  // 筛选和搜索状态
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  
  // 生成凭证表单状态
  const [generateForm, setGenerateForm] = useState({
    templateId: '',
    title: '',
    description: '',
    credentialType: '',
    category: 'achievement',
    tags: '',
    skillsProven: '',
    expirationDays: '',
    isPublic: true,
    credentialSubject: '',
    evidence: ''
  })

  let isMounted = true

  // 加载用户凭证
  const loadCredentials = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const response = await apiService.getUserCredentials({
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sort: sortBy,
        order: 'desc'
      })
      
      if (response.success && isMounted) {
        setCredentials(response.data.credentials || [])
      } else if (isMounted) {
        toast({
          title: t('loadError'),
          description: response.error || t('loadErrorDesc'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('加载凭证失败:', error)
      if (isMounted) {
        toast({
          title: t('loadError'),
          description: t('networkError'),
          variant: 'destructive'
        })
      }
    } finally {
      if (isMounted) {
        setLoading(false)
      }
    }
  }

  // 加载凭证模板
  const loadTemplates = async () => {
    try {
      const response = await apiService.getCredentialTemplates()
      
      if (response.success && isMounted) {
        setTemplates(response.data.templates || [])
      }
    } catch (error) {
      console.error('加载模板失败:', error)
    }
  }

  useEffect(() => {
    loadCredentials()
    loadTemplates()
    
    return () => {
      isMounted = false
    }
  }, [user])

  // 生成凭证
  const handleGenerateCredential = async () => {
    if (!generateForm.title || !generateForm.credentialType) {
      toast({
        title: t('generateForm.validationError'),
        description: t('generateForm.requiredFields'),
        variant: 'destructive'
      })
      return
    }

    setGenerating(true)
    try {
      const credentialSubject = generateForm.credentialSubject 
        ? JSON.parse(generateForm.credentialSubject)
        : {}
      
      const evidence = generateForm.evidence 
        ? JSON.parse(generateForm.evidence)
        : []

      const payload = {
        templateId: generateForm.templateId || undefined,
        title: generateForm.title,
        description: generateForm.description,
        credentialType: generateForm.credentialType,
        category: generateForm.category,
        tags: generateForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        skillsProven: generateForm.skillsProven.split(',').map(s => s.trim()).filter(Boolean),
        expirationDays: generateForm.expirationDays ? parseInt(generateForm.expirationDays) : undefined,
        isPublic: generateForm.isPublic,
        credentialSubject,
        evidence
      }

      const response = await apiService.generateCredential(payload)
      
      if (response.success) {
        toast({
          title: t('generateSuccess'),
          description: t('generateSuccessDesc'),
          variant: 'default'
        })
        
        setGenerateDialogOpen(false)
        setGenerateForm({
          templateId: '',
          title: '',
          description: '',
          credentialType: '',
          category: 'achievement',
          tags: '',
          skillsProven: '',
          expirationDays: '',
          isPublic: true,
          credentialSubject: '',
          evidence: ''
        })
        
        await loadCredentials()
      } else {
        toast({
          title: t('generateError'),
          description: response.error || t('generateErrorDesc'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('生成凭证失败:', error)
      toast({
        title: t('generateError'),
        description: t('networkError'),
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  // 筛选凭证
  const filteredCredentials = credentials.filter(credential => {
    const matchesSearch = !searchTerm || 
      credential.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.credentialType.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || credential.category === categoryFilter
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'verified' && credential.isVerified) ||
      (statusFilter === 'unverified' && !credential.isVerified) ||
      (statusFilter === 'revoked' && credential.isRevoked) ||
      (statusFilter === 'expired' && credential.expiryDate && new Date(credential.expiryDate) < new Date())
    
    return matchesSearch && matchesCategory && matchesStatus
  }).sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'verificationScore':
        return b.verificationScore - a.verificationScore
      case 'viewCount':
        return b.viewCount - a.viewCount
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  // 查看凭证详情
  const handleViewCredential = (credential: Credential) => {
    setSelectedCredential(credential)
    setViewerOpen(true)
  }

  // 获取统计信息
  const stats = {
    total: credentials.length,
    verified: credentials.filter(c => c.isVerified).length,
    public: credentials.filter(c => c.isPublic).length,
    totalViews: credentials.reduce((sum, c) => sum + c.viewCount, 0)
  }

  return (
    <div className="space-y-6">
      {/* 头部统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.totalCredentials')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.verifiedCredentials')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.publicCredentials')}</p>
                <p className="text-2xl font-bold text-blue-600">{stats.public}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.totalViews')}</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalViews}</p>
              </div>
              <Star className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作工具栏 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>{t('description')}</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('generateCredential')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{t('generateForm.title')}</DialogTitle>
                    <DialogDescription>
                      {t('generateForm.description')}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="template">{t('generateForm.template')}</Label>
                        <Select 
                          value={generateForm.templateId} 
                          onValueChange={(value) => setGenerateForm(prev => ({ ...prev, templateId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('generateForm.selectTemplate')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">{t('generateForm.customCredential')}</SelectItem>
                            {templates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="category">{t('generateForm.category')}</Label>
                        <Select 
                          value={generateForm.category} 
                          onValueChange={(value) => setGenerateForm(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="achievement">{t('categories.achievement')}</SelectItem>
                            <SelectItem value="certification">{t('categories.certification')}</SelectItem>
                            <SelectItem value="badge">{t('categories.badge')}</SelectItem>
                            <SelectItem value="skill">{t('categories.skill')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="title">{t('generateForm.title')} *</Label>
                      <Input
                        id="title"
                        value={generateForm.title}
                        onChange={(e) => setGenerateForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder={t('generateForm.titlePlaceholder')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">{t('generateForm.description')}</Label>
                      <Textarea
                        id="description"
                        value={generateForm.description}
                        onChange={(e) => setGenerateForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder={t('generateForm.descriptionPlaceholder')}
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="credentialType">{t('generateForm.credentialType')} *</Label>
                      <Input
                        id="credentialType"
                        value={generateForm.credentialType}
                        onChange={(e) => setGenerateForm(prev => ({ ...prev, credentialType: e.target.value }))}
                        placeholder={t('generateForm.credentialTypePlaceholder')}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tags">{t('generateForm.tags')}</Label>
                        <Input
                          id="tags"
                          value={generateForm.tags}
                          onChange={(e) => setGenerateForm(prev => ({ ...prev, tags: e.target.value }))}
                          placeholder={t('generateForm.tagsPlaceholder')}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="skillsProven">{t('generateForm.skillsProven')}</Label>
                        <Input
                          id="skillsProven"
                          value={generateForm.skillsProven}
                          onChange={(e) => setGenerateForm(prev => ({ ...prev, skillsProven: e.target.value }))}
                          placeholder={t('generateForm.skillsProvenPlaceholder')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="credentialSubject">{t('generateForm.credentialSubject')} *</Label>
                      <Textarea
                        id="credentialSubject"
                        value={generateForm.credentialSubject}
                        onChange={(e) => setGenerateForm(prev => ({ ...prev, credentialSubject: e.target.value }))}
                        placeholder={t('generateForm.credentialSubjectPlaceholder')}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                      {tCommon('cancel')}
                    </Button>
                    <Button onClick={handleGenerateCredential} disabled={generating}>
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('generating')}
                        </>
                      ) : (
                        t('generate')
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" onClick={loadCredentials} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {tCommon('refresh')}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
                <SelectItem value="achievement">{t('categories.achievement')}</SelectItem>
                <SelectItem value="certification">{t('categories.certification')}</SelectItem>
                <SelectItem value="badge">{t('categories.badge')}</SelectItem>
                <SelectItem value="skill">{t('categories.skill')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                <SelectItem value="verified">{t('filters.verified')}</SelectItem>
                <SelectItem value="unverified">{t('filters.unverified')}</SelectItem>
                <SelectItem value="revoked">{t('filters.revoked')}</SelectItem>
                <SelectItem value="expired">{t('filters.expired')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">{t('sort.newest')}</SelectItem>
                <SelectItem value="title">{t('sort.title')}</SelectItem>
                <SelectItem value="verificationScore">{t('sort.verificationScore')}</SelectItem>
                <SelectItem value="viewCount">{t('sort.viewCount')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 凭证列表 */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeleton
          [...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="h-5 bg-muted rounded w-1/3"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredCredentials.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Award className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">{t('noCredentials.title')}</h3>
                <p className="text-muted-foreground">{t('noCredentials.description')}</p>
                <Button onClick={() => setGenerateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('generateFirstCredential')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredCredentials.map((credential) => (
            <CredentialCard
              key={credential.id}
              credential={credential}
              variant="detailed"
              showActions={true}
              onView={() => handleViewCredential(credential)}
              onVerify={() => window.open(`/verify/${credential.ipfsHash}`, '_blank')}
              onShare={() => {
                if (credential.shareableLink) {
                  navigator.clipboard.writeText(credential.shareableLink)
                  toast({
                    title: t('linkCopied'),
                    description: t('linkCopiedDesc'),
                    variant: 'default'
                  })
                }
              }}
            />
          ))
        )}
      </div>

      {/* 凭证查看器对话框 */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedCredential && (
            <CredentialViewer 
              credentialHash={selectedCredential.ipfsHash}
              onClose={() => setViewerOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
