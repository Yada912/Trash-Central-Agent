'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from '@/components/account/use-account'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  CONTAINER_PRESETS,
  formatSlotDaysId,
  type ContainerPreset,
  type CurrentTrashCondition,
  type ResidentWasteProfile,
  type SpecialEventSurge,
} from '@/lib/accounts/store'
import { computeUserOtonanFromBirthDate } from '@/lib/calendar/balinese-calendar'
import { KECAMATAN, type Kecamatan, type WasteStream } from '@/lib/schemas'

const CONDITION_OPTIONS: Array<{
  value: CurrentTrashCondition
  label: string
  desc: string
  icon: string
  bg: string
}> = [
  {
    value: 'terkendali',
    label: 'Terkendali & Rapi',
    desc: 'Wadah cukup, sampah siap diangkut sesuai jadwal rutin.',
    icon: 'check_circle',
    bg: 'bg-mint',
  },
  {
    value: 'menumpuk',
    label: 'Mulai Menumpuk',
    desc: 'Kantong mulai penuh di depan rumah/halaman selama beberapa hari.',
    icon: 'stacked_bar_chart',
    bg: 'bg-amber',
  },
  {
    value: 'meluber',
    label: 'Meluber / Mendesak',
    desc: 'Wadah tidak muat, berbau, atau rawan tercecer ke jalan.',
    icon: 'warning',
    bg: 'bg-coral',
  },
  {
    value: 'pasca_upacara',
    label: 'Lonjakan Sisa Upacara / Acara',
    desc: 'Banyak janur, canang, daun pisang, atau kemasan pasca hari raya/hajatan.',
    icon: 'celebration',
    bg: 'bg-lavender',
  },
]

export function AccountView() {
  const router = useRouter()
  const { activeAccount, timetable, optimization, busy, login, logout, switchAccount, updateProfile, updateTimetable } =
    useAccount()

  const [profileDraft, setProfileDraft] = useState<ResidentWasteProfile | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [addressDraft, setAddressDraft] = useState('')
  const [kecamatanDraft, setKecamatanDraft] = useState<Kecamatan>('Denpasar Barat')
  const [desaDraft, setDesaDraft] = useState('')
  const [banjarDraft, setBanjarDraft] = useState('')
  const [tps3rDraft, setTps3rDraft] = useState('')
  const [birthDateDraft, setBirthDateDraft] = useState('1996-05-14')
  const [savedBanner, setSavedBanner] = useState<string | null>(null)

  // Petugas Escalation Authentication State
  const [petugasEmail, setPetugasEmail] = useState('')
  const [petugasPassword, setPetugasPassword] = useState('')
  const [petugasLoginBusy, setPetugasLoginBusy] = useState(false)
  const [petugasLoginError, setPetugasLoginError] = useState<string | null>(null)

  const [newEventName, setNewEventName] = useState('')
  const [newEventContainers, setNewEventContainers] = useState('4')
  const [newEventStream, setNewEventStream] = useState<WasteStream>('organik')

  useEffect(() => {
    if (!activeAccount) return
    setNameDraft(activeAccount.name)
    setAddressDraft(activeAccount.address)
    setKecamatanDraft(activeAccount.kecamatan)
    setDesaDraft(activeAccount.desa)
    setBanjarDraft(activeAccount.banjarName ?? 'Banjar Pekambingan')
    setTps3rDraft(activeAccount.tps3rNode ?? 'TPS3R Swakelola Desa')
    setBirthDateDraft(activeAccount.birthDate ?? '1996-05-14')
    if (activeAccount.wasteProfile) {
      setProfileDraft(structuredClone(activeAccount.wasteProfile))
    } else {
      setProfileDraft(null)
    }
  }, [activeAccount])

  if (!activeAccount) {
    return (
      <main id="main" className="grid gap-6">
        <div className="vector-card p-6">
          <p className="font-bold">Memuat profil akun…</p>
        </div>
      </main>
    )
  }

  const computedOtonan = birthDateDraft ? computeUserOtonanFromBirthDate(birthDateDraft) : null

  const preset = profileDraft ? CONTAINER_PRESETS[profileDraft.containerPreset] : CONTAINER_PRESETS.kantong_15l
  const weeklyContainerCount = profileDraft ? Math.max(1, Math.round(profileDraft.weeklyRegularLiters / preset.liters)) : 5

  function updateContainerCount(count: number) {
    if (!profileDraft) return
    const safeCount = Math.max(1, Math.min(200, count))
    setProfileDraft({
      ...profileDraft,
      weeklyRegularLiters: safeCount * preset.liters,
    })
  }

  function toggleEventActive(eventId: string) {
    if (!profileDraft) return
    setProfileDraft({
      ...profileDraft,
      specialEvents: profileDraft.specialEvents.map((ev) =>
        ev.id === eventId ? { ...ev, activeThisWeek: !ev.activeThisWeek } : ev,
      ),
    })
  }

  function addCustomEvent() {
    if (!profileDraft || !newEventName.trim()) return
    const containers = Math.max(1, Number(newEventContainers) || 2)
    const added: SpecialEventSurge = {
      id: `evt_${Date.now().toString(36)}`,
      name: newEventName.trim(),
      frequency: 'Sesuai jadwal acara',
      extraLiters: containers * preset.liters,
      dominantStream: newEventStream,
      activeThisWeek: true,
      notes: `Tambahan ~${containers} ${preset.label.toLowerCase()} (${containers * preset.liters} L)`,
    }
    setProfileDraft({
      ...profileDraft,
      specialEvents: [...profileDraft.specialEvents, added],
    })
    setNewEventName('')
  }

  async function saveWargaProfile() {
    await updateProfile({
      name: nameDraft.trim() || activeAccount?.name,
      kecamatan: kecamatanDraft,
      desa: desaDraft,
      banjarName: banjarDraft,
      tps3rNode: tps3rDraft,
      birthDate: birthDateDraft,
      address: addressDraft,
      wasteProfile: profileDraft ?? undefined,
    })
    setSavedBanner('Profil sampah, banjar, dan tanggal lahir (Pawukon/Otonan) berhasil disimpan!')
    setTimeout(() => setSavedBanner(null), 4000)
  }

  async function handlePetugasEscalation(email: string, pass: string) {
    setPetugasLoginError(null)
    setPetugasLoginBusy(true)
    const authed = await login(email, pass)
    setPetugasLoginBusy(false)
    if (!authed || authed.role !== 'petugas') {
      setPetugasLoginError('Otentikasi Petugas gagal. Pastikan email kedinasan dan kata sandi benar.')
      return
    }
    router.push('/petugas')
  }

  async function handleReturnToWarga() {
    await switchAccount('usr_warga_01')
    router.push('/warga')
  }

  function handleLogout() {
    logout()
    router.push('/masuk')
  }

  return (
    <main id="main" className="grid gap-8">
      {/* Header Section: Single Account Context */}
      <section className="vector-card bg-gradient-to-br from-card via-card to-sky/30 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="vector-pill bg-amber text-ink tilt-left">
                <MaterialIcon name={activeAccount.role === 'petugas' ? 'badge' : 'person'} size="sm" />
                Mode Akun: {activeAccount.role === 'petugas' ? 'Petugas Operasional DLHK' : 'Warga Denpasar'}
              </span>
              <span className="vector-pill bg-mint text-ink">
                <MaterialIcon name="location_on" size="sm" />
                {activeAccount.kecamatan} · {activeAccount.desa}
              </span>
              <span className="vector-pill bg-sky text-ink">
                <MaterialIcon name="account_balance" size="sm" />
                {activeAccount.banjarName ?? 'Banjar Lingkungan'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {activeAccount.role === 'petugas'
                ? 'Akun Petugas & Kendali Operasional DLHK'
                : 'Profil Pengelolaan Sampah Mandiri Warga'}
            </h1>
            <p className="max-w-3xl text-base text-ink/80">
              {activeAccount.role === 'petugas'
                ? 'Pengaturan jadwal desentralisasi TPS3R per kecamatan, kapasitas angkut harian, batas toleransi (leeway) rahinan, dan rute VRP.'
                : 'Pengelolaan ritme sampah rumah tangga/usaha Anda secara personal. Sistem menyesuaikan jadwal jemput TPS3R desa dan kalender rahinan/otonan keluarga Anda.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeAccount.role === 'warga' ? (
              <Button onClick={() => void saveWargaProfile()} disabled={busy}>
                <MaterialIcon name="save" />
                Simpan Profil & Otonan
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => void handleReturnToWarga()}>
                <MaterialIcon name="person" />
                Kembali ke Mode Warga
              </Button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="btn-tactile bg-coral text-white px-3.5 py-2 rounded-md border-2 border-ink text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0_#1F2933] hover:bg-coral/90"
              data-testid="logout-button"
            >
              <MaterialIcon name="logout" size="sm" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>

        {/* Highlighted Otonan & Decentralized Node Card */}
        {activeAccount.role === 'warga' && computedOtonan ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border-2 border-ink bg-lavender/40 p-4">
              <div className="flex items-center gap-2">
                <MaterialIcon name="auto_awesome" className="text-primary" size="sm" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-ink">
                  Pawukon & Otonan Pribadi Anda
                </span>
              </div>
              <p className="mt-1 text-base font-extrabold text-ink">
                {computedOtonan.pawukonLabel}
              </p>
              <p className="text-xs font-semibold text-ink mt-0.5">
                Siklus 210 hari · Jatuh pada {computedOtonan.nextOtonanDate} (prediksi ekstra +30 L lungsuran banten otonan pada jadwal organik terdekat).
              </p>
            </div>

            <div className="rounded-xl border-2 border-ink bg-mint/40 p-4">
              <div className="flex items-center gap-2">
                <MaterialIcon name="hub" className="text-primary" size="sm" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-ink">
                  Node Desentralisasi TPS3R
                </span>
              </div>
              <p className="mt-1 text-base font-extrabold text-ink">
                {activeAccount.tps3rNode ?? 'TPS3R Swakelola Desa Pemecutan'}
              </p>
              <p className="text-xs font-semibold text-ink mt-0.5">
                Pengelolaan Berbasis Sumber Pergub 47/2019: Organik diolah jadi kompos & eco-enzyme lokal; Anorganik disalurkan ke Bank Sampah.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {savedBanner ? (
        <div role="status" className="vector-card bg-mint p-4 flex items-center gap-3 font-bold text-ink">
          <MaterialIcon name="verified" className="text-primary" size="lg" />
          <span>{savedBanner}</span>
        </div>
      ) : null}

      {/* Container: Identitas Warga & Tanggal Lahir untuk Pawukon / Otonan */}
      {activeAccount.role === 'warga' ? (
        <section className="vector-card p-6 grid gap-4 bg-card">
          <div className="flex items-center justify-between gap-2 border-b-2 border-ink pb-3">
            <div className="flex items-center gap-2">
              <span className="vector-pill bg-lavender text-ink">00</span>
              <h2 className="text-xl font-extrabold">Identitas Warga & Tanggal Lahir (Kalender Pawukon / Otonan)</h2>
            </div>
            <MaterialIcon name="person" className="text-primary" size="lg" />
          </div>
          <p className="text-sm font-semibold text-ink">
            Tanggal lahir digunakan oleh AI untuk menghitung wuku kelahiran, siklus 210 hari Otonan Bali Anda, dan memprediksi kebutuhan ekstra wadah organik untuk lungsuran banten.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1">
              <Label htmlFor="warga-name">Nama Lengkap / Nama Tempat</Label>
              <Input
                id="warga-name"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Nama Anda"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="warga-birthdate">Tanggal Lahir (Untuk Otonan)</Label>
              <Input
                id="warga-birthdate"
                type="date"
                value={birthDateDraft}
                onChange={(e) => setBirthDateDraft(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="warga-banjar">Banjar / Lingkungan Swakelola</Label>
              <Input
                id="warga-banjar"
                value={banjarDraft}
                onChange={(e) => setBanjarDraft(e.target.value)}
                placeholder="Mis. Banjar Pekambingan"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1">
              <Label htmlFor="warga-kecamatan">Kecamatan</Label>
              <Select
                id="warga-kecamatan"
                value={kecamatanDraft}
                onChange={(e) => setKecamatanDraft(e.target.value as Kecamatan)}
              >
                {KECAMATAN.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="warga-desa">Desa / Kelurahan</Label>
              <Input
                id="warga-desa"
                value={desaDraft}
                onChange={(e) => setDesaDraft(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="warga-address">Alamat Rumah / Usaha</Label>
              <Input
                id="warga-address"
                value={addressDraft}
                onChange={(e) => setAddressDraft(e.target.value)}
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* WARGA VIEW: Curated Trash Situation + Weekly Output + Special Events + Timetable Optimization */}
      {activeAccount.role === 'warga' && profileDraft ? (
        <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
          <div className="grid gap-6">
            {/* Step 1: Bagaimana kondisi sampah yang sekarang? */}
            <section className="vector-card p-6 grid gap-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="vector-pill bg-sky text-ink">01</span>
                  <h2 className="text-xl font-extrabold">Bagaimana kondisi sampah Anda sekarang?</h2>
                </div>
                <MaterialIcon name="recycling" className="text-primary" size="lg" />
              </div>
              <p className="text-sm text-ink/75">
                Pilih kondisi yang paling menggambarkan keadaan tempat sampah di rumah/tempat usaha Anda hari ini:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {CONDITION_OPTIONS.map((opt) => {
                  const selected = profileDraft.currentCondition === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setProfileDraft({ ...profileDraft, currentCondition: opt.value })}
                      aria-pressed={selected}
                      className={
                        selected
                          ? `vector-card ${opt.bg} p-4 text-left`
                          : 'vector-card-soft bg-card hover:bg-bg p-4 text-left'
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 font-extrabold text-base">
                          <MaterialIcon name={opt.icon} />
                          {opt.label}
                        </span>
                        {selected ? <MaterialIcon name="check_circle" className="text-primary" /> : null}
                      </div>
                      <p className="mt-1.5 text-xs text-ink/80">{opt.desc}</p>
                    </button>
                  )
                })}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="condition-note">Catatan Singkat Kondisi Saat Ini</Label>
                <Textarea
                  id="condition-note"
                  className="min-h-20"
                  value={profileDraft.conditionNote}
                  onChange={(e) => setProfileDraft({ ...profileDraft, conditionNote: e.target.value })}
                  placeholder="Contoh: Ada 4 kantong sisa daun canang dan botol plastik di dekat pagar..."
                />
              </div>
            </section>

            {/* Step 2: Rata-rata timbulan mingguan dengan Takaran Mudah (Kantong / Ember / Karung) */}
            <section className="vector-card p-6 grid gap-4">
              <div className="flex items-center gap-2">
                <span className="vector-pill bg-mint text-ink">02</span>
                <h2 className="text-xl font-extrabold">Takaran Timbulan Mingguan (Tanpa Hitung Rumit)</h2>
              </div>
              <p className="text-sm text-ink/75">
                Tidak perlu tahu angka liter! Pilih ukuran wadah yang biasa Anda pakai sehari-hari, lalu atur berapa wadah yang penuh dalam seminggu:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.entries(CONTAINER_PRESETS) as Array<[ContainerPreset, (typeof CONTAINER_PRESETS)[ContainerPreset]]>).map(
                  ([key, item]) => {
                    const active = profileDraft.containerPreset === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setProfileDraft({
                            ...profileDraft,
                            containerPreset: key,
                          })
                        }
                        className={
                          active
                            ? 'vector-card bg-amber p-3.5 text-left'
                            : 'vector-card-soft bg-card p-3.5 text-left hover:bg-amber/20'
                        }
                      >
                        <div className="flex items-center gap-2 font-extrabold">
                          <MaterialIcon name={item.icon} />
                          <span>{item.label}</span>
                        </div>
                        <p className="mt-1 text-xs text-ink/75">{item.hint}</p>
                      </button>
                    )
                  },
                )}
              </div>

              <div className="vector-card-soft bg-bg p-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-sm font-extrabold">
                    Berapa {preset.label.toLowerCase()} penuh dalam 1 minggu biasa?
                  </p>
                  <p className="text-xs text-ink/70">
                    Setara otomatis dengan <strong>{profileDraft.weeklyRegularLiters} Liter / minggu</strong> ({profileDraft.householdMembers} orang di lokasi ini)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => updateContainerCount(weeklyContainerCount - 1)}>
                    <MaterialIcon name="remove" />
                  </Button>
                  <span className="min-w-20 text-center text-2xl font-extrabold">
                    {weeklyContainerCount}x
                  </span>
                  <Button variant="secondary" onClick={() => updateContainerCount(weeklyContainerCount + 1)}>
                    <MaterialIcon name="add" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="grid gap-1">
                  <Label htmlFor="warga-kecamatan">Kecamatan</Label>
                  <Select
                    id="warga-kecamatan"
                    value={kecamatanDraft}
                    onChange={(e) => setKecamatanDraft(e.target.value as Kecamatan)}
                  >
                    {KECAMATAN.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="warga-desa">Desa / Kelurahan</Label>
                  <Input id="warga-desa" value={desaDraft} onChange={(e) => setDesaDraft(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="warga-sorting">Kesiapan Pemilahan</Label>
                  <Select
                    id="warga-sorting"
                    value={profileDraft.sortingReadiness}
                    onChange={(e) =>
                      setProfileDraft({
                        ...profileDraft,
                        sortingReadiness: e.target.value as ResidentWasteProfile['sortingReadiness'],
                      })
                    }
                  >
                    <option value="sudah_dipilah">Sudah Dipilah (Organik & Anorganik)</option>
                    <option value="sebagian">Baru Sebagian Dipilah</option>
                    <option value="belum_dipilah">Masih Tercampur</option>
                  </Select>
                </div>
              </div>
            </section>

            {/* Step 3: Lonjakan Acara Khusus (Hari Raya / Odalan / Hajatan) */}
            <section className="vector-card p-6 grid gap-4">
              <div className="flex items-center gap-2">
                <span className="vector-pill bg-lavender text-ink">03</span>
                <h2 className="text-xl font-extrabold">Lonjakan Hari Raya, Odalan, & Acara Khusus</h2>
              </div>
              <p className="text-sm text-ink/75">
                Centang acara yang sedang atau akan berlangsung minggu ini agar sistem menghitung apakah lonjakan sampah Anda masih masuk dalam toleransi (leeway) truk petugas:
              </p>
              <ul className="grid gap-3">
                {profileDraft.specialEvents.map((ev) => (
                  <li
                    key={ev.id}
                    className={
                      ev.activeThisWeek
                        ? 'vector-card bg-amber/40 p-4 flex flex-wrap items-center justify-between gap-3'
                        : 'vector-card-soft bg-card p-4 flex flex-wrap items-center justify-between gap-3'
                    }
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 accent-primary"
                        checked={ev.activeThisWeek}
                        onChange={() => toggleEventActive(ev.id)}
                      />
                      <div>
                        <p className="font-extrabold text-base">
                          {ev.name}{' '}
                          <span className="ml-1 rounded border border-ink px-2 py-0.5 text-xs bg-card">
                            +{ev.extraLiters} L ({ev.dominantStream})
                          </span>
                        </p>
                        <p className="text-xs text-ink/75">{ev.notes}</p>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>

              <div className="vector-card-soft bg-bg p-4 grid gap-3">
                <p className="text-sm font-extrabold">Tambah Acara / Kegiatan Lain Minggu Ini</p>
                <div className="grid gap-3 sm:grid-cols-[1.4fr_0.8fr_0.8fr_auto] sm:items-end">
                  <div className="grid gap-1">
                    <Label htmlFor="new-ev-name">Nama Acara</Label>
                    <Input
                      id="new-ev-name"
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      placeholder="Mis. Syukuran / Arisan"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="new-ev-bags">Tambahan ({preset.label})</Label>
                    <Input
                      id="new-ev-bags"
                      type="number"
                      min={1}
                      max={50}
                      value={newEventContainers}
                      onChange={(e) => setNewEventContainers(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="new-ev-stream">Jenis Dominan</Label>
                    <Select
                      id="new-ev-stream"
                      value={newEventStream}
                      onChange={(e) => setNewEventStream(e.target.value as WasteStream)}
                    >
                      <option value="organik">Organik (Canang/Makanan)</option>
                      <option value="anorganik">Anorganik (Plastik/Kardus)</option>
                      <option value="residu">Residu</option>
                    </Select>
                  </div>
                  <Button variant="secondary" onClick={addCustomEvent}>
                    <MaterialIcon name="add_circle" />
                    Tambah
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={() => void saveWargaProfile()} disabled={busy}>
                  <MaterialIcon name="save" />
                  Simpan Profil & Hitung Optimasi Jadwal
                </Button>
                <Button asChild variant="gold">
                  <Link href="/report">
                    <MaterialIcon name="add_a_photo" />
                    Lapor & Minta Angkut Sekarang
                  </Link>
                </Button>
              </div>
            </section>
          </div>

          {/* Right Column: Live Optimization & Timetable Leeway Advisor */}
          <aside className="grid content-start gap-6">
            {optimization ? (
              <section className="vector-card bg-card p-6 grid gap-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={
                      optimization.overallStatus === 'optimal'
                        ? 'vector-pill bg-mint text-ink tilt-right'
                        : optimization.overallStatus === 'leeway_used'
                          ? 'vector-pill bg-amber text-ink tilt-right'
                          : 'vector-pill bg-coral text-ink tilt-right'
                    }
                  >
                    <MaterialIcon
                      name={
                        optimization.overallStatus === 'optimal'
                          ? 'verified'
                          : optimization.overallStatus === 'leeway_used'
                            ? 'schedule'
                            : 'priority_high'
                      }
                      size="sm"
                    />
                    {optimization.overallStatus === 'optimal'
                      ? 'Sesuai Jadwal Rutin'
                      : optimization.overallStatus === 'leeway_used'
                        ? 'Masuk Toleransi Leeway'
                        : 'Perlu Penjemputan Tambahan'}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold leading-tight">{optimization.headline}</h2>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="vector-card-soft bg-sky/40 p-3">
                    <p className="text-xs font-bold uppercase">Rutin</p>
                    <p className="text-xl font-extrabold">{optimization.baseWeeklyLiters} L</p>
                  </div>
                  <div className="vector-card-soft bg-lavender/50 p-3">
                    <p className="text-xs font-bold uppercase">Lonjakan Acara</p>
                    <p className="text-xl font-extrabold">+{optimization.eventExtraLiters} L</p>
                  </div>
                  <div className="vector-card-soft bg-mint/60 p-3">
                    <p className="text-xs font-bold uppercase">Total Mingguan</p>
                    <p className="text-xl font-extrabold">{optimization.totalWeeklyLiters} L</p>
                    <p className="text-[11px] font-semibold">≈ {optimization.equivalentContainers} {optimization.containerLabel}</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <h3 className="text-base font-extrabold flex items-center gap-1.5">
                    <MaterialIcon name="calendar_month" className="text-primary" />
                    Kecocokan dengan Jadwal & Leeway Petugas ({activeAccount.kecamatan})
                  </h3>
                  {optimization.streams.map((st) => (
                    <div
                      key={st.stream}
                      className={
                        st.status === 'needs_extra_pickup'
                          ? 'vector-card-soft bg-coral/40 p-3.5 grid gap-1'
                          : st.status === 'within_leeway'
                            ? 'vector-card-soft bg-amber/40 p-3.5 grid gap-1'
                            : 'vector-card-soft bg-bg p-3.5 grid gap-1'
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold uppercase text-sm">{st.stream}</span>
                        <span className="text-xs font-bold">
                          {st.weeklyLiters} L/minggu ({st.litersPerPickup} L/jemput)
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-primary">{st.windowLabel}</p>
                      <p className="text-[11px] text-ink/70">{st.leewayLabel}</p>
                      <p className="mt-1 text-xs font-medium">{st.recommendation}</p>
                    </div>
                  ))}
                </div>

                <div className="vector-card-soft bg-mint/40 p-4 grid gap-2">
                  <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                    <MaterialIcon name="tips_and_updates" />
                    Langkah Terbaik Minggu Ini
                  </h3>
                  <ul className="list-disc pl-5 text-xs grid gap-1.5 font-medium">
                    {optimization.actionItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      ) : null}

      {/* PETUGAS VIEW: Timetable & Leeway Editor */}
      {activeAccount.role === 'petugas' ? (
        <section className="vector-card p-6 grid gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold flex items-center gap-2">
                <MaterialIcon name="tune" className="text-primary" size="lg" />
                Pengaturan Jadwal Tetap & Kelonggaran (Leeway) Armada
              </h2>
              <p className="text-sm text-ink/75">
                Sesuaikan jam operasional, batas muatan per titik rumah tangga/usaha, dan persentase leeway cadangan saat minggu hari raya. Perubahan ini langsung memperbarui rekomendasi pada profil Warga.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="secondary">
                <Link href="/dashboard">
                  <MaterialIcon name="space_dashboard" />
                  Buka Dasbor Kota
                </Link>
              </Button>
              <Button asChild>
                <Link href="/planner">
                  <MaterialIcon name="route" />
                  Buka Perencana Rute VRP
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {timetable.map((slot) => (
              <div key={slot.id} className="vector-card-soft bg-bg p-4 grid gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="vector-pill bg-amber text-ink">{slot.kecamatan}</span>
                    <span className="ml-2 vector-pill bg-mint text-ink">{slot.stream}</span>
                  </div>
                  <span className="text-xs font-bold">{formatSlotDaysId(slot.days)}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <Label htmlFor={`start-${slot.id}`}>Jam Mulai (WITA)</Label>
                    <Input
                      id={`start-${slot.id}`}
                      defaultValue={slot.windowStart}
                      onBlur={(e) => void updateTimetable({ slotId: slot.id, windowStart: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor={`end-${slot.id}`}>Jam Selesai (WITA)</Label>
                    <Input
                      id={`end-${slot.id}`}
                      defaultValue={slot.windowEnd}
                      onBlur={(e) => void updateTimetable({ slotId: slot.id, windowEnd: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor={`leeway-${slot.id}`}>Leeway Waktu (± menit)</Label>
                    <Input
                      id={`leeway-${slot.id}`}
                      type="number"
                      min={0}
                      max={180}
                      defaultValue={slot.leewayMinutes}
                      onBlur={(e) => void updateTimetable({ slotId: slot.id, leewayMinutes: Number(e.target.value) || 30 })}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor={`surge-${slot.id}`}>Toleransi Lonjakan Acara (%)</Label>
                    <Input
                      id={`surge-${slot.id}`}
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={slot.surgeTolerancePct}
                      onBlur={(e) => void updateTimetable({ slotId: slot.id, surgeTolerancePct: Number(e.target.value) || 20 })}
                    />
                  </div>
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`max-${slot.id}`}>Batas Normal per Jemput (Liter)</Label>
                  <Input
                    id={`max-${slot.id}`}
                    type="number"
                    min={15}
                    max={500}
                    defaultValue={slot.maxLitersPerPickup}
                    onBlur={(e) => void updateTimetable({ slotId: slot.id, maxLitersPerPickup: Number(e.target.value) || 60 })}
                  />
                </div>
                <p className="text-xs text-ink/75">{slot.notes}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* SECTION AT THE BOTTOM: Otentikasi Khusus Petugas Operasional */}
      {activeAccount.role === 'warga' ? (
        <section
          data-testid="petugas-escalation-section"
          className="vector-card bg-amber/20 border-2 border-ink p-6 grid gap-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3">
            <div className="flex items-center gap-2">
              <span className="vector-pill bg-lavender text-ink">Akses Khusus</span>
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <MaterialIcon name="badge" className="text-primary" />
                Otentikasi Khusus Petugas Operasional (TPS3R / DLHK Kota Denpasar)
              </h2>
            </div>
            <span className="text-xs font-extrabold text-ink/70">Akses Terlindungi</span>
          </div>

          <p className="text-sm text-ink/85">
            Sesuai protokol sistem, seluruh personil masuk melalui portal Warga terlebih dahulu. Jika Anda adalah petugas armada kebersihan, pengawas TPS3R desa, atau perencana operasional DLHK, masukkan kredensial kedinasan Anda di bawah ini untuk mengaktifkan <strong>Mode Petugas</strong> dan membuka dasbor koordinasi armada serta rute VRP.
          </p>

          {petugasLoginError ? (
            <div role="alert" className="vector-card bg-coral p-3 text-sm font-extrabold text-alert flex items-center gap-2">
              <MaterialIcon name="error" size="sm" />
              <span>{petugasLoginError}</span>
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handlePetugasEscalation(petugasEmail, petugasPassword)
            }}
            className="grid gap-4 sm:grid-cols-2 max-w-2xl"
          >
            <div className="grid gap-1">
              <Label htmlFor="petugas-email">Email Kedinasan Petugas</Label>
              <Input
                id="petugas-email"
                type="email"
                value={petugasEmail}
                onChange={(e) => setPetugasEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="petugas-password">Kata Sandi</Label>
              <Input
                id="petugas-password"
                type="password"
                value={petugasPassword}
                onChange={(e) => setPetugasPassword(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit" disabled={petugasLoginBusy}>
                <MaterialIcon name="verified_user" size="sm" />
                {petugasLoginBusy ? 'Memverifikasi…' : 'Otentikasi & Aktifkan Mode Petugas'}
              </Button>
            </div>
          </form>
        </section>
      ) : (
        <section
          data-testid="petugas-escalation-section"
          className="vector-card bg-lavender/30 border-2 border-ink p-6 grid gap-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="vector-pill bg-amber text-ink">Mode Aktif</span>
              <h2 className="mt-1 text-xl font-extrabold flex items-center gap-2">
                <MaterialIcon name="badge" className="text-primary" />
                Anda Sedang Berada dalam Mode Petugas Operasional (DLHK Kota Denpasar)
              </h2>
              <p className="text-xs font-semibold text-ink mt-0.5">
                Nomor Induk Petugas: <strong>{activeAccount.badgeId ?? 'DLHK-DPS-042'}</strong> · Wilayah Penugasan: <strong>{activeAccount.kecamatan}</strong>
              </p>
            </div>
            <Button variant="secondary" onClick={() => void handleReturnToWarga()}>
              <MaterialIcon name="logout" size="sm" />
              Keluar ke Mode Warga
            </Button>
          </div>
        </section>
      )}

      {/* Sesi Akun / Logout */}
      <section className="vector-card bg-card p-5 flex flex-wrap items-center justify-between gap-3 border-2 border-ink">
        <div className="flex items-center gap-2.5">
          <MaterialIcon name="manage_accounts" size="sm" className="text-primary" />
          <div>
            <p className="text-sm font-extrabold text-ink">Keluar dari Sesi Aplikasi</p>
            <p className="text-xs font-semibold text-ink">
              Keluar dari akun {activeAccount.name} ({activeAccount.email}).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="btn-tactile bg-coral text-white px-4 py-2 rounded-md border-2 border-ink text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0_#1F2933] hover:bg-coral/90"
        >
          <MaterialIcon name="logout" size="sm" />
          <span>Keluar dari Akun (Logout)</span>
        </button>
      </section>
    </main>
  )
}

