import { useMemo, useState } from "react"

import { UsersListView } from "./list"
import { UserDetailView } from "./user-detail"
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

const usersSeed: UserAccount[] = [
  {
    id: "usr-001",
    email: "clara.mendes@lacantine.fr",
    firstName: "Clara",
    lastName: "Mendes",
    phone: "06 12 34 45 89",
    phoneSms: "06 12 34 45 89",
    internNotes: "Compte pilote restauration rapide.",
    superAdmin: false,
    createdAt: "2024-10-12T09:12:00",
    updatedAt: "2024-12-01T14:08:00",
    lastLogin: "2025-02-02T08:20:00",
  },
  {
    id: "usr-014",
    email: "hugo@brasserieduport.fr",
    firstName: "Hugo",
    lastName: "Perrin",
    phone: "06 44 18 22 10",
    phoneSms: null,
    internNotes: null,
    superAdmin: false,
    createdAt: "2024-11-04T11:05:00",
    updatedAt: "2025-01-15T10:02:00",
    lastLogin: "2025-02-01T17:42:00",
  },
  {
    id: "usr-022",
    email: "nicolas@chezantonio.fr",
    firstName: "Nicolas",
    lastName: "Dubois",
    phone: "07 09 32 10 55",
    phoneSms: "07 09 32 10 55",
    internNotes: "A besoin d un suivi rapproché.",
    superAdmin: false,
    createdAt: "2024-09-22T16:44:00",
    updatedAt: null,
    lastLogin: "2025-01-29T09:12:00",
  },
  {
    id: "usr-032",
    email: "admin@ravy.app",
    firstName: "Admin",
    lastName: "Ravy",
    phone: null,
    phoneSms: null,
    internNotes: "Compte interne supervision.",
    superAdmin: true,
    createdAt: "2024-08-01T08:30:00",
    updatedAt: "2025-01-20T09:00:00",
    lastLogin: "2025-02-02T07:50:00",
  },
]

const establishmentsSeed: Establishment[] = [
  {
    id: "est-001",
    name: "La Cantine Lumiere",
    slug: "la-cantine-lumiere",
    email: "contact@lacantine.fr",
    phone: "04 72 44 10 10",
    siren: "812345678",
    fullAddress: "12 rue des Halles, 69002 Lyon",
    activeSms: true,
    typeSms: "FOOD",
    smsVariationTrigger: "ALL",
    recommendedRetailPriceMethod: "MULTIPLIER",
    recommendedRetailPriceValue: 3,
    createdAt: "2024-10-12T09:00:00",
  },
  {
    id: "est-002",
    name: "Brasserie du Port",
    slug: "brasserie-du-port",
    email: "contact@brasserieduport.fr",
    phone: "04 91 56 22 33",
    siren: "899001223",
    fullAddress: "9 quai du Port, 13002 Marseille",
    activeSms: false,
    typeSms: "FOOD & BEVERAGES",
    smsVariationTrigger: "±10%",
    recommendedRetailPriceMethod: "PERCENTAGE",
    recommendedRetailPriceValue: 18,
    createdAt: "2024-11-04T09:10:00",
  },
  {
    id: "est-003",
    name: "Chez Antonio",
    slug: "chez-antonio",
    email: "contact@chezantonio.fr",
    phone: "04 93 21 98 76",
    siren: "812009332",
    fullAddress: "21 avenue de la Mer, 06000 Nice",
    activeSms: true,
    typeSms: "FOOD",
    smsVariationTrigger: "±5%",
    recommendedRetailPriceMethod: "VALUE",
    recommendedRetailPriceValue: 2.5,
    createdAt: "2024-09-22T15:30:00",
  },
  {
    id: "est-004",
    name: "Atelier Vert",
    slug: "atelier-vert",
    email: "bonjour@ateliervert.fr",
    phone: "05 56 22 19 11",
    siren: "921114556",
    fullAddress: "4 cours Alsace, 33000 Bordeaux",
    activeSms: false,
    typeSms: "FOOD",
    smsVariationTrigger: null,
    recommendedRetailPriceMethod: "MULTIPLIER",
    recommendedRetailPriceValue: 2.8,
    createdAt: "2024-12-03T10:20:00",
  },
]

const userEstablishmentsSeed: UserEstablishment[] = [
  {
    userId: "usr-001",
    establishmentId: "est-001",
    role: "owner",
    createdAt: "2024-10-12T09:15:00",
  },
  {
    userId: "usr-014",
    establishmentId: "est-002",
    role: "manager",
    createdAt: "2024-11-04T11:08:00",
  },
  {
    userId: "usr-014",
    establishmentId: "est-004",
    role: "manager",
    createdAt: "2024-12-03T10:30:00",
  },
  {
    userId: "usr-022",
    establishmentId: "est-003",
    role: "padrino",
    createdAt: "2024-09-22T16:50:00",
  },
]

const mercurialeAccessSeed: UserMercurialeAccess[] = [
  {
    id: "access-1",
    userId: "usr-001",
    level: "STANDARD",
    assignedBy: "usr-032",
    createdAt: "2024-10-12T09:20:00",
    updatedAt: "2024-12-01T14:08:00",
  },
  {
    id: "access-2",
    userId: "usr-014",
    level: "PLUS",
    assignedBy: "usr-032",
    createdAt: "2024-11-04T11:12:00",
    updatedAt: "2025-01-10T10:12:00",
  },
  {
    id: "access-3",
    userId: "usr-022",
    level: "PREMIUM",
    assignedBy: "usr-032",
    createdAt: "2024-09-22T16:55:00",
    updatedAt: "2024-12-20T09:45:00",
  },
]

export default function AdminEstablishmentsPage() {
  const [users] = useState<UserAccount[]>(usersSeed)
  const [establishments] = useState<Establishment[]>(establishmentsSeed)
  const [userEstablishments] = useState<UserEstablishment[]>(userEstablishmentsSeed)
  const [accessEntries, setAccessEntries] = useState<UserMercurialeAccess[]>(
    mercurialeAccessSeed
  )
  const [view, setView] = useState<ViewState>({ type: "list" })

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

  const handleUpdateAccess = (userId: string, level: MercurialeLevel) => {
    setAccessEntries((prev) => {
      const existing = prev.find((entry) => entry.userId === userId)
      if (!existing) {
        return [
          ...prev,
          {
            id: `access-${Math.random().toString(36).slice(2, 9)}`,
            userId,
            level,
            assignedBy: "usr-032",
            createdAt: nowStamp(),
            updatedAt: nowStamp(),
          },
        ]
      }
      return prev.map((entry) =>
        entry.userId === userId
          ? { ...entry, level, updatedAt: nowStamp() }
          : entry
      )
    })
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
