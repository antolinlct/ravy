export type SupplierOption = {
  value: string
  label: string
  isPending?: boolean
}

export type InvoiceListItem = {
  id: string
  supplier: string
  supplierValue: string
  reference: string
  date: string
  dateValue: Date
  createdAt: Date
  ht: string
  tva: string
  ttc: string
  ttcValue?: number
}

export type InvoiceTotals = {
  ht: string
  tva: string
  ttc: string
}

export type InvoiceItem = {
  id: string
  name: string
  unit: string
  quantity?: string
  unitPrice: string
  lineTotal?: string
  delta?: string
  dutiesTaxes?: string
  discount?: string
  masterArticleId?: string | null
}

export type InvoiceSupplierType = "beverage" | "other"

export type InvoiceDetail = {
  number: string
  lastModified: string
  supplier: string
  supplierType: InvoiceSupplierType
  date: string
  importedAt: string
  documentUrl?: string
  pageCount?: number
  totals: InvoiceTotals
  items: InvoiceItem[]
}

export type InvoicePricePoint = {
  date: Date
  value: number
  label: string
}

export type SupplierRow = {
  id: string
  name: string
  invoicesCount: number
  label: string
  labelTone: "outline" | "secondary" | "default"
  analyses: boolean
  marketSupplierId?: string | null
  labelValue?: string | null
}

export type MergeRequest = {
  id: string
  date: string
  target: string
  sources: string[]
  status: string
}

export type LabelOption = {
  value: string
  label: string
  tone: "default" | "outline" | "secondary"
}
