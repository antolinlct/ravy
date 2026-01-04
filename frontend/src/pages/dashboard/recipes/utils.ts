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

const isSerializedState = (value: unknown): value is SerializedEditorState => {
  if (!value || typeof value !== "object") return false
  const root = (value as { root?: { children?: unknown[] } }).root
  return Boolean(root && Array.isArray(root.children))
}

export const parseInstructionsState = (value?: string | null): SerializedEditorState | null => {
  if (!value || !value.trim()) return null
  const trimmed = value.trim()
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed)
      if (isSerializedState(parsed)) {
        return parsed
      }
    } catch {
      // fall back to plain text
    }
  }
  return toSerializedState(value)
}

const extractNodeText = (node: Record<string, unknown>): string => {
  if (typeof node.text === "string") {
    return node.text
  }
  const children = node.children
  if (Array.isArray(children)) {
    return children.map((child) => extractNodeText(child as Record<string, unknown>)).join("")
  }
  return ""
}

export const toPlainText = (state: SerializedEditorState | null | undefined): string => {
  if (!state || typeof state !== "object") return ""
  const root = (state as { root?: { children?: unknown[] } }).root
  const blocks = Array.isArray(root?.children) ? root.children : []
  const lines = blocks
    .map((block) => extractNodeText(block as Record<string, unknown>).trim())
    .filter(Boolean)
  return lines.join("\n")
}

const TEXT_REPLACEMENTS: Record<string, string> = {
  "\u2022": "-",
  "\u2013": "-",
  "\u2014": "-",
  "\u2018": "'",
  "\u2019": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u2026": "...",
  "\u00a0": " ",
  "€": "EUR",
}

const normalizePdfText = (text: string) => {
  return Object.entries(TEXT_REPLACEMENTS).reduce(
    (acc, [from, to]) => acc.split(from).join(to),
    text
  )
}

const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const renderTextNode = (node: Record<string, unknown>) => {
  const rawText = typeof node.text === "string" ? node.text : ""
  let text = escapeHtml(normalizePdfText(rawText))
  const format = node.format
  const formatValue = typeof format === "number" ? format : String(format ?? "")
  const isBold = typeof formatValue === "number" ? (formatValue & 1) !== 0 : formatValue.includes("bold")
  const isUnderline =
    typeof formatValue === "number" ? (formatValue & 4) !== 0 : formatValue.includes("underline")
  if (isUnderline) {
    text = `<u>${text}</u>`
  }
  if (isBold) {
    text = `<b>${text}</b>`
  }
  return text
}

const renderNodes = (nodes: unknown[]): string => {
  return nodes.map((node) => renderNode(node as Record<string, unknown>)).join("")
}

const renderInlineNodes = (nodes: unknown[]): string => {
  return nodes.map((node) => renderInlineNode(node as Record<string, unknown>)).join("")
}

const renderInlineNode = (node: Record<string, unknown>): string => {
  const type = String(node.type ?? "")
  if (type === "paragraph") {
    const children = Array.isArray(node.children) ? (node.children as unknown[]) : []
    return renderInlineNodes(children)
  }
  return renderNode(node)
}

const renderNode = (node: Record<string, unknown>): string => {
  const type = String(node.type ?? "")
  if (type === "text") {
    return renderTextNode(node)
  }
  if (type === "linebreak") {
    return "<br />"
  }
  const children = Array.isArray(node.children) ? (node.children as unknown[]) : []
  if (type === "paragraph") {
    const content = renderNodes(children).trim()
    return content ? `<p>${content}</p>` : ""
  }
  if (type === "heading") {
    const tag = String(node.tag ?? "")
    const content = renderNodes(children).trim()
    if (!content) return ""
    return tag === "h3" ? `<p><b>${content}</b></p>` : `<p>${content}</p>`
  }
  if (type === "list") {
    const listType = String(node.listType ?? "")
    const listItems = children.filter((child) => (child as Record<string, unknown>).type === "listitem")
    if (!listItems.length) return ""
    const isOrdered = listType === "number" || listType === "ordered"
    return listItems
      .map((child, index) => {
        const item = child as Record<string, unknown>
        const itemChildren = Array.isArray(item.children) ? (item.children as unknown[]) : []
        const content = renderInlineNodes(itemChildren).trim()
        if (!content) return ""
        const prefix = isOrdered ? `${index + 1}. ` : "- "
        return `<p>${prefix}${content}</p>`
      })
      .filter(Boolean)
      .join("")
  }
  if (type === "listitem") {
    const content = renderInlineNodes(children).trim()
    return content
  }
  return renderNodes(children)
}

export const toInstructionsHtml = (
  state: SerializedEditorState | null | undefined
): string => {
  if (!state || typeof state !== "object") return ""
  const root = (state as { root?: { children?: unknown[] } }).root
  const blocks = Array.isArray(root?.children) ? root.children : []
  return renderNodes(blocks).trim()
}
