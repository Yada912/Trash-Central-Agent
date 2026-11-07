import { hasGeminiApiKey } from '@/lib/ai/keys'

/** Reports saved while no Gemini API key is configured are demo records. */
export function savedReportIsDemo(): boolean {
  return !hasGeminiApiKey()
}
