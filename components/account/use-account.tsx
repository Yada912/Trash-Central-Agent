'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type {
  PetugasTimetableSlot,
  ResidentOptimizationSummary,
  ResidentWasteProfile,
  UserAccount,
  UserRole,
} from '@/lib/accounts/store'
import type { AccountType, Kecamatan } from '@/lib/schemas'

type AccountApiData = {
  activeAccount: UserAccount
  accounts: UserAccount[]
  timetable: PetugasTimetableSlot[]
  optimization: ResidentOptimizationSummary | null
}

type AccountContextValue = {
  activeAccount: UserAccount | null
  accounts: UserAccount[]
  timetable: PetugasTimetableSlot[]
  optimization: ResidentOptimizationSummary | null
  loading: boolean
  busy: boolean
  switchAccount: (accountId: string) => Promise<void>
  updateProfile: (patch: {
    name?: string
    kecamatan?: Kecamatan
    desa?: string
    address?: string
    lat?: number
    lng?: number
    accountType?: AccountType
    wasteProfile?: ResidentWasteProfile
  }) => Promise<void>
  createNewAccount: (input: {
    name: string
    email: string
    role: UserRole
    kecamatan: Kecamatan
    desa: string
    address: string
    accountType: AccountType
  }) => Promise<void>
  updateTimetable: (patch: {
    slotId: string
    days?: string[]
    windowStart?: string
    windowEnd?: string
    leewayMinutes?: number
    surgeTolerancePct?: number
    maxLitersPerPickup?: number
    notes?: string
  }) => Promise<void>
  reload: () => Promise<void>
}

const AccountContext = createContext<AccountContextValue | null>(null)

const STORAGE_KEY = 'cta.activeAccountId'

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AccountApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const savedId = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
      const query = savedId ? `?accountId=${encodeURIComponent(savedId)}` : ''
      const res = await fetch(`/api/accounts${query}`)
      if (!res.ok) return
      const payload = (await res.json()) as { data: AccountApiData }
      setData(payload.data)
    } catch {
      // Keep graceful state if offline
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const mutate = useCallback(async (body: Record<string, unknown>) => {
    setBusy(true)
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) return
      const payload = (await res.json()) as { data: AccountApiData }
      setData(payload.data)
      if (typeof window !== 'undefined' && payload.data.activeAccount?.id) {
        window.localStorage.setItem(STORAGE_KEY, payload.data.activeAccount.id)
      }
    } finally {
      setBusy(false)
    }
  }, [])

  const switchAccount = useCallback(
    async (accountId: string) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, accountId)
      }
      await mutate({ action: 'switch', accountId })
    },
    [mutate],
  )

  const updateProfile = useCallback(
    async (patch: Parameters<AccountContextValue['updateProfile']>[0]) => {
      if (!data?.activeAccount) return
      await mutate({
        action: 'update_profile',
        accountId: data.activeAccount.id,
        profilePatch: patch,
      })
    },
    [data?.activeAccount, mutate],
  )

  const createNewAccount = useCallback(
    async (input: Parameters<AccountContextValue['createNewAccount']>[0]) => {
      await mutate({
        action: 'create_account',
        newAccount: input,
      })
    },
    [mutate],
  )

  const updateTimetable = useCallback(
    async (patch: Parameters<AccountContextValue['updateTimetable']>[0]) => {
      await mutate({
        action: 'update_timetable',
        timetablePatch: patch,
      })
    },
    [mutate],
  )

  return (
    <AccountContext.Provider
      value={{
        activeAccount: data?.activeAccount ?? null,
        accounts: data?.accounts ?? [],
        timetable: data?.timetable ?? [],
        optimization: data?.optimization ?? null,
        loading,
        busy,
        switchAccount,
        updateProfile,
        createNewAccount,
        updateTimetable,
        reload: load,
      }}
    >
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext)
  if (!ctx) {
    return {
      activeAccount: null,
      accounts: [],
      timetable: [],
      optimization: null,
      loading: false,
      busy: false,
      switchAccount: async () => {},
      updateProfile: async () => {},
      createNewAccount: async () => {},
      updateTimetable: async () => {},
      reload: async () => {},
    }
  }
  return ctx
}

