import type { Metadata } from 'next'
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './globals.css'
import { AccountProvider } from '@/components/account/use-account'
import { ModeBadge } from '@/components/mode-badge'
import { SiteHeader } from '@/components/site-header'

export const metadata: Metadata = {
  title: 'Central Trash Agent — Pengelolaan & Penjemputan Sampah Kota Denpasar',
  description:
    'Platform terpadu pelaporan kondisi sampah warga, profil timbulan rumah tangga/usaha, jadwal armada kecamatan, dan perencanaan rute pengangkutan Kota Denpasar.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased pb-20 md:pb-8">
        <AccountProvider>
          <a href="#main" className="skip-link">
            Lewati ke konten utama
          </a>
          <div className="mx-auto max-w-6xl px-4 pt-2">
            <ModeBadge />
          </div>
          <SiteHeader />
          <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
        </AccountProvider>
      </body>
    </html>
  )
}
