'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useAccount } from '@/components/account/use-account'
import { InteractiveCalendar } from '@/components/calendar/interactive-calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MaterialIcon } from '@/components/ui/material-icon'
import {
  BALINESE_CALENDAR_EVENTS_2026,
  type BalineseCalendarEvent,
} from '@/lib/calendar/balinese-calendar'
import { computeResidentOptimization } from '@/lib/accounts/store'

export function WargaPortal() {
  const { activeAccount, isSignedIn, timetable, updateProfile, login } = useAccount()
  const weeklyLiters = activeAccount?.wasteProfile?.weeklyRegularLiters ?? 105
  const [bagCount, setBagCount] = useState<number>(() => Math.max(1, Math.round(weeklyLiters / 15)))
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedToast, setSavedToast] = useState<string | null>(null)

  const selectedEventIds = activeAccount?.wasteProfile?.selectedBalineseEventIds ?? [
    'bali_penampahan_galungan',
    'bali_galungan',
    'bali_umanis_galungan',
    'bali_tilem_kelima',
    'bali_penampahan_kuningan',
    'bali_kuningan',
    'bali_purnama_keenam',
  ]

  const optimization = useMemo(() => {
    if (!activeAccount) return null
    return computeResidentOptimization(activeAccount, timetable)
  }, [activeAccount, timetable])

  // Role separation guard: block direct access if not signed in as 'warga'
  if (!isSignedIn || !activeAccount || activeAccount.role !== 'warga') {
    return (
      <main id="main" className="grid gap-6 max-w-3xl mx-auto" data-testid="warga-role-guard">
        <section className="vector-card bg-card p-6 grid gap-4">
          <span className="vector-pill bg-amber text-ink w-fit">
            <MaterialIcon name="shield_person" size="sm" />
            Akses Khusus Warga
          </span>
          <h1 className="text-3xl font-extrabold">
            Halaman Ini Khusus untuk Akun Warga
          </h1>
          <p className="text-base font-medium text-ink/85">
            {activeAccount?.role === 'petugas'
              ? `Anda sedang masuk sebagai Petugas DLHK (${activeAccount.name}). Tampilan Warga dan Petugas dipisahkan agar setiap pengguna hanya melihat fitur sesuai perannya.`
              : 'Silakan masuk menggunakan akun Warga untuk melihat kalender jemputan rumah Anda, riwayat pengangkutan, dan prediksi Hari Raya Bali.'}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={() => void login('made.adi@warga.denpasar.id', 'warga123')}
              data-testid="switch-to-warga-btn"
            >
              <MaterialIcon name="person" size="sm" />
              Masuk Cepat sebagai Warga (I Made Adi)
            </Button>
            {activeAccount?.role === 'petugas' ? (
              <Link
                href="/petugas"
                className="vector-btn inline-flex items-center gap-2 rounded-md border-2 border-ink bg-lavender px-4 py-2.5 text-sm font-bold text-ink"
              >
                <MaterialIcon name="space_dashboard" size="sm" />
                Kembali ke Portal Petugas
              </Link>
            ) : null}
            <Link
              href="/masuk"
              className="vector-btn inline-flex items-center gap-2 rounded-md border-2 border-ink bg-card px-4 py-2.5 text-sm font-bold text-ink"
            >
              <MaterialIcon name="login" size="sm" />
              Halaman Masuk / Daftar
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const pickupHistory = activeAccount.wasteProfile?.pickupHistory ?? []
  const upcomingPickups = pickupHistory.filter((p) => p.status === 'scheduled')
  const pastPickups = pickupHistory.filter((p) => p.status === 'completed')

  async function handleToggleBalineseEvent(eventId: string) {
    if (!activeAccount || !activeAccount.wasteProfile) return
    const exists = selectedEventIds.includes(eventId)
    const nextIds = exists
      ? selectedEventIds.filter((id) => id !== eventId)
      : [...selectedEventIds, eventId]

    setSavingProfile(true)
    await updateProfile({
      wasteProfile: {
        ...activeAccount.wasteProfile,
        selectedBalineseEventIds: nextIds,
      },
    })
    setSavingProfile(false)
    setSavedToast('Pilihan Hari Raya Bali & prediksi lonjakan sampah Anda telah diperbarui.')
  }

  async function handleSaveWeeklyBags(nextBags: number) {
    if (!activeAccount || !activeAccount.wasteProfile) return
    const clamped = Math.max(1, Math.min(40, nextBags))
    setBagCount(clamped)
    const liters = clamped * 15
    setSavingProfile(true)
    await updateProfile({
      wasteProfile: {
        ...activeAccount.wasteProfile,
        weeklyRegularLiters: liters,
      },
    })
    setSavingProfile(false)
    setSavedToast(`Profil timbulan rutin diperbarui menjadi ${clamped} kantong (~${liters} L/minggu).`)
  }

  const selectedBaliEvents: BalineseCalendarEvent[] = BALINESE_CALENDAR_EVENTS_2026.filter((ev) =>
    selectedEventIds.includes(ev.id),
  )

  return (
    <main id="main" className="grid gap-6" data-testid="warga-portal">
      {/* 1. Personal Welcome & Action Header */}
      <section className="vector-card bg-card p-6 grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="vector-pill bg-mint text-ink tilt-left">
              <MaterialIcon name="home" size="sm" />
              Portal Warga · {activeAccount.kecamatan}
            </span>
            <span className="vector-pill bg-amber text-ink">
              <MaterialIcon name="location_on" size="sm" />
              {activeAccount.desa} · {activeAccount.address}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/report"
              className="vector-btn inline-flex items-center gap-2 rounded-md border-2 border-ink bg-primary px-4 py-2 text-sm font-extrabold text-white"
            >
              <MaterialIcon name="add_a_photo" size="sm" />
              Lapor Tumpukan / Foto Sampah
            </Link>
            <Link
              href="/masuk"
              className="vector-btn inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-bg px-3 py-2 text-xs font-bold text-ink"
            >
              <MaterialIcon name="manage_accounts" size="sm" />
              Ganti Akun
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div className="grid gap-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Halo, {activeAccount.name}
            </h1>
            <p className="text-base font-medium text-ink/85">
              Pantau jadwal pengangkutan sampah di rumah Anda, simpan jadwal ke kalender HP/Google, dan atur persiapan sampah menjelang Hari Raya Bali.
            </p>
          </div>

          {/* Personal Weekly Output Quick Adjuster (No Jargon!) */}
          <div className="vector-card-soft bg-mint/35 p-4 grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="warga-bag-counter" className="text-xs font-extrabold uppercase text-primary">
                Rata-Rata Sampah Mingguan Rumah Anda
              </Label>
              <span className="rounded border border-ink bg-card px-2 py-0.5 text-xs font-extrabold">
                ~{weeklyLiters} Liter / minggu
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                className="px-2.5 py-1 text-xs"
                disabled={savingProfile}
                onClick={() => void handleSaveWeeklyBags(bagCount - 1)}
              >
                -1 Kantong
              </Button>
              <div className="flex items-center gap-1.5">
                <Input
                  id="warga-bag-counter"
                  type="number"
                  min={1}
                  max={40}
                  value={bagCount}
                  onChange={(e) => setBagCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 text-center font-extrabold"
                />
                <span className="text-xs font-bold">kantong sedang (15L)</span>
              </div>
              <Button
                variant="secondary"
                className="px-2.5 py-1 text-xs"
                disabled={savingProfile}
                onClick={() => void handleSaveWeeklyBags(bagCount + 1)}
              >
                +1 Kantong
              </Button>
              <Button
                variant="primary"
                className="px-3 py-1 text-xs"
                disabled={savingProfile}
                onClick={() => void handleSaveWeeklyBags(bagCount)}
              >
                Simpan
              </Button>
            </div>
          </div>
        </div>

        {savedToast ? (
          <p role="status" className="text-xs font-extrabold text-primary flex items-center gap-1">
            <MaterialIcon name="check_circle" size="sm" />
            {savedToast}
          </p>
        ) : null}
      </section>

      {/* 2. Personal Status Cards (Only what matters to this resident) */}
      {optimization ? (
        <section className="grid gap-4 md:grid-cols-3" aria-label="Ringkasan Status Sampah Anda">
          <div className="vector-card bg-mint/45 p-4 grid gap-1">
            <span className="text-xs font-extrabold uppercase text-primary flex items-center gap-1">
              <MaterialIcon name="local_shipping" size="sm" />
              Timbulan Rutin Mingguan
            </span>
            <p className="text-2xl font-extrabold">
              {optimization.baseWeeklyLiters} L ({optimization.equivalentContainers} {optimization.containerLabel})
            </p>
            <p className="text-xs font-semibold text-ink/80">
              {optimization.headline}
            </p>
          </div>

          <div className="vector-card bg-lavender/45 p-4 grid gap-1">
            <span className="text-xs font-extrabold uppercase text-primary flex items-center gap-1">
              <MaterialIcon name="temple_hindu" size="sm" />
              Prediksi Pekan Hari Raya Bali
            </span>
            <p className="text-2xl font-extrabold" data-testid="warga-event-total-liters">
              {optimization.totalWeeklyLiters} L{' '}
              <span className="text-sm font-bold">(+{optimization.eventExtraLiters} L)</span>
            </p>
            <p className="text-xs font-semibold text-ink/80">
              {optimization.overallStatus !== 'action_required'
                ? 'Masuk dalam kuota toleransi leeway petugas di kecamatan Anda.'
                : 'Melebihi kuota reguler — disarankan membagi ke beberapa hari angkut.'}
            </p>
          </div>

          <div className="vector-card bg-amber/40 p-4 grid gap-1">
            <span className="text-xs font-extrabold uppercase text-primary flex items-center gap-1">
              <MaterialIcon name="event_upcoming" size="sm" />
              Penjemputan Terdekat
            </span>
            <p className="text-lg font-extrabold">
              {upcomingPickups[0]
                ? `${upcomingPickups[0].date} · ${upcomingPickups[0].stream.toUpperCase()}`
                : 'Senin Pagi · ORGANIK'}
            </p>
            <p className="text-xs font-semibold text-ink/80">
              {upcomingPickups[0]
                ? `Pukul ${upcomingPickups[0].window} (${upcomingPickups[0].containersLabel})`
                : 'Siapkan di depan rumah sebelum pukul 06:00 WITA.'}
            </p>
          </div>
        </section>
      ) : null}

      {/* 3. Interactive Calendar with Clickable Day Cells & Add to User's Actual Calendar */}
      <section aria-labelledby="warga-calendar-heading" className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="warga-calendar-heading" className="text-2xl font-extrabold flex items-center gap-2">
            <MaterialIcon name="calendar_month" className="text-primary" />
            Kalender Jemputan & Rahinan Bali Saya
          </h2>
          <span className="text-xs font-bold text-ink/75">
            Klik sel tanggal untuk melihat jadwal & menyimpan ke Google Calendar / Kalender HP (.ics)
          </span>
        </div>

        <InteractiveCalendar
          kecamatan={activeAccount.kecamatan}
          timetable={timetable}
          weeklyRegularLiters={weeklyLiters}
          selectedBalineseEventIds={selectedEventIds}
          onToggleBalineseEvent={(eventId) => void handleToggleBalineseEvent(eventId)}
        />
      </section>

      {/* 4. Balinese Calendar (Kalender Bali) Personal Selector & AI Surge Prediction */}
      <section
        aria-labelledby="balinese-events-heading"
        data-testid="balinese-events-section"
        className="vector-card bg-card p-6 grid gap-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <span className="vector-pill bg-lavender text-ink w-fit">
              <MaterialIcon name="temple_hindu" size="sm" />
              Prediksi Cerdas Kalender Bali
            </span>
            <h2 id="balinese-events-heading" className="text-2xl font-extrabold">
              Pilih Hari Raya & Rahinan yang Mempengaruhi Rumah Anda
            </h2>
            <p className="text-sm text-ink/80 max-w-3xl">
              Kalender Bali memiliki banyak Rahinan. Centang hari raya atau upacara yang Anda rayakan di rumah/tempat usaha agar sistem memprediksi lonjakan sampah organik (canang, janur, penjor) dan menyesuaikan kuota jemputan petugas.
            </p>
          </div>
          <div className="vector-card-soft bg-mint/40 px-3.5 py-2 text-xs font-extrabold">
            {selectedBaliEvents.length} dari {BALINESE_CALENDAR_EVENTS_2026.length} Rahinan dipilih
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BALINESE_CALENDAR_EVENTS_2026.map((ev) => {
            const checked = selectedEventIds.includes(ev.id)
            return (
              <label
                key={ev.id}
                data-testid={`bali-event-toggle-${ev.id}`}
                className={[
                  'cursor-pointer rounded-md border-2 p-3.5 transition-transform flex flex-col justify-between gap-2',
                  checked
                    ? 'border-ink bg-lavender/40 -translate-y-0.5'
                    : 'border-ink/40 bg-bg hover:bg-card',
                ].join(' ')}
              >
                <div className="grid gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-extrabold text-primary">{ev.date}</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={checked}
                      onChange={() => void handleToggleBalineseEvent(ev.id)}
                    />
                  </div>
                  <p className="font-extrabold text-sm">{ev.name}</p>
                  <p className="text-xs font-semibold text-ink/70">{ev.balineseName}</p>
                </div>

                <div className="grid gap-1 pt-2 border-t border-ink/20 text-xs">
                  <span className="font-extrabold text-ink">
                    Lonjakan: +{ev.extraLitersHousehold} L (Organik +{ev.organicSurgePct}%)
                  </span>
                  <span className="text-ink/75">{ev.typicalWasteItems.join(', ')}</span>
                </div>
              </label>
            )
          })}
        </div>

        {/* Personalized AI & Schedule Recommendation for Selected Balinese Events */}
        {optimization ? (
          <div className="vector-card-soft bg-sky/30 p-4 grid gap-2" data-testid="bali-prediction-summary">
            <h3 className="text-base font-extrabold flex items-center gap-1.5">
              <MaterialIcon name="auto_awesome" size="sm" className="text-primary" />
              Rekomendasi Pengelolaan & Leeway Armada untuk Rahinan Pilihan Anda
            </h3>
            <p className="text-sm font-semibold text-ink/90">
              {optimization.actionItems.join(' ')}
            </p>
            {selectedBaliEvents.length > 0 ? (
              <ul className="grid gap-1.5 pt-1 text-xs font-medium text-ink/85 sm:grid-cols-2">
                {selectedBaliEvents.slice(0, 4).map((ev) => (
                  <li key={ev.id} className="rounded border border-ink/30 bg-card/80 px-3 py-2">
                    <strong>{ev.name} ({ev.date}):</strong> {ev.preparationTip}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* 5. Previous Pickups & Upcoming Pickups Timeline */}
      <section className="grid gap-5 lg:grid-cols-2" aria-label="Riwayat dan Jadwal Pengangkutan">
        {/* Upcoming Pickups */}
        <div className="vector-card bg-card p-5 grid content-start gap-3" data-testid="upcoming-pickups-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <MaterialIcon name="upcoming" className="text-primary" />
              Jadwal Pengangkutan Mendatang
            </h2>
            <span className="vector-pill bg-mint text-ink text-xs">
              {upcomingPickups.length} Terjadwal
            </span>
          </div>
          <p className="text-xs text-ink/75">
            Perkiraan waktu kedatangan armada di {activeAccount.address} beserta toleransi leeway petugas.
          </p>
          <ul className="grid gap-2.5">
            {upcomingPickups.map((item) => (
              <li key={item.id} className="vector-card-soft bg-bg p-3.5 grid gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-sm">
                    {item.date} · Armada {item.stream.toUpperCase()}
                  </span>
                  <span className="rounded border border-ink bg-mint px-2 py-0.5 text-[11px] font-extrabold">
                    ~{item.liters} Liter ({item.containersLabel})
                  </span>
                </div>
                <p className="text-xs font-bold text-primary">
                  Pukul {item.window}
                </p>
                <p className="text-xs text-ink/80">{item.notes}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Past Pickups */}
        <div className="vector-card bg-card p-5 grid content-start gap-3" data-testid="past-pickups-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <MaterialIcon name="history" className="text-primary" />
              Riwayat Pengangkutan Sebelumnya
            </h2>
            <span className="vector-pill bg-sky text-ink text-xs">
              {pastPickups.length} Selesai
            </span>
          </div>
          <p className="text-xs text-ink/75">
            Catatan penjemputan sampah yang telah diselesaikan oleh kru DLHK di rumah/usaha Anda.
          </p>
          <ul className="grid gap-2.5">
            {pastPickups.map((item) => (
              <li key={item.id} className="vector-card-soft bg-bg p-3.5 grid gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-sm flex items-center gap-1">
                    <MaterialIcon name="check_circle" size="sm" className="text-success" />
                    {item.date} · {item.stream.toUpperCase()}
                  </span>
                  <span className="rounded border border-ink bg-card px-2 py-0.5 text-[11px] font-extrabold">
                    {item.liters} Liter ({item.containersLabel})
                  </span>
                </div>
                <p className="text-xs font-semibold text-ink/75">
                  Jam Angkut: {item.window}
                </p>
                <p className="text-xs text-ink/80">{item.notes}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Subtle, Non-Intrusive Optional Info for B3 / Special Waste */}
      <details className="vector-card-soft bg-bg p-4 text-sm">
        <summary className="cursor-pointer font-bold text-ink/80 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MaterialIcon name="info" size="sm" className="text-primary" />
            Punya barang elektronik rusak, baterai bekas, atau kaleng cat? (Info Jemput Terpisah)
          </span>
          <span className="text-xs font-extrabold underline">Lihat Panduan</span>
        </summary>
        <div className="mt-3 border-t border-ink/20 pt-3 text-xs text-ink/80 grid gap-2">
          <p>
            Untuk menjaga keselamatan petugas pengomposan, benda seperti baterai, lampu neon, aki, atau limbah medis tidak digabung ke kantong organik/anorganik harian.
          </p>
          <p>
            Simpan di wadah kering tertutup dan gunakan tombol{' '}
            <Link href="/report" className="font-extrabold text-primary underline">
              Lapor Tumpukan / Foto Sampah
            </Link>{' '}
            jika Anda memerlukan penjemputan khusus oleh unit terkait.
          </p>
        </div>
      </details>
    </main>
  )
}
