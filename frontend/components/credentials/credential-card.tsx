'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Award,
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  User,
  Clock,
  Tag,
  FileText
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CredentialCardProps {
  credential: {
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
  variant?: 'default' | 'compact' | 'detailed'
  showActions?: boolean
  onView?: () => void
  onVerify?: () => void
  onShare?: () => void
}

export function CredentialCard({ 
  credential, 
  variant = 'default',
  showActions = true,
  onView,
  onVerify,
  onShare
}: CredentialCardProps) {
  const t = useTranslations('credentials')
  const tCommon = useTranslations('common')
  const { toast } = useToast()
  
  const [copied, setCopied] = useState(false)

  // 获取凭证状态
  const isExpired = credential.expiryDate ? new Date(credential.expiryDate) < new Date() : false
  const isValid = credential.isVerified && !credential.isRevoked && !isExpired

  // 获取信任度等级
  const getTrustLevel = (score: number) => {
    if (score >= 90) return { level: 'high', color: 'green', icon: ShieldCheck }
    if (score >= 70) return { level: 'medium', color: 'yellow', icon: Shield }
    if (score >= 50) return { level: 'low', color: 'orange', icon: ShieldAlert }
    return { level: 'none', color: 'red', icon: ShieldAlert }
  }

  const trustInfo = getTrustLevel(credential.verificationScore)
  const TrustIcon = trustInfo.icon

  // 获取分类徽章样式
  const getCategoryStyle = (category: string) => {
    const styles = {
      achievement: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      certification: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      external: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      skill: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    }
    return styles[category as keyof typeof styles] || styles.external
  }

  // 复制链接
  const handleCopyLink = async () => {
    if (!credential.shareableLink) return
    
    try {
      await navigator.clipboard.writeText(credential.shareableLink)
      setCopied(true)
      toast({
        title: t('card.linkCopied'),
        description: t('card.linkCopiedDesc'),
        variant: 'default'
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: t('card.copyFailed'),
        description: t('card.copyFailedDesc'),
        variant: 'destructive'
      })
    }
  }

  // 紧凑版本
  if (variant === 'compact') {
    return (
      <Card className="w-full transition-all hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium truncate">{credential.title}</h4>
                {isValid && <Check className="h-4 w-4 text-green-500" />}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate">{credential.issuer?.username || t('card.platform')}</span>
                <Badge variant="outline" className={getCategoryStyle(credential.category)}>
                  {t(`categories.${credential.category}`)}
                </Badge>
              </div>
            </div>
            
            {showActions && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onView}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 详细版本
  return (
    <Card className={`w-full transition-all hover:shadow-md ${!isValid ? 'opacity-75' : ''}`}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle className="truncate">{credential.title}</CardTitle>
              <div className="flex items-center gap-1">
                <TrustIcon className={`h-4 w-4 text-${trustInfo.color}-500`} />
                <span className="text-sm font-medium">{credential.verificationScore}%</span>
              </div>
            </div>
            
            {credential.description && (
              <CardDescription className="line-clamp-2">
                {credential.description}
              </CardDescription>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge variant={isValid ? "default" : "destructive"}>
              {isValid ? t('status.valid') : 
               isExpired ? t('status.expired') :
               credential.isRevoked ? t('status.revoked') : 
               t('status.unverified')}
            </Badge>
            
            <Badge variant="outline" className={getCategoryStyle(credential.category)}>
              {t(`categories.${credential.category}`)}
            </Badge>
          </div>
        </div>

        {/* 标签和技能 */}
        <div className="space-y-2">
          {credential.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {credential.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {credential.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{credential.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          {credential.skillsProven.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Star className="h-3 w-3 text-muted-foreground" />
              {credential.skillsProven.slice(0, 2).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {credential.skillsProven.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{credential.skillsProven.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 颁发者和时间信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground">{t('card.issuer')}: </span>
              <span className="font-medium">
                {credential.issuer?.username || t('card.platform')}
              </span>
              {credential.issuer?.role && (
                <Badge variant="outline" className="ml-1 text-xs">
                  {credential.issuer.role}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground">{t('card.issued')}: </span>
              <span>{new Date(credential.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          {credential.expiryDate && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">{t('card.expires')}: </span>
                <span className={isExpired ? 'text-red-500' : ''}>
                  {new Date(credential.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground">{t('card.views')}: </span>
              <span>{credential.viewCount}</span>
            </div>
          </div>
        </div>

        {/* 验证记录 */}
        {credential.verifications && credential.verifications.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium">{t('card.verifications')}</h5>
            <div className="space-y-1">
              {credential.verifications.slice(0, 2).map((verification, index) => (
                <div key={verification.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={verification.status === 'verified' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {t(`verificationStatus.${verification.status}`)}
                    </Badge>
                    <span className="text-muted-foreground">
                      {verification.verifier.username}
                    </span>
                  </div>
                  {verification.score && (
                    <span className="font-medium">{verification.score}%</span>
                  )}
                </div>
              ))}
              {credential.verifications.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{credential.verifications.length - 2} {t('card.moreVerifications')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onView}>
              <FileText className="h-4 w-4 mr-1" />
              {t('card.viewDetails')}
            </Button>
            
            {credential.shareableLink && (
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? t('card.copied') : t('card.copyLink')}
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={onVerify}>
              <ExternalLink className="h-4 w-4 mr-1" />
              {t('card.verify')}
            </Button>
            
            {credential.shareableLink && (
              <Button variant="outline" size="sm" asChild>
                <a href={credential.shareableLink} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-1" />
                  {t('card.download')}
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
