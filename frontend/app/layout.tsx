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
import { IPFSConfigProvider } from '@/components/providers/ipfs-config-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HackX - Blockchain Hackathon Platform',
  description: 'The ultimate platform for blockchain hackathons, connecting developers, innovators, and the future of Web3.',
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Web3AuthProvider>
              <IPFSConfigProvider>
                <Header />
                <NetworkStatus className="mx-4 mt-4" />
                <main>
                  {children}
                </main>
                <Footer />
                <Toaster />
              </IPFSConfigProvider>
            </Web3AuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
