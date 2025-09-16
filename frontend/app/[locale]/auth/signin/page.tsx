'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, ArrowLeft } from 'lucide-react'
import { useWeb3Auth } from '@/hooks/use-web3-auth'
import { ConnectWalletDialog } from '@/components/auth/connect-wallet-dialog'

export default function ConnectWalletPage() {
  const [walletDialogOpen, setWalletDialogOpen] = useState(false)
  const { connectWallet, connecting, user } = useWeb3Auth()
  const router = useRouter()
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')

  // If user is already connected, redirect to home
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const handleWalletConnect = () => {
    setWalletDialogOpen(true)
  }

  const handleWalletConnectSuccess = async (address: string, chainId: number) => {
    console.log('Wallet connected successfully:', { address, chainId })
    setWalletDialogOpen(false)
    // Redirect to home after successful connection
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back to home link */}
        <div className="text-left">
          <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {tCommon('backToHome')}
          </Link>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Wallet className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">{t('wallet.connect')}</CardTitle>
            <CardDescription>
              {t('wallet.loginWithWeb3')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleWalletConnect}
              disabled={connecting}
              className="w-full"
              size="lg"
            >
              {connecting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {tCommon('connecting')}
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  {t('wallet.connectMetaMask')}
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>{t('wallet.noWallet')}</p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {t('wallet.installMetaMask')} →
              </a>
            </div>

            <div className="text-center text-xs text-muted-foreground mt-6">
              <p>{t('wallet.byConnecting')}</p>
              <div className="space-x-2">
                <Link href="/terms" className="hover:underline">{tCommon('terms')}</Link>
                <span>{tCommon('and')}</span>
                <Link href="/privacy" className="hover:underline">{tCommon('privacy')}</Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet connection dialog */}
      <ConnectWalletDialog
        open={walletDialogOpen}
        onOpenChange={setWalletDialogOpen}
        onConnect={handleWalletConnectSuccess}
      />
    </div>
  )
}