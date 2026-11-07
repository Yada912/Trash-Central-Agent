import type { Metadata } from 'next'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import { ModeBadge } from '@/components/mode-badge'
import { SiteHeader } from '@/components/site-header'
import './globals.css'

export const metadata: Metadata = {
  title: 'Central Trash Agent',
  description: 'Report a waste pile in Denpasar, review the classification, and plan a pickup with a person in the loop.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-6">{children}</div>
        <footer className="border-t border-ink/10 px-4 py-6 text-sm text-ink">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <p>Demo product for Bali DigiFest 2026. Routes are simulated. Nothing is sent to DLH.</p>
            <ModeBadge />
          </div>
        </footer>
      </body>
    </html>
  )
}
