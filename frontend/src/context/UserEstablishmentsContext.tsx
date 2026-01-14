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
  | "accountant"
  | "staff"

export type UserEstablishment = {
  establishmentId: string
  role: UserRole
}

type ContextValue = {
  list: UserEstablishment[]
  reload: () => Promise<void>
  loading: boolean
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
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    const userId = authUser?.id

    // Aucun user → reset
    if (!userId) {
      setList([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from("user_establishment")
      .select("establishment_id, role")
      .eq("user_id", userId)

    if (error || !Array.isArray(data)) {
      setLoading(false)
      setList([])
      return
    }

    const rolePriority: Record<UserRole, number> = {
      padrino: 5,
      owner: 4,
      admin: 3,
      manager: 2,
      accountant: 1,
      staff: 0,
    }

    const unique = new Map<string, UserRole>()
    data.forEach((row) => {
      const establishmentId = row.establishment_id
      const role = row.role as UserRole
      if (!establishmentId) return

      const existing = unique.get(establishmentId)
      if (!existing || rolePriority[role] > rolePriority[existing]) {
        unique.set(establishmentId, role)
      }
    })

    setList(
      Array.from(unique.entries()).map(([establishmentId, role]) => ({
        establishmentId,
        role,
      }))
    )
    setLoading(false)
  }, [authUser?.id])

  useEffect(() => {
    reload().catch(() => {
      /* ignore initial load errors */
    })
  }, [reload])

  return (
    <UserEstablishmentsContext.Provider value={{ list, reload, loading }}>
      {children}
    </UserEstablishmentsContext.Provider>
  )
}

// --- Hook ---
// eslint-disable-next-line react-refresh/only-export-components -- hook export nécessaire aux consommateurs
export function useUserEstablishments() {
  return useContext(UserEstablishmentsContext)
}
