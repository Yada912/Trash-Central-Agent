import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import { classifyModelId, geminiApiKeys } from '@/lib/ai/keys'
import {
  type AgentChatMessage,
  type AgentMemoryItem,
  type CurrentTrashCondition,
  type PetugasTimetableSlot,
  type ResidentWasteProfile,
  type SpecialEventSurge,
  type UserAccount,
  formatSlotDaysId,
} from '@/lib/accounts/store'
import { computeUserOtonanFromBirthDate } from '@/lib/calendar/balinese-calendar'
import { inspectPromptInput, redactPiiFromText } from '@/lib/security/guard'
import type { WasteStream } from '@/lib/schemas'

export type AgentChatResult = {
  reply: string
  source: 'gemini' | 'template'
  modelUpdateSummary?: string
  updatedProfile: ResidentWasteProfile
  newMemoryItem?: AgentMemoryItem
}

const AGENT_SYSTEM_PROMPT = `Anda adalah Kresna, Agen Pengelola Sampah Cerdas Central Trash Agent Bali.
Peran Anda adalah bertindak sebagai penasihat personal bagi warga dalam mengelola timbulan sampah berbasis sumber (Pergub Bali No. 47/2019 & Perda Denpasar No. 8/2023).
Platform ini BUKAN sekadar kalender pasif, melainkan sistem berbasis permintaan (demand-based) yang menyelaraskan timbulan warga dengan jadwal dan kuota kelonggaran (leeway) armada pengangkut di kecamatan warga.

Karakter Anda:
- Ramah, empatik, memahami budaya Bali (upacara adat, rahinan, canang sari, janur, banten, banjar).
- Komunikatif dalam Bahasa Indonesia yang santun, praktis, dan solutif.
- Pergub Bali No. 47 Tahun 2019 Pasal 6 ayat (2) mewajibkan pemilahan paling sedikit LIMA jenis: sampah mudah terurai, sampah yang dapat digunakan kembali, sampah yang dapat didaur ulang, sampah B3, dan sampah residu. Jangan mengatakan peraturan itu hanya punya tiga kategori.
- Aplikasi memetakan kelima jenis itu ke empat aliran operasional: organik (mudah terurai, kompos TPS3R), anorganik (guna ulang dan daur ulang, Bank Sampah), residu, dan B3 (penanganan terpisah, tidak dicampur ke kantong harian).

Tugas Anda:
1. Menanggapi pesan warga mengenai situasi sampah, hajatan, upacara adat, atau kendala tempat sampah mereka.
2. Memeriksa apakah lonjakan sampah mereka dapat diserap oleh jadwal dan kelonggaran (leeway) pengangkutan di kecamatan mereka.
3. Mengekstrak pembaruan model timbulan warga secara terstruktur:
   - Jika tempat sampah menumpuk atau meluber: tentukan condition = 'menumpuk' | 'meluber'.
   - Jika ada hajatan/upacara mendatang: tentukan nama acara, estimasi volume ekstra (+L), dan aliran dominan ('organik' atau 'anorganik').
   - Jika ada fakta penting tentang kebiasaan pengguna: catat dalam memoryFact untuk diingat di masa depan.
4. Tuliskan ringkasan pembaruan model singkat (modelUpdateSummary) untuk ditampilkan kepada pengguna.`

export async function processResidentAgentChat(params: {
  message: string
  account: UserAccount
  timetable: PetugasTimetableSlot[]
  conversationHistory?: AgentChatMessage[]
}): Promise<AgentChatResult> {
  const { message, account, timetable, conversationHistory = [] } = params
  const cleanMessage = redactPiiFromText(message).trim()
  const guard = inspectPromptInput(cleanMessage)

  const currentProfile = account.wasteProfile ?? {
    currentCondition: 'terkendali',
    conditionNote: 'Timbulan rutin mingguan.',
    weeklyRegularLiters: 105,
    containerPreset: 'kantong_15l',
    householdMembers: 4,
    sortingReadiness: 'sebagian',
    compositionPct: { organic: 60, plastic: 20, paper: 10, metal: 0, residual: 10, hazardous: 0 },
    specialEvents: [],
  }

  const kecamatanSlots = timetable.filter((s) => s.kecamatan === account.kecamatan)
  const otonan = account.birthDate ? computeUserOtonanFromBirthDate(account.birthDate) : null

  // Guardrail check: if prompt injection detected
  if (guard.blocked) {
    const fallbackReply =
      'Saya adalah Agen Sampah Cerdas Kota Denpasar yang bertugas membantu pengelolaan pemilahan sampah dan jadwal penjemputan TPS3R Anda. Mari diskusikan kondisi tempat sampah atau rencana upacara/acara di rumah Anda.'
    const userMsg: AgentChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: cleanMessage,
      timestamp: new Date().toISOString(),
    }
    const agentMsg: AgentChatMessage = {
      id: `agt_${Date.now() + 1}`,
      sender: 'agent',
      text: fallbackReply,
      timestamp: new Date().toISOString(),
    }
    return {
      reply: fallbackReply,
      source: 'template',
      updatedProfile: {
        ...currentProfile,
        chatMessages: [...(currentProfile.chatMessages ?? []), userMsg, agentMsg],
      },
    }
  }

  let reply = ''
  let source: 'gemini' | 'template' = 'template'
  let modelUpdateSummary: string | undefined
  let conditionUpdate: CurrentTrashCondition | undefined
  let newEventData: SpecialEventSurge | undefined
  let memoryFact: string | undefined

  const keys = geminiApiKeys()
  if (keys.length > 0) {
    const slotsInfo = kecamatanSlots
      .map(
        (s) =>
          `- ${s.stream.toUpperCase()}: ${formatSlotDaysId(s.days)} (${s.windowStart}–${s.windowEnd} WITA), Kapasitas normal ${s.maxLitersPerPickup} L/angkut (+${s.surgeTolerancePct}% leeway)`,
      )
      .join('\n')

    const memoryContext = (currentProfile.agentMemory ?? []).map((m) => `- ${m.fact}`).join('\n')

    const prompt = `Konteks Profil Warga:
Nama: ${account.name}
Wilayah: Banjar ${account.banjarName ?? 'Banjar setempat'}, Desa ${account.desa}, Kecamatan ${account.kecamatan}
Node Pengolahan: ${account.tps3rNode ?? 'TPS3R Swakelola Desa'}
Kondisi Sampah Saat Ini: ${currentProfile.currentCondition} (${currentProfile.conditionNote})
Timbulan Rutin: ${currentProfile.weeklyRegularLiters} Liter/minggu (${currentProfile.householdMembers} anggota keluarga)
Otonan Pribadi: ${otonan ? otonan.pawukonLabel + ' (Berikutnya: ' + otonan.nextOtonanDate + ')' : 'Belum diisi'}

Jadwal Pengangkutan Swakelola di ${account.kecamatan}:
${slotsInfo}

Memori Agen tentang Warga Ini:
${memoryContext || '- Belum ada catatan khusus.'}

Riwayat 3 Pesan Terakhir:
${conversationHistory
  .slice(-3)
  .map((m) => `${m.sender === 'user' ? 'Warga' : 'Kresna'}: ${m.text}`)
  .join('\n')}

Pesan Terbaru dari Warga: "${cleanMessage}"

Berikan tanggapan dan ekstraksi pembaruan model sampah secara terstruktur.`

    const schema = z.object({
      reply: z.string().describe('Tanggapan ramah dan solutif dalam Bahasa Indonesia'),
      detectedCondition: z
        .enum(['terkendali', 'menumpuk', 'meluber', 'pasca_upacara', 'tidak_berubah'])
        .describe('Perubahan kondisi tempat sampah jika disebutkan warga'),
      newEvent: z
        .object({
          hasEvent: z.boolean(),
          name: z.string().optional(),
          extraLiters: z.number().optional(),
          dominantStream: z.enum(['organik', 'anorganik', 'residu', 'B3']).optional(),
          notes: z.string().optional(),
        })
        .optional()
        .describe('Acara keluarga / upacara adat yang membutuhkan ekstra kuota penjemputan'),
      memoryFact: z.string().optional().describe('Fakta baru tentang warga untuk disimpan di memori jangka panjang'),
      modelUpdateSummary: z.string().optional().describe('Ringkasan 1 kalimat perubahan model sampah'),
    })

    for (const apiKey of keys) {
      try {
        const result = await generateObject({
          model: createGoogleGenerativeAI({ apiKey })(classifyModelId()),
          system: AGENT_SYSTEM_PROMPT,
          prompt,
          schema,
          temperature: 0.2,
          maxRetries: 0,
        })
        reply = result.object.reply
        source = 'gemini'
        modelUpdateSummary = result.object.modelUpdateSummary
        if (result.object.detectedCondition && result.object.detectedCondition !== 'tidak_berubah') {
          conditionUpdate = result.object.detectedCondition
        }
        if (result.object.newEvent?.hasEvent && result.object.newEvent.name) {
          newEventData = {
            id: `evt_${Date.now().toString(36)}`,
            name: result.object.newEvent.name,
            frequency: 'Sesuai percakapan warga',
            extraLiters: Math.max(15, result.object.newEvent.extraLiters || 45),
            dominantStream: result.object.newEvent.dominantStream || 'organik',
            activeThisWeek: true,
            notes: result.object.newEvent.notes || 'Dicatat otomatis oleh Agen Kresna melalui percakapan.',
          }
        }
        memoryFact = result.object.memoryFact
        break
      } catch {
        // Try the next key, then the labelled template below.
      }
    }
  }

  // Deterministic fallback assistant logic if no Gemini or network error
  if (!reply) {
    const lower = cleanMessage.toLowerCase()
    let streamType: WasteStream = 'organik'
    let extra = 30
    let eventName = ''

    if (lower.includes('meluber') || lower.includes('tumpuk') || lower.includes('bau') || lower.includes('penuh')) {
      conditionUpdate = lower.includes('meluber') ? 'meluber' : 'menumpuk'
    }

    if (lower.includes('botol') || lower.includes('plastik') || lower.includes('kardus') || lower.includes('anorganik')) {
      streamType = 'anorganik'
      extra = 40
    }

    if (
      lower.includes('potong gigi') ||
      lower.includes('upacara') ||
      lower.includes('hajatan') ||
      lower.includes('nikahan') ||
      lower.includes('syukuran') ||
      lower.includes('odalan') ||
      lower.includes('otonan') ||
      lower.includes('tamu')
    ) {
      conditionUpdate = 'pasca_upacara'
      eventName = lower.includes('potong gigi')
        ? 'Upacara Metatah / Potong Gigi'
        : lower.includes('odalan')
          ? 'Odalan / Piodalan Merajan'
          : lower.includes('otonan')
            ? 'Upacara Otonan Keluarga'
            : 'Acara Keluarga / Hajatan'
      extra = streamType === 'organik' ? 50 : 40
    }

    if (eventName) {
      newEventData = {
        id: `evt_${Date.now().toString(36)}`,
        name: eventName,
        frequency: 'Pekan ini',
        extraLiters: extra,
        dominantStream: streamType,
        activeThisWeek: true,
        notes: `Lonjakan dicatat dari percakapan warga (${extra} L ${streamType}).`,
      }
      modelUpdateSummary = `Model Timbulan Diperbarui: Ditambahkan ${eventName} (+${extra} L ${streamType}).`
      reply = `Halo ${account.name}, saya telah mencatat rencana ${eventName} di rumah Anda. Estimasi lonjakan +${extra} Liter sampah ${streamType} telah disinkronkan ke profil Anda. Untuk wilayah ${account.kecamatan} (${account.banjarName ?? 'Banjar Anda'}), pengangkutan ${streamType} terdekat siap menyerap timbulan ini dalam batas toleransi leeway armada TPS3R. Mohon pisahkan sampah mudah terurai dari kantong plastik ya.`
      memoryFact = `Warga memiliki agenda ${eventName} dengan estimasi timbulan +${extra}L ${streamType}.`
    } else if (conditionUpdate) {
      modelUpdateSummary = `Model Timbulan Diperbarui: Kondisi tempat sampah disetel ke "${conditionUpdate}".`
      reply = `Baik ${account.name}, status kondisi tempat sampah Anda telah saya perbarui menjadi "${conditionUpdate}". Jika tumpukan mendesak, silakan ambil foto melalui menu "Lapor" agar armada TPS3R ${account.desa} dapat memprioritaskan titik jemput Anda pada giliran berikutnya.`
      memoryFact = `Kondisi tempat sampah dilaporkan ${conditionUpdate} pada ${new Date().toLocaleDateString('id-ID')}.`
    } else {
      reply = `Halo ${account.name}! Saya siap membantu mengoptimalkan ritme pemilahan sampah Anda di ${account.banjarName ?? 'lingkungan Anda'}. Jadwal pengangkutan Organik terdekat adalah Senin, Rabu, Kamis, dan Sabtu (06:00–09:00 WITA) menuju ${account.tps3rNode ?? 'TPS3R Desa'}. Apakah ada acara khusus minggu ini atau ada kendala wadah sampah yang ingin disesuaikan?`
    }
  }

  // Construct updated profile
  const updatedSpecialEvents = newEventData
    ? [...currentProfile.specialEvents.filter((e) => e.name !== newEventData?.name), newEventData]
    : currentProfile.specialEvents

  const userMessageItem: AgentChatMessage = {
    id: `msg_usr_${Date.now().toString(36)}`,
    sender: 'user',
    text: cleanMessage,
    timestamp: new Date().toISOString(),
  }

  const agentMessageItem: AgentChatMessage = {
    id: `msg_agt_${(Date.now() + 1).toString(36)}`,
    sender: 'agent',
    text: reply,
    timestamp: new Date().toISOString(),
    modelUpdateSummary,
    source,
  }

  let newMemoryItem: AgentMemoryItem | undefined
  let updatedMemory = currentProfile.agentMemory ?? []
  if (memoryFact) {
    newMemoryItem = {
      id: `mem_${Date.now().toString(36)}`,
      fact: memoryFact,
      createdAt: new Date().toISOString(),
    }
    updatedMemory = [newMemoryItem, ...updatedMemory].slice(0, 8)
  }

  const updatedProfile: ResidentWasteProfile = {
    ...currentProfile,
    currentCondition: conditionUpdate ?? currentProfile.currentCondition,
    conditionNote: conditionUpdate
      ? `Diperbarui via Agen Kresna: ${cleanMessage.slice(0, 140)}`
      : currentProfile.conditionNote,
    specialEvents: updatedSpecialEvents,
    chatMessages: [...(currentProfile.chatMessages ?? []), userMessageItem, agentMessageItem].slice(-20),
    agentMemory: updatedMemory,
  }

  return {
    reply,
    source,
    modelUpdateSummary,
    updatedProfile,
    newMemoryItem,
  }
}

