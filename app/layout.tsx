import type { Metadata } from 'next'
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './globals.css'
import { AccountProvider } from '@/components/account/use-account'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Central Trash Agent Bali — Pengelolaan & Penjemputan Sampah Cerdas',
  description:
    'Platform terpadu agen cerdas pelaporan sampah warga, profil timbulan rumah tangga/usaha, jadwal armada desentralisasi TPS3R, dan rute VRP di Provinsi Bali.',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased pb-20 md:pb-8">
        <AccountProvider>
          <a href="#main" className="skip-link">
            Lewati ke konten utama
          </a>
          <SiteHeader />
          <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
          <SiteFooter />
        </AccountProvider>
      </body>
    </html>
  )
}
