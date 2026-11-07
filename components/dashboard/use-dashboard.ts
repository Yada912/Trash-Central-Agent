'use client'

import { useEffect, useState } from 'react'
import { requestJson, type ApiMeta } from '@/lib/client/api'
import type { Dashboard, Report } from '@/lib/schemas'

export function useDashboard() {
  const [reports, setReports] = useState<Report[]>([])
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [meta, setMeta] = useState<ApiMeta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [reportResponse, dashboardResponse] = await Promise.all([
        requestJson<Report[]>('/api/reports'),
        requestJson<Dashboard>('/api/dashboard'),
      ])
      setReports(reportResponse.data)
      setDashboard(dashboardResponse.data)
      setMeta(dashboardResponse.meta)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Dasbor tidak dapat dimuat.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [reportResponse, dashboardResponse] = await Promise.all([
          requestJson<Report[]>('/api/reports'),
          requestJson<Dashboard>('/api/dashboard'),
        ])
        if (cancelled) return
        setReports(reportResponse.data)
        setDashboard(dashboardResponse.data)
        setMeta(dashboardResponse.meta)
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Dasbor tidak dapat dimuat.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { reports, dashboard, meta, error, loading, reload: load }
}
