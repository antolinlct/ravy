/**
 * AppInitializer.tsx
 * -------------------
 * Synchronise les contextes avec la session Supabase.
 * Ne gère PAS le routing.
 */

"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useUser } from "./UserContext"
import { useUserData } from "./UserDataContext"
import { useEstablishment } from "./EstablishmentContext"
import { useEstablishmentData } from "./EstablishmentDataContext"

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const user = useUser()
  useUserData()
  const { estId, select } = useEstablishment()
  useEstablishmentData()

  useEffect(() => {
    let isMounted = true

    async function sync(session: any | null) {
      if (!isMounted) return

      if (!session) {
        // Pas de session → on nettoie juste
        localStorage.removeItem("user_id")
        localStorage.removeItem("current_establishment_id")
        sessionStorage.clear()
        return
      }

      // Hydrate user_id si manquant
      if (!user?.id) {
        localStorage.setItem("user_id", session.user.id)
      }

      // Sélection établissement par défaut si manquant
      if (!estId) {
        const API_URL = import.meta.env.VITE_API_URL
        if (!API_URL) return

        const res = await fetch(
          `${API_URL}/user_establishment?user_id=${session.user.id}`
        )

        if (res.ok) {
          const links = await res.json()
          if (
            Array.isArray(links) &&
            links.length > 0 &&
            links[0]?.establishment_id
          ) {
            select(links[0].establishment_id)
          }
        }
      }
    }

    // 1. Sync immédiat
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!error) {
          sync(data.session)
        }
      })
      .catch(() => {
        /* ignore getSession errors */
      })

    // 2. Sync temps réel (login / logout)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      sync(session)
    })

    return () => {
      isMounted = false
      sub?.subscription?.unsubscribe()
    }
    // select provient du contexte et n'est pas mémorisé, on le passe volontairement hors deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, estId])

  return <>{children}</>
}
