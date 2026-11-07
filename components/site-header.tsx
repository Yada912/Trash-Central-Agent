'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/dashboard', label: 'Dasbor' },
  { href: '/schedule', label: 'Jadwal' },
  { href: '/planner', label: 'Perencana' },
  { href: '/report', label: 'Lapor' },
]

export function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="site-header px-4 pt-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 rounded-lg bg-ink px-4 py-3 text-white md:flex-row md:items-center md:justify-between">
        <Link href="/" className="text-sm font-semibold tracking-wide text-white no-underline">
          AGEN SAMPAH TERPUSAT
        </Link>
        <nav aria-label="Navigasi utama">
          <ul className="flex flex-wrap gap-4">
            {LINKS.map((link) => {
              const current = pathname === link.href
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? 'page' : undefined}
                    className={
                      current
                        ? 'border-b-2 border-gold pb-0.5 font-semibold text-white'
                        : 'text-white'
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <label className="flex items-center gap-2 text-xs font-semibold tracking-wide text-white">
          Peran demo (bukan login)
          <select
            aria-label="Peran demo (bukan login)"
            defaultValue="resident"
            className="rounded-md bg-white px-2 py-1 text-xs text-ink"
          >
            <option value="resident">Warga</option>
            <option value="officer">Petugas</option>
          </select>
        </label>
      </div>
    </header>
  )
}
