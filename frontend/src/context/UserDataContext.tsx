/**
 * UserDataContext.tsx
 * --------------------
 * Source unique des informations utilisateur côté front.
 *
 * Fusionne :
 * - Supabase Auth (email)
 * - user_profiles (first_name, last_name, phone_sms)
 *
 * Règles :
 * - Aucun parsing dans les pages
 * - fullName est dérivé, jamais stocké
 * - Chargé une seule fois après user.id
 */

"use client"
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { usePostHog } from "posthog-js/react"
import { supabase } from "@/lib/supabaseClient"
import { useUser } from "./UserContext"

type UserData = {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  fullName?: string
  phone?: string
  emailVerified?: boolean
}

type ContextValue = {
  data: UserData | null
  reload: () => Promise<void>
}

const UserDataContext = createContext<ContextValue | null>(null)

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const user = useUser()
  const [data, setData] = useState<UserData | null>(null)
  const posthog = usePostHog()

  const reload = useCallback(async () => {
    if (!user?.id) {
      setData(null)
      return
    }

    // 1) Auth (email)
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return

    // 2) user_profiles
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("first_name, last_name, phone_sms")
      .eq("id", authData.user.id)
      .maybeSingle()

    const firstName = profile?.first_name || undefined
    const lastName = profile?.last_name || undefined
    const fullName =
      [firstName, lastName].filter(Boolean).join(" ") || undefined

    setData({
      id: authData.user.id,
      email: authData.user.email || undefined,
      firstName,
      lastName,
      fullName,
      phone: profile?.phone_sms || undefined,
      emailVerified: Boolean(
        authData.user.email_confirmed_at ||
          authData.user.confirmed_at ||
          authData.user.user_metadata?.email_verified
      ),
    })
  }, [user?.id])

  useEffect(() => {
    reload().catch(() => {
      /* ignore initial load errors */
    })
  }, [reload])

  useEffect(() => {
    if (!posthog) return
    if (!data?.id) {
      posthog.reset()
      return
    }
    posthog.identify(data.id, {
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      full_name: data.fullName,
      phone: data.phone,
    })
  }, [posthog, data?.id, data?.email, data?.firstName, data?.lastName, data?.fullName, data?.phone])

  return (
    <UserDataContext.Provider value={{ data, reload }}>
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData() {
  return useContext(UserDataContext)?.data ?? null
}

export function useUserDataReload() {
  return useContext(UserDataContext)?.reload
}
