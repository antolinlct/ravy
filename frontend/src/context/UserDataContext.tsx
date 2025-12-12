/**
 * UserDataContext.tsx
 * --------------------
 * Stocke les informations détaillées de l'utilisateur (nom, email, avatar, etc).
 *
 * - Chargé UNE SEULE FOIS après que user.id soit connu
 * - Ne bloque PAS les pages publiques
 * - Permet d'éviter les fetchs répétitifs dans tout le dashboard
 *
 * Ce contexte NE protège pas les routes → RequireAuth s'en occupe.
 */

"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useUser } from "./UserContext"
import { supabase } from "@/lib/supabaseClient"

const UserDataContext = createContext(null)

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const user = useUser()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function load() {
      if (!user?.id) return

      const { data, error } = await supabase.auth.getUser()
      if (error || !data?.user) return

      const u = data.user

      const fullName =
        u.user_metadata?.full_name ||
        [u.user_metadata?.first_name, u.user_metadata?.last_name]
          .filter(Boolean)
          .join(" ")

      setProfile({
        id: u.id,
        email: u.email || undefined,
        fullName: fullName || undefined,
        avatar:
          (u.user_metadata?.avatar_url as string | undefined) ||
          (u.user_metadata?.avatar as string | undefined) ||
          undefined,
      })
    }

    load()
  }, [user?.id])

  return (
    <UserDataContext.Provider value={profile}>
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData() {
  return useContext(UserDataContext)
}
