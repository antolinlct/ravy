/**
 * UserEstablishmentsContext.tsx
 * -----------------------------
 * Source unique des relations utilisateur ↔ établissements.
 *
 * Responsabilités :
 * - Charger la table user_establishment pour l'utilisateur connecté
 * - Exposer la liste des établissements accessibles + rôle associé
 *
 * Règles :
 * - Dépend UNIQUEMENT de UserContext (auth)
 * - Ne dépend PAS de UserDataContext
 * - Ne charge AUCUNE donnée établissement (nom, logo, etc.)
 */

"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useUser } from "./UserContext"

// --- Types métier ---
export type UserRole =
  | "padrino"
  | "owner"
  | "admin"
  | "manager"
  | "staff"

export type UserEstablishment = {
  establishmentId: string
  role: UserRole
}

type ContextValue = {
  list: UserEstablishment[]
  reload: () => Promise<void>
}

// --- Contexte ---
const UserEstablishmentsContext = createContext<ContextValue | null>(null)

// --- Provider ---
export function UserEstablishmentsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const authUser = useUser()
  const [list, setList] = useState<UserEstablishment[]>([])

  const reload = useCallback(async () => {
    const userId = authUser?.id

    // Aucun user → reset
    if (!userId) {
      setList([])
      return
    }

    const { data, error } = await supabase
      .from("user_establishment")
      .select("establishment_id, role")
      .eq("user_id", userId)

    if (error || !Array.isArray(data)) return

    setList(
      data.map((row) => ({
        establishmentId: row.establishment_id,
        role: row.role as UserRole,
      }))
    )
  }, [authUser?.id])

  useEffect(() => {
    reload().catch(() => {
      /* ignore initial load errors */
    })

  }, [reload])

  return (
    <UserEstablishmentsContext.Provider value={{ list, reload }}>
      {children}
    </UserEstablishmentsContext.Provider>
  )
}

// --- Hook ---
// eslint-disable-next-line react-refresh/only-export-components -- hook export nécessaire aux consommateurs
export function useUserEstablishments() {
  return useContext(UserEstablishmentsContext)
}
