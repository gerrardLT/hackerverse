'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CredentialViewer } from '@/components/credentials/credential-viewer'
import { 
  Shield,
  ArrowLeft,
  Home
} from 'lucide-react'
import Link from 'next/link'

interface VerifyPageProps {
  params: {
    hash: string
    locale: string
  }
}

export default function VerifyPage({ params }: VerifyPageProps) {
  const t = useTranslations('credentials.verify')
  const tCommon = useTranslations('common')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  {tCommon('backToHome')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                {t('pageTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {t('description')}
                </p>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('verificationProcess.title')}</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      {t('verificationProcess.step1')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      {t('verificationProcess.step2')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      {t('verificationProcess.step3')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      {t('verificationProcess.step4')}
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">{t('securityNote.title')}</h4>
                  <p className="text-sm text-blue-800">
                    {t('securityNote.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credential Verification */}
          <CredentialViewer 
            credentialHash={params.hash}
          />
          
          {/* Additional Information */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">{t('features.decentralized.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('features.decentralized.description')}
                  </p>
                </div>
                
                <div className="text-center">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">{t('features.immutable.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('features.immutable.description')}
                  </p>
                </div>
                
                <div className="text-center">
                  <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">{t('features.transparent.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('features.transparent.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">HackX {t('credentialVerification')}</span>
            </div>
            
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              {t('footerDescription')}
            </p>
            
            <div className="flex items-center justify-center gap-4 text-sm">
              <Link href="/about" className="hover:text-primary transition-colors">
                {tCommon('about')}
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                {tCommon('privacy')}
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors">
                {tCommon('terms')}
              </Link>
              <Link href="/contact" className="hover:text-primary transition-colors">
                {tCommon('contact')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
