/**
 * UserContext.tsx
 * ----------------
 * Contexte global permettant de stocker et d'exposer les informations
 * de l'utilisateur actuellement connecté.
 *
 * Objectifs :
 *  - éviter d'appeler supabase.auth.getUser() partout dans l'application
 *  - éviter les rechargements répétitifs du user dans le DashboardLayout
 *  - stocker le user_id localement pour un accès instantané
 *
 * Règles :
 *  - Ce contexte NE BLOQUE PAS l'accès aux pages (aucune redirection ici)
 *  - RequireAuth se charge de protéger les routes privées
 *  - Ce Provider peut envelopper toute l'app sans risque
 *
 * Fonctionnement :
 *  1) Si un user_id existe déjà dans localStorage → utilisation immédiate
 *  2) Sinon → récupération via Supabase, puis stockage dans localStorage
 *  3) Le contexte expose : { id, email, fullName }
 *
 * À modifier uniquement si :
 *  - tu veux enrichir le profil utilisateur global
 */

"use client"
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"

interface UserData {
  id: string
  email?: string
  fullName?: string
  emailVerified?: boolean
}

const UserContext = createContext<UserData | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    let isMounted = true

    async function hydrateFromSession(session: Session | null) {
      if (!isMounted || !session?.user) return

      const u = session.user
      localStorage.setItem("user_id", u.id)

      const fullName =
        u.user_metadata?.full_name ||
        [u.user_metadata?.first_name, u.user_metadata?.last_name]
          .filter(Boolean)
          .join(" ")
      const emailVerified = Boolean(
        u.email_confirmed_at || u.confirmed_at || u.user_metadata?.email_verified
      )

      setUser({
        id: u.id,
        email: u.email || undefined,
        fullName: fullName || undefined,
        emailVerified,
      })
    }

    async function loadUser() {
      // 1. Vérifier si user_id est déjà en localStorage
      const storedId = localStorage.getItem("user_id")
      if (storedId) {
        setUser((prev) => prev ?? { id: storedId })
      }

      // 2. Synchroniser avec la session Supabase
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!error) {
          await hydrateFromSession(data.session)
        }
      } catch {
        /* ignore initial session errors */
      }
    }

    loadUser()

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          localStorage.removeItem("user_id")
          setUser(null)
          return
        }
        hydrateFromSession(session)
      }
    )

    return () => {
      isMounted = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useUser() {
  return useContext(UserContext)
}
