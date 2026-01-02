import type { SerializedEditorState } from "lexical"
import type { ApiRecipe } from "./api"
import type { RecipeDetail } from "./types"

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const toRecipeDetail = (recipe: ApiRecipe): RecipeDetail => {
  const portions = toNumber(recipe.portion) ?? 1
  const updatedAt = recipe.updated_at
    ? new Date(recipe.updated_at)
    : recipe.created_at
      ? new Date(recipe.created_at)
      : new Date()

  return {
    id: recipe.id,
    name: recipe.name ?? "Recette sans nom",
    active: Boolean(recipe.active),
    saleable: Boolean(recipe.saleable),
    vatId: recipe.vat_id ?? "",
    recommendedRetailPrice: toNumber(recipe.recommanded_retail_price) ?? 0,
    portions: Number.isFinite(portions) && portions > 0 ? portions : 1,
    portionWeightGrams: toNumber(recipe.portion_weight),
    priceInclTax: toNumber(recipe.price_incl_tax),
    categoryId: recipe.category_id ?? "",
    subcategoryId: recipe.subcategory_id ?? "",
    updatedAt,
    containsSubRecipe: Boolean(recipe.contains_sub_recipe),
    purchaseCostPerPortion: toNumber(recipe.purchase_cost_per_portion),
    technicalDataSheetInstructions: recipe.technical_data_sheet_instructions ?? "",
    technicalDataSheetImagePath: recipe.technical_data_sheet_image_path ?? null,
  }
}

export const formatCurrency = (value: number) =>
  value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  })

export const parseNumber = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return 0

  const hasLeadingNegative = trimmed.startsWith("-")
  const cleaned = trimmed.replace(/[^\d.,]/g, "")

  const lastDot = cleaned.lastIndexOf(".")
  const lastComma = cleaned.lastIndexOf(",")
  const decimalIndex = Math.max(lastDot, lastComma)

  const normalized = (() => {
    if (decimalIndex === -1) {
      return cleaned.replace(/[.,]/g, "")
    }
    const intPart = cleaned.slice(0, decimalIndex).replace(/[.,]/g, "")
    const fracPart = cleaned.slice(decimalIndex + 1).replace(/[.,]/g, "")
    return `${intPart}.${fracPart}`
  })()

  const withSign = hasLeadingNegative ? `-${normalized}` : normalized
  const num = parseFloat(withSign)
  return Number.isFinite(num) ? num : 0
}

export const sameNumber = (a: number | null | undefined, b: number | null | undefined) => {
  if (a === null || a === undefined) return b === null || b === undefined
  if (b === null || b === undefined) return false
  return Math.abs(a - b) < 1e-9
}

export const toSerializedState = (text: string): SerializedEditorState =>
  ({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
              type: "text",
              version: 1,
            },
          ],
          direction: null,
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  } as unknown as SerializedEditorState)
