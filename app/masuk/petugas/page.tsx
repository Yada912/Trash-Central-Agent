'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAccount } from '@/components/account/use-account'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MaterialIcon } from '@/components/ui/material-icon'

export default function MasukPetugasPage() {
  const router = useRouter()
  const { login, activeAccount, isSignedIn, logout } = useAccount()
  const [email, setEmail] = useState('surya.wirawan@dlhk.denpasar.id')
  const [password, setPassword] = useState('petugas123')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    const authed = await login(email.trim(), password)
    setBusy(false)

    if (!authed) {
      setError('Otentikasi gagal. Pastikan email kedinasan dan kata sandi Anda terdaftar di sistem DLHK.')
      return
    }

    if (authed.role !== 'petugas') {
      setError('Akun ini terdaftar sebagai Warga, bukan Petugas Operasional. Silakan masuk melalui halaman login Warga.')
      return
    }

    router.push('/petugas')
  }

  async function handleQuickLogin() {
    setEmail('surya.wirawan@dlhk.denpasar.id')
    setPassword('petugas123')
    setError(null)
    setBusy(true)

    const authed = await login('surya.wirawan@dlhk.denpasar.id', 'petugas123')
    setBusy(false)

    if (!authed || authed.role !== 'petugas') {
      setError('Gagal masuk sebagai Petugas Uji.')
      return
    }

    router.push('/petugas')
  }

  return (
    <main id="main" className="grid gap-6 max-w-xl mx-auto" data-testid="masuk-petugas-page">
      <section className="vector-card bg-card p-6 grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
          <span className="vector-pill bg-lavender text-ink font-extrabold flex items-center gap-1.5">
            <MaterialIcon name="badge" size="sm" />
            Portal Petugas DLHK Kota Denpasar
          </span>
          <Link
            href="/masuk"
            className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1"
          >
            <MaterialIcon name="arrow_back" size="sm" />
            <span>Kembali ke Masuk Warga</span>
          </Link>
        </div>

        <div className="grid gap-1.5">
          <h1 className="text-2xl font-black text-ink">
            Masuk sebagai Petugas Operasional
          </h1>
          <p className="text-sm text-ink/80 leading-relaxed">
            Halaman otentikasi khusus pengemudi armada, operator cikar swakelola TPS3R, dan koordinator pengangkutan DLHK Kota Denpasar.
          </p>
        </div>

        {isSignedIn && activeAccount ? (
          <div className="rounded-xl border-2 border-ink bg-sky/30 p-3 text-xs font-bold text-ink flex items-center justify-between gap-2">
            <span>
              Sedang masuk sebagai: <strong>{activeAccount.name}</strong> ({activeAccount.role === 'petugas' ? 'Petugas' : 'Warga'})
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-ink bg-coral px-2.5 py-1 text-ink text-[11px] font-black hover:bg-coral/80"
            >
              Keluar Sesi
            </button>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="vector-card bg-coral p-3 text-xs font-black text-alert flex items-center gap-2"
          >
            <MaterialIcon name="error" size="sm" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleLogin} className="grid gap-3.5">
          <div className="grid gap-1">
            <Label htmlFor="petugas-input-email" className="text-xs font-extrabold uppercase text-ink">
              Email Kedinasan Petugas
            </Label>
            <Input
              id="petugas-input-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@dlhk.denpasar.id"
              required
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="petugas-input-password" className="text-xs font-extrabold uppercase text-ink">
              Kata Sandi Petugas
            </Label>
            <Input
              id="petugas-input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="grid gap-2 pt-2">
            <Button
              type="submit"
              disabled={busy}
              className="btn-tactile bg-primary text-white w-full py-2.5 font-extrabold flex items-center justify-center gap-2"
            >
              <MaterialIcon name="verified_user" size="sm" />
              <span>{busy ? 'Memverifikasi…' : 'Masuk ke Portal Petugas'}</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void handleQuickLogin()}
              className="btn-tactile bg-mint text-ink w-full py-2 font-black text-xs flex items-center justify-center gap-1.5"
            >
              <MaterialIcon name="bolt" size="sm" />
              <span>Masuk Cepat: I Wayan Gde Surya Wirawan (Driver Barat)</span>
            </Button>
          </div>
        </form>

        <div className="rounded-xl border border-ink/30 bg-bg p-3 text-xs text-ink/75 grid gap-1">
          <p className="font-bold flex items-center gap-1 text-ink">
            <MaterialIcon name="shield" size="sm" className="text-primary" />
            Perlindungan Data Kedinasan
          </p>
          <p>
            Akses portal petugas mencakup penetapan toleransi leeway armada, rute penjemputan VRP, dan data TPS3R kecamatan sesuai regulasi DLHK Kota Denpasar.
          </p>
        </div>
      </section>
    </main>
  )
}

