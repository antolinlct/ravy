from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class FinancialReports(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    month: Optional[date] = None
    ca_solid_ht: Optional[float] = None
    ca_liquid_ht: Optional[float] = None
    ca_total_ht: Optional[float] = None
    ca_tracked_recipes_total: Optional[float] = None
    ca_tracked_recipes_ratio: Optional[float] = None
    ca_untracked_recipes_total: Optional[float] = None
    ca_untracked_recipes_ratio: Optional[float] = None
    material_cost_solid: Optional[float] = None
    material_cost_liquid: Optional[float] = None
    material_cost_total: Optional[float] = None
    material_cost_ratio: Optional[float] = None
    material_cost_ratio_solid: Optional[float] = None
    material_cost_ratio_liquid: Optional[float] = None
    labor_cost_total: Optional[float] = None
    labor_cost_ratio: Optional[float] = None
    fte_count: Optional[float] = None
    fixed_charges_total: Optional[float] = None
    fixed_charges_ratio: Optional[float] = None
    variable_charges_total: Optional[float] = None
    variable_charges_ratio: Optional[float] = None
    commercial_margin_solid: Optional[float] = None
    commercial_margin_liquid: Optional[float] = None
    commercial_margin_total: Optional[float] = None
    commercial_margin_solid_ratio: Optional[float] = None
    commercial_margin_liquid_ratio: Optional[float] = None
    commercial_margin_total_ratio: Optional[float] = None
    production_cost_total: Optional[float] = None
    production_cost_ratio: Optional[float] = None
    ebitda: Optional[float] = None
    ebitda_ratio: Optional[float] = None
    break_even_point: Optional[float] = None
    safety_margin: Optional[float] = None
    safety_margin_ratio: Optional[float] = None
    revenue_per_employee: Optional[float] = None
    result_per_employee: Optional[float] = None
    salary_per_employee: Optional[float] = None
    avg_revenue_per_dish: Optional[float] = None
    avg_cost_per_dish: Optional[float] = None
    avg_margin_per_dish: Optional[float] = None
    theoretical_sales_solid: Optional[float] = None
    theoretical_material_cost_solid: Optional[float] = None
    multiplier_global: Optional[float] = None
    multiplier_solid: Optional[float] = None
    multiplier_liquid: Optional[float] = None
    notes: Optional[str] = None
    mscv: Optional[float] = None
    mscv_ratio: Optional[float] = None
    score_global: Optional[float] = None
    score_financial: Optional[float] = None
    score_recipe: Optional[float] = None
    score_purchase: Optional[float] = None
    other_charges_total: Optional[float] = None
    other_charges_ratio: Optional[float] = None
