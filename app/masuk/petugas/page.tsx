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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    const authed = await login(email.trim(), password)
    setBusy(false)

    if (!authed) {
      setError('Otentikasi gagal. Pastikan email petugas dan kata sandi Anda terdaftar di sistem.')
      return
    }

    if (authed.role !== 'petugas') {
      setError('Akun ini terdaftar sebagai Warga, bukan Petugas Operasional. Silakan masuk melalui halaman login Warga.')
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
            Portal Petugas Armada Denpasar
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
            Halaman otentikasi khusus pengemudi armada, operator cikar swakelola TPS3R, dan koordinator pengangkutan sampah Kota Denpasar.
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
              Email Akun Petugas
            </Label>
            <Input
              id="petugas-input-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh: nama.petugas@armada.id"
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
          </div>
        </form>

        {/* Dewan Juri / Evaluator Reference Box for Petugas */}
        <div className="rounded-xl border-2 border-dashed border-ink bg-lavender/40 p-4 text-xs grid gap-2.5 shadow-[2px_2px_0_#1F2933]">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink text-white font-black text-xs shrink-0">
              <MaterialIcon name="badge" size="sm" />
            </span>
            <div>
              <span className="font-black text-sm text-ink block">
                Akun Sampel Petugas DLHK (Akses Juri &amp; Admin)
              </span>
              <span className="text-[11px] font-bold text-ink/90">
                Contoh Driver Armada Pengangkutan Denpasar Barat
              </span>
            </div>
          </div>
          <p className="font-semibold text-ink leading-relaxed">
            Dewan Juri dapat mengevaluasi antarmuka pengemudi armada DLHK, rute VRP terintegrasi Google Maps, dan pengatur leeway dengan akun dinas contoh:
          </p>
          <div className="rounded-lg border-2 border-ink bg-card p-3 font-mono text-xs flex flex-wrap items-center justify-between gap-2 shadow-[1px_1px_0_#1F2933]">
            <div className="grid gap-0.5">
              <p>Email: <strong className="text-ink">surya.wirawan@dlhk.denpasar.id</strong></p>
              <p>Sandi: <strong className="text-ink">petugas123</strong></p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('surya.wirawan@dlhk.denpasar.id')
                setPassword('petugas123')
              }}
              className="btn-tactile bg-lavender text-ink px-3 py-1.5 rounded-md border-2 border-ink font-sans font-black text-xs flex items-center gap-1 shadow-[1px_1px_0_#1F2933] hover:bg-lavender/80"
            >
              <MaterialIcon name="content_copy" size="sm" />
              <span>Gunakan Akun Petugas</span>
            </button>
          </div>
        </div>

        <div className="rounded-xl border-2 border-ink bg-bg p-3.5 text-xs text-ink font-semibold grid gap-1">
          <p className="font-black flex items-center gap-1 text-ink">
            <MaterialIcon name="shield" size="sm" className="text-primary" />
            Perlindungan Sesi Operasional Armada
          </p>
          <p className="text-ink/90 font-medium">
            Akses portal petugas mencakup penetapan toleransi leeway armada, rute penjemputan VRP, dan data TPS3R kecamatan (simulasi operasional armada untuk wilayah Kota Denpasar).
          </p>
        </div>
      </section>
    </main>
  )
}
