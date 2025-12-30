import type { SerializedEditorState } from "lexical"

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
