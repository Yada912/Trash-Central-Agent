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
  isSignedIn: boolean
  accounts: UserAccount[]
  timetable: PetugasTimetableSlot[]
  optimization: ResidentOptimizationSummary | null
  loading: boolean
  busy: boolean
  error: string | null
  login: (email: string, password?: string) => Promise<UserAccount | null>
  logout: () => void
  switchAccount: (accountId: string) => Promise<UserAccount | null>
  updateProfile: (patch: {
    name?: string
    kecamatan?: Kecamatan
    desa?: string
    banjarName?: string
    tps3rNode?: string
    birthDate?: string
    address?: string
    lat?: number
    lng?: number
    accountType?: AccountType
    wasteProfile?: ResidentWasteProfile
  }) => Promise<void>
  createNewAccount: (input: {
    name: string
    email: string
    password?: string
    role: UserRole
    kecamatan: Kecamatan
    desa: string
    banjarName?: string
    tps3rNode?: string
    birthDate?: string
    address: string
    accountType: AccountType
    wasteProfile?: Partial<ResidentWasteProfile>
  }) => Promise<UserAccount | null>
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
const SIGNED_IN_KEY = 'cta.isSignedIn'

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AccountApiData | null>(null)
  const [isSignedIn, setIsSignedIn] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const savedId = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
      const signedFlag = typeof window !== 'undefined' ? window.localStorage.getItem(SIGNED_IN_KEY) : null
      if (signedFlag === 'false') {
        setIsSignedIn(false)
      } else {
        setIsSignedIn(true)
      }
      const query = savedId ? `?accountId=${encodeURIComponent(savedId)}` : ''
      const res = await fetch(`/api/accounts${query}`)
      if (!res.ok) return
      const payload = (await res.json()) as { data: AccountApiData }
      setData(payload.data)
    } catch {
      // Keep graceful state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const mutate = useCallback(async (body: Record<string, unknown>): Promise<AccountApiData | null> => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const payload = (await res.json()) as { data?: AccountApiData; error?: { message?: string } }
      if (!res.ok || !payload.data) {
        setError(payload.error?.message ?? 'Permintaan akun gagal.')
        return null
      }
      setData(payload.data)
      if (typeof window !== 'undefined' && payload.data.activeAccount?.id) {
        window.localStorage.setItem(STORAGE_KEY, payload.data.activeAccount.id)
      }
      return payload.data
    } finally {
      setBusy(false)
    }
  }, [])

  const login = useCallback(
    async (email: string, password?: string) => {
      const result = await mutate({ action: 'login', login: { email, password } })
      if (result?.activeAccount) {
        setIsSignedIn(true)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(SIGNED_IN_KEY, 'true')
        }
        return result.activeAccount
      }
      return null
    },
    [mutate],
  )

  const logout = useCallback(() => {
    setIsSignedIn(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SIGNED_IN_KEY, 'false')
    }
  }, [])

  const switchAccount = useCallback(
    async (accountId: string) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, accountId)
        window.localStorage.setItem(SIGNED_IN_KEY, 'true')
      }
      setIsSignedIn(true)
      const result = await mutate({ action: 'switch', accountId })
      return result?.activeAccount ?? null
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
      const result = await mutate({
        action: 'create_account',
        newAccount: input,
      })
      if (result?.activeAccount) {
        setIsSignedIn(true)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(SIGNED_IN_KEY, 'true')
        }
        return result.activeAccount
      }
      return null
    },
    [mutate],
  )

  const updateTimetable = useCallback(
    async (patch: Parameters<AccountContextValue['updateTimetable']>[0]) => {
      await mutate({
        action: 'update_timetable',
        accountId: data?.activeAccount?.id,
        timetablePatch: patch,
      })
    },
    [data?.activeAccount?.id, mutate],
  )

  return (
    <AccountContext.Provider
      value={{
        activeAccount: isSignedIn ? (data?.activeAccount ?? null) : null,
        isSignedIn,
        accounts: data?.accounts ?? [],
        timetable: data?.timetable ?? [],
        optimization: isSignedIn ? (data?.optimization ?? null) : null,
        loading,
        busy,
        error,
        login,
        logout,
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
      isSignedIn: false,
      accounts: [],
      timetable: [],
      optimization: null,
      loading: false,
      busy: false,
      error: null,
      login: async () => null,
      logout: () => {},
      switchAccount: async () => null,
      updateProfile: async () => {},
      createNewAccount: async () => null,
      updateTimetable: async () => {},
      reload: async () => {},
    }
  }
  return ctx
}
