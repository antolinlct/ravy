export type LiveScoreType = "global" | "purchase" | "recipe" | "financial"

export type LiveScoreRow = {
  id: string
  created_at?: string | null
  establishment_id?: string | null
  type?: LiveScoreType | null
  value?: number | null
  updated_at?: string | null
}

export type FinancialReportRow = {
  id: string
  establishment_id?: string | null
  month?: string | null
  updated_at?: string | null
  ca_total_ht?: number | null
  ca_solid_ht?: number | null
  ca_liquid_ht?: number | null
  ca_tracked_recipes_total?: number | null
  ca_tracked_recipes_ratio?: number | null
  ca_untracked_recipes_total?: number | null
  ca_untracked_recipes_ratio?: number | null
  material_cost_solid?: number | null
  material_cost_liquid?: number | null
  material_cost_total?: number | null
  material_cost_ratio?: number | null
  material_cost_ratio_solid?: number | null
  material_cost_ratio_liquid?: number | null
  labor_cost_total?: number | null
  labor_cost_ratio?: number | null
  fixed_charges_total?: number | null
  fixed_charges_ratio?: number | null
  variable_charges_total?: number | null
  variable_charges_ratio?: number | null
  other_charges_total?: number | null
  other_charges_ratio?: number | null
  production_cost_total?: number | null
  production_cost_ratio?: number | null
  commercial_margin_total?: number | null
  commercial_margin_total_ratio?: number | null
  commercial_margin_solid?: number | null
  commercial_margin_solid_ratio?: number | null
  commercial_margin_liquid?: number | null
  commercial_margin_liquid_ratio?: number | null
  ebitda?: number | null
  ebitda_ratio?: number | null
  break_even_point?: number | null
  safety_margin?: number | null
  safety_margin_ratio?: number | null
  revenue_per_employee?: number | null
  result_per_employee?: number | null
  salary_per_employee?: number | null
  avg_revenue_per_dish?: number | null
  avg_cost_per_dish?: number | null
  avg_margin_per_dish?: number | null
  avg_margin_delta?: number | null
  theoretical_sales_solid?: number | null
  theoretical_material_cost_solid?: number | null
  multiplier_global?: number | null
  multiplier_solid?: number | null
  multiplier_liquid?: number | null
  score_global?: number | null
  score_financial?: number | null
  score_recipe?: number | null
  score_purchase?: number | null
  fte_count?: number | null
}

export type FinancialIngredientRow = {
  id: string
  financial_report_id?: string | null
  master_article_id?: string | null
  quantity?: number | null
  consumed_value?: number | null
  market_gap_value?: number | null
  market_gap_percentage?: number | null
  market_total_savings?: number | null
  market_balanced?: number | null
}

export type FinancialRecipeRow = {
  id: string
  financial_report_id?: string | null
  recipe_id?: string | null
  sales_number?: number | null
  total_revenue?: number | null
  total_cost?: number | null
  total_margin?: number | null
  balanced_margin?: number | null
}

export type RecipeRow = {
  id: string
  name?: string | null
  active?: boolean | null
  saleable?: boolean | null
  price_excl_tax?: number | null
  price_tax?: number | null
  price_incl_tax?: number | null
  category_id?: string | null
  subcategory_id?: string | null
}

export type MasterArticleRow = {
  id: string
  name?: string | null
  unformatted_name?: string | null
  supplier_id?: string | null
  unit?: string | null
}

export type SupplierRow = {
  id: string
  name?: string | null
}

export type RecipeCategoryRow = {
  id: string
  name?: string | null
}

export type RecipeSubcategoryRow = {
  id: string
  name?: string | null
  category_id?: string | null
}

export type ReportableRecipe = {
  id: string
  name: string
  price: number
}

export type ScoreCard = {
  id: "buy" | "recipes" | "finance"
  title: string
  subtitle: string
  detail: string
  value: number
  delta: number
}

export type ScoreTrendPoint = {
  label: string
  value: number
  date: string
}
