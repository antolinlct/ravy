export type MercurialeLevel = "STANDARD" | "PLUS" | "PREMIUM"

export type UserRole = "padrino" | "owner" | "admin" | "manager" | "staff"

export type UserAccount = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  phoneSms: string | null
  internNotes: string | null
  superAdmin: boolean
  createdAt: string
  updatedAt: string | null
  lastLogin: string | null
}

export type Establishment = {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  siren: string | null
  fullAddress: string | null
  activeSms: boolean
  typeSms: string
  smsVariationTrigger: string | null
  recommendedRetailPriceMethod: "MULTIPLIER" | "PERCENTAGE" | "VALUE"
  recommendedRetailPriceValue: number | null
  createdAt: string
}

export type UserEstablishment = {
  userId: string
  establishmentId: string
  role: UserRole
  createdAt: string
}

export type UserMercurialeAccess = {
  id: string
  userId: string
  level: MercurialeLevel
  assignedBy: string | null
  createdAt: string
  updatedAt: string | null
}

export type UserListRow = {
  id: string
  name: string
  email: string
  superAdmin: boolean
  establishmentCount: number
  mercurialeLevel: MercurialeLevel | null
  lastLogin: string | null
  createdAt: string
}

export type UserEstablishmentRow = {
  id: string
  name: string
  role: UserRole
  activeSms: boolean
  typeSms: string
  smsVariationTrigger: string | null
  siren: string | null
  email: string | null
  phone: string | null
}
