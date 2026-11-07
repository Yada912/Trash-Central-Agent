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
  const [transcribing, setTranscribing] = useState(false)
  const [speechNotice, setSpeechNotice] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  function appendSnippet(snippet: string) {
    const trimmed = value.trim()
    const next = trimmed ? `${trimmed} ${snippet}` : snippet
    onChange(next.slice(0, 1000))
  }

  function toggleSpeechToText() {
    setSpeechNotice(null)
    if ((listening || transcribing) && recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      setListening(false)
      setTranscribing(false)
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
        setTranscribing(false)
        setListening(false)
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
        setTranscribing(false)
      }
      rec.onend = () => {
        setListening(false)
        setTranscribing(false)
      }
      recognitionRef.current = rec
      setListening(true)
      setTranscribing(false)
      rec.start()
    } catch {
      setSpeechNotice('Tidak dapat memulai perekaman suara pada perangkat ini.')
      setListening(false)
      setTranscribing(false)
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
          variant={listening || transcribing ? 'alert' : 'secondary'}
          onClick={toggleSpeechToText}
          aria-pressed={listening || transcribing}
        >
          <MaterialIcon name={listening ? 'stop_circle' : 'mic'} />
          {listening ? 'Berhenti Rekam Suara…' : transcribing ? 'Memproses Teks…' : 'Isi dengan Suara (Bahasa Indonesia)'}
        </Button>
      </div>

      {listening || transcribing ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 rounded-xl border-2 border-ink bg-coral/20 px-3.5 py-2.5 text-xs font-black text-ink shadow-[2px_2px_0_#1F2933] animate-pulse"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-coral"></span>
            </span>
            <MaterialIcon name={listening ? 'mic' : 'sync'} size="sm" className="text-coral" />
            <span>
              {listening
                ? 'Mendengarkan suara Anda... Silakan berbicara (Bahasa Indonesia)'
                : 'Sedang memproses suara ke teks...'}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleSpeechToText}
            className="rounded border border-ink bg-card px-2 py-0.5 text-[11px] font-black text-ink hover:bg-coral hover:text-white transition-colors"
          >
            Selesai
          </button>
        </div>
      ) : null}

      {speechNotice ? <p className="text-xs font-bold text-alert">{speechNotice}</p> : null}

      {/* Guided Curated Prompts: "Bagaimana kondisi sampah yang sekarang?" */}
      <div className="vector-card-soft bg-bg p-3.5 grid gap-2.5 border-2 border-ink">
        <p className="text-xs font-black uppercase tracking-wide text-primary flex items-center gap-1">
          <MaterialIcon name="touch_app" size="sm" />
          Pilih cepat kondisi sampah sekarang (klik untuk mengisi otomatis):
        </p>
        <div className="flex flex-wrap gap-2">
          {CURATED_CONDITIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => appendSnippet(item.snippet)}
              className="inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-card px-2.5 py-1.5 text-xs font-black text-ink hover:bg-amber/50 active:translate-y-0.5 shadow-[1px_1px_0_#1F2933]"
            >
              <MaterialIcon name={item.icon} size="sm" className="text-primary" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t-2 border-ink/20">
          <span className="text-[11px] font-black text-ink mr-1">Perkiraan wadah:</span>
          {CONTAINER_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => appendSnippet(chip.text)}
              className="rounded border-2 border-ink bg-mint px-2 py-1 text-[11px] font-black text-ink hover:bg-mint/80 shadow-[1px_1px_0_#1F2933]"
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
      <div className="flex items-center justify-between text-xs font-bold text-ink">
        <span>Tips: Pilih tombol di atas atau tekan tombol mikrofon untuk berbicara langsung.</span>
        <span>{value.trim().length} / 1000</span>
      </div>
    </div>
  )
}
