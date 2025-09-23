'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Award,
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  Clock,
  Tag,
  Star,
  Globe,
  Eye,
  FileText,
  Hash,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'

interface CredentialViewerProps {
  credentialHash: string
  onClose?: () => void
}

interface VerificationResult {
  hash: string
  isValid: boolean
  isAuthentic: boolean | null
  trustScore: number
  status: {
    exists: boolean
    ipfsAccessible: boolean
    isExpired: boolean
    isRevoked: boolean
    isVerified: boolean
  }
  credential?: {
    id: string
    title: string
    description?: string
    credentialType: string
    category: string
    issuanceDate: string
    expirationDate?: string
    subject: {
      id: string
      name: string
      reputation: number
    }
    issuer?: {
      id: string
      name: string
      role: string
      reputation: number
    }
    template?: {
      id: string
      name: string
      version: string
    }
    tags: string[]
    skillsProven: string[]
    verificationScore: number
    metadata?: any
  }
  ipfsData?: any
  verifications: Array<{
    id: string
    status: string
    score?: number
    verifier: {
      username: string
      role: string
    }
    createdAt: string
    comments?: string
  }>
  statistics?: {
    viewCount: number
    verificationCount: number
    lastVerified?: string
    averageVerificationScore?: number
  }
  shareableLink: string
  verifiedAt: string
}

export function CredentialViewer({ credentialHash, onClose }: CredentialViewerProps) {
  const t = useTranslations('credentials')
  const tCommon = useTranslations('common')
  const { toast } = useToast()
  
  const [verification, setVerification] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  // 获取信任度等级和图标
  const getTrustInfo = (score: number) => {
    if (score >= 90) return { 
      level: 'high', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50 border-green-200',
      icon: ShieldCheck,
      label: t('viewer.trustLevels.high')
    }
    if (score >= 70) return { 
      level: 'medium', 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50 border-yellow-200',
      icon: Shield,
      label: t('viewer.trustLevels.medium')
    }
    if (score >= 50) return { 
      level: 'low', 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50 border-orange-200',
      icon: ShieldAlert,
      label: t('viewer.trustLevels.low')
    }
    return { 
      level: 'none', 
      color: 'text-red-600', 
      bgColor: 'bg-red-50 border-red-200',
      icon: XCircle,
      label: t('viewer.trustLevels.none')
    }
  }

  // 获取状态图标和颜色
  const getStatusInfo = (status: VerificationResult['status']) => {
    if (!status.exists) {
      return { icon: AlertTriangle, color: 'text-gray-500', label: t('viewer.status.notFound') }
    }
    if (status.isRevoked) {
      return { icon: XCircle, color: 'text-red-500', label: t('viewer.status.revoked') }
    }
    if (status.isExpired) {
      return { icon: Clock, color: 'text-orange-500', label: t('viewer.status.expired') }
    }
    if (!status.ipfsAccessible) {
      return { icon: AlertTriangle, color: 'text-yellow-500', label: t('viewer.status.inaccessible') }
    }
    if (status.isVerified) {
      return { icon: CheckCircle2, color: 'text-green-500', label: t('viewer.status.verified') }
    }
    return { icon: Shield, color: 'text-blue-500', label: t('viewer.status.unverified') }
  }

  // 加载凭证验证信息
  const loadCredentialVerification = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiService.get(`/credentials/${credentialHash}/verify`)
      
      if (response.success) {
        setVerification(response.data)
      } else {
        setError(response.error || t('viewer.loadError'))
      }
    } catch (error) {
      console.error('加载凭证验证信息失败:', error)
      setError(t('viewer.networkError'))
    } finally {
      setLoading(false)
    }
  }

  // 重新验证凭证
  const reverifyCredential = async () => {
    setVerifying(true)
    try {
      await loadCredentialVerification()
      toast({
        title: t('viewer.reverifySuccess'),
        description: t('viewer.reverifySuccessDesc'),
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: t('viewer.reverifyError'),
        description: t('viewer.reverifyErrorDesc'),
        variant: 'destructive'
      })
    } finally {
      setVerifying(false)
    }
  }

  // 复制链接
  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: tCommon('success'),
        description: successMessage,
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: t('viewer.copyError'),
        description: t('viewer.copyErrorDesc'),
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    loadCredentialVerification()
  }, [credentialHash])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>{t('viewer.loading')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <h3 className="font-semibold text-red-600">{t('viewer.error')}</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={loadCredentialVerification} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {tCommon('retry')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!verification) {
    return null
  }

  const trustInfo = getTrustInfo(verification.trustScore)
  const statusInfo = getStatusInfo(verification.status)
  const TrustIcon = trustInfo.icon
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-6">
      {/* 标题和状态 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-3">
                <Award className="h-6 w-6 text-primary" />
                {verification.credential?.title || t('viewer.unknownCredential')}
              </CardTitle>
              
              {verification.credential?.description && (
                <p className="text-muted-foreground">
                  {verification.credential.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={reverifyCredential} disabled={verifying}>
                <RefreshCw className={`h-4 w-4 mr-2 ${verifying ? 'animate-spin' : ''}`} />
                {t('viewer.reverify')}
              </Button>
              
              {onClose && (
                <Button variant="ghost" onClick={onClose}>
                  {tCommon('close')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 验证状态 */}
            <div className={`p-4 rounded-lg border-2 ${trustInfo.bgColor}`}>
              <div className="flex items-center gap-3 mb-2">
                <TrustIcon className={`h-6 w-6 ${trustInfo.color}`} />
                <div>
                  <h4 className="font-semibold">{t('viewer.trustScore')}</h4>
                  <p className={`text-2xl font-bold ${trustInfo.color}`}>
                    {verification.trustScore}%
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {trustInfo.label}
              </p>
            </div>
            
            {/* 凭证状态 */}
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-3 mb-2">
                <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
                <div>
                  <h4 className="font-semibold">{t('viewer.credentialStatus')}</h4>
                  <p className={`font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{t('viewer.statusDetails.exists')}:</span>
                  <Badge variant={verification.status.exists ? "default" : "destructive"}>
                    {verification.status.exists ? tCommon('yes') : tCommon('no')}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>{t('viewer.statusDetails.accessible')}:</span>
                  <Badge variant={verification.status.ipfsAccessible ? "default" : "destructive"}>
                    {verification.status.ipfsAccessible ? tCommon('yes') : tCommon('no')}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>{t('viewer.statusDetails.verified')}:</span>
                  <Badge variant={verification.status.isVerified ? "default" : "secondary"}>
                    {verification.status.isVerified ? tCommon('yes') : tCommon('no')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详细信息标签页 */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">{t('viewer.tabs.details')}</TabsTrigger>
          <TabsTrigger value="verification">{t('viewer.tabs.verification')}</TabsTrigger>
          <TabsTrigger value="technical">{t('viewer.tabs.technical')}</TabsTrigger>
          <TabsTrigger value="actions">{t('viewer.tabs.actions')}</TabsTrigger>
        </TabsList>

        {/* 详细信息 */}
        <TabsContent value="details">
          <Card>
            <CardContent className="p-6 space-y-6">
              {verification.credential && (
                <>
                  {/* 基本信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t('viewer.subject')}
                      </h4>
                      <div className="text-sm">
                        <p className="font-medium">{verification.credential.subject.name}</p>
                        <p className="text-muted-foreground">
                          {t('viewer.reputation')}: {verification.credential.subject.reputation}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        {t('viewer.issuer')}
                      </h4>
                      <div className="text-sm">
                        <p className="font-medium">
                          {verification.credential.issuer?.name || t('viewer.platform')}
                        </p>
                        {verification.credential.issuer && (
                          <p className="text-muted-foreground">
                            {verification.credential.issuer.role} - {t('viewer.reputation')}: {verification.credential.issuer.reputation}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t('viewer.issuanceDate')}
                      </h4>
                      <p className="text-sm">
                        {new Date(verification.credential.issuanceDate).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {verification.credential.expirationDate && (
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {t('viewer.expirationDate')}
                        </h4>
                        <p className={`text-sm ${verification.status.isExpired ? 'text-red-500' : ''}`}>
                          {new Date(verification.credential.expirationDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* 标签和技能 */}
                  <div className="space-y-4">
                    {verification.credential.tags.length > 0 && (
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <Tag className="h-4 w-4" />
                          {t('viewer.tags')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {verification.credential.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {verification.credential.skillsProven.length > 0 && (
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <Star className="h-4 w-4" />
                          {t('viewer.skillsProven')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {verification.credential.skillsProven.map((skill, index) => (
                            <Badge key={index} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 模板信息 */}
                  {verification.credential.template && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">{t('viewer.template')}</h4>
                        <div className="text-sm space-y-1">
                          <p><strong>{t('viewer.templateName')}:</strong> {verification.credential.template.name}</p>
                          <p><strong>{t('viewer.templateVersion')}:</strong> {verification.credential.template.version}</p>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 验证记录 */}
        <TabsContent value="verification">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{t('viewer.verificationHistory')}</h4>
                  {verification.statistics && (
                    <div className="text-sm text-muted-foreground">
                      {t('viewer.totalVerifications')}: {verification.statistics.verificationCount}
                    </div>
                  )}
                </div>
                
                {verification.verifications.length > 0 ? (
                  <div className="space-y-3">
                    {verification.verifications.map((verification_record, index) => (
                      <div key={verification_record.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={verification_record.status === 'verified' ? 'default' : 'secondary'}
                            >
                              {t(`verificationStatus.${verification_record.status}`)}
                            </Badge>
                            <span className="text-sm font-medium">
                              {verification_record.verifier.username}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {verification_record.verifier.role}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {verification_record.score && (
                              <span className="font-medium">{verification_record.score}%</span>
                            )}
                            <span>{new Date(verification_record.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {verification_record.comments && (
                          <p className="text-sm text-muted-foreground">
                            {verification_record.comments}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Shield className="h-8 w-8 mx-auto mb-2" />
                    <p>{t('viewer.noVerifications')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 技术信息 */}
        <TabsContent value="technical">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    IPFS {t('viewer.hash')}
                  </h4>
                  <div className="p-2 bg-muted rounded font-mono text-xs break-all">
                    {verification.hash}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-1"
                    onClick={() => copyToClipboard(verification.hash, t('viewer.hashCopied'))}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {t('viewer.copyHash')}
                  </Button>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">{t('viewer.verificationMethod')}</h4>
                  <p>{verification.verificationMethod}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">{t('viewer.verifiedAt')}</h4>
                  <p>{new Date(verification.verifiedAt).toLocaleString()}</p>
                </div>
                
                {verification.statistics && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('viewer.statistics')}</h4>
                    <div className="space-y-1">
                      <p>{t('viewer.viewCount')}: {verification.statistics.viewCount}</p>
                      <p>{t('viewer.verificationCount')}: {verification.statistics.verificationCount}</p>
                      {verification.statistics.averageVerificationScore && (
                        <p>
                          {t('viewer.averageScore')}: {verification.statistics.averageVerificationScore.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {verification.ipfsData && (
                <div>
                  <h4 className="font-semibold mb-2">{t('viewer.rawData')}</h4>
                  <pre className="p-3 bg-muted rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(verification.ipfsData, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 操作 */}
        <TabsContent value="actions">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h4 className="font-semibold">{t('viewer.availableActions')}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-4"
                    onClick={() => copyToClipboard(verification.shareableLink, t('viewer.linkCopied'))}
                  >
                    <div className="text-center">
                      <Copy className="h-6 w-6 mx-auto mb-2" />
                      <div>
                        <p className="font-medium">{t('viewer.copyShareableLink')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('viewer.copyShareableLinkDesc')}
                        </p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4"
                    asChild
                  >
                    <a href={verification.shareableLink} target="_blank" rel="noopener noreferrer">
                      <div className="text-center">
                        <ExternalLink className="h-6 w-6 mx-auto mb-2" />
                        <div>
                          <p className="font-medium">{t('viewer.openInNewTab')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('viewer.openInNewTabDesc')}
                          </p>
                        </div>
                      </div>
                    </a>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4"
                    onClick={() => window.print()}
                  >
                    <div className="text-center">
                      <FileText className="h-6 w-6 mx-auto mb-2" />
                      <div>
                        <p className="font-medium">{t('viewer.printCredential')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('viewer.printCredentialDesc')}
                        </p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4"
                    onClick={() => copyToClipboard(`https://gateway.pinata.cloud/ipfs/${verification.hash}`, t('viewer.ipfsLinkCopied'))}
                  >
                    <div className="text-center">
                      <Globe className="h-6 w-6 mx-auto mb-2" />
                      <div>
                        <p className="font-medium">{t('viewer.copyIPFSLink')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('viewer.copyIPFSLinkDesc')}
                        </p>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
