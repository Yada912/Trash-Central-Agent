'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Textarea } from '@/components/ui/textarea'
import { BaliVectorMap } from '@/components/home/bali-vector-map'
import type { ClassifyOutcome } from '@/lib/schemas'

const GUEST_LIMIT = 5
const GUEST_STORAGE_KEY = 'cta_guest_try_count_v1'

const SAMPLE_PROMPTS = [
  {
    label: 'Canang & Janur Galungan',
    text: 'Ada 3 kantong besar sampah organik sisa daun canang sari, janur penjor, dan kulit buah sekitar 45 liter di depan rumah seusai Hari Raya Galungan.',
  },
  {
    label: 'Botol Plastik Warung',
    text: 'Tumpukan botol plastik minuman kemasan bersih sekitar 30 liter sudah dikumpulkan dalam 2 karung di dekat warung makan.',
  },
  {
    label: 'Baterai & Lampu Bekas',
    text: 'Ada baterai bekas bocor dan kaleng pestisida sekitar 5 liter yang dipisahkan di dalam kotak tertutup.',
  },
] as const

export default function HomePage() {
  const [guestTriesUsed, setGuestTriesUsed] = useState(0)
  const [sampleText, setSampleText] = useState<string>(SAMPLE_PROMPTS[0].text)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ClassifyOutcome | null>(null)
  const [modelUsed, setModelUsed] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(GUEST_STORAGE_KEY) ?? '0')
      if (Number.isFinite(saved) && saved >= 0) {
        setGuestTriesUsed(Math.min(GUEST_LIMIT, saved))
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  const remainingTries = Math.max(0, GUEST_LIMIT - guestTriesUsed)

  async function handleGuestTry() {
    if (remainingTries <= 0) {
      setError('Batas 5 kali uji coba tamu telah habis. Silakan masuk atau daftar akun gratis untuk melanjutkan.')
      return
    }
    if (!sampleText.trim()) {
      setError('Masukkan deskripsi singkat kondisi sampah terlebih dahulu.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const response = await fetch('/api/reports/classify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: sampleText.trim() }),
      })
      const json = (await response.json()) as {
        ok: boolean
        data?: ClassifyOutcome
        meta?: { model?: string }
        error?: { message?: string }
      }
      if (!response.ok || !json.ok || !json.data) {
        setError(json.error?.message ?? 'Gagal menjalankan klasifikasi uji coba.')
        return
      }
      setResult(json.data)
      setModelUsed(json.meta?.model ?? null)
      const nextCount = Math.min(GUEST_LIMIT, guestTriesUsed + 1)
      setGuestTriesUsed(nextCount)
      try {
        window.localStorage.setItem(GUEST_STORAGE_KEY, String(nextCount))
      } catch {
        // ignore
      }
    } catch {
      setError('Gagal terhubung ke server klasifikasi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main id="main" className="grid gap-8">
      {/* 1. Hero Section */}
      <section className="vector-card bg-card p-6 md:p-8 grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="vector-pill bg-mint text-ink tilt-left">
              <MaterialIcon name="eco" size="sm" />
              Kota Denpasar · Bali
            </span>
            <span className="vector-pill bg-amber text-ink tilt-right">
              <MaterialIcon name="temple_hindu" size="sm" />
              Terintegrasi Kalender Bali & Jadwal Kecamatan
            </span>
          </div>
          <Link
            href="/masuk"
            className="vector-btn inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-gold px-3.5 py-1.5 text-xs font-extrabold text-ink"
          >
            <MaterialIcon name="login" size="sm" />
            Masuk / Daftar Akun
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div className="grid gap-3">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Central Trash Agent
            </h1>
            <p className="text-lg font-medium text-ink/85">
              Platform pengelolaan sampah cerdas yang menghubungkan <strong>Warga & UMKM Kota Denpasar</strong> dengan <strong>Armada Petugas DLHK</strong>. Dilengkapi kalender jemputan interaktif, prediksi lonjakan sampah Hari Raya Bali, dan optimasi rute pengangkutan.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/warga"
                data-testid="open-warga-portal-link"
                className="vector-btn inline-flex items-center gap-2 rounded-md border-2 border-ink bg-primary px-5 py-3 text-base font-extrabold text-white"
              >
                <MaterialIcon name="home" />
                Portal Warga
              </Link>
              <Link
                href="/petugas"
                data-testid="open-petugas-portal-link"
                className="vector-btn inline-flex items-center gap-2 rounded-md border-2 border-ink bg-lavender px-5 py-3 text-base font-extrabold text-ink"
              >
                <MaterialIcon name="badge" />
                Portal Petugas DLHK
              </Link>
              <Link
                href="/report"
                className="vector-btn inline-flex items-center gap-2 rounded-md border-2 border-ink bg-mint px-4 py-3 text-sm font-extrabold text-ink"
              >
                <MaterialIcon name="add_a_photo" size="sm" />
                Laporkan tumpukan
              </Link>
              <Link
                href="/dashboard"
                className="vector-btn inline-flex items-center gap-2 rounded-md border-2 border-ink bg-card px-4 py-3 text-sm font-extrabold text-ink"
              >
                <MaterialIcon name="space_dashboard" size="sm" />
                Lihat dasbor
              </Link>
            </div>
          </div>

          {/* Role Comparison Quick Box */}
          <div className="grid gap-3">
            <div className="vector-card-soft bg-mint/45 p-4 grid gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-base flex items-center gap-1.5">
                  <MaterialIcon name="person" size="sm" className="text-primary" />
                  Tampilan Khusus Warga (`/warga`)
                </span>
                <Link href="/warga" className="text-xs font-extrabold text-primary underline">
                  Buka →
                </Link>
              </div>
              <p className="text-xs font-medium text-ink/85">
                Fokus pada rumah/usaha Anda sendiri: kalender hari angkut Organik/Anorganik/Residu, simpan jadwal ke Google Calendar/HP (`.ics`), pilih Rahinan Bali yang dirayakan, dan pantau riwayat pengangkutan.
              </p>
            </div>

            <div className="vector-card-soft bg-lavender/45 p-4 grid gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-base flex items-center gap-1.5">
                  <MaterialIcon name="local_shipping" size="sm" className="text-primary" />
                  Tampilan Khusus Petugas (`/petugas`)
                </span>
                <Link href="/petugas" className="text-xs font-extrabold text-primary underline">
                  Buka →
                </Link>
              </div>
              <p className="text-xs text-ink/85 font-medium">
                Pusat kendali armada DLHK: verifikasi laporan warga, kelola leeway jadwal per kecamatan, susun & setujui rute VRP dari TPA Suwung, serta uji efektivitas AI secara langsung.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive 3D Vector Map: Bali Decentralized Waste Coverage */}
      <section aria-labelledby="bali-map-heading" className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="vector-pill bg-mint text-ink tilt-left">
              <MaterialIcon name="explore" size="sm" />
              Sistem Desentralisasi Berbasis Sumber
            </span>
            <h2 id="bali-map-heading" className="mt-1 text-2xl font-extrabold tracking-tight">
              Peta Operasional & Cakupan Wilayah Bali
            </h2>
          </div>
          <p className="text-xs font-bold text-ink/75">
            Sesuai Pergub Bali No. 47 Tahun 2019 & Perda Kota Denpasar No. 8 Tahun 2023
          </p>
        </div>
        <BaliVectorMap />
      </section>

      {/* 3. About Section (Tentang Central Trash Agent) */}
      <section aria-labelledby="about-heading" className="grid gap-4 md:grid-cols-3">
        <div className="vector-card bg-card p-5 grid content-start gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-ink bg-mint">
            <MaterialIcon name="calendar_month" />
          </div>
          <h2 id="about-heading" className="text-lg font-extrabold">
            1. Kalender Jemputan & Rahinan Bali
          </h2>
          <p className="text-sm text-ink/80">
            Menyatukan jadwal pengangkutan rutin kecamatan dengan Kalender Bali (<em>Galungan, Kuningan, Purnama, Tilem, Kajeng Kliwon</em>). Warga dapat mengklik tanggal mana pun untuk mengunduh pengingat ke kalender pribadi.
          </p>
        </div>

        <div className="vector-card bg-card p-5 grid content-start gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-ink bg-amber">
            <MaterialIcon name="photo_camera" />
          </div>
          <h3 className="text-lg font-extrabold">
            2. Klasifikasi AI & Input Kantong Mudah
          </h3>
          <p className="text-sm text-ink/80">
            Tidak perlu menebak volume dalam liter. Gunakan kamera langsung, ketik, atau rekam suara Bahasa Indonesia, lalu sesuaikan dengan ukuran kantong kresek atau ember rumah tangga.
          </p>
        </div>

        <div className="vector-card bg-card p-5 grid content-start gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-ink bg-sky">
            <MaterialIcon name="route" />
          </div>
          <h3 className="text-lg font-extrabold">
            3. Optimasi Leeway & Rute Armada VRP
          </h3>
          <p className="text-sm text-ink/80">
            Petugas mengatur kuota toleransi (leeway) saat lonjakan hari raya, memisahkan limbah berbahaya dari truk biasa, dan menyusun rute paling efisien dengan log audit penuh.
          </p>
        </div>
      </section>

      {/* 3. Guest AI Sandbox (Limited to 1–5 Tries without an account) */}
      <section
        aria-labelledby="guest-sandbox-heading"
        data-testid="guest-ai-sandbox"
        className="vector-card bg-sky/25 p-6 grid gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="vector-pill bg-amber text-ink">
              <MaterialIcon name="auto_awesome" size="sm" />
              Coba Langsung Tanpa Akun
            </span>
            <h2 id="guest-sandbox-heading" className="mt-1.5 text-2xl font-extrabold">
              Uji Coba Klasifikasi Sampah AI (Batas {GUEST_LIMIT}x Percobaan Tamu)
            </h2>
            <p className="text-xs text-ink/80">
              Coba kemampuan analisis jenis dan volume sampah sebelum membuat akun. Dibatasi maksimal {GUEST_LIMIT} kali percobaan agar kuota token tetap terjaga.
            </p>
          </div>
          <div
            data-testid="guest-tries-badge"
            className="vector-card-soft bg-card px-4 py-2 text-xs font-extrabold"
          >
            Sisa Kuota Tamu: <span className="text-primary text-sm">{remainingTries}</span> / {GUEST_LIMIT}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold">Contoh Cepat:</span>
          {SAMPLE_PROMPTS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setSampleText(item.text)}
              className="rounded-md border-2 border-ink bg-card hover:bg-mint/45 px-2.5 py-1 text-xs font-bold transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-[1.3fr_1fr]">
          <div className="grid gap-2">
            <label htmlFor="guest-ai-input" className="text-xs font-extrabold uppercase">
              Deskripsi Kondisi Sampah
            </label>
            <Textarea
              id="guest-ai-input"
              rows={3}
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              disabled={remainingTries <= 0 || busy}
              placeholder="Contoh: Ada 3 kantong sampah organik sisa daun canang dan janur..."
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => void handleGuestTry()}
                disabled={remainingTries <= 0 || busy}
                data-testid="guest-try-submit-btn"
              >
                <MaterialIcon name="psychology" size="sm" />
                {busy
                  ? 'Menganalisis…'
                  : remainingTries > 0
                    ? `Uji Klasifikasi Sekarang (${remainingTries} sisa)`
                    : 'Kuota Tamu Habis'}
              </Button>
              {remainingTries <= 0 ? (
                <Link
                  href="/masuk"
                  className="vector-btn inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-gold px-3.5 py-2 text-xs font-extrabold text-ink"
                >
                  <MaterialIcon name="person_add" size="sm" />
                  Masuk / Daftar untuk Akses Penuh
                </Link>
              ) : null}
            </div>
            {error ? (
              <p role="alert" className="text-xs font-extrabold text-alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="vector-card-soft bg-card p-4 grid content-start gap-2" data-testid="guest-ai-result">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-primary">
                Hasil Analisis Uji Coba
              </span>
              {modelUsed ? (
                <span className="rounded border border-ink/40 bg-bg px-2 py-0.5 text-[10px] font-bold">
                  {modelUsed}
                </span>
              ) : null}
            </div>

            {!result ? (
              <p className="text-xs text-ink/70">
                Klik tombol <strong>Uji Klasifikasi Sekarang</strong> untuk melihat hasil estimasi jenis sampah, persentase komposisi, dan perkiraan jumlah kantong/liter.
              </p>
            ) : result.kind === 'trash' ? (
              <div className="grid gap-1.5 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  {result.classification.types.map((t) => (
                    <span
                      key={t.type}
                      className="rounded border-2 border-ink bg-mint px-2 py-0.5 font-extrabold uppercase"
                    >
                      {t.type}: {Math.round(t.share * 100)}%
                    </span>
                  ))}
                </div>
                <p className="font-extrabold text-sm mt-1">
                  Estimasi Volume: {result.classification.volume.liters} Liter (~
                  {Math.max(1, Math.round(result.classification.volume.liters / 15))} kantong sedang)
                </p>
                <p className="font-semibold text-ink/80">
                  Urgensi: <strong>{result.classification.urgency}</strong> · Kepercayaan:{' '}
                  <strong>{Math.round(result.classification.confidence * 100)}%</strong>
                </p>
                <p className="text-ink/80 bg-bg p-2 rounded border border-ink/20">
                  {result.classification.rationale}
                </p>
              </div>
            ) : result.kind === 'insufficient' ? (
              <p className="text-xs font-bold text-alert">{result.reason}</p>
            ) : (
              <p className="text-xs font-bold">{result.reason}</p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
