export type SupplierLabel =
  | "FOOD"
  | "BEVERAGES"
  | "FIXED COSTS"
  | "VARIABLE COSTS"
  | "OTHER"

export type MergeRequestStatus =
  | "pending"
  | "to_confirm"
  | "accepted"
  | "resolved"
  | "refused"

export type SupplierMergeRequest = {
  id: string
  createdAt: string
  status: MergeRequestStatus
  sourceSupplierIds: string[]
  targetSupplierId: string
  requestingEstablishmentId?: string | null
  establishment?: string | null
}

export type MarketSupplier = {
  id: string
  name: string
  active: boolean
  label?: SupplierLabel | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type MarketSupplierAlias = {
  id: string
  supplierMarketId: string
  alias: string
  createdAt?: string | null
}
