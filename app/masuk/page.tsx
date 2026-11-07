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
import {
  CONTAINER_PRESETS,
  DEFAULT_SELECTED_BALI_EVENTS,
  type ContainerPreset,
} from '@/lib/accounts/store'
import { KECAMATAN, type AccountType, type Kecamatan } from '@/lib/schemas'

export default function MasukPage() {
  const router = useRouter()
  const { activeAccount, isSignedIn, login, logout, createNewAccount } = useAccount()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Login form state (no hardcoded prefill)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Curated Onboarding Questionnaire State (Steps 1 to 4)
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1: Kredensial Akun
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regAccountType, setRegAccountType] = useState<AccountType>('household')

  // Step 2: Lokasi & Banjar di Bali
  const [regKecamatan, setRegKecamatan] = useState<Kecamatan>('Denpasar Barat')
  const [regDesa, setRegDesa] = useState('Pemecutan')
  const [regBanjarName, setRegBanjarName] = useState('')
  const [regAddress, setRegAddress] = useState('')

  // Step 3: Karakteristik Sampah Rumah Tangga
  const [regContainerPreset, setRegContainerPreset] = useState<ContainerPreset>('kantong_15l')
  const [regBagCount, setRegBagCount] = useState<number>(3) // e.g. 3 kantong (45L)
  const [regHouseholdMembers, setRegHouseholdMembers] = useState<number>(4)
  const [regSortingReadiness, setRegSortingReadiness] = useState<'sudah_dipilah' | 'sebagian' | 'belum_dipilah'>('sebagian')

  // Step 4: Tradisi, Otonan & Kalender Rahinan
  const [regBirthDate, setRegBirthDate] = useState('')
  const [regIncludesCeremonies, setRegIncludesCeremonies] = useState<boolean>(true)

  async function handleLoginSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!loginEmail.trim() || !loginPassword) {
      setError('Masukkan alamat email dan kata sandi Anda.')
      return
    }
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

  async function handleFinishOnboarding() {
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError('Nama lengkap, email, dan kata sandi wajib diisi pada langkah 1.')
      setOnboardingStep(1)
      return
    }
    if (regPassword.length < 6) {
      setError('Kata sandi minimal 6 karakter.')
      setOnboardingStep(1)
      return
    }

    setError(null)
    setBusy(true)

    const presetLiters = CONTAINER_PRESETS[regContainerPreset]?.liters ?? 15
    const totalWeeklyLiters = Math.max(15, regBagCount * presetLiters)

    try {
      const created = await createNewAccount({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: 'warga',
        kecamatan: regKecamatan,
        desa: regDesa.trim() || 'Pemecutan',
        banjarName: regBanjarName.trim() || `Banjar Lingkungan ${regDesa.trim() || 'Pemecutan'}`,
        birthDate: regBirthDate.trim() || undefined,
        address: regAddress.trim() || `Wilayah ${regKecamatan}`,
        accountType: regAccountType,
        wasteProfile: {
          currentCondition: 'terkendali',
          conditionNote: `Profil awal onboarding: ${regBagCount} wadah (~${totalWeeklyLiters} L/minggu).`,
          weeklyRegularLiters: totalWeeklyLiters,
          containerPreset: regContainerPreset,
          householdMembers: regHouseholdMembers,
          sortingReadiness: regSortingReadiness,
          selectedBalineseEventIds: regIncludesCeremonies ? DEFAULT_SELECTED_BALI_EVENTS : [],
          compositionPct: {
            organic: regIncludesCeremonies ? 60 : 50,
            plastic: 20,
            paper: 10,
            metal: 0,
            residual: regIncludesCeremonies ? 10 : 20,
            hazardous: 0,
          },
        },
      })

      setBusy(false)
      if (!created) {
        setError('Gagal mendaftarkan akun. Email mungkin sudah terdaftar.')
        return
      }
      router.push('/warga')
    } catch {
      setBusy(false)
      setError('Terjadi kendala saat mendaftarkan akun. Silakan coba lagi.')
    }
  }

  return (
    <main id="main" className="grid gap-6 max-w-3xl mx-auto" data-testid="masuk-page">
      {/* Welcome Card & Role Guidance */}
      <section className="vector-card bg-card p-6 grid gap-4 border-2 border-ink shadow-[4px_4px_0_#1F2933]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="vector-pill bg-mint text-ink font-black text-xs">
            <MaterialIcon name="lock" size="sm" />
            Portal Masuk &amp; Pendaftaran Warga
          </span>
          {isSignedIn && activeAccount ? (
            <div className="flex flex-wrap items-center gap-2 text-xs font-black">
              <span className="rounded-lg border border-ink bg-amber px-2.5 py-1 text-ink">
                Sesi Aktif: {activeAccount.name} ({activeAccount.role === 'petugas' ? 'Petugas' : 'Warga'})
              </span>
              <Link
                href={activeAccount.role === 'petugas' ? '/petugas' : '/warga'}
                className="btn-tactile bg-primary text-white px-3 py-1"
              >
                Buka Portal Saya
              </Link>
              <button
                type="button"
                onClick={logout}
                className="btn-tactile bg-coral text-white px-3 py-1"
              >
                Keluar
              </button>
            </div>
          ) : null}
        </div>

        <div>
          <h1 className="text-3xl font-black text-ink tracking-tight">
            Selamat Datang di Central Trash Agent Bali
          </h1>
          <p className="text-sm font-semibold text-ink/85 mt-1 leading-relaxed">
            Platform agen cerdas pengelolaan persampahan berbasis sumber sesuai <strong>Pergub Bali No. 47 Tahun 2019</strong> &amp; <strong>Perda Denpasar No. 8 Tahun 2023</strong>.
          </p>
        </div>

        {/* Dedicated Petugas Switcher Banner */}
        <div className="rounded-xl border-2 border-ink bg-sky/25 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-[2px_2px_0_#1F2933]">
          <div className="flex items-center gap-2">
            <MaterialIcon name="badge" size="sm" className="text-primary shrink-0" />
            <span className="text-xs font-black text-ink">
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

        {/* Tabs: Masuk vs Daftar Akun */}
        <div className="flex flex-wrap gap-2 pt-1 border-t-2 border-ink/20">
          <Button
            variant={tab === 'login' ? 'primary' : 'secondary'}
            onClick={() => {
              setTab('login')
              setError(null)
            }}
            className="btn-tactile font-black text-xs"
          >
            <MaterialIcon name="login" size="sm" />
            <span>Masuk ke Akun Warga</span>
          </Button>
          <Button
            variant={tab === 'register' ? 'primary' : 'secondary'}
            onClick={() => {
              setTab('register')
              setError(null)
            }}
            className="btn-tactile font-black text-xs"
          >
            <MaterialIcon name="assignment" size="sm" />
            <span>Daftar Akun Baru (Kuesioner Onboarding)</span>
          </Button>
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          data-testid="auth-error"
          className="vector-card bg-coral p-3.5 text-xs font-black text-alert flex items-center gap-2 border-2 border-ink shadow-[3px_3px_0_#1F2933]"
        >
          <MaterialIcon name="error" size="sm" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* TAB 1: FORM LOGIN ASLI (NO SPEED LOGIN) */}
      {tab === 'login' ? (
        <form
          onSubmit={handleLoginSubmit}
          className="vector-card bg-card p-6 grid gap-4 border-2 border-ink shadow-[4px_4px_0_#1F2933]"
        >
          <div className="border-b-2 border-ink/20 pb-3">
            <h2 className="text-xl font-black text-ink flex items-center gap-2">
              <MaterialIcon name="passkey" className="text-primary" />
              <span>Masuk dengan Kredensial Terdaftar</span>
            </h2>
            <p className="text-xs font-semibold text-ink/80 mt-0.5">
              Masukkan alamat email dan kata sandi yang telah Anda daftarkan.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="login-email" className="text-xs font-black uppercase text-ink">
              Alamat Email
            </Label>
            <Input
              id="login-email"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="nama@email.com"
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="login-password" className="text-xs font-black uppercase text-ink">
              Kata Sandi
            </Label>
            <Input
              id="login-password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={busy}
              className="btn-tactile bg-primary text-white w-full py-2.5 font-black text-sm flex items-center justify-center gap-2"
            >
              <MaterialIcon name="login" size="sm" />
              <span>{busy ? 'Memverifikasi…' : 'Masuk ke Dasbor Warga'}</span>
            </Button>
          </div>

          {/* Dewan Juri / Evaluator Reference Box */}
          <div className="rounded-xl border-2 border-dashed border-ink bg-amber/35 p-4 text-xs grid gap-2.5 shadow-[2px_2px_0_#1F2933] mt-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink text-gold font-black text-xs shrink-0">
                <MaterialIcon name="school" size="sm" />
              </span>
              <div>
                <span className="font-black text-sm text-ink block">
                  Akun Sampel Evaluasi Juri &amp; Admin
                </span>
                <span className="text-[11px] font-bold text-ink/90">
                  Contoh Profil Warga Terisi Penuh (Data Historis, Rahinan &amp; Memori AI)
                </span>
              </div>
            </div>
            <p className="font-semibold text-ink leading-relaxed">
              Untuk menguji platform tanpa perlu mengisi data dari awal, Dewan Juri dapat menggunakan akun sampel <strong>I Made Adi Wijaya</strong> (Warga Banjar Pekambingan, Denpasar Barat):
            </p>
            <div className="rounded-lg border-2 border-ink bg-card p-3 font-mono text-xs flex flex-wrap items-center justify-between gap-2 shadow-[1px_1px_0_#1F2933]">
              <div className="grid gap-0.5">
                <p>Email: <strong className="text-ink">made.adi@warga.denpasar.id</strong></p>
                <p>Sandi: <strong className="text-ink">warga123</strong></p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('made.adi@warga.denpasar.id')
                  setLoginPassword('warga123')
                }}
                className="btn-tactile bg-mint text-ink px-3 py-1.5 rounded-md border-2 border-ink font-sans font-black text-xs flex items-center gap-1 shadow-[1px_1px_0_#1F2933] hover:bg-mint/80"
              >
                <MaterialIcon name="content_copy" size="sm" />
                <span>Gunakan Akun Juri</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* TAB 2: CURATED ONBOARDING QUESTIONNAIRE FLOW */
        <section
          aria-labelledby="onboarding-heading"
          className="vector-card bg-card p-6 grid gap-5 border-2 border-ink shadow-[4px_4px_0_#1F2933]"
          data-testid="onboarding-flow"
        >
          {/* Step Progress Bar */}
          <div className="grid gap-2 border-b-2 border-ink/20 pb-3">
            <div className="flex items-center justify-between text-xs font-black text-ink">
              <span id="onboarding-heading" className="text-base font-black flex items-center gap-1.5">
                <MaterialIcon name="quiz" className="text-primary" />
                Kuesioner Onboarding Warga Bali (Langkah {onboardingStep} dari 4)
              </span>
              <span className="rounded-md border border-ink bg-mint px-2 py-0.5">
                {onboardingStep === 1
                  ? 'Identitas'
                  : onboardingStep === 2
                    ? 'Lokasi & Banjar'
                    : onboardingStep === 3
                      ? 'Profil Wadah'
                      : 'Tradisi & Otonan'}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full border border-ink bg-bg">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(onboardingStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* STEP 1: IDENTITAS & KREDENSIAL */}
          {onboardingStep === 1 ? (
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-black text-ink">Langkah 1: Siapa Nama &amp; Kontak Anda?</h3>
                <p className="text-xs font-semibold text-ink/80 mt-0.5">
                  Informasi ini digunakan untuk otentikasi login dan identitas akun Anda di sistem persampahan.
                </p>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="reg-name" className="text-xs font-black uppercase text-ink">
                  Nama Lengkap / Penanggung Jawab Rumah Tangga
                </Label>
                <Input
                  id="reg-name"
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: I Gede Sukadana"
                  required
                />
              </div>

              <div className="grid gap-1">
                <Label htmlFor="reg-email" className="text-xs font-black uppercase text-ink">
                  Alamat Email (Digunakan untuk Masuk)
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="sukadana@warga.denpasar.id"
                  required
                />
              </div>

              <div className="grid gap-1">
                <Label htmlFor="reg-password" className="text-xs font-black uppercase text-ink">
                  Kata Sandi Baru (Minimal 6 Karakter)
                </Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="grid gap-1">
                <Label htmlFor="reg-account-type" className="text-xs font-black uppercase text-ink">
                  Kategori Penghasil Sampah
                </Label>
                <Select
                  id="reg-account-type"
                  value={regAccountType}
                  onChange={(e) => setRegAccountType(e.target.value as AccountType)}
                >
                  <option value="household">Rumah Tangga / Tempat Tinggal Pribadi</option>
                  <option value="company">Badan Usaha / Warung / Toko / UMKM</option>
                </Select>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    if (!regName.trim() || !regEmail.trim() || !regPassword) {
                      setError('Harap lengkapi nama, email, dan kata sandi sebelum lanjut.')
                      return
                    }
                    if (regPassword.length < 6) {
                      setError('Kata sandi harus minimal 6 karakter.')
                      return
                    }
                    setError(null)
                    setOnboardingStep(2)
                  }}
                  className="btn-tactile font-black text-xs flex items-center gap-1.5"
                >
                  <span>Lanjut: Wilayah &amp; Banjar</span>
                  <MaterialIcon name="arrow_forward" size="sm" />
                </Button>
              </div>
            </div>
          ) : null}

          {/* STEP 2: LOKASI & LINGKUNGAN BANJAR */}
          {onboardingStep === 2 ? (
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-black text-ink">Langkah 2: Di Mana Lokasi Rumah atau Usaha Anda?</h3>
                <p className="text-xs font-semibold text-ink/80 mt-0.5">
                  Diperlukan untuk menghubungkan rumah Anda dengan jadwal armada TPS3R swakelola dan Bank Sampah setempat.
                </p>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="reg-kecamatan" className="text-xs font-black uppercase text-ink">
                  Kecamatan di Kota Denpasar
                </Label>
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
                <Label htmlFor="reg-desa" className="text-xs font-black uppercase text-ink">
                  Kelurahan / Desa
                </Label>
                <Input
                  id="reg-desa"
                  type="text"
                  value={regDesa}
                  onChange={(e) => setRegDesa(e.target.value)}
                  placeholder="Contoh: Pemecutan, Sanur Kauh, Ubung..."
                  required
                />
              </div>

              <div className="grid gap-1">
                <Label htmlFor="reg-banjar" className="text-xs font-black uppercase text-ink">
                  Nama Banjar Adat / Lingkungan
                </Label>
                <Input
                  id="reg-banjar"
                  type="text"
                  value={regBanjarName}
                  onChange={(e) => setRegBanjarName(e.target.value)}
                  placeholder="Contoh: Banjar Pekambingan, Banjar Intaran..."
                />
              </div>

              <div className="grid gap-1">
                <Label htmlFor="reg-address" className="text-xs font-black uppercase text-ink">
                  Alamat Jalan / Patokan Rumah
                </Label>
                <Input
                  id="reg-address"
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Contoh: Jl. Hasanuddin No. 12"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOnboardingStep(1)}
                  className="btn-tactile text-xs font-bold"
                >
                  <MaterialIcon name="arrow_back" size="sm" />
                  <span>Kembali</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setOnboardingStep(3)
                  }}
                  className="btn-tactile font-black text-xs flex items-center gap-1.5"
                >
                  <span>Lanjut: Profil Wadah Sampah</span>
                  <MaterialIcon name="arrow_forward" size="sm" />
                </Button>
              </div>
            </div>
          ) : null}

          {/* STEP 3: KARAKTERISTIK WADAH & TIMBULAN MINGGUAN */}
          {onboardingStep === 3 ? (
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-black text-ink">Langkah 3: Bagaimana Situasi Sampah Mingguan Anda?</h3>
                <p className="text-xs font-semibold text-ink/80 mt-0.5">
                  Pilih wadah yang biasa Anda gunakan agar AI dapat memperkirakan kapasitas tanpa perlu menimbang manual.
                </p>
              </div>

              {/* Wadah Presets */}
              <div className="grid gap-2">
                <span className="text-xs font-black uppercase text-ink">Pilih Wadah Utama di Rumah:</span>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {(Object.keys(CONTAINER_PRESETS) as ContainerPreset[]).map((key) => {
                    const preset = CONTAINER_PRESETS[key]
                    const isSelected = regContainerPreset === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setRegContainerPreset(key)}
                        className={`rounded-xl border-2 border-ink p-3 text-left transition-all flex items-start gap-2.5 shadow-[2px_2px_0_#1F2933] ${
                          isSelected ? 'bg-mint/45 border-primary ring-2 ring-primary' : 'bg-card hover:bg-amber/20'
                        }`}
                      >
                        <MaterialIcon name={preset.icon} size="md" className="text-primary mt-0.5" />
                        <div>
                          <p className="font-black text-sm text-ink">{preset.label}</p>
                          <p className="text-xs font-bold text-ink/80">{preset.hint}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Perkiraan Jumlah Wadah per Minggu */}
              <div className="vector-card-soft bg-mint/30 p-4 grid gap-2 border-2 border-ink">
                <div className="flex items-center justify-between text-xs font-black text-ink">
                  <span>Perkiraan Jumlah Wadah per Minggu:</span>
                  <span className="rounded bg-card px-2 py-0.5 border border-ink text-primary text-sm font-black">
                    ~{regBagCount * (CONTAINER_PRESETS[regContainerPreset]?.liters ?? 15)} Liter / minggu
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setRegBagCount(Math.max(1, regBagCount - 1))}
                    className="h-9 w-9 p-0 font-black text-base"
                  >
                    -
                  </Button>
                  <span className="text-lg font-black text-ink px-2">{regBagCount} wadah penuh</span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setRegBagCount(Math.min(30, regBagCount + 1))}
                    className="h-9 w-9 p-0 font-black text-base"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Jumlah Anggota Rumah Tangga */}
              <div className="grid gap-1.5">
                <span className="text-xs font-black uppercase text-ink">
                  Jumlah Anggota Rumah Tangga / Penghuni:
                </span>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setRegHouseholdMembers(Math.max(1, regHouseholdMembers - 1))}
                    className="h-9 w-9 p-0 font-black text-base"
                  >
                    -
                  </Button>
                  <span className="text-lg font-black text-ink px-2">{regHouseholdMembers} Orang</span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setRegHouseholdMembers(Math.min(25, regHouseholdMembers + 1))}
                    className="h-9 w-9 p-0 font-black text-base"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Status Pemilahan Sumber */}
              <div className="grid gap-1.5">
                <span className="text-xs font-black uppercase text-ink">
                  Kebiasaan Pemilahan Sampah Saat Ini:
                </span>
                <div className="grid gap-2 sm:grid-cols-3 text-xs font-bold">
                  {[
                    { id: 'sudah_dipilah', label: '✓ Sudah Memilah Organik & Anorganik' },
                    { id: 'sebagian', label: '⚡ Sebagian (Hanya Botol Plastik)' },
                    { id: 'belum_dipilah', label: '○ Belum Sempat Memilah' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRegSortingReadiness(opt.id as typeof regSortingReadiness)}
                      className={`rounded-lg border-2 border-ink p-2.5 text-center transition-all shadow-[2px_2px_0_#1F2933] ${
                        regSortingReadiness === opt.id
                          ? 'bg-primary text-white font-black'
                          : 'bg-card text-ink hover:bg-amber/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOnboardingStep(2)}
                  className="btn-tactile text-xs font-bold"
                >
                  <MaterialIcon name="arrow_back" size="sm" />
                  <span>Kembali</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setOnboardingStep(4)
                  }}
                  className="btn-tactile font-black text-xs flex items-center gap-1.5"
                >
                  <span>Lanjut: Tradisi &amp; Otonan</span>
                  <MaterialIcon name="arrow_forward" size="sm" />
                </Button>
              </div>
            </div>
          ) : null}

          {/* STEP 4: TRADISI UPACARA, OTONAN & SELESAI */}
          {onboardingStep === 4 ? (
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-black text-ink">Langkah 4: Tradisi, Upacara Adat &amp; Kalender Bali</h3>
                <p className="text-xs font-semibold text-ink/80 mt-0.5">
                  AI akan mengantisipasi lonjakan sampah banten, janur, dan canang sari saat rahinan agar tidak meluber.
                </p>
              </div>

              {/* Tanggal Lahir untuk Pawukon Otonan */}
              <div className="rounded-xl border-2 border-ink bg-lavender/35 p-4 grid gap-2">
                <div className="flex items-center gap-2 font-black text-sm text-ink">
                  <MaterialIcon name="auto_awesome" size="sm" className="text-primary" />
                  <span>Tanggal Lahir (Untuk Perhitungan Siklus Otonan Pawukon 210 Hari):</span>
                </div>
                <Input
                  id="reg-birth-date"
                  type="date"
                  value={regBirthDate}
                  onChange={(e) => setRegBirthDate(e.target.value)}
                  className="font-black bg-card max-w-xs"
                />
                <p className="text-[11px] font-bold text-ink">
                  Opsional. Digunakan semata-mata untuk memprediksi hari otonan keluarga Anda guna penjadwalan sampah organik banten.
                </p>
              </div>

              {/* Ikut Kalender Hari Raya Bali */}
              <label className="rounded-xl border-2 border-ink bg-card p-3.5 flex items-center gap-3 cursor-pointer shadow-[2px_2px_0_#1F2933]">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-primary cursor-pointer shrink-0"
                  checked={regIncludesCeremonies}
                  onChange={(e) => setRegIncludesCeremonies(e.target.checked)}
                />
                <div className="grid gap-0.5">
                  <span className="font-black text-sm text-ink">
                    Aktifkan Prediksi Otomatis Hari Raya Galungan, Kuningan, Purnama &amp; Tilem
                  </span>
                  <span className="text-xs font-black text-ink">
                    Menambahkan ekstra leeway armada TPS3R saat lonjakan upacara adat berlangsung.
                  </span>
                </div>
              </label>

              {/* Ringkasan Sebelum Selesai */}
              <div className="rounded-xl border border-ink/40 bg-bg p-3.5 text-xs grid gap-1">
                <span className="font-black text-primary uppercase text-[11px]">Ringkasan Profil Anda:</span>
                <p className="font-bold text-ink">
                  {regName} · {regKecamatan} ({regDesa}) · {regAccountType === 'household' ? 'Rumah Tangga' : 'Badan Usaha'}
                </p>
                <p className="text-ink/80">
                  Estimasi Rutin: ~{regBagCount * (CONTAINER_PRESETS[regContainerPreset]?.liters ?? 15)} Liter/minggu ({CONTAINER_PRESETS[regContainerPreset]?.label})
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOnboardingStep(3)}
                  className="btn-tactile text-xs font-bold"
                >
                  <MaterialIcon name="arrow_back" size="sm" />
                  <span>Kembali</span>
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleFinishOnboarding()}
                  className="btn-tactile bg-primary text-white font-black text-sm px-6 py-2.5 flex items-center gap-2"
                >
                  <MaterialIcon name="check_circle" size="sm" />
                  <span>{busy ? 'Mengaktifkan Akun…' : 'Selesaikan & Aktifkan Profil Saya'}</span>
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </main>
  )
}
