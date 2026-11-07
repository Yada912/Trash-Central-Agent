import type { Metadata } from 'next'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import { ModeBadge } from '@/components/mode-badge'
import { SiteHeader } from '@/components/site-header'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agen Sampah Terpusat — Denpasar',
  description:
    'Laporkan tumpukan sampah di Denpasar, tinjau klasifikasi AI, dan rencanakan rute pengangkutan dengan manusia dalam kendali.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <a className="skip-link" href="#main">
          Lewati ke konten utama
        </a>
        <SiteHeader />
        <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-6">{children}</div>
        <footer className="border-t border-ink/10 px-4 py-6 text-sm text-ink">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <p>
              Produk demonstrasi untuk Bali DigiFest 2026. Rute bersifat simulasi dan tidak dikirim otomatis ke DLH.
            </p>
            <ModeBadge />
          </div>
        </footer>
      </body>
    </html>
  )
}
