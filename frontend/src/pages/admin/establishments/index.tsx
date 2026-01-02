import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { UsersListView } from "./list"
import { UserDetailView } from "./user-detail"
import {
  createUserMercurialeAccess,
  fetchEstablishments,
  fetchUserEstablishments,
  fetchUserMercurialeAccess,
  fetchUserProfiles,
  updateUserMercurialeAccess,
  type ApiEstablishment,
  type ApiUserMercurialeAccess,
  type ApiUserProfile,
} from "./api"
import type {
  Establishment,
  MercurialeLevel,
  UserAccount,
  UserEstablishment,
  UserEstablishmentRow,
  UserListRow,
  UserMercurialeAccess,
} from "./types"

type ViewState = { type: "list" } | { type: "detail"; userId: string }

const nowStamp = () => new Date().toISOString()
const toNumber = (value?: number | string | null) => {
  if (value === null || value === undefined) return null
  const numeric = typeof value === "string" ? Number(value) : value
  return Number.isFinite(numeric) ? numeric : null
}

const mapUser = (user: ApiUserProfile): UserAccount => ({
  id: user.id,
  email: user.email ?? "--",
  firstName: user.first_name ?? null,
  lastName: user.last_name ?? null,
  phone: user.phone ?? null,
  phoneSms: user.phone_sms ?? null,
  internNotes: user.intern_notes ?? null,
  superAdmin: Boolean(user.super_admin),
  createdAt: user.created_at ?? nowStamp(),
  updatedAt: user.updated_at ?? null,
  lastLogin: user.last_login ?? null,
})

const mapEstablishment = (est: ApiEstablishment): Establishment => ({
  id: est.id,
  name: est.name ?? "Etablissement",
  slug: est.slug ?? "",
  email: est.email ?? null,
  phone: est.phone ?? null,
  siren: est.siren ?? null,
  fullAddress: est.full_adresse ?? null,
  activeSms: Boolean(est.active_sms),
  typeSms: est.type_sms ?? "FOOD",
  smsVariationTrigger: est.sms_variation_trigger ?? null,
  recommendedRetailPriceMethod:
    est.recommended_retail_price_method ?? "MULTIPLIER",
  recommendedRetailPriceValue: toNumber(est.recommended_retail_price_value),
  createdAt: est.created_at ?? nowStamp(),
})

const mapAccess = (entry: ApiUserMercurialeAccess): UserMercurialeAccess => ({
  id: entry.id,
  userId: entry.user_id,
  level: entry.mercuriale_level,
  assignedBy: entry.assigned_by ?? null,
  createdAt: entry.created_at ?? nowStamp(),
  updatedAt: entry.updated_at ?? null,
})

export default function AdminEstablishmentsPage() {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [userEstablishments, setUserEstablishments] = useState<UserEstablishment[]>([])
  const [accessEntries, setAccessEntries] = useState<UserMercurialeAccess[]>([])
  const [view, setView] = useState<ViewState>({ type: "list" })

  const loadData = useCallback(async () => {
    try {
      const [profiles, links, access, establishmentsData] = await Promise.all([
        fetchUserProfiles(),
        fetchUserEstablishments(),
        fetchUserMercurialeAccess(),
        fetchEstablishments(),
      ])
      setUsers(profiles.map(mapUser))
      setUserEstablishments(
        links.map<UserEstablishment>((link) => ({
          userId: link.user_id,
          establishmentId: link.establishment_id,
          role: link.role,
          createdAt: link.created_at ?? nowStamp(),
        }))
      )
      setAccessEntries(access.map(mapAccess))
      setEstablishments(establishmentsData.map(mapEstablishment))
    } catch {
      toast.error("Impossible de charger les utilisateurs.")
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const accessByUserId = useMemo(() => {
    return new Map(accessEntries.map((entry) => [entry.userId, entry]))
  }, [accessEntries])

  const establishmentById = useMemo(() => {
    return new Map(establishments.map((establishment) => [establishment.id, establishment]))
  }, [establishments])

  const userRows = useMemo<UserListRow[]>(() => {
    const countByUser = new Map<string, number>()
    userEstablishments.forEach((link) => {
      countByUser.set(link.userId, (countByUser.get(link.userId) ?? 0) + 1)
    })

    return [...users]
      .map((user) => ({
        id: user.id,
        name:
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.email,
        email: user.email,
        superAdmin: user.superAdmin,
        establishmentCount: countByUser.get(user.id) ?? 0,
        mercurialeLevel: accessByUserId.get(user.id)?.level ?? null,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      }))
      .sort((a, b) => {
        const left = a.lastLogin ?? a.createdAt
        const right = b.lastLogin ?? b.createdAt
        return right.localeCompare(left, "fr", { sensitivity: "base" })
      })
  }, [accessByUserId, userEstablishments, users])

  const selectedUser =
    view.type === "detail"
      ? users.find((user) => user.id === view.userId) ?? null
      : null

  const selectedAccess = selectedUser
    ? accessByUserId.get(selectedUser.id)?.level ?? null
    : null

  const selectedEstablishments = useMemo<UserEstablishmentRow[]>(() => {
    if (!selectedUser) return []
    return userEstablishments
      .filter((link) => link.userId === selectedUser.id)
      .map((link) => {
        const establishment = establishmentById.get(link.establishmentId)
        return {
          id: link.establishmentId,
          name: establishment?.name ?? "Etablissement inconnu",
          role: link.role,
          activeSms: establishment?.activeSms ?? false,
          typeSms: establishment?.typeSms ?? "--",
          smsVariationTrigger: establishment?.smsVariationTrigger ?? null,
          siren: establishment?.siren ?? null,
          email: establishment?.email ?? null,
          phone: establishment?.phone ?? null,
        }
      })
  }, [establishmentById, selectedUser, userEstablishments])

  const handleUpdateAccess = async (userId: string, level: MercurialeLevel) => {
    const existing = accessByUserId.get(userId)
    try {
      if (!existing) {
        const created = await createUserMercurialeAccess({
          user_id: userId,
          mercuriale_level: level,
        })
        setAccessEntries((prev) => [...prev, mapAccess(created)])
      } else {
        const updated = await updateUserMercurialeAccess(existing.id, {
          mercuriale_level: level,
          updated_at: nowStamp(),
        })
        setAccessEntries((prev) =>
          prev.map((entry) => (entry.id === existing.id ? mapAccess(updated) : entry))
        )
      }
      toast.success("Acces mercuriale mis a jour.")
    } catch {
      toast.error("Impossible de mettre a jour l acces mercuriale.")
    }
  }

  if (view.type === "detail" && selectedUser) {
    return (
      <UserDetailView
        user={selectedUser}
        accessLevel={selectedAccess}
        establishments={selectedEstablishments}
        onBack={() => setView({ type: "list" })}
        onUpdateAccess={(level) => handleUpdateAccess(selectedUser.id, level)}
      />
    )
  }

  return <UsersListView users={userRows} onOpenUser={(id) => setView({ type: "detail", userId: id })} />
}
