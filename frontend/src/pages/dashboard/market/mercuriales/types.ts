export type MercurialeSupplier = {
  id: string
  created_at?: string | null
  market_supplier_id?: string | null
  label?: "FOOD" | "BEVERAGES" | "FIXED COSTS" | "VARIABLE COSTS" | "OTHER" | null
  mercurial_logo_path?: string | null
  active?: boolean | null
  name?: string | null
}

export type Mercuriale = {
  id: string
  name?: string | null
  description?: string | null
  active?: boolean | null
  effective_from?: string | null
  effective_to?: string | null
  created_at?: string | null
  updated_at?: string | null
  mercuriale_supplier_id?: string | null
  market_supplier_id?: string | null
}

export type MercurialeMasterArticle = {
  id: string
  created_at?: string | null
  mercurial_supplier_id?: string | null
  name?: string | null
  unit?: string | null
  vat_rate?: number | null
  active?: boolean | null
  description?: string | null
  notes?: string | null
  market_master_article?: string | null
  category_id?: string | null
  subcategory_id?: string | null
  race_name?: string | null
}

export type MercurialeArticle = {
  id: string
  mercuriale_id: string
  mercurial_master_article_id: string
  price_standard?: number | null
  price_plus?: number | null
  price_premium?: number | null
  active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}
