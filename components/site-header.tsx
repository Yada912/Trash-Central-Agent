'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount } from '@/components/account/use-account'
import { MaterialIcon } from '@/components/ui/material-icon'

type NavItem = {
  href: string
  label: string
  icon: string
}

const WARGA_NAV_ITEMS: NavItem[] = [
  { href: '/warga', label: 'Dasbor Warga', icon: 'home' },
  { href: '/report', label: 'Lapor', icon: 'add_a_photo' },
  { href: '/schedule', label: 'Jadwal', icon: 'calendar_month' },
  { href: '/akun', label: 'Profil & Akun', icon: 'account_circle' },
]

const PETUGAS_NAV_ITEMS: NavItem[] = [
  { href: '/petugas', label: 'Pusat Petugas', icon: 'badge' },
  { href: '/dashboard', label: 'Dasbor', icon: 'space_dashboard' },
  { href: '/planner', label: 'Perencana', icon: 'route' },
  { href: '/schedule', label: 'Jadwal', icon: 'calendar_month' },
  { href: '/akun', label: 'Akun', icon: 'account_circle' },
]

const GUEST_NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Beranda & Uji Coba', icon: 'public' },
  { href: '/schedule', label: 'Jadwal Kota', icon: 'calendar_month' },
  { href: '/masuk', label: 'Masuk / Daftar', icon: 'login' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { activeAccount, accounts, isSignedIn, switchAccount } = useAccount()

  const navItems: NavItem[] = !isSignedIn || !activeAccount
    ? GUEST_NAV_ITEMS
    : activeAccount.role === 'petugas'
      ? PETUGAS_NAV_ITEMS
      : WARGA_NAV_ITEMS

  return (
    <>
      <header className="site-header sticky top-0 z-40 border-b-4 border-ink bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          {/* Brand + Dedicated Logo Placeholder */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex items-center gap-3 rounded-md focus:outline-none"
              aria-label="Central Trash Agent Beranda"
            >
              <div
                data-testid="brand-logo-slot"
                title="Ruang Logo (Siap diganti dengan aset logo resmi)"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-white bg-primary text-white font-extrabold text-[11px] tracking-tighter tilt-left group-hover:rotate-0 transition-transform"
              >
                <span className="flex flex-col items-center leading-none">
                  <MaterialIcon name="recycling" size="sm" />
                  <span className="mt-0.5 text-[9px]">LOGO</span>
                </span>
              </div>
              <div>
                <span className="block text-lg font-extrabold tracking-tight text-white">
                  Central Trash Agent
                </span>
                <span className="block text-xs font-medium text-white/75">
                  Warga & Armada DLHK Kota Denpasar
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation (Strictly Scoped to Active Actor Role) */}
          <nav aria-label="Utama" className="hidden md:flex flex-wrap items-center gap-2 text-sm">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? 'inline-flex items-center gap-1.5 rounded-md border-2 border-white bg-primary px-3 py-1.5 font-extrabold text-white'
                      : 'inline-flex items-center gap-1.5 rounded-md border-2 border-white/25 bg-white/10 px-3 py-1.5 font-bold text-white hover:bg-white/20'
                  }
                >
                  <MaterialIcon name={item.icon} size="sm" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Active Account Quick Switcher & Sign In Button */}
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="account-Role-switcher" className="sr-only">
              Pilih Akun Aktif
            </label>
            <div className="flex items-center gap-1.5 rounded-md border-2 border-white/40 bg-white/10 px-2.5 py-1.5">
              <MaterialIcon
                name={activeAccount?.role === 'petugas' ? 'badge' : 'person'}
                size="sm"
                className="text-gold"
              />
              <select
                id="account-Role-switcher"
                aria-label="Peran demo"
                value={isSignedIn && activeAccount ? activeAccount.id : ''}
                onChange={(event) => {
                  if (event.target.value) {
                    void switchAccount(event.target.value)
                  }
                }}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
              >
                {!isSignedIn ? (
                  <option value="" className="text-ink">
                    Tamu (Belum Masuk)
                  </option>
                ) : null}
                {accounts.length === 0 ? (
                  <option value="" className="text-ink">
                    Warga / Petugas
                  </option>
                ) : (
                  accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="text-ink font-semibold">
                      {acc.role === 'petugas' ? 'Petugas' : 'Warga'}: {acc.name} ({acc.kecamatan})
                    </option>
                  ))
                )}
              </select>
            </div>
            <Link
              href="/masuk"
              className="inline-flex items-center gap-1 rounded-md border-2 border-white bg-gold px-2.5 py-1.5 font-extrabold text-ink hover:bg-amber"
            >
              <MaterialIcon name="login" size="sm" />
              <span>{isSignedIn ? 'Akun' : 'Masuk'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Adaptive Mobile Bottom Tab Bar */}
      <nav
        aria-label="Navigasi Seluler"
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t-4 border-ink bg-card px-1 py-1.5 md:hidden"
      >
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? 'flex flex-col items-center justify-center rounded-md bg-primary/15 px-2 py-1 text-[11px] font-extrabold text-primary'
                  : 'flex flex-col items-center justify-center px-2 py-1 text-[11px] font-semibold text-ink/75'
              }
            >
              <MaterialIcon name={item.icon} size="md" />
              <span className="mt-0.5 truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
