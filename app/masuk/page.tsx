'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAccount } from '@/components/account/use-account'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Select } from '@/components/ui/select'
import { KECAMATAN, type AccountType, type Kecamatan } from '@/lib/schemas'

export default function MasukPage() {
  const router = useRouter()
  const { activeAccount, isSignedIn, login, logout, createNewAccount } = useAccount()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Login state
  const [loginEmail, setLoginEmail] = useState('made.adi@warga.denpasar.id')
  const [loginPassword, setLoginPassword] = useState('warga123')

  // Register state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regBirthDate, setRegBirthDate] = useState('1998-07-15')
  const [regBanjarName, setRegBanjarName] = useState('')
  const [regKecamatan, setRegKecamatan] = useState<Kecamatan>('Denpasar Barat')
  const [regDesa, setRegDesa] = useState('Padangsambian')
  const [regAddress, setRegAddress] = useState('')
  const [regAccountType, setRegAccountType] = useState<AccountType>('household')

  async function handleLoginSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    const acc = await login(loginEmail.trim(), loginPassword)
    setBusy(false)
    if (!acc) {
      setError('Gagal masuk. Periksa kembali email dan kata sandi Anda.')
      return
    }
    router.push(acc.role === 'petugas' ? '/petugas' : '/warga')
  }

  async function handleQuickLogin(email: string, pass: string) {
    setLoginEmail(email)
    setLoginPassword(pass)
    setError(null)
    setBusy(true)
    const acc = await login(email, pass)
    setBusy(false)
    if (!acc) {
      setError('Gagal masuk.')
      return
    }
    router.push(acc.role === 'petugas' ? '/petugas' : '/warga')
  }

  async function handleRegisterSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Nama lengkap, email, dan kata sandi wajib diisi.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const created = await createNewAccount({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: 'warga', // Selalu terdaftar sebagai akun Warga terlebih dahulu
        kecamatan: regKecamatan,
        desa: regDesa.trim() || 'Pemecutan',
        banjarName: regBanjarName.trim() || `Banjar Lingkungan ${regDesa.trim() || 'Pemecutan'}`,
        birthDate: regBirthDate.trim() || undefined,
        address: regAddress.trim() || `Wilayah ${regKecamatan}`,
        accountType: regAccountType,
      })
      setBusy(false)
      if (!created) {
        setError('Gagal mendaftarkan akun baru.')
        return
      }
      router.push('/warga')
    } catch {
      setBusy(false)
      setError('Gagal mendaftarkan akun baru. Silakan coba lagi.')
    }
  }

  return (
    <main id="main" className="grid gap-6 max-w-4xl mx-auto">
      <section className="vector-card bg-card p-6 grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="vector-pill bg-mint text-ink tilt-left">
            <MaterialIcon name="lock_open" size="sm" />
            Otentikasi Peran Terpisah
          </span>
          {isSignedIn && activeAccount ? (
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
              <span className="vector-pill bg-amber text-ink">
                Sedang Masuk: {activeAccount.name} ({activeAccount.role === 'petugas' ? 'Petugas' : 'Warga'})
              </span>
              <Link
                href={activeAccount.role === 'petugas' ? '/petugas' : '/warga'}
                className="vector-btn rounded-md border-2 border-ink bg-primary px-3 py-1 text-white"
              >
                Buka Portal Saya
              </Link>
              <button
                type="button"
                onClick={logout}
                className="vector-btn rounded-md border-2 border-ink bg-coral px-3 py-1 text-ink"
              >
                Keluar
              </button>
            </div>
          ) : null}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Masuk ke Akun Warga
        </h1>
        <p className="text-base font-medium text-ink/85">
          Kelola ritme pemilahan sampah berbasis sumber di lingkungan rumah tangga atau usaha Anda sesuai <strong>Pergub Bali No. 47 Tahun 2019</strong>.
        </p>
        <div className="rounded-xl border-2 border-ink bg-sky/25 p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MaterialIcon name="badge" size="sm" className="text-primary shrink-0" />
            <span className="text-xs font-bold text-ink">
              Apakah Anda petugas armada kebersihan DLHK atau TPS3R?
            </span>
          </div>
          <Link
            href="/masuk/petugas"
            className="btn-tactile bg-sky text-ink px-3.5 py-1.5 text-xs font-black inline-flex items-center gap-1.5 border-2 border-ink shadow-[2px_2px_0_#1F2933]"
          >
            <MaterialIcon name="lock_person" size="sm" />
            <span>Masuk sebagai Petugas</span>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant={tab === 'login' ? 'primary' : 'secondary'}
            onClick={() => {
              setTab('login')
              setError(null)
            }}
          >
            <MaterialIcon name="login" size="sm" />
            Masuk ke Akun
          </Button>
          <Button
            variant={tab === 'register' ? 'primary' : 'secondary'}
            onClick={() => {
              setTab('register')
              setError(null)
            }}
          >
            <MaterialIcon name="person_add" size="sm" />
            Daftar Akun Baru
          </Button>
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          data-testid="auth-error"
          className="vector-card bg-coral px-4 py-3 text-sm font-extrabold text-alert flex items-center gap-2"
        >
          <MaterialIcon name="error" size="sm" />
          <span>{error}</span>
        </div>
      ) : null}

      {tab === 'login' ? (
        <div className="grid gap-6 md:grid-cols-[1.15fr_1fr]">
          <form onSubmit={handleLoginSubmit} className="vector-card bg-card p-6 grid gap-4">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <MaterialIcon name="passkey" className="text-primary" />
              Masuk dengan Email & Kata Sandi
            </h2>
            <div className="grid gap-1.5">
              <Label htmlFor="login-email">Alamat Email</Label>
              <Input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="login-password">Kata Sandi</Label>
              <Input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={busy}>
              <MaterialIcon name="login" size="sm" />
              {busy ? 'Memverifikasi…' : 'Masuk Sekarang'}
            </Button>
          </form>

          {/* 1-Click Quick Login Cards for Warga */}
          <aside className="vector-card bg-sky/30 p-6 grid content-start gap-3">
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <MaterialIcon name="bolt" className="text-primary" />
              Akses Cepat Akun Warga
            </h2>
            <p className="text-xs font-medium text-ink/80">
              Pilih profil Warga di bawah untuk langsung mencoba dasbor jadwal & pemilahan:
            </p>
            <div className="grid gap-2.5">
              <button
                type="button"
                data-testid="quick-login-warga"
                onClick={() => void handleQuickLogin('made.adi@warga.denpasar.id', 'warga123')}
                className="vector-card-soft bg-card hover:bg-mint/40 p-3 text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="vector-pill bg-mint text-ink text-[11px]">
                    <MaterialIcon name="home" size="sm" />
                    Warga Rumah Tangga
                  </span>
                  <span className="text-xs font-extrabold text-primary">Masuk →</span>
                </div>
                <p className="mt-1 font-extrabold text-sm">I Made Adi Wijaya</p>
                <p className="text-xs text-ink/75">Denpasar Barat · Banjar Pekambingan</p>
              </button>

              <button
                type="button"
                data-testid="quick-login-umkm"
                onClick={() => void handleQuickLogin('putu.sari@umkm.denpasar.id', 'warga123')}
                className="vector-card-soft bg-card hover:bg-mint/40 p-3 text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="vector-pill bg-amber text-ink text-[11px]">
                    <MaterialIcon name="storefront" size="sm" />
                    Warga Pelaku UMKM / Warung
                  </span>
                  <span className="text-xs font-extrabold text-primary">Masuk →</span>
                </div>
                <p className="mt-1 font-extrabold text-sm">Ni Luh Putu Sari (Warung Sari)</p>
                <p className="text-xs text-ink/75">Denpasar Selatan · Sanur</p>
              </button>
            </div>
          </aside>
        </div>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="vector-card bg-card p-6 grid gap-4">
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <MaterialIcon name="person_add" className="text-primary" />
            Formulir Pendaftaran Akun Baru
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1">
              <Label htmlFor="reg-name">Nama Lengkap</Label>
              <Input
                id="reg-name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Contoh: I Wayan Dharma"
                required
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="wayan@warga.denpasar.id"
                required
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="reg-password">Kata Sandi</Label>
              <Input
                id="reg-password"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1">
              <Label htmlFor="reg-birthdate">Tanggal Lahir (Untuk Kalender Pawukon / Otonan)</Label>
              <Input
                id="reg-birthdate"
                type="date"
                value={regBirthDate}
                onChange={(e) => setRegBirthDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="reg-kecamatan">Kecamatan</Label>
              <Select
                id="reg-kecamatan"
                value={regKecamatan}
                onChange={(e) => setRegKecamatan(e.target.value as Kecamatan)}
              >
                {KECAMATAN.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="reg-desa">Desa / Kelurahan</Label>
              <Input
                id="reg-desa"
                value={regDesa}
                onChange={(e) => setRegDesa(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1">
              <Label htmlFor="reg-banjar">Nama Banjar / Lingkungan</Label>
              <Input
                id="reg-banjar"
                value={regBanjarName}
                onChange={(e) => setRegBanjarName(e.target.value)}
                placeholder="Contoh: Banjar Pekambingan"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="reg-address">Alamat Lengkap Rumah / Usaha</Label>
              <Input
                id="reg-address"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                placeholder="Jl. Hasanuddin Gang IV No. 12"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="reg-account-type">Kategori Sumber Sampah</Label>
              <Select
                id="reg-account-type"
                value={regAccountType}
                onChange={(e) => setRegAccountType(e.target.value as AccountType)}
              >
                <option value="household">Rumah Tangga</option>
                <option value="company">Warung / UMKM / Kantor</option>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={busy}>
            <MaterialIcon name="how_to_reg" size="sm" />
            {busy ? 'Mendaftarkan Akun…' : 'Daftar & Buka Portal'}
          </Button>
        </form>
      )}
    </main>
  )
}
