'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import { useAccount } from '@/components/account/use-account'
import type { AgentChatMessage, AgentMemoryItem } from '@/lib/accounts/store'

const QUICK_PROMPTS = [
  'Ada upacara potong gigi (metatah) minggu ini, butuh tampungan janur & canang',
  'Kondisi tempat sampah di depan rumah sudah mulai meluber',
  'Banyak kardus dan botol plastik sisa belanja paket akhir pekan',
  'Bagaimana jadwal penjemputan sampah organik terdekat di banjar saya?',
]

export function WargaAgentChat() {
  const { activeAccount, reload } = useAccount()
  const [messages, setMessages] = useState<AgentChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [lastUpdateNotice, setLastUpdateNotice] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Initialize chat messages from activeAccount profile or welcoming message
  useEffect(() => {
    if (activeAccount?.wasteProfile?.chatMessages && activeAccount.wasteProfile.chatMessages.length > 0) {
      setMessages(activeAccount.wasteProfile.chatMessages)
    } else {
      setMessages([
        {
          id: 'welcome_kresna',
          sender: 'agent',
          text: `Om Swastyastu, ${activeAccount?.name || 'Warga Denpasar'}! Saya Kresna, Asisten Pengelola Sampah Cerdas Kota Denpasar. Ada upacara adat, hajatan keluarga, atau tempat sampah yang mulai penuh minggu ini? Ceritakan pada saya agar model timbulan dan jadwal jemputan TPS3R Anda langsung diselaraskan secara otomatis.`,
          timestamp: new Date().toISOString(),
          modelUpdateSummary: 'Model timbulan aktif tersinkronisasi dengan TPS3R kecamatan Anda.',
        },
      ])
    }
  }, [activeAccount?.id, activeAccount?.wasteProfile?.chatMessages, activeAccount?.name])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isSending])

  async function handleSendMessage(textToSend?: string) {
    const raw = (textToSend ?? input).trim()
    if (!raw || isSending || !activeAccount) return

    const userMessageId = `usr_${Date.now()}`
    const tempUserMsg: AgentChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: raw,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, tempUserMsg])
    setInput('')
    setIsSending(true)
    setLastUpdateNotice(null)

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: raw,
          accountId: activeAccount.id,
        }),
      })

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as {
          error?: { message?: string }
        }
        throw new Error(errorData.error?.message || 'Gagal menghubungi asisten.')
      }

      const payload = (await res.json()) as {
        data: {
          reply: string
          modelUpdateSummary?: string
          updatedAccount?: { wasteProfile?: { chatMessages?: AgentChatMessage[] } }
        }
      }

      const agentMessageId = `agt_${Date.now()}`
      const agentMsg: AgentChatMessage = {
        id: agentMessageId,
        sender: 'agent',
        text: payload.data.reply,
        timestamp: new Date().toISOString(),
        modelUpdateSummary: payload.data.modelUpdateSummary,
      }

      setMessages((prev) => [...prev, agentMsg])
      if (payload.data.modelUpdateSummary) {
        setLastUpdateNotice(payload.data.modelUpdateSummary)
      }

      // Reload global account context to sync weekly volume, conditions, and leeway cards
      await reload()
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : 'Terjadi kendala jaringan.'
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'agent',
          text: `Mohon maaf, kendala: ${errText}. Silakan coba kirim kembali pesan Anda.`,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  // Voice speech-to-text using native Web Speech API (id-ID)
  function handleToggleVoiceRecognition() {
    if (typeof window === 'undefined') return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Fitur input suara (Speech to Text) didukung di browser Google Chrome, Edge, atau Safari modern.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'id-ID'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsListening(true)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
        }
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  const memoryItems: AgentMemoryItem[] = activeAccount?.wasteProfile?.agentMemory ?? []
  const condition = activeAccount?.wasteProfile?.currentCondition ?? 'terkendali'

  const conditionLabels: Record<string, { label: string; bg: string; icon: string }> = {
    terkendali: { label: 'Terkendali', bg: 'bg-mint', icon: 'check_circle' },
    menumpuk: { label: 'Menumpuk (+Perhatian)', bg: 'bg-amber', icon: 'warning' },
    meluber: { label: 'Meluber (Prioritas Armada)', bg: 'bg-coral text-white', icon: 'error' },
    pasca_upacara: { label: 'Pasca Upacara Adat', bg: 'bg-lavender', icon: 'temple_hindu' },
  }

  const currentConditionMeta = conditionLabels[condition] ?? conditionLabels.terkendali

  return (
    <section
      aria-labelledby="warga-agent-heading"
      className="vector-card bg-card p-5 grid gap-4"
      data-testid="warga-agent-chat-section"
    >
      {/* 1. Header with Kresna Avatar & Live Demand Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-sky text-ink shadow-[2px_2px_0_#1F2933]">
            <MaterialIcon name="smart_toy" size="lg" />
          </div>
          <div className="grid gap-0.5">
            <div className="flex items-center gap-2">
              <h2 id="warga-agent-heading" className="text-xl font-black text-ink">
                Kresna — Agen Sampah Cerdas
              </h2>
              <span className="vector-pill bg-mint text-ink text-[11px] font-extrabold py-0.5 px-2">
                Demand-Based AI
              </span>
            </div>
            <p className="text-xs text-ink/75 font-medium">
              Menyelaraskan timbulan sampah Anda langsung dengan kuota armada TPS3R{' '}
              {activeAccount?.tps3rNode ?? activeAccount?.kecamatan}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-lg border-2 border-ink px-2.5 py-1 text-xs font-black flex items-center gap-1 shadow-[2px_2px_0_#1F2933] ${currentConditionMeta.bg}`}
          >
            <MaterialIcon name={currentConditionMeta.icon} size="sm" />
            Kondisi: {currentConditionMeta.label}
          </span>
          <span className="rounded-lg border-2 border-ink bg-bg px-2.5 py-1 text-xs font-black text-ink">
            ~{activeAccount?.wasteProfile?.weeklyRegularLiters ?? 105} L / minggu
          </span>
        </div>
      </div>

      {/* 2. Personalized Agent Memory Tags (if any exist) */}
      {memoryItems.length > 0 ? (
        <div className="rounded-xl border border-ink/30 bg-mint/25 p-2.5 text-xs grid gap-1">
          <span className="font-extrabold text-primary flex items-center gap-1 text-[11px]">
            <MaterialIcon name="psychology" size="sm" />
            Memori Personal Kresna tentang Rumah Anda:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {memoryItems.map((mem) => (
              <span
                key={mem.id}
                className="rounded-md border border-ink bg-card px-2 py-0.5 text-[11px] font-bold text-ink"
              >
                📌 {mem.fact}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* 3. Live Model Update Notice Banner */}
      {lastUpdateNotice ? (
        <div
          role="status"
          className="rounded-xl border-2 border-ink bg-mint p-3 text-xs font-black text-ink shadow-[2px_2px_0_#1F2933] flex items-center gap-2"
        >
          <MaterialIcon name="auto_awesome" className="text-primary text-base" />
          <span>{lastUpdateNotice}</span>
        </div>
      ) : null}

      {/* 4. Chat Message Feed */}
      <div
        ref={scrollRef}
        tabIndex={0}
        aria-label="Riwayat Percakapan Asisten Sampah"
        className="flex max-h-[340px] min-h-[180px] flex-col gap-3 overflow-y-auto rounded-xl border-2 border-ink bg-bg p-3.5 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {messages.map((msg) => {
          const isAgent = msg.sender === 'agent'
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${isAgent ? 'items-start mr-6 sm:mr-12' : 'items-end ml-6 sm:ml-12'}`}
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-ink/70">
                <MaterialIcon name={isAgent ? 'smart_toy' : 'person'} size="sm" />
                <span>{isAgent ? 'Kresna (Asisten DLHK)' : 'Anda (Warga)'}</span>
              </div>
              <div
                className={`rounded-2xl border-2 border-ink p-3 text-sm font-medium leading-relaxed ${
                  isAgent
                    ? 'bg-card text-ink shadow-[3px_3px_0_#1F2933]'
                    : 'bg-mint text-ink shadow-[3px_3px_0_#1F2933]'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                {msg.modelUpdateSummary ? (
                  <div className="mt-2.5 rounded-lg border border-ink bg-sky/35 p-2 text-xs font-black text-ink flex items-center gap-1.5">
                    <MaterialIcon name="published_with_changes" size="sm" className="text-primary" />
                    <span>{msg.modelUpdateSummary}</span>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}

        {isSending ? (
          <div className="flex items-center gap-2 text-xs font-bold text-ink/75 p-2">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-ink border-t-transparent" />
            <span>Kresna sedang menganalisis timbulan & jadwal armada...</span>
          </div>
        ) : null}
      </div>

      {/* 5. Quick Prompt Chips */}
      <div className="grid gap-1.5">
        <span className="text-[11px] font-extrabold uppercase text-ink/70">
          💡 Rekomendasi Pertanyaan & Situasi Cepat:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isSending}
              onClick={() => void handleSendMessage(prompt)}
              className="rounded-lg border-2 border-ink bg-card px-2.5 py-1 text-xs font-bold text-ink hover:bg-amber/30 active:translate-y-0.5 transition-all text-left shadow-[2px_2px_0_#1F2933]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Message Input & Voice Assistant Trigger */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleSendMessage()
        }}
        className="flex flex-wrap sm:flex-nowrap items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            disabled={isSending}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ceritakan kondisi tempat sampah, rencana upacara, atau kendala Anda..."
            className="w-full rounded-xl border-2 border-ink bg-card px-3.5 py-2.5 text-sm font-semibold text-ink placeholder:text-ink/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-[2px_2px_0_#1F2933]"
          />
        </div>

        {/* Voice Input Speech-To-Text Button */}
        <button
          type="button"
          onClick={handleToggleVoiceRecognition}
          title={isListening ? 'Mendengarkan suara Anda...' : 'Bicara lewat Suara (Speech to Text)'}
          aria-label={isListening ? 'Hentikan rekaman suara' : 'Mulai bicara'}
          className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink font-bold shadow-[2px_2px_0_#1F2933] transition-all ${
            isListening ? 'bg-coral text-white animate-pulse' : 'bg-lavender text-ink hover:bg-lavender/80'
          }`}
        >
          <MaterialIcon name={isListening ? 'mic' : 'mic_none'} size="sm" />
        </button>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSending || !input.trim()}
          className="btn-tactile h-11 px-5 text-sm font-extrabold flex items-center gap-1.5"
        >
          <MaterialIcon name="send" size="sm" />
          <span>Kirim</span>
        </Button>
      </form>
    </section>
  )
}

