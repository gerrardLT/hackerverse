'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, ArrowLeft, UserPlus } from 'lucide-react'
import { useWeb3Auth } from '@/hooks/use-web3-auth'
import { ConnectWalletDialog } from '@/components/auth/connect-wallet-dialog'

export default function WalletSignupPage() {
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
  }, [user?.id, router]) // Only depend on user.id to avoid re-renders

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
              <div className="p-4 bg-green-100 rounded-full">
                <UserPlus className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">{t('signup.createAccount')}</CardTitle>
            <CardDescription>
              {t('signup.connectToCreate')}
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
                  {t('wallet.connectToSignup')}
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>{t('signup.alreadyHaveAccount')}</p>
              <Link href="/auth/signin" className="text-blue-600 hover:underline">
                {t('signup.directConnect')} →
              </Link>
            </div>

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

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm text-blue-900 mb-2">{t('signup.whyWallet')}</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• {t('signup.benefit1')}</li>
                <li>• {t('signup.benefit2')}</li>
                <li>• {t('signup.benefit3')}</li>
                <li>• {t('signup.benefit4')}</li>
              </ul>
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