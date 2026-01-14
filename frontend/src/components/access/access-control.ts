import { useMemo } from "react"
import { useEstablishment } from "@/context/EstablishmentContext"
import { useUserEstablishments } from "@/context/UserEstablishmentsContext"

export type AccessRole = "padrino" | "owner" | "admin" | "manager" | "staff" | "accountant"

export type AccessFeature =
  | "billing"
  | "access"
  | "establishment_create"
  | "establishment_settings"
  | "preferences"
  | "support"
  | "integrations"
  | "invoices"
  | "recipes"
  | "analytics"
  | "performance"
  | "consultant"

const fullAccess: AccessFeature[] = [
  "billing",
  "access",
  "establishment_create",
  "establishment_settings",
  "preferences",
  "support",
  "integrations",
  "invoices",
  "recipes",
  "analytics",
  "performance",
  "consultant",
]

const roleAccess: Record<Exclude<AccessRole, "padrino">, AccessFeature[]> = {
  owner: fullAccess,
  admin: fullAccess,
  manager: [
    "preferences",
    "support",
    "integrations",
    "invoices",
    "recipes",
    "analytics",
    "performance",
    "consultant",
  ],
  staff: ["invoices", "recipes", "analytics"],
  accountant: ["invoices", "performance"],
}

export function canAccess(role: AccessRole | null | undefined, feature: AccessFeature) {
  if (!role) return false
  if (role === "padrino") return true
  return roleAccess[role]?.includes(feature) ?? false
}

export function useAccess() {
  const { estId } = useEstablishment()
  const userEstablishments = useUserEstablishments()

  const role = useMemo<AccessRole | null>(() => {
    const list = userEstablishments?.list ?? []
    const match = list.find((item) => item.establishmentId === estId)
    return (match?.role as AccessRole) ?? null
  }, [userEstablishments?.list, estId])

  return {
    role,
    can: (feature: AccessFeature) => canAccess(role, feature),
  }
}
