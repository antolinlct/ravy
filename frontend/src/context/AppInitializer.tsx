/**
 * AppInitializer.tsx
 * -------------------
 * Synchronise les contextes avec la session Supabase.
 * Ne gère PAS le routing.
 */

"use client"

import { useEffect } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import { useUser } from "./UserContext"
import { useUserData, useUserDataReload } from "./UserDataContext"
import { useEstablishment } from "./EstablishmentContext"
import {
  useEstablishmentData,
  useEstablishmentDataReload,
  useEstablishmentUsageCountersReload,
} from "./EstablishmentDataContext"
import { useUserEstablishments } from "./UserEstablishmentsContext"
import { useUserMercurialeAccessReload } from "./UserMercurialeAccessContext"

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const user = useUser()
  useUserData()
  const userDataReload = useUserDataReload()
  const { estId, select, clear } = useEstablishment()
  useEstablishmentData()
  const estDataReload = useEstablishmentDataReload()
  const usageReload = useEstablishmentUsageCountersReload()
  const userEstablishments = useUserEstablishments()
  const userMercurialeReload = useUserMercurialeAccessReload()

  useEffect(() => {
    let isMounted = true

    async function refreshAll() {
      await Promise.allSettled([
        userDataReload?.(),
        userEstablishments?.reload?.(),
        userMercurialeReload?.(),
        estDataReload?.(),
        usageReload?.(),
      ])
    }

    async function sync(session: Session | null, event?: string) {
      if (!isMounted) return

      if (!session) {
        // Pas de session → on nettoie juste
        localStorage.removeItem("user_id")
        localStorage.removeItem("current_establishment_id")
        sessionStorage.clear()
        return
      }

      if (event === "SIGNED_IN") {
        await refreshAll()
      }

      // Hydrate user_id si manquant
      if (!user?.id) {
        localStorage.setItem("user_id", session.user.id)
      }
    }

    // 1. Sync immédiat
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!error) {
          sync(data.session, "INITIAL_SESSION")
        }
      })
      .catch(() => {
        /* ignore getSession errors */
      })

    // 2. Sync temps réel (login / logout)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      sync(session, event)
    })

    return () => {
      isMounted = false
      sub?.subscription?.unsubscribe()
    }
    // select provient du contexte et n'est pas mémorisé, on le passe volontairement hors deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, estId])

  useEffect(() => {
    const links = userEstablishments?.list ?? []
    if (!user?.id) return
    if (!links.length) {
      clear()
      return
    }
    if (estId && links.some((link) => link.establishmentId === estId)) {
      return
    }
    if (links[0]?.establishmentId && estId !== links[0].establishmentId) {
      select(links[0].establishmentId)
    }
  }, [user?.id, estId, userEstablishments?.list, select, clear])

  return <>{children}</>
}
