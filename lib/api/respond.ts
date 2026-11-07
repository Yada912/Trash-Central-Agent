import { NextResponse } from 'next/server'
import type { ApiMode, ErrorCode } from '@/lib/schemas'

export function requestIdFrom(request: Request): string {
  const incoming = request.headers.get('x-request-id')
  if (incoming && /^[A-Za-z0-9._:-]{8,80}$/.test(incoming)) return incoming
  return crypto.randomUUID()
}

export function apiMode(): ApiMode {
  return process.env.GEMINI_API_KEY ? 'live' : 'demo'
}

function withHeaders(response: NextResponse, requestId: string): NextResponse {
  response.headers.set('x-request-id', requestId)
  response.headers.set('cache-control', 'no-store')
  return response
}

export function jsonOk<T>(
  requestId: string,
  data: T,
  extra?: { model?: string; latencyMs?: number },
  status = 200,
): NextResponse {
  return withHeaders(
    NextResponse.json(
      {
        data,
        meta: {
          mode: apiMode(),
          requestId,
          ...extra,
        },
      },
      { status },
    ),
    requestId,
  )
}

export function jsonErr(
  requestId: string,
  status: number,
  code: ErrorCode,
  message: string,
  fields?: Record<string, string[]>,
): NextResponse {
  return withHeaders(
    NextResponse.json(
      {
        error: fields ? { code, message, fields } : { code, message },
        meta: { requestId },
      },
      { status },
    ),
    requestId,
  )
}

export function isModuleFailure(error: unknown): boolean {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : ''
  const name = error instanceof Error ? error.name : ''
  const statusCode =
    typeof error === 'object' && error && 'statusCode' in error && typeof (error as { statusCode?: unknown }).statusCode === 'number'
      ? (error as { statusCode: number }).statusCode
      : undefined
  return code === 'TIMEOUT' || code === 'UPSTREAM' || code === 'RATE_LIMIT' || name === 'AbortError' || name === 'TimeoutError' || statusCode === 429
}

export function mapModuleError(error: unknown): { status: number; code: ErrorCode; message: string } {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : ''
  const name = error instanceof Error ? error.name : ''
  const message = error instanceof Error ? error.message : ''
  const statusCode =
    typeof error === 'object' && error && 'statusCode' in error && typeof (error as { statusCode?: unknown }).statusCode === 'number'
      ? (error as { statusCode: number }).statusCode
      : undefined
  if (code === 'TIMEOUT' || name === 'AbortError' || name === 'TimeoutError' || /timeout/i.test(message)) {
    return { status: 504, code: 'TIMEOUT', message: 'The model did not respond within 15 seconds.' }
  }
  if (code === 'RATE_LIMIT' || statusCode === 429 || message.includes('429')) {
    return { status: 429, code: 'RATE_LIMIT', message: 'The model provider rate-limited the request.' }
  }
  return { status: 502, code: 'UPSTREAM', message: 'The model request failed.' }
}
