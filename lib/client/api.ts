export type ApiMeta = {
  mode: 'live' | 'demo'
  requestId: string
  model?: string
  latencyMs?: number
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: Record<string, string[]>

  constructor(status: number, code: string, message: string, fields?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function requestJson<T>(path: string, init?: { method?: string; body?: unknown }): Promise<{ data: T; meta: ApiMeta }> {
  const response = await fetch(path, {
    method: init?.method ?? (init?.body === undefined ? 'GET' : 'POST'),
    headers: {
      accept: 'application/json',
      ...(init?.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  })
  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      payload = null
    }
  }
  if (!response.ok) {
    const error = isRecord(payload) && isRecord(payload.error) ? payload.error : null
    const code = error && typeof error.code === 'string' ? error.code : response.status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INTERNAL'
    const message = error && typeof error.message === 'string' ? error.message : 'The request failed.'
    const fields = error && isRecord(error.fields) ? (error.fields as Record<string, string[]>) : undefined
    throw new ApiError(response.status, code, message, fields)
  }
  if (!isRecord(payload) || !('data' in payload) || !isRecord(payload.meta)) {
    throw new ApiError(response.status, 'INTERNAL', 'The server returned an unexpected response.')
  }
  return { data: payload.data as T, meta: payload.meta as ApiMeta }
}

export function messageForApiError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something went wrong. Your text and photo are still here.'
  if (error.status === 413 || error.code === 'PAYLOAD_TOO_LARGE' || error.fields?.image) {
    return 'That photo is too large to send. Choose a smaller photo. The limit is 3 MB after compression.'
  }
  if (error.status === 504 || error.code === 'TIMEOUT') {
    return 'The request timed out. Your text and photo are still here. Try again.'
  }
  return error.message
}
