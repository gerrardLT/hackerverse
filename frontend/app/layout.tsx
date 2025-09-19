import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { AuthProvider } from '@/hooks/use-auth'
import { Web3AuthProvider } from '@/hooks/use-web3-auth'
import { NetworkStatus } from '@/components/web3/network-status'
import { NotificationProvider } from '@/components/providers/notification-provider'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HackX - Blockchain Hackathon Platform',
  description: 'The ultimate platform for blockchain hackathons, connecting developers, innovators, and the future of Web3.',
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <Web3AuthProvider>
                <NotificationProvider>
                  <Header />
                  <NetworkStatus className="container mt-4" />
                  <main className="flex-1">
                    {children}
                  </main>
                  <Footer />
                  <Toaster />
                </NotificationProvider>
              </Web3AuthProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
