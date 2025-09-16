"use client"

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { useWeb3Auth } from '@/hooks/use-web3-auth'
import { useToast } from '@/hooks/use-toast'
import { User, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

interface UserRegistrationProps {
  onSuccess?: () => void
  className?: string
}

export function UserRegistration({ onSuccess, className }: UserRegistrationProps) {
  const { user, registerUser, loading } = useWeb3Auth()
  const { toast } = useToast()
  const [username, setUsername] = useState('')
  const t = useTranslations('ui.userRegistration')
  const tCommon = useTranslations('common')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: tCommon('error'),
        description: t('connectWalletFirst'),
        variant: "destructive"
      })
      return
    }

    if (!username) {
      toast({
        title: tCommon('error'),
        description: t('enterUsername'),
        variant: "destructive"
      })
      return
    }

    try {
      // 简化的用户资料CID (实际应该上传到IPFS)
      const profileCID = `QmUserProfile${Date.now()}`
      const success = await registerUser(profileCID)
      
      if (success) {
        toast({
        title: t('registrationSuccess'),
        description: t('userRegisteredToBlockchain'),
        })
        onSuccess?.()
      }
    } catch (error) {
      console.error('User registration failed:', error)
      toast({
        title: t('registrationFailed'),
        description: t('tryAgainLater'),
        variant: "destructive"
      })
    }
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{t('title')}</span>
          </CardTitle>
          <CardDescription>
            {t('connectWalletToRegister')}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
            <span>{t('title')}</span>
        </CardTitle>
        <CardDescription>
          {t('registerToDecentralizedPlatform')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t('username')} *</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('enterUsernamePlaceholder')}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {loading ? t('registering') : t('registerUser')}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>{t('walletAddress')}:</strong> {user.address}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>{t('registrationStatus')}:</strong> {user.isRegistered ? t('registered') : t('notRegistered')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 