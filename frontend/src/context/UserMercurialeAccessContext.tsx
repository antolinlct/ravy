/**
 * UserMercurialeAccessContext.tsx
 * -------------------------------
 * Source unique du niveau d’accès mercuriale d’un utilisateur.
 *
 * - Dépend uniquement de UserContext (auth)
 * - Charge user_mercuriale_access
 * - Expose un niveau simple : STANDARD | PLUS | PREMIUM
 */

"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useUser } from "./UserContext"

export type MercurialeLevel = "STANDARD" | "PLUS" | "PREMIUM"

type ContextValue = {
  level: MercurialeLevel | null
}

const UserMercurialeAccessContext = createContext<ContextValue | null>(null)

export function UserMercurialeAccessProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useUser()
  const [level, setLevel] = useState<MercurialeLevel | null>(null)

  useEffect(() => {
    const userId = user?.id

    if (!userId) {
      setLevel(null)
      return
    }

    let active = true

    async function load() {
      const { data, error } = await supabase
        .from("user_mercuriale_access")
        .select("mercuriale_level")
        .eq("user_id", userId)
        .maybeSingle()

      if (!active || error) return

      setLevel(data?.mercuriale_level ?? "STANDARD")
    }

    load()

    return () => {
      active = false
    }
  }, [user?.id])

  return (
    <UserMercurialeAccessContext.Provider value={{ level }}>
      {children}
    </UserMercurialeAccessContext.Provider>
  )
}

// --- Hook ---
// eslint-disable-next-line react-refresh/only-export-components -- hook export nécessaire aux consommateurs
export function useUserMercurialeAccess() {
  return useContext(UserMercurialeAccessContext)
}
