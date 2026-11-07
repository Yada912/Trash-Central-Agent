'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/report', label: 'Report' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/planner', label: 'Planner' },
]

export function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="border-b border-ink/10 border-t-4 border-t-gold bg-card">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="text-lg font-semibold text-ink no-underline">
          Central Trash Agent
        </Link>
        <nav aria-label="Primary">
          <ul className="flex flex-wrap gap-2">
            {LINKS.map((link) => {
              const current = pathname === link.href
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? 'page' : undefined}
                    className={current ? 'font-semibold text-primary' : 'text-ink'}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}
