# Dashboard recipes (recipes/index.tsx, recipes/detail.tsx) - AGENTS

## Purpose
- Provide the core recipe workspace: list all recipes, create new ones, and edit a recipe in detail.
- Editing covers ingredients (articles, sub-recipes, fixed costs), pricing, and technical data sheet assets.

## Current structure (factored)
- Pages
  - `frontend/src/pages/dashboard/recipes/index.tsx`: list + create entry point.
  - `frontend/src/pages/dashboard/recipes/detail.tsx`: full editor for a single recipe.
- Types + data
- `frontend/src/pages/dashboard/recipes/types.ts`: shared DTOs for list/detail, ingredients, editor drafts.
- `frontend/src/pages/dashboard/recipes/api.ts`: API helpers (read + write logic triggers).
- `frontend/src/pages/dashboard/recipes/utils.ts`: parsing/formatting helpers and editor serialization.
- Components
  - `components/RecipesPageHeader.tsx`
  - `components/RecipeCreationCard.tsx`
  - `components/RecipesListCard.tsx`
  - `components/RecipeDetailHeader.tsx`
  - `components/RecipeIngredientsCard.tsx`
  - `components/RecipeSettingsCard.tsx`
  - `components/IngredientEditorSheet.tsx`
  - `components/RecipeNavGuardDialog.tsx`
  - `components/RecipeDeleteDialog.tsx`
  - `components/RecipeDuplicateDialog.tsx`
  - `components/RecipeRenameDialog.tsx`
  - `components/RecipeDownloadDialog.tsx`

## Data flow (current behavior)
- Index page
  - Loads recipes, categories, subcategories, and ingredient counts from API.
  - Create flow validates name/category/subcategory, POSTs `/recipes`, then navigates to detail.
  - Filters: category, subcategory, and recipe combobox; search is ID-based.
  - Sorting: name, margin, portion cost, sale price.
- Detail page
  - Loads recipe + ingredients + lookup data (categories, subcategories, suppliers, master articles, VAT).
  - Unsaved changes guard blocks navigation + sidebar clicks + hotkeys until saved.
  - Ingredients editor supports three types:
    - `ARTICLE`: master-article product with supplier, quantity, waste.
    - `SUBRECIPE`: existing recipe as an ingredient (cost per portion × portions used).
    - `FIXED`: fixed cost (labor, energy, packaging). Label stored in `unit` (no DB name field).
  - Pricing logic:
    - Purchase cost per portion = total ingredient cost ÷ portions.
    - Suggested price TTC uses establishment pricing preferences.
    - Margin = price HT - cost HT, % = margin / price HT.
- Technical data sheet:
  - Uploads image to Supabase bucket `technical_data_sheet_image` (env override).
  - Stores path in `technical_data_sheet_image_path`.
  - Pricing preferences come from `fetchRecipePricePrefs` which calls `/establishments/{estId}`.

## Backend logic to use (write)
- Delete ingredient: `backend/app/logic/write/delete_ingredient.py`
  - Deletes ingredient, updates recipe + dependent sub-recipe ingredients.
  - Recomputes history + margins for impacted recipes (only active & saleable).
- Delete recipe: `backend/app/logic/write/delete_recipes.py`
  - Deletes recipe + sub-recipe ingredients referencing it.
  - Updates dependent recipes + recomputes margins.
- Duplicate recipe: `backend/app/logic/write/recipe_duplication.py`
  - Clones recipe + ingredients (without computed fields) and recomputes histories + margins.

## Contracts / tables (from contracts_summary.json)
- `public.recipes`
  - `name`, `active`, `saleable`, `vat_id`, `portion`, `portion_weight`,
    `price_excl_tax`, `price_incl_tax`, `price_tax`, `category_id`, `subcategory_id`,
    `purchase_cost_total`, `purchase_cost_per_portion`, `technical_data_sheet_*`.
- `public.ingredients`
  - `recipe_id`, `type`, `master_article_id`, `subrecipe_id`, `quantity`, `unit`, `unit_cost`,
    `percentage_loss`, `gross_unit_price`.
- `public.history_ingredients`, `public.history_recipes`
  - Versioned computed costs and margins per date.
- `public.recipe_categories`, `public.recipes_subcategories`
  - Category hierarchy for recipe classification.
- `public.recipe_margin`, `public.recipe_margin_category`, `public.recipe_margin_subcategory`
  - Aggregate margins used by analytics.

## Implementation notes
- `ingredients.type` is a custom enum in DB; front maps it to `ARTICLE | SUBRECIPE | FIXED`.
- `ingredients.unit_cost` is the line total computed by backend; UI displays the per-unit price
  from `gross_unit_price` (or master article price) and recomputes line totals with quantity + loss.
- `contains_sub_recipe` on `recipes` is used to prevent nesting sub-recipes inside sub-recipes.
- `recommended_retail_price_method` + `recommended_retail_price_value` are read from
  `/establishments/{estId}` to compute suggested price.
- Technical image path handling:
  - Full URL if already absolute; otherwise resolved against Supabase public storage.
- API usage:
  - Read: `/recipes`, `/ingredients`, `/recipe_categories`, `/recipes_subcategories`,
    `/suppliers`, `/master_articles`, `/vat_rates`.
  - Write logic triggers: `/logic/write/update-recipe`, `/logic/write/update-ingredient`,
    `/logic/write/delete-ingredient`, `/logic/write/duplicate-recipe`, `/logic/write/delete-recipe`.
