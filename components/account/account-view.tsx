'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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
  type UserRole,
} from '@/lib/accounts/store'
import { KECAMATAN, type AccountType, type Kecamatan, type WasteStream } from '@/lib/schemas'

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
  const { activeAccount, accounts, timetable, optimization, busy, switchAccount, updateProfile, createNewAccount, updateTimetable } =
    useAccount()

  const [profileDraft, setProfileDraft] = useState<ResidentWasteProfile | null>(null)
  const [addressDraft, setAddressDraft] = useState('')
  const [kecamatanDraft, setKecamatanDraft] = useState<Kecamatan>('Denpasar Barat')
  const [desaDraft, setDesaDraft] = useState('')
  const [savedBanner, setSavedBanner] = useState<string | null>(null)

  const [showRegister, setShowRegister] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('warga')
  const [newKecamatan, setNewKecamatan] = useState<Kecamatan>('Denpasar Barat')
  const [newDesa, setNewDesa] = useState('Pemecutan')
  const [newAddress, setNewAddress] = useState('')
  const [newAccountType, setNewAccountType] = useState<AccountType>('household')

  const [newEventName, setNewEventName] = useState('')
  const [newEventContainers, setNewEventContainers] = useState('4')
  const [newEventStream, setNewEventStream] = useState<WasteStream>('organik')

  useEffect(() => {
    if (!activeAccount) return
    setAddressDraft(activeAccount.address)
    setKecamatanDraft(activeAccount.kecamatan)
    setDesaDraft(activeAccount.desa)
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
      kecamatan: kecamatanDraft,
      desa: desaDraft,
      address: addressDraft,
      wasteProfile: profileDraft ?? undefined,
    })
    setSavedBanner('Profil sampah & jadwal rumah tangga berhasil diperbarui!')
    setTimeout(() => setSavedBanner(null), 4000)
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) return
    await createNewAccount({
      name: newName,
      email: newEmail,
      role: newRole,
      kecamatan: newKecamatan,
      desa: newDesa,
      address: newAddress,
      accountType: newAccountType,
    })
    setNewName('')
    setNewEmail('')
    setNewAddress('')
    setShowRegister(false)
    setSavedBanner('Akun baru berhasil dibuat dan diaktifkan!')
    setTimeout(() => setSavedBanner(null), 4000)
  }

  return (
    <main id="main" className="grid gap-8">
      {/* Header Section */}
      <section className="vector-card bg-gradient-to-br from-card via-card to-sky/40 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="vector-pill bg-amber text-ink tilt-left">
                <MaterialIcon name={activeAccount.role === 'petugas' ? 'badge' : 'person'} size="sm" />
                Mode Akun: {activeAccount.role === 'petugas' ? 'Petugas DLHK' : 'Warga Denpasar'}
              </span>
              <span className="vector-pill bg-mint text-ink">
                <MaterialIcon name="location_on" size="sm" />
                {activeAccount.kecamatan}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {activeAccount.role === 'petugas'
                ? 'Akun Petugas & Kendali Jadwal Armada'
                : 'Profil Sampah Warga & Penyesuaian Jadwal'}
            </h1>
            <p className="max-w-3xl text-base text-ink/80">
              {activeAccount.role === 'petugas'
                ? 'Atur jadwal tetap per kecamatan, batas kapasitas per penjemputan, dan toleransi kelonggaran (leeway) armada saat lonjakan hari raya/upacara.'
                : 'Catat kondisi sampah Anda sekarang, kebiasaan timbulan mingguan (cukup hitung kantong/ember), serta lonjakan acara adat agar selaras dengan jadwal dan toleransi (leeway) petugas.'}
            </p>
          </div>
          <Button variant="secondary" onClick={() => setShowRegister((prev) => !prev)}>
            <MaterialIcon name="person_add" />
            {showRegister ? 'Tutup Form Akun Baru' : 'Buat Akun Warga / Petugas'}
          </Button>
        </div>

        {/* Account Switcher Cards */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {accounts.map((acc) => {
            const isCurrent = acc.id === activeAccount.id
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => void switchAccount(acc.id)}
                aria-pressed={isCurrent}
                className={
                  isCurrent
                    ? 'vector-card bg-primary text-white p-4 text-left transition-transform'
                    : 'vector-card-soft bg-card hover:bg-amber/30 p-4 text-left transition-transform'
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider">
                    <MaterialIcon name={acc.role === 'petugas' ? 'local_shipping' : acc.accountType === 'company' ? 'storefront' : 'home'} size="sm" />
                    {acc.role === 'petugas' ? 'Petugas' : acc.accountType === 'company' ? 'Warga (Usaha)' : 'Warga (Rumah)'}
                  </span>
                  {isCurrent ? (
                    <span className="rounded-full border border-white bg-white/20 px-2 py-0.5 text-xs font-bold">Aktif</span>
                  ) : null}
                </div>
                <p className="mt-2 text-base font-extrabold">{acc.name}</p>
                <p className={isCurrent ? 'text-xs text-white/90' : 'text-xs text-ink/70'}>
                  {acc.kecamatan} · {acc.desa}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {savedBanner ? (
        <div role="status" className="vector-card bg-mint p-4 flex items-center gap-3 font-bold text-ink">
          <MaterialIcon name="verified" className="text-primary" size="lg" />
          <span>{savedBanner}</span>
        </div>
      ) : null}

      {/* New Account Registration Modal/Drawer */}
      {showRegister ? (
        <form onSubmit={(e) => void handleCreateAccount(e)} className="vector-card bg-amber/30 p-6 grid gap-4">
          <div className="flex items-center gap-2">
            <MaterialIcon name="badge" className="text-primary" size="lg" />
            <h2 className="text-xl font-extrabold">Daftarkan Akun Baru (Warga / Petugas)</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1">
              <Label htmlFor="reg-name">Nama Lengkap / Nama Usaha</Label>
              <Input id="reg-name" required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Mis. I Ketut Sudiana" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="ketut@contoh.id" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="reg-role">Peran Utama</Label>
              <Select id="reg-role" value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
                <option value="warga">Warga (Pelapor & Rumah Tangga/Usaha)</option>
                <option value="petugas">Petugas (Operator & Pengatur Jadwal)</option>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="reg-kecamatan">Kecamatan</Label>
              <Select id="reg-kecamatan" value={newKecamatan} onChange={(e) => setNewKecamatan(e.target.value as Kecamatan)}>
                {KECAMATAN.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="reg-desa">Desa / Kelurahan</Label>
              <Input id="reg-desa" value={newDesa} onChange={(e) => setNewDesa(e.target.value)} placeholder="Mis. Sesetan" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="reg-type">Jenis Tempat</Label>
              <Select id="reg-type" value={newAccountType} onChange={(e) => setNewAccountType(e.target.value as AccountType)}>
                <option value="household">Rumah Tangga</option>
                <option value="company">Tempat Usaha / Warung / Kantor</option>
              </Select>
            </div>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="reg-addr">Alamat / Banjar</Label>
            <Input id="reg-addr" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Jl. Raya Sesetan Gang Melati No. 5" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy}>
              <MaterialIcon name="check" />
              Simpan & Aktifkan Akun
            </Button>
            <Button variant="secondary" onClick={() => setShowRegister(false)}>
              Batal
            </Button>
          </div>
        </form>
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
    </main>
  )
}

