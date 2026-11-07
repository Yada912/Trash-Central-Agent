'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Textarea } from '@/components/ui/textarea'

const CURATED_CONDITIONS = [
  {
    label: 'Menumpuk di depan rumah',
    icon: 'home',
    snippet: 'Ada tumpukan sampah rumah tangga di depan rumah yang sudah penuh dan siap diangkut.',
  },
  {
    label: 'Sisa upacara / canang & janur',
    icon: 'celebration',
    snippet: 'Tumpukan sampah organik sisa upacara adat (janur, canang, daun pisang, dan bunga) pasca hari raya/odalan.',
  },
  {
    label: 'Tempat sampah meluber ke jalan',
    icon: 'warning',
    snippet: 'Bak/tempat sampah sudah penuh dan meluber ke tepi jalan sehingga mengganggu warga.',
  },
  {
    label: 'Dominan botol plastik & kardus',
    icon: 'recycling',
    snippet: 'Kantong berisi kumpulan botol plastik kemasan, gelas plastik, dan kardus kering yang sudah dipisah.',
  },
  {
    label: 'Ada limbah berbahaya (B3)',
    icon: 'battery_alert',
    snippet: 'Terdapat limbah berbahaya (B3) berupa baterai bekas, kaleng cat/aerosol, atau pecahan lampu neon yang dipisahkan.',
  },
] as const

const CONTAINER_CHIPS = [
  { label: '~2 Kantong Kresek (~30 L)', text: 'Perkiraan sekitar 2 kantong kresek sedang (~30 liter).' },
  { label: '~2 Ember Rumah (~50 L)', text: 'Perkiraan sekitar 2 ember sampah penuh (~50 liter).' },
  { label: '~2 Karung Besar (~100 L)', text: 'Perkiraan sekitar 2 karung besar penuh (~100 liter).' },
  { label: '~1 Gerobak Penuh (~150 L)', text: 'Perkiraan sekitar 1 gerobak dorong penuh (~150 liter).' },
] as const

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

export function DescriptionField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [listening, setListening] = useState(false)
  const [speechNotice, setSpeechNotice] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  function appendSnippet(snippet: string) {
    const trimmed = value.trim()
    const next = trimmed ? `${trimmed} ${snippet}` : snippet
    onChange(next.slice(0, 1000))
  }

  function toggleSpeechToText() {
    setSpeechNotice(null)
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      setListening(false)
      return
    }

    const win = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : null
    const SpeechRec = (win?.SpeechRecognition ?? win?.webkitSpeechRecognition) as
      | (new () => SpeechRecognitionInstance)
      | undefined

    if (!SpeechRec) {
      setSpeechNotice('Peramban ini belum mendukung pendiktean suara langsung. Gunakan Chrome/Edge/Safari atau pilih tombol kondisi cepat di atas.')
      return
    }

    try {
      const rec = new SpeechRec()
      rec.lang = 'id-ID'
      rec.continuous = false
      rec.interimResults = false
      rec.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((res) => res[0]?.transcript ?? '')
          .join(' ')
          .trim()
        if (transcript) {
          const current = value.trim()
          onChange((current ? `${current} ${transcript}` : transcript).slice(0, 1000))
        }
      }
      rec.onerror = () => {
        setSpeechNotice('Gagal menangkap suara. Pastikan izin mikrofon peramban diaktifkan.')
        setListening(false)
      }
      rec.onend = () => {
        setListening(false)
      }
      recognitionRef.current = rec
      setListening(true)
      rec.start()
    } catch {
      setSpeechNotice('Tidak dapat memulai perekaman suara pada perangkat ini.')
      setListening(false)
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="description" className="text-base font-extrabold flex items-center gap-1.5">
          <MaterialIcon name="chat" className="text-primary" />
          Apa yang Anda lihat?
        </Label>
        <Button
          variant={listening ? 'alert' : 'secondary'}
          onClick={toggleSpeechToText}
          aria-pressed={listening}
        >
          <MaterialIcon name={listening ? 'stop_circle' : 'mic'} />
          {listening ? 'Berhenti Rekam Suara…' : 'Isi dengan Suara (Bahasa Indonesia)'}
        </Button>
      </div>

      {speechNotice ? <p className="text-xs font-bold text-alert">{speechNotice}</p> : null}

      {/* Guided Curated Prompts: "Bagaimana kondisi sampah yang sekarang?" */}
      <div className="vector-card-soft bg-bg p-3.5 grid gap-2.5">
        <p className="text-xs font-extrabold uppercase tracking-wide text-primary flex items-center gap-1">
          <MaterialIcon name="touch_app" size="sm" />
          Pilih cepat kondisi sampah sekarang (klik untuk mengisi otomatis):
        </p>
        <div className="flex flex-wrap gap-2">
          {CURATED_CONDITIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => appendSnippet(item.snippet)}
              className="inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-card px-2.5 py-1.5 text-xs font-bold hover:bg-amber/50 active:translate-y-0.5"
            >
              <MaterialIcon name={item.icon} size="sm" className="text-primary" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-ink/10">
          <span className="text-[11px] font-bold text-ink/70 mr-1">Perkiraan wadah:</span>
          {CONTAINER_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => appendSnippet(chip.text)}
              className="rounded border border-ink bg-mint/60 px-2 py-1 text-[11px] font-bold hover:bg-mint"
            >
              + {chip.label}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        id="description"
        name="description"
        maxLength={1000}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ceritakan kondisi sampah sekarang, jenis dominan (organik/plastik/residu), dan apakah ini sampah rutin mingguan atau sisa acara..."
      />
      <div className="flex items-center justify-between text-xs font-semibold text-ink/75">
        <span>Tips: Pilih tombol di atas atau tekan tombol mikrofon untuk berbicara langsung.</span>
        <span>{value.trim().length} / 1000</span>
      </div>
    </div>
  )
}
