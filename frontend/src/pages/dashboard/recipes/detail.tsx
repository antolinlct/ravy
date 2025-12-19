import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  FileText,
  FileDown,
  Info,
  Pencil,
  Plus,
  X,
  ShoppingBasket,
  Trash2,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Checkbox as CheckboxIcon } from "@/components/ui/checkbox"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Editor } from "@/components/blocks/editor-00/editor"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useEstablishment } from "@/context/EstablishmentContext"
import { cn } from "@/lib/utils"
import type { SerializedEditorState } from "lexical"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type IngredientType = "ARTICLE" | "SUBRECIPE" | "FIXED"
type PriceMethod = "MULTIPLIER" | "PERCENTAGE" | "VALUE"

type VatRateOption = {
  id: string
  label: string
  rate: number
}

type Recipe = {
  id: string
  name: string
  active: boolean
  saleable: boolean
  vatId: string
  recommendedRetailPrice: number
  portions: number
  portionWeightGrams: number | null
  priceInclTax: number | null
  categoryId: string
  subcategoryId: string
  updatedAt: Date
  containsSubRecipe?: boolean
  technicalDataSheetInstructions?: string
  technicalDataSheetImagePath?: string | null
}

type Ingredient = {
  id: string
  type: IngredientType
  name: string
  quantity: number
  unit: string
  unitCost: number
  supplierId?: string
  productId?: string
  wastePercent?: number
  subRecipeId?: string
}

type IngredientEditorDraft =
  | {
      type: "ARTICLE"
      supplierId: string
      productId: string
      quantity: string
      wastePercent: string
    }
  | {
      type: "SUBRECIPE"
      categoryId: string
      subcategoryId: string
      recipeId: string
      portionsUsed: string
    }
  | {
      type: "FIXED"
      name: string
      fixedCost: string
    }

type PendingNav =
  | { type: "path"; value: string }
  | { type: "hotkey"; value: string }
  | { type: "callback"; action: () => void }

const vatOptions: VatRateOption[] = [
  { id: "vat-0", label: "0%", rate: 0 },
  { id: "vat-55", label: "5,5%", rate: 0.055 },
  { id: "vat-10", label: "10%", rate: 0.1 },
  { id: "vat-20", label: "20%", rate: 0.2 },
]

const categoryOptions = [
  { id: "cat-desserts", label: "Dessert" },
  { id: "cat-plats", label: "Plats" },
  { id: "cat-entrees", label: "Entrées" },
  { id: "cat-boissons", label: "Boissons" },
]

const subcategoryOptionsByCategory: Record<string, { id: string; label: string }[]> = {
  "cat-desserts": [
    { id: "sub-patisseries", label: "Pâtisseries" },
    { id: "sub-glaces", label: "Glaces" },
  ],
  "cat-plats": [
    { id: "sub-viandes", label: "Viandes" },
    { id: "sub-poissons", label: "Poissons" },
  ],
  "cat-entrees": [
    { id: "sub-chaudes", label: "Entrées chaudes" },
    { id: "sub-froides", label: "Entrées froides" },
  ],
  "cat-boissons": [
    { id: "sub-sans-alcool", label: "Sans alcool" },
    { id: "sub-alcool", label: "Alcool" },
  ],
}

const supplierOptions = [
  { id: "sup-metro", label: "METRO" },
  { id: "sup-transgourmet", label: "Transgourmet" },
  { id: "sup-france-boissons", label: "France Boissons" },
]

const productOptionsBySupplier: Record<
  string,
  { id: string; label: string; unit: string; unitCost: number }[]
> = {
  "sup-metro": [
    { id: "prod-praline", label: "PRALINE CONCASSEE ST 1 KG", unit: "ST", unitCost: 4.03 },
    { id: "prod-egg", label: "OEUF ALV. MOY. 53/63G X180", unit: "PC", unitCost: 0.22 },
    { id: "prod-cream", label: "CREME 30%MG UHT 1L X12", unit: "L", unitCost: 3.89 },
  ],
  "sup-transgourmet": [
    { id: "prod-cream-press", label: "CREME S/PRESS. UHT DEBIC...", unit: "PC", unitCost: 6.73 },
    { id: "prod-flour", label: "Farine", unit: "KG", unitCost: 1.2 },
    { id: "prod-butter", label: "Beurre", unit: "KG", unitCost: 2.0 },
  ],
  "sup-france-boissons": [
    { id: "prod-water", label: "Eau", unit: "L", unitCost: 0.2 },
  ],
}

const formatCurrency = (value: number) =>
  value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  })

const parseNumber = (value: string) => {
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

const sameNumber = (a: number | null | undefined, b: number | null | undefined) => {
  if (a === null || a === undefined) return b === null || b === undefined
  if (b === null || b === undefined) return false
  return Math.abs(a - b) < 1e-9
}

const TECH_IMAGE_BUCKET =
  import.meta.env.VITE_SUPABASE_TECHNICAL_DS_BUCKET || "technical_data_sheet_image"
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ""

const resolveTechnicalImageUrl = (raw?: string | null) => {
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  if (!SUPABASE_URL) return null
  const clean = raw.replace(/^technical_data_sheet_image\//, "")
  return `${SUPABASE_URL}/storage/v1/object/public/${TECH_IMAGE_BUCKET}/${clean}`
}

const toSerializedState = (text: string): SerializedEditorState =>
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

const mockRecipes: Record<string, Recipe> = {
  "r-1": {
    id: "r-1",
    name: "Tarte pralines",
    active: true,
    saleable: true,
    vatId: "vat-10",
    recommendedRetailPrice: 0.7,
    portions: 8,
    portionWeightGrams: 0,
    priceInclTax: 8,
    categoryId: "cat-desserts",
    subcategoryId: "sub-patisseries",
    updatedAt: new Date("2025-11-06T15:12:00"),
    containsSubRecipe: true,
    technicalDataSheetInstructions:
      "Préchauffez le four à 180°C. Préparez la pâte (voir sous-recette), étalez-la et ajoutez la garniture praline. Enfournez 20 minutes puis laissez refroidir avant service.",
    technicalDataSheetImagePath: null,
  },
  "r-2": {
    id: "r-2",
    name: "Salade Lyonnaise XL",
    active: false,
    saleable: true,
    vatId: "vat-10",
    recommendedRetailPrice: 13.9,
    portions: 1,
    portionWeightGrams: null,
    priceInclTax: 13.9,
    categoryId: "cat-plats",
    subcategoryId: "sub-viandes",
    updatedAt: new Date("2025-11-01T09:21:00"),
    containsSubRecipe: false,
    technicalDataSheetInstructions:
      "Préparez la salade, poêlez les lardons, dressez avec l’œuf poché et assaisonnez juste avant le service.",
    technicalDataSheetImagePath: null,
  },
  "r-3": {
    id: "r-3",
    name: "Pâte à tarte",
    active: false,
    saleable: false,
    vatId: "vat-10",
    recommendedRetailPrice: 0,
    portions: 4,
    portionWeightGrams: null,
    priceInclTax: null,
    categoryId: "cat-desserts",
    subcategoryId: "sub-patisseries",
    updatedAt: new Date("2025-10-29T11:02:00"),
    containsSubRecipe: false,
    technicalDataSheetInstructions:
      "Sabler farine et beurre, ajouter l’eau, fraiser rapidement puis laisser reposer 30 min au froid avant utilisation.",
    technicalDataSheetImagePath: null,
  },
}

const mockIngredientsByRecipe: Record<string, Ingredient[]> = {
  "r-1": [
    { id: "ing-1", type: "SUBRECIPE", name: "Pâte à tarte", quantity: 1, unit: "portion", unitCost: 0.2, subRecipeId: "r-3" },
    { id: "ing-2", type: "ARTICLE", name: "PRALINE CONCASSEE ST 1 KG", quantity: 0.1, unit: "ST", unitCost: 4.03, supplierId: "sup-metro", productId: "prod-praline", wastePercent: 0 },
    { id: "ing-3", type: "ARTICLE", name: "OEUF ALV. MOY. 53/63G X180", quantity: 0.45, unit: "PC", unitCost: 0.22, supplierId: "sup-metro", productId: "prod-egg", wastePercent: 0 },
    { id: "ing-4", type: "ARTICLE", name: "CREME 30%MG UHT 1L X12", quantity: 0.028, unit: "L", unitCost: 3.89, supplierId: "sup-metro", productId: "prod-cream", wastePercent: 0 },
    { id: "ing-5", type: "ARTICLE", name: "CREME S/PRESS. UHT DEBIC...", quantity: 0.03, unit: "PC", unitCost: 6.73, supplierId: "sup-transgourmet", productId: "prod-cream-press", wastePercent: 0 },
    { id: "ing-12", type: "FIXED", name: "Charge additionnelle (gaz)", quantity: 1, unit: "forfait", unitCost: 1.2 },
    { id: "ing-13", type: "ARTICLE", name: "Sucre semoule", quantity: 0.12, unit: "KG", unitCost: 1.1, supplierId: "sup-transgourmet", productId: "prod-flour", wastePercent: 0 },
    { id: "ing-14", type: "ARTICLE", name: "Gousse de vanille", quantity: 0.02, unit: "PC", unitCost: 2.4, supplierId: "sup-metro", productId: "prod-egg", wastePercent: 0 },
  ],
  "r-2": [
    { id: "ing-6", type: "ARTICLE", name: "Salade batavia", quantity: 1, unit: "PC", unitCost: 0.55 },
    { id: "ing-7", type: "ARTICLE", name: "Lardons", quantity: 0.15, unit: "KG", unitCost: 7.9 },
  ],
  "r-3": [
    { id: "ing-8", type: "ARTICLE", name: "Farine", quantity: 0.25, unit: "KG", unitCost: 1.2, supplierId: "sup-transgourmet", productId: "prod-flour", wastePercent: 0 },
    { id: "ing-9", type: "ARTICLE", name: "Beurre", quantity: 0.2, unit: "KG", unitCost: 2.0, supplierId: "sup-transgourmet", productId: "prod-butter", wastePercent: 0 },
    { id: "ing-10", type: "ARTICLE", name: "Eau", quantity: 0.05, unit: "L", unitCost: 0.2, supplierId: "sup-france-boissons", productId: "prod-water", wastePercent: 0 },
    { id: "ing-11", type: "ARTICLE", name: "OEUF ALV. MOY. 53/63G X180", quantity: 0.4, unit: "PC", unitCost: 0.22, supplierId: "sup-metro", productId: "prod-egg", wastePercent: 0 },
  ],
}

type LocationState = {
  recipeId?: string
  recipe?: Recipe
  ingredients?: Ingredient[]
}

export default function RecipeDetailPage() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState
  const { estId } = useEstablishment()

  const recipeId = params.id ?? state.recipeId ?? "r-1"
  const initialRecipe = state.recipe ?? mockRecipes[recipeId] ?? mockRecipes["r-1"]
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe)
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    state.ingredients
      ? [...state.ingredients]
      : mockIngredientsByRecipe[recipeId]
        ? [...mockIngredientsByRecipe[recipeId]]
        : []
  )
  const [forceSaveOnEntry, setForceSaveOnEntry] = useState<boolean>(
    Boolean((location.state as any)?.forceSaveOnEntry)
  )

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [duplicateName, setDuplicateName] = useState("")
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(recipe.name)

  const [downloadOpen, setDownloadOpen] = useState(false)
  const [downloadEditorState, setDownloadEditorState] = useState<SerializedEditorState | null>(null)
  const [downloadShowFinancial, setDownloadShowFinancial] = useState(true)
  const [technicalImageFile, setTechnicalImageFile] = useState<File | null>(null)
  const [technicalImagePath, setTechnicalImagePath] = useState<string | null>(
    initialRecipe.technicalDataSheetImagePath ?? null
  )
  const [technicalImagePreview, setTechnicalImagePreview] = useState<string | null>(
    resolveTechnicalImageUrl(initialRecipe.technicalDataSheetImagePath) || null
  )

  const [portionsText, setPortionsText] = useState(() => String(initialRecipe.portions ?? 1))
  const [portionWeightText, setPortionWeightText] = useState(() =>
    initialRecipe.portionWeightGrams === null ? "" : String(initialRecipe.portionWeightGrams)
  )
  const [priceInclTaxText, setPriceInclTaxText] = useState(() =>
    initialRecipe.priceInclTax === null ? "" : String(initialRecipe.priceInclTax)
  )
  const [pricePrefs, setPricePrefs] = useState<{ method: PriceMethod; value: number }>({
    method: "MULTIPLIER",
    value: 3,
  })
  const [baselineParams, setBaselineParams] = useState({
    vatId: initialRecipe.vatId,
    priceInclTax: initialRecipe.priceInclTax,
    portions: initialRecipe.portions,
    portionWeightGrams: initialRecipe.portionWeightGrams,
    categoryId: initialRecipe.categoryId,
    subcategoryId: initialRecipe.subcategoryId,
    active: initialRecipe.active,
    saleable: initialRecipe.saleable,
  })

  const [priceTtcFocused, setPriceTtcFocused] = useState(false)
  const [portionsFocused, setPortionsFocused] = useState(false)
  const [portionWeightFocused, setPortionWeightFocused] = useState(false)

  const [priceTtcTooltipOpen, setPriceTtcTooltipOpen] = useState(false)
  const [priceTtcLabelTooltipOpen, setPriceTtcLabelTooltipOpen] = useState(false)
  const [portionsTooltipOpen, setPortionsTooltipOpen] = useState(false)
  const [portionsLabelTooltipOpen, setPortionsLabelTooltipOpen] = useState(false)
  const [portionWeightTooltipOpen, setPortionWeightTooltipOpen] = useState(false)
  const [portionWeightLabelTooltipOpen, setPortionWeightLabelTooltipOpen] = useState(false)
  const [navConfirmOpen, setNavConfirmOpen] = useState(false)
  const [pendingNav, setPendingNav] = useState<PendingNav | null>(null)
  const bypassHotkeyRef = useRef(false)
  const bypassClickGuardRef = useRef(false)
  const lastSidebarInteractionRef = useRef(0)

  const [ingredientEditorOpen, setIngredientEditorOpen] = useState(false)
  const [ingredientEditorMode, setIngredientEditorMode] = useState<"create" | "edit">("create")
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null)
  const [ingredientDraft, setIngredientDraft] = useState<IngredientEditorDraft>({
    type: "ARTICLE",
    supplierId: "",
    productId: "",
    quantity: "",
    wastePercent: "0",
  })
  const [supplierComboOpen, setSupplierComboOpen] = useState(false)
  const [productComboOpen, setProductComboOpen] = useState(false)
  const [subRecipeComboOpen, setSubRecipeComboOpen] = useState(false)
  const supplierMap = useMemo(
    () =>
      supplierOptions.reduce<Record<string, string>>((acc, opt) => {
        acc[opt.id] = opt.label
    return acc
  }, {}),
  []
)

  const handleTechnicalImageChange = (file: File | null) => {
    if (!file) {
      setTechnicalImageFile(null)
      setTechnicalImagePreview(resolveTechnicalImageUrl(technicalImagePath) || null)
      return
    }
    const allowed = ["image/png", "image/svg+xml", "image/jpeg", "image/jpg"]
    if (!allowed.includes(file.type)) {
      toast.error("Formats acceptés : png, jpg, svg.")
      return
    }
    setTechnicalImageFile(file)
    const objectUrl = URL.createObjectURL(file)
    setTechnicalImagePreview(objectUrl)
  }

  const uploadTechnicalImage = async (): Promise<string | null> => {
    if (!technicalImageFile) return technicalImagePath
    const safeName = technicalImageFile.name.replace(/\s+/g, "-")
    const path = `${recipe.id}/${Date.now()}-${safeName}`
    const { data, error } = await supabase.storage
      .from(TECH_IMAGE_BUCKET)
      .upload(path, technicalImageFile, {
        upsert: true,
        cacheControl: "3600",
        contentType: technicalImageFile.type || "application/octet-stream",
      })

    if (error) {
      toast.error("Impossible de téléverser l'image.")
      return null
    }

    return data?.fullPath ?? data?.path ?? path
  }

  const closeIngredientEditor = () => {
    setIngredientEditorOpen(false)
    setEditingIngredientId(null)
  }

  useEffect(() => {
    setPortionsText(String(recipe.portions ?? 1))
    setPortionWeightText(recipe.portionWeightGrams === null ? "" : String(recipe.portionWeightGrams))
    setPriceInclTaxText(recipe.priceInclTax === null ? "" : String(recipe.priceInclTax))
    setBaselineParams({
      vatId: recipe.vatId,
      priceInclTax: recipe.priceInclTax,
      portions: recipe.portions,
      portionWeightGrams: recipe.portionWeightGrams,
      categoryId: recipe.categoryId,
      subcategoryId: recipe.subcategoryId,
      active: recipe.active,
      saleable: recipe.saleable,
    })
    setNavConfirmOpen(false)
    setPendingNav(null)
  }, [recipe.id])

  useEffect(() => {
    if (recipe.technicalDataSheetInstructions?.trim()) {
      setDownloadEditorState(toSerializedState(recipe.technicalDataSheetInstructions.trim()))
    } else {
      setDownloadEditorState(null)
    }
    setTechnicalImagePath(recipe.technicalDataSheetImagePath ?? null)
    setTechnicalImagePreview(resolveTechnicalImageUrl(recipe.technicalDataSheetImagePath) || null)
    setTechnicalImageFile(null)
  }, [recipe.technicalDataSheetInstructions, recipe.technicalDataSheetImagePath, recipe.id])

  useEffect(() => {
    if (!estId) return
    let active = true
    const loadPrefs = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL
        const res = await fetch(`${API_URL}/establishments/${estId}`)
        if (!active || !res.ok) return
        const data = await res.json()
        const method = (data?.recommended_retail_price_method as PriceMethod) ?? "MULTIPLIER"
        const valueRaw = data?.recommended_retail_price_value
        const value = Number.isFinite(valueRaw) ? Number(valueRaw) : 3
        setPricePrefs({
          method,
          value: Number.isFinite(value) && value > 0 ? value : 3,
        })
      } catch {
        // ignore fetch failure, keep defaults
      }
    }
    loadPrefs()
    return () => {
      active = false
    }
  }, [estId])

  const editingIngredient = useMemo(() => {
    if (!editingIngredientId) return null
    return ingredients.find((item) => item.id === editingIngredientId) ?? null
  }, [editingIngredientId, ingredients])

  const vatRate = useMemo(
    () => vatOptions.find((opt) => opt.id === recipe.vatId)?.rate ?? 0,
    [recipe.vatId]
  )

  const ingredientRows = useMemo(() => {
    return ingredients.map((item) => {
      const wasteMultiplier = 1 + Math.max(0, item.wastePercent ?? 0) / 100
      const cost = Math.max(0, item.quantity) * Math.max(0, item.unitCost) * wasteMultiplier
      const subtitle =
        item.type === "ARTICLE"
          ? supplierMap[item.supplierId ?? ""] ?? "Produit"
          : item.type === "SUBRECIPE"
            ? "Sous-recette"
            : "Fixe"
      return { ...item, cost, subtitle }
    })
  }, [ingredients, supplierMap])

  const purchaseCostTotal = useMemo(
    () => ingredientRows.reduce((sum, row) => sum + row.cost, 0),
    [ingredientRows]
  )

  const portionsValue = useMemo(() => {
    return Math.max(1, parseNumber(portionsText) || 1)
  }, [portionsText])

  const portionWeightValue = useMemo(() => {
    const value = parseNumber(portionWeightText)
    return Number.isFinite(value) && value > 0 ? value : null
  }, [portionWeightText])

  const priceInclTaxValue = useMemo(() => {
    if (!recipe.saleable) return null
    const value = parseNumber(priceInclTaxText)
    return Number.isFinite(value) && value > 0 ? value : null
  }, [priceInclTaxText, recipe.saleable])

  const purchaseCostPerPortion = useMemo(() => {
    const portions = portionsValue
    return purchaseCostTotal / portions
  }, [purchaseCostTotal, portionsValue])

  const priceInclTax = priceInclTaxValue
  const priceExclTax = useMemo(() => {
    if (!priceInclTax || priceInclTax <= 0) return 0
    return priceInclTax / (1 + vatRate)
  }, [priceInclTax, vatRate])

  const recommendedPriceTtc = useMemo(() => {
    const costHt = purchaseCostPerPortion
    if (costHt <= 0) return 0

    const method = pricePrefs.method
    const value = pricePrefs.value ?? 0

    let priceHt = costHt

    if (method === "MULTIPLIER") {
      priceHt = costHt * Math.max(0, value || 1)
    } else if (method === "PERCENTAGE") {
      const ratio = Math.max(0, value) / 100
      priceHt = ratio >= 1 ? costHt : costHt / Math.max(0.01, 1 - ratio)
    } else if (method === "VALUE") {
      priceHt = costHt + Math.max(0, value)
    }

    return priceHt * (1 + vatRate)
  }, [pricePrefs, purchaseCostPerPortion, vatRate])

  const hasChanges = useMemo(() => {
    const currentPrice = recipe.saleable ? priceInclTaxValue ?? null : null
    const baselinePrice = baselineParams.saleable ? baselineParams.priceInclTax ?? null : null

    return (
      baselineParams.vatId !== recipe.vatId ||
      !sameNumber(currentPrice, baselinePrice) ||
      !sameNumber(portionsValue, baselineParams.portions) ||
      !sameNumber(portionWeightValue, baselineParams.portionWeightGrams) ||
      baselineParams.categoryId !== recipe.categoryId ||
      baselineParams.subcategoryId !== recipe.subcategoryId ||
      baselineParams.active !== recipe.active ||
      baselineParams.saleable !== recipe.saleable
    )
  }, [
    baselineParams,
    portionWeightValue,
    portionsValue,
    priceInclTaxValue,
    recipe.active,
    recipe.categoryId,
    recipe.saleable,
    recipe.subcategoryId,
    recipe.vatId,
  ])

  const navigationBlocked = useMemo(
    () => hasChanges || forceSaveOnEntry || ingredients.length === 0,
    [hasChanges, forceSaveOnEntry, ingredients.length]
  )

  const marginHtPerPortion = useMemo(() => {
    if (!recipe.saleable) return null
    return priceExclTax - purchaseCostPerPortion
  }, [priceExclTax, purchaseCostPerPortion, recipe.saleable])

  const marginPercent = useMemo(() => {
    if (!recipe.saleable) return null
    if (priceExclTax <= 0) return null
    const margin = marginHtPerPortion ?? 0
    return (margin / priceExclTax) * 100
  }, [marginHtPerPortion, priceExclTax, recipe.saleable])

  const subcategoryOptions = useMemo(() => {
    return subcategoryOptionsByCategory[recipe.categoryId] ?? []
  }, [recipe.categoryId])

  const formattedUpdatedAt = useMemo(() => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(recipe.updatedAt)
  }, [recipe.updatedAt])

  const availableSubRecipes = useMemo(() => {
    return Object.values(mockRecipes).filter(
      (item) => item.id !== recipe.id && item.containsSubRecipe !== true
    )
  }, [recipe.id])

  const editorSubcategoryOptions = useMemo(() => {
    if (ingredientDraft.type !== "SUBRECIPE") return []
    return subcategoryOptionsByCategory[ingredientDraft.categoryId] ?? []
  }, [ingredientDraft])

  const editorSubRecipeOptions = useMemo(() => {
    if (ingredientDraft.type !== "SUBRECIPE") return []
    return availableSubRecipes
  }, [availableSubRecipes, ingredientDraft])

  const selectedSubRecipe = useMemo(() => {
    if (ingredientDraft.type !== "SUBRECIPE") return null
    return editorSubRecipeOptions.find((opt) => opt.id === ingredientDraft.recipeId) ?? null
  }, [editorSubRecipeOptions, ingredientDraft])

  const editorArticleProducts = useMemo(() => {
    if (ingredientDraft.type !== "ARTICLE") return []
    return productOptionsBySupplier[ingredientDraft.supplierId] ?? []
  }, [ingredientDraft])

  const editorSelectedProduct = useMemo(() => {
    if (ingredientDraft.type !== "ARTICLE") return null
    return editorArticleProducts.find((item) => item.id === ingredientDraft.productId) ?? null
  }, [editorArticleProducts, ingredientDraft])

  const openCreateIngredient = (type: IngredientType) => {
    setIngredientEditorMode("create")
    setEditingIngredientId(null)
    if (type === "ARTICLE") {
      const draft: IngredientEditorDraft = {
        type,
        supplierId: "",
        productId: "",
        quantity: "",
        wastePercent: "0",
      }
      setIngredientDraft(draft)
    } else if (type === "SUBRECIPE") {
      const draft: IngredientEditorDraft = {
        type,
        categoryId: "",
        subcategoryId: "",
        recipeId: "",
        portionsUsed: "1",
      }
      setIngredientDraft(draft)
    } else {
      const draft: IngredientEditorDraft = {
        type,
        name: "",
        fixedCost: "",
      }
      setIngredientDraft(draft)
    }
    setIngredientEditorOpen(true)
  }

  const openEditIngredient = (id: string) => {
    const found = ingredients.find((item) => item.id === id)
    if (!found) return
    setIngredientEditorMode("edit")
    setEditingIngredientId(id)

    if (found.type === "ARTICLE") {
      const draft: IngredientEditorDraft = {
        type: "ARTICLE",
        supplierId: found.supplierId ?? "",
        productId: found.productId ?? "",
        quantity: String(found.quantity).replace(".", ","),
        wastePercent: String(found.wastePercent ?? 0).replace(".", ","),
      }
      setIngredientDraft(draft)
    } else if (found.type === "SUBRECIPE") {
      const subId = found.subRecipeId ?? ""
      const subRecipe = subId ? mockRecipes[subId] : undefined
      const draft: IngredientEditorDraft = {
        type: "SUBRECIPE",
        categoryId: subRecipe?.categoryId ?? recipe.categoryId,
        subcategoryId: subRecipe?.subcategoryId ?? recipe.subcategoryId,
        recipeId: subId,
        portionsUsed: String(found.quantity).replace(".", ","),
      }
      setIngredientDraft(draft)
    } else {
      const draft: IngredientEditorDraft = {
        type: "FIXED",
        name: found.name,
        fixedCost: String(found.unitCost).replace(".", ","),
      }
      setIngredientDraft(draft)
    }

    setIngredientEditorOpen(true)
  }

  const handleDeleteIngredient = () => {
    if (!editingIngredientId) return
    setIngredients((prev) => prev.filter((item) => item.id !== editingIngredientId))
    closeIngredientEditor()
    toast.error("L'ingrédient a bien été supprimé de la recette.", {
      icon: <Trash2 className="h-4 w-4 text-destructive" />,
    })
  }

  const handleSaveIngredient = () => {
    const upsert = (next: Ingredient) => {
      setIngredients((prev) => {
        if (ingredientEditorMode === "edit" && editingIngredientId) {
          return prev.map((item) => (item.id === editingIngredientId ? next : item))
        }
        return [...prev, next]
      })
      closeIngredientEditor()
    }

    if (ingredientDraft.type === "ARTICLE") {
      const supplierId = ingredientDraft.supplierId
      const productId = ingredientDraft.productId
      const quantity = parseNumber(ingredientDraft.quantity)
      const wastePercent = parseNumber(ingredientDraft.wastePercent)
      const product = (productOptionsBySupplier[supplierId] ?? []).find((p) => p.id === productId)

      if (!supplierId || !productId || !product) {
        toast.error("Sélectionnez un fournisseur et un produit.")
        return
      }
      if (quantity <= 0) {
        toast.error("La quantité doit être supérieure à 0.")
        return
      }

      upsert({
        id: editingIngredientId ?? `ing-${Date.now()}`,
        type: "ARTICLE",
        name: product.label,
        quantity,
        unit: product.unit,
        unitCost: product.unitCost,
        supplierId,
        productId,
        wastePercent,
      })
      toast.success(ingredientEditorMode === "edit" ? "Ingrédient mis à jour." : "Ingrédient ajouté.")
      return
    }

    if (ingredientDraft.type === "SUBRECIPE") {
      const recipeId = ingredientDraft.recipeId
      const portionsUsed = parseNumber(ingredientDraft.portionsUsed)
      const selected = recipeId ? mockRecipes[recipeId] : undefined

      if (!selected) {
        toast.error("Sélectionnez une recette.")
        return
      }
      if (portionsUsed <= 0 || !Number.isFinite(portionsUsed)) {
        toast.error("Le nombre de portions doit être supérieur à 0.")
        return
      }

      const subIngredients = mockIngredientsByRecipe[recipeId] ?? []
      const subTotal = subIngredients.reduce((sum, item) => {
        const wasteMultiplier = 1 + Math.max(0, item.wastePercent ?? 0) / 100
        return sum + Math.max(0, item.quantity) * Math.max(0, item.unitCost) * wasteMultiplier
      }, 0)
      const subCostPerPortion = subTotal / Math.max(1, selected.portions || 1)

      upsert({
        id: editingIngredientId ?? `ing-${Date.now()}`,
        type: "SUBRECIPE",
        name: selected.name,
        quantity: portionsUsed,
        unit: "portion",
        unitCost: subCostPerPortion,
        subRecipeId: recipeId,
      })
      toast.success(ingredientEditorMode === "edit" ? "Sous-recette mise à jour." : "Sous-recette ajoutée.")
      return
    }

    const name = ingredientDraft.name.trim()
    const fixedCost = parseNumber(ingredientDraft.fixedCost)
    if (!name) {
      toast.error("Le nom de la charge est requis.")
      return
    }
    if (fixedCost <= 0) {
      toast.error("Le coût fixe doit être supérieur à 0.")
      return
    }
    upsert({
      id: editingIngredientId ?? `ing-${Date.now()}`,
      type: "FIXED",
      name,
      quantity: 1,
      unit: "forfait",
      unitCost: fixedCost,
    })
    toast.success(ingredientEditorMode === "edit" ? "Charge mise à jour." : "Charge ajoutée.")
  }

  const toggleActive = (next: boolean) => {
    const name = recipe.name
    setRecipe((prev) => ({
      ...prev,
      active: next,
      updatedAt: new Date(),
    }))
    toast.message(
      <>
        Recette <span className="font-semibold">{name}</span>{" "}
        {next ? "activée" : "désactivée"}. Enregistrez les paramètres pour confirmer.
      </>,
      { icon: <Info className="h-4 w-4 text-muted-foreground" /> }
    )
  }

  const toggleSaleable = (next: boolean) => {
    const name = recipe.name
    setRecipe((prev) => ({
      ...prev,
      saleable: next,
      updatedAt: new Date(),
    }))
    toast.message(
      <>
        Recette <span className="font-semibold">{name}</span>{" "}
        {next ? "rendue vendable" : "rendue non vendable"}. Enregistrez les paramètres pour confirmer.
      </>,
      { icon: <Info className="h-4 w-4 text-muted-foreground" /> }
    )
  }

  const handleSave = () => {
    setRecipe((prev) => ({
      ...prev,
      portions: portionsValue,
      portionWeightGrams: portionWeightValue,
      priceInclTax: priceInclTaxValue,
      updatedAt: new Date(),
    }))
    setBaselineParams({
      vatId: recipe.vatId,
      priceInclTax: recipe.saleable ? priceInclTaxValue : null,
      portions: portionsValue,
      portionWeightGrams: portionWeightValue,
      categoryId: recipe.categoryId,
      subcategoryId: recipe.subcategoryId,
      active: recipe.active,
      saleable: recipe.saleable,
    })
    setForceSaveOnEntry(false)
    toast.success("Recette enregistrée.")
  }

  const openDuplicate = () => {
    setDuplicateName(`Copie de ${recipe.name}`)
    setDuplicateOpen(true)
  }

  const openDownload = () => {
    setDownloadOpen(true)
    setDownloadShowFinancial(true)
  }

  const requestNavigate = useCallback(
    (path: string) => {
      if (navigationBlocked) {
        setPendingNav({ type: "path", value: path })
        setNavConfirmOpen(true)
        return
      }
      navigate(path)
    },
    [navigationBlocked, navigate]
  )

  const confirmNavigate = () => {
    if (ingredients.length === 0) {
      toast.error("Ajoutez au moins un ingrédient avant de quitter cette recette.")
      return
    }
    if (pendingNav) {
      if (pendingNav.type === "path") {
        navigate(pendingNav.value)
      } else if (pendingNav.type === "hotkey") {
        bypassHotkeyRef.current = true
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: pendingNav.value,
            metaKey: true,
            ctrlKey: true,
          })
        )
      } else if (pendingNav.type === "callback") {
        bypassClickGuardRef.current = true
        pendingNav.action()
        setTimeout(() => {
          bypassClickGuardRef.current = false
        }, 0)
      }
    }
    setNavConfirmOpen(false)
    setPendingNav(null)
  }

  const handleNavClickCapture = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (bypassClickGuardRef.current) return
      if (!navigationBlocked) return
      const target = event.target as HTMLElement | null
      const anchor = target?.closest("a[href]")
      if (!anchor) return

      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return
      if (anchor.getAttribute("target") === "_blank") return

      const url = new URL(href, window.location.href)
      if (url.origin !== window.location.origin) return

      const path = url.pathname + url.search + url.hash
      if (path === window.location.pathname + window.location.search + window.location.hash) return

      event.preventDefault()
      requestNavigate(path)
    },
    [navigationBlocked, requestNavigate]
  )

  useEffect(() => {
    const sidebarSelectors =
      "[data-sidebar='sidebar'], [data-slot='sidebar'], [data-slot='sidebar-inner'], [data-slot='sidebar-content'], [data-slot='sidebar-menu'], [data-slot='sidebar-menu-item'], [data-slot='sidebar-header'], [data-slot='sidebar-footer'], [data-slot='sidebar-rail'], [data-slot='sidebar-trigger'], [data-slot='sidebar-gap'], [data-slot='sidebar-container']"

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      const inSidebar = target?.closest(sidebarSelectors)
      const inSidebarDropdown = target?.closest("[data-radix-dropdown-menu-content]")
      if (inSidebar || inSidebarDropdown) {
        lastSidebarInteractionRef.current = Date.now()
      } else {
        lastSidebarInteractionRef.current = 0
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true)
    return () => document.removeEventListener("pointerdown", handlePointerDown, true)
  }, [])

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (bypassClickGuardRef.current) return
      if (!navigationBlocked || event.defaultPrevented) return
      const target = event.target as HTMLElement | null
      const anchor = target?.closest("a[href]")
      if (anchor) {
        const href = anchor.getAttribute("href")
        if (!href || href.startsWith("#") || href.startsWith("mailto:")) return
        if (anchor.getAttribute("target") === "_blank") return

        const url = new URL(href, window.location.href)
        if (url.origin !== window.location.origin) return

        const path = url.pathname + url.search + url.hash
        if (path === window.location.pathname + window.location.search + window.location.hash) return

        event.preventDefault()
        requestNavigate(path)
        return
      }

      const sidebarSelectors =
        "[data-sidebar='sidebar'], [data-slot='sidebar'], [data-slot='sidebar-inner'], [data-slot='sidebar-content'], [data-slot='sidebar-menu'], [data-slot='sidebar-menu-item'], [data-slot='sidebar-header'], [data-slot='sidebar-footer'], [data-slot='sidebar-rail'], [data-slot='sidebar-trigger'], [data-slot='sidebar-gap'], [data-slot='sidebar-container']"
      const inSidebar = target?.closest(sidebarSelectors)
      const inSidebarDropdown = target?.closest("[data-radix-dropdown-menu-content]")
      const recentSidebar = lastSidebarInteractionRef.current
        ? Date.now() - lastSidebarInteractionRef.current < 4000
        : false

      if (!inSidebar && !(inSidebarDropdown && recentSidebar)) return

      event.preventDefault()
      event.stopPropagation()
      const elementTarget = target as HTMLElement
      setPendingNav({
        type: "callback",
        action: () => {
          if (elementTarget.isConnected) {
            elementTarget.click()
          }
        },
      })
      setNavConfirmOpen(true)
    }

    document.addEventListener("click", handleDocumentClick, true)
    return () => document.removeEventListener("click", handleDocumentClick, true)
  }, [navigationBlocked, requestNavigate])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (bypassHotkeyRef.current) {
        bypassHotkeyRef.current = false
        return
      }
    if (!navigationBlocked) return
    if (!(event.metaKey || event.ctrlKey)) return
    if (!/^[1-9]$/.test(event.key)) return
    event.preventDefault()
    event.stopPropagation()
      setPendingNav({ type: "hotkey", value: event.key })
      setNavConfirmOpen(true)
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [navigationBlocked])

  const confirmDownload = async () => {
    if (technicalImageFile) {
      const uploaded = await uploadTechnicalImage()
      if (!uploaded) return
      setTechnicalImagePath(uploaded)
      setTechnicalImageFile(null)
      setTechnicalImagePreview(resolveTechnicalImageUrl(uploaded))
      setRecipe((prev) => ({
        ...prev,
        technicalDataSheetImagePath: uploaded,
      }))
    }
    setDownloadOpen(false)
    toast.message(
      <>
        Téléchargement de <span className="font-semibold">{recipe.name}</span>…
      </>
    )
  }

  const confirmDuplicate = () => {
    const nextName = duplicateName.trim()
    if (!nextName) return
    const nextId = `${recipe.id}-copy-${Date.now()}`
    toast.success(
      <>
        Recette <span className="font-semibold">{nextName}</span> dupliquée
      </>
    )
    setDuplicateOpen(false)
    navigate(`/dashboard/recipes/${nextId}`, {
      replace: false,
      state: {
        recipe: {
          ...recipe,
          id: nextId,
          name: nextName,
          active: false,
          updatedAt: new Date(),
        } satisfies Recipe,
        ingredients,
      } satisfies LocationState,
    })
  }

  const confirmDeleteRecipe = () => {
    setDeleteOpen(false)
    toast.success(
      <>
        Recette <span className="font-semibold">{recipe.name}</span> supprimée
      </>
    )
    navigate("/dashboard/recipes")
  }

  const openRename = () => {
    setRenameValue(recipe.name)
    setRenameOpen(true)
  }

  const confirmRename = () => {
    const next = renameValue.trim()
    if (!next) return
    setRecipe((prev) => ({ ...prev, name: next, updatedAt: new Date() }))
    setRenameOpen(false)
    toast.success("Nom mis à jour.")
  }

  return (
    <div className="space-y-6" onClickCapture={handleNavClickCapture}>
      <AlertDialog
        open={navConfirmOpen}
        onOpenChange={(open) => {
          setNavConfirmOpen(open)
          if (!open) setPendingNav(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non enregistrées</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des paramètres non enregistrés. Voulez-vous quitter cette page sans enregistrer,
              ou enregistrer vos paramètres avant de partir ?
              {ingredients.length === 0
                ? " Ajoutez au moins un ingrédient pour pouvoir quitter ou enregistrer."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-end">
            <AlertDialogCancel>Rester</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmNavigate}
              className={buttonVariants({ variant: "destructive" })}
              disabled={ingredients.length === 0}
            >
              Quitter sans enregistrer
            </AlertDialogAction>
            <AlertDialogAction
              className={buttonVariants({ variant: "default" })}
              onClick={() => {
                handleSave()
                confirmNavigate()
              }}
            >
              Enregistrer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la recette ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Voulez-vous supprimer{" "}
              <span className="font-semibold">{recipe.name}</span> ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={confirmDeleteRecipe}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dupliquer la recette</DialogTitle>
            <DialogDescription>
              Donnez un nom à la copie de{" "}
              <span className="font-semibold">{recipe.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="duplicate-name">Nom</Label>
            <Input
              id="duplicate-name"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              placeholder={`Copie de ${recipe.name}`}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDuplicateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmDuplicate} disabled={!duplicateName.trim()}>
              Dupliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer la recette</DialogTitle>
            <DialogDescription>Modifiez le nom affiché dans votre carte.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-name">Nom</Label>
            <Input
              id="rename-name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmRename} disabled={!renameValue.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-primary">Téléchargez votre recette</DialogTitle>
            <DialogDescription>
              La recette <span className="font-semibold text-primary">{recipe.name}</span> est prête à être
              téléchargée. Vous pouvez ajouter ou modifier les instructions qui apparaîtront sous la liste
              des ingrédients.
          </DialogDescription>
        </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="technical-image" className="text-base">
              Image de fiche technique
            </Label>
            <div className="grid grid-cols-4 items-stretch gap-4">
              <div className="relative col-span-3 flex h-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/40 p-2 text-center">
                <p className="text-xs text-muted-foreground">
                  {technicalImageFile?.name
                    ? `Fichier sélectionné : ${technicalImageFile.name}`
                    : "Glissez-déposez ou cliquez pour ajouter une image."}
                </p>
                <Input
                  id="technical-image"
                  name="technical-image"
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={(e) => handleTechnicalImageChange(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                {technicalImageFile && (
                  <button
                    type="button"
                    aria-label="Supprimer le fichier sélectionné"
                    className="absolute right-2 top-2 rounded-md bg-background/80 p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleTechnicalImageChange(null)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-sidebar-border/60 bg-sidebar p-0.5">
                {technicalImagePreview ? (
                  <img
                    src={technicalImagePreview}
                    alt="Aperçu fiche technique"
                    className="h-full w-full rounded-md object-contain"
                  />
                ) : (
                  <div className="text-center text-xs text-muted-foreground">Aucun visuel</div>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Optionnel – Formats png, jpg ou svg. L’image sera stockée dans la fiche technique.
            </p>
          </div>
          <div className="space-y-3">
            <Label className="text-base">Instructions de la recette</Label>
            <Editor
              placeholder="Exemple (formatable) : 1) Préparez tous les ingrédients. 2) Mélangez jusqu’à obtenir une pâte lisse. 3) Enfournez à 180°C pendant 20 min. Ajoutez vos étapes détaillées ici."
              editorSerializedState={downloadEditorState ?? undefined}
              onSerializedChange={(state) => setDownloadEditorState(state)}
            />
          </div>
          <DialogFooter className="flex flex-col gap-4">
            <div className="flex w-full flex-wrap items-center gap-2 justify-start">
              <button
                type="button"
                onClick={() => setDownloadShowFinancial((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm transition hover:bg-muted"
                aria-pressed={downloadShowFinancial}
              >
                <CheckboxIcon
                  checked={downloadShowFinancial}
                  onCheckedChange={(state) => setDownloadShowFinancial(state === true)}
                  className="h-4 w-4 text-[#108FFF] data-[state=checked]:border-[#108FFF] data-[state=checked]:bg-[#108FFF]"
                />
                <span>Afficher les données financières</span>
              </button>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setDownloadOpen(false)}>
                Annuler
              </Button>
              <Button onClick={confirmDownload} className="gap-2">
                <FileDown className="h-4 w-4" />
                Télécharger
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={ingredientEditorOpen}
        onOpenChange={(open) => {
          setIngredientEditorOpen(open)
          if (!open) {
            setEditingIngredientId(null)
          }
        }}
      >
        <SheetContent
          side="right"
          className="sm:max-w-xl"
          onInteractOutside={(event) => {
            event.preventDefault()
            closeIngredientEditor()
          }}
          onEscapeKeyDown={(event) => {
            event.preventDefault()
            closeIngredientEditor()
          }}
        >
          <SheetHeader>
            <SheetTitle>
              {ingredientEditorMode === "create"
                ? ingredientDraft.type === "ARTICLE"
                  ? "Ajouter un produit"
                  : ingredientDraft.type === "SUBRECIPE"
                    ? "Ajouter une recette"
                    : "Ajouter une charge"
                : `Modifier ${editingIngredient?.name ?? "l’ingrédient"}`}
            </SheetTitle>
            <SheetDescription>
              {ingredientDraft.type === "ARTICLE"
                ? "Sélectionnez un produit issu de vos factures."
                : ingredientDraft.type === "SUBRECIPE"
                  ? "Ajoutez une recette existante à cette recette."
                  : "Ajoutez un coût fixe (ex: main d’œuvre, gaz…)."}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {ingredientDraft.type === "ARTICLE" ? (
              <>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Fournisseur</Label>
                    <Popover open={supplierComboOpen} onOpenChange={setSupplierComboOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={supplierComboOpen}
                          className="w-full justify-between"
                        >
                          {ingredientDraft.supplierId
                            ? supplierOptions.find((opt) => opt.id === ingredientDraft.supplierId)?.label
                            : "Sélectionnez un fournisseur"}
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Rechercher un fournisseur..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>Aucun fournisseur.</CommandEmpty>
                            <CommandGroup>
                              {supplierOptions.map((opt) => (
                                <CommandItem
                                  key={opt.id}
                                  value={opt.id}
                                  onSelect={(value) => {
                                    const next = value === ingredientDraft.supplierId ? "" : value
                                    setIngredientDraft((prev) =>
                                      prev.type === "ARTICLE" ? { ...prev, supplierId: next, productId: "" } : prev
                                    )
                                    setSupplierComboOpen(false)
                                    setProductComboOpen(false)
                                  }}
                                >
                                  {opt.label}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      ingredientDraft.supplierId === opt.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Produit</Label>
                    <Popover
                      open={productComboOpen}
                      onOpenChange={setProductComboOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={productComboOpen}
                          className="w-full justify-between"
                          disabled={!ingredientDraft.supplierId}
                        >
                          {ingredientDraft.productId
                            ? editorArticleProducts.find((opt) => opt.id === ingredientDraft.productId)?.label
                            : ingredientDraft.supplierId
                              ? "Sélectionnez un produit"
                              : "Choisissez un fournisseur"}
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Rechercher un produit..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>Aucun produit disponible.</CommandEmpty>
                            <CommandGroup>
                              {editorArticleProducts.map((opt) => (
                                <CommandItem
                                  key={opt.id}
                                  value={opt.id}
                                  onSelect={(value) => {
                                    const next = value === ingredientDraft.productId ? "" : value
                                    setIngredientDraft((prev) =>
                                      prev.type === "ARTICLE" ? { ...prev, productId: next } : prev
                                    )
                                    setProductComboOpen(false)
                                  }}
                                >
                                  {opt.label}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      ingredientDraft.productId === opt.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Quantité</Label>
                    <InputGroup>
                      <InputGroupInput
                        value={ingredientDraft.quantity}
                        inputMode="decimal"
                        onChange={(e) =>
                          setIngredientDraft((prev) =>
                            prev.type === "ARTICLE" ? { ...prev, quantity: e.target.value } : prev
                          )
                        }
                        placeholder="—"
                      />
                      <InputGroupAddon align="inline-end">
                        {editorSelectedProduct?.unit ?? "—"}
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Perte (%)</Label>
                    <InputGroup>
                      <InputGroupInput
                        value={ingredientDraft.wastePercent}
                        inputMode="decimal"
                        onChange={(e) =>
                          setIngredientDraft((prev) =>
                            prev.type === "ARTICLE" ? { ...prev, wastePercent: e.target.value } : prev
                          )
                        }
                        placeholder="0"
                      />
                      <InputGroupAddon align="inline-end">%</InputGroupAddon>
                    </InputGroup>
                  </div>
                </div>

                <Card className="border bg-background shadow-none">
                  <CardContent className="p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Prix unitaire actuel :</span>
                        <span className="text-sm font-medium text-red-600">
                          {editorSelectedProduct ? formatCurrency(editorSelectedProduct.unitCost) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Coût net de l'ingredient :</span>
                        <Badge
                          variant="secondary"
                          className="bg-red-500/10 text-red-600 text-sm font-medium"
                        >
                          {formatCurrency(
                            parseNumber(ingredientDraft.quantity) *
                              (editorSelectedProduct?.unitCost ?? 0) *
                              (1 + parseNumber(ingredientDraft.wastePercent) / 100)
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}

            {ingredientDraft.type === "SUBRECIPE" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select
                      value={ingredientDraft.categoryId}
                      onValueChange={(value) => {
                        const normalized = value === "__all__" ? "" : value
                        const nextSub =
                          normalized ? subcategoryOptionsByCategory[normalized]?.[0]?.id ?? "" : ""
                        setIngredientDraft((prev) =>
                          prev.type === "SUBRECIPE"
                            ? {
                                ...prev,
                                categoryId: normalized,
                                subcategoryId: nextSub,
                                recipeId: "",
                              }
                            : prev
                        )
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">
                          <span className="text-muted-foreground">Toutes les catégories</span>
                        </SelectItem>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sous-catégorie</Label>
                    <Select
                      value={ingredientDraft.subcategoryId}
                      onValueChange={(value) =>
                        setIngredientDraft((prev) => {
                          const normalized = value === "__all__" ? "" : value
                          return prev.type === "SUBRECIPE"
                            ? { ...prev, subcategoryId: normalized, recipeId: "" }
                            : prev
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une sous-catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">
                          <span className="text-muted-foreground">Toutes les sous-catégories</span>
                        </SelectItem>
                        {editorSubcategoryOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-10">
                  <div className="space-y-2 sm:col-span-6">
                    <Label>Nom de la recette</Label>
                    <Popover open={subRecipeComboOpen} onOpenChange={setSubRecipeComboOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={subRecipeComboOpen}
                          className="w-full justify-between"
                        >
                          {ingredientDraft.recipeId
                            ? editorSubRecipeOptions.find((opt) => opt.id === ingredientDraft.recipeId)?.name
                            : "Sélectionnez une recette"}
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Rechercher une recette..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>Aucune recette trouvée.</CommandEmpty>
                              <CommandGroup>
                                {editorSubRecipeOptions
                                  .filter((opt) => {
                                    if (opt.containsSubRecipe) return false
                                    if (opt.id === recipe.id) return false
                                    const catOk =
                                      !ingredientDraft.categoryId || opt.categoryId === ingredientDraft.categoryId
                                    const subOk =
                                      !ingredientDraft.subcategoryId ||
                                      opt.subcategoryId === ingredientDraft.subcategoryId
                                    return catOk && subOk
                                  })
                                  .map((opt) => (
                                    <CommandItem
                                      key={opt.id}
                                      value={opt.id}
                                      onSelect={(value) => {
                                        const next = value === ingredientDraft.recipeId ? "" : value
                                        setIngredientDraft((prev) =>
                                          prev.type === "SUBRECIPE" ? { ...prev, recipeId: next } : prev
                                        )
                                        setSubRecipeComboOpen(false)
                                      }}
                                    >
                                      {opt.name}
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          ingredientDraft.recipeId === opt.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2 sm:col-span-4">
                    <Label>Portions utilisées</Label>
                    <InputGroup>
                      <InputGroupInput
                        value={ingredientDraft.portionsUsed}
                        inputMode="decimal"
                        onChange={(e) =>
                          setIngredientDraft((prev) =>
                            prev.type === "SUBRECIPE" ? { ...prev, portionsUsed: e.target.value } : prev
                          )
                        }
                        placeholder="1"
                      />
                      <InputGroupAddon align="inline-end">
                        {selectedSubRecipe?.portionWeightGrams && selectedSubRecipe.portionWeightGrams > 0
                          ? `portion(s) de ${selectedSubRecipe.portionWeightGrams}g`
                          : "portion(s)"}
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                </div>

                <Card className="border bg-background shadow-none">
                  <CardContent className="p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Coût par portion :</span>
                        <Badge
                          variant="secondary"
                          className="bg-muted text-foreground text-sm font-medium"
                        >
                          {ingredientDraft.recipeId
                            ? formatCurrency(
                                (() => {
                                  const selected = mockRecipes[ingredientDraft.recipeId]
                                  const list = mockIngredientsByRecipe[ingredientDraft.recipeId] ?? []
                                  const total = list.reduce((sum, item) => {
                                    const wasteMultiplier = 1 + Math.max(0, item.wastePercent ?? 0) / 100
                                    return (
                                      sum +
                                      Math.max(0, item.quantity) * Math.max(0, item.unitCost) * wasteMultiplier
                                    )
                                  }, 0)
                                  return total / Math.max(1, selected.portions || 1)
                                })()
                              )
                            : "—"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Coût net de la sous-recette :</span>
                        <Badge
                          variant="secondary"
                          className="bg-red-500/10 text-red-600 text-sm font-medium"
                        >
                          {ingredientDraft.recipeId
                            ? formatCurrency(
                                (() => {
                                  const selected = mockRecipes[ingredientDraft.recipeId]
                                  const list = mockIngredientsByRecipe[ingredientDraft.recipeId] ?? []
                                  const total = list.reduce((sum, item) => {
                                    const wasteMultiplier = 1 + Math.max(0, item.wastePercent ?? 0) / 100
                                    return (
                                      sum +
                                      Math.max(0, item.quantity) * Math.max(0, item.unitCost) * wasteMultiplier
                                    )
                                  }, 0)
                                  const perPortion = total / Math.max(1, selected.portions || 1)
                                  return perPortion * parseNumber(ingredientDraft.portionsUsed)
                                })()
                              )
                            : formatCurrency(0)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </>
            ) : null}

            {ingredientDraft.type === "FIXED" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-10">
                  <div className="space-y-2 sm:col-span-6">
                    <Label>Nom de votre charge additionnelle</Label>
                    <Input
                      value={ingredientDraft.name}
                      onChange={(e) =>
                        setIngredientDraft((prev) =>
                          prev.type === "FIXED" ? { ...prev, name: e.target.value } : prev
                        )
                      }
                      placeholder="Gaz, Main-d’œuvre, Serviettes, Autres…"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-4">
                    <Label>Coût fixe</Label>
                    <InputGroup>
                      <InputGroupInput
                        value={ingredientDraft.fixedCost}
                        inputMode="decimal"
                        onChange={(e) =>
                          setIngredientDraft((prev) =>
                            prev.type === "FIXED" ? { ...prev, fixedCost: e.target.value } : prev
                          )
                        }
                        placeholder="—"
                      />
                      <InputGroupAddon align="inline-end">€</InputGroupAddon>
                    </InputGroup>
                  </div>
                </div>

                <Card className="mt-3 min-h-0 border bg-background shadow-none">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-muted-foreground text-right">Prix net :</span>
                      <Badge
                        variant="secondary"
                        className="bg-red-500/10 text-red-600 border-red-500/20 text-sm font-medium"
                      >
                        {formatCurrency(parseNumber(ingredientDraft.fixedCost))}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}


            <div className="flex items-center justify-between gap-3">
              {ingredientEditorMode === "edit" ? (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDeleteIngredient}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={closeIngredientEditor}>
                  Annuler
                </Button>
                <Button onClick={handleSaveIngredient}>Enregistrer</Button>
              </div>
            </div>
            {ingredientDraft.type === "ARTICLE" ? (
              <Card className="mt-15 min-h-0 border bg-background shadow-none">
                <CardContent className="p-3">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="losses" className="border-0">
                      <AccordionTrigger className="px-0 py-2">
                        <span className="text-sm font-medium">Explications</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pt-1 text-sm text-muted-foreground space-y-2">
                        <p>
                          La perte est optionnelle. Indiquez la quantité réellement servie (après cuisson/paration)
                          et ajoutez un pourcentage pour couvrir parures/cuisson (ex: gras, peau, réduction).
                        </p>
                        <p>
                          Exemple : pour servir <span className="font-medium">300 g</span> de viande, mettez
                          <span className="font-medium"> 300 g</span> en quantité et
                          <span className="font-medium"> 25 %</span> de perte si 400 g achetés donnent 300 g servis.
                        </p>
                        <p>
                          Le coût est majoré automatiquement : 500 g à 20 €/kg = 10 €, avec 20 % de perte ⇒
                          12 € (coût × (1 + perte)).
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ) : null}

            {ingredientDraft.type === "SUBRECIPE" ? (
              <Card className="mt-15 min-h-0 border bg-background shadow-none">
                <CardContent className="p-3">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="subrecipe-info" className="border-0">
                      <AccordionTrigger className="px-0 py-2">
                        <span className="text-sm font-medium">Explications</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pt-1 text-sm text-muted-foreground space-y-2">
                        <p>
                          Les filtres catégorie/sous-catégorie sont optionnels : ils aident juste à préfiltrer si vous
                          avez beaucoup de recettes. Vous pouvez choisir directement la sous-recette.
                        </p>
                        <p>
                          “Portions utilisées” correspond au nombre de portions de la sous-recette intégrées ici. Le
                          coût net = coût/portion de la sous-recette × portions utilisées.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ) : null}

            {ingredientDraft.type === "FIXED" ? (
              <Card className="mt-15 min-h-0 border bg-background shadow-none">
                <CardContent className="p-3">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="fixed-info" className="border-0">
                      <AccordionTrigger className="px-0 py-2">
                        <span className="text-sm font-medium">Explications</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pt-1 text-sm text-muted-foreground space-y-2">
                        <p>
                          Utilisez ce type pour les charges additionnelles fixes (main-d’œuvre, énergie, emballages,
                          autres coûts qui ne dépendent pas directement des quantités).
                        </p>
                        <p>
                          Saisissez le nom de la charge et son coût TTC ou HT selon votre logique de saisie. Le prix net
                          sera directement appliqué au calcul du coût total de la recette.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => requestNavigate("/dashboard/recipes")}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Retour</span>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{recipe.name}</h1>
            <Button variant="ghost" size="icon" onClick={openRename} aria-label="Renommer">
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Dernière modification : {formattedUpdatedAt}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => {
              if (navigationBlocked) {
                setPendingNav({ type: "callback", action: openDuplicate })
                setNavConfirmOpen(true)
                return
              }
              openDuplicate()
            }}
          >
            <Copy className="h-4 w-4" />
            Dupliquer
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (navigationBlocked) {
                setPendingNav({ type: "callback", action: openDownload })
                setNavConfirmOpen(true)
                return
              }
              openDownload()
            }}
          >
            <Download className="h-4 w-4" />
            Télécharger
          </Button>
          <Button variant="destructive" className="gap-2" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12 items-start">
        <div className="space-y-4 lg:col-span-8">
          <Card className="shadow-sm h-[595px] flex flex-col overflow-hidden">
            <CardHeader className="p-6 pb-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CardTitle>Ingrédients</CardTitle>
                    <Badge variant="secondary">{ingredients.length}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          className="gap-2"
                          onClick={() => openCreateIngredient("ARTICLE")}
                        >
                          <ShoppingBasket className="h-4 w-4" />
                          Ajouter un produit
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        Produits issus de vos factures (quantité, pertes, coût).
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          className="gap-2"
                          onClick={() => openCreateIngredient("SUBRECIPE")}
                        >
                          <FileText className="h-4 w-4" />
                          Ajouter une recette
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        Intégrez une sous-recette existante dans celle-ci.
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          className="gap-2"
                          onClick={() => openCreateIngredient("FIXED")}
                        >
                          <Plus className="h-4 w-4" />
                          Autre
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        Ajoutez un coût fixe (main-d’œuvre, énergie…).
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <CardDescription>Ajoutez des produits, des sous-recettes ou des charges fixes.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-hidden rounded-md border min-h-0">
                <div className="flex flex-col h-full min-h-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-3 text-left">Ingrédient</TableHead>
                        <TableHead className="w-40 text-left">Quantité</TableHead>
                        <TableHead className="w-32 text-left">Coût</TableHead>
                        <TableHead className="w-12 pr-3 text-right" />
                      </TableRow>
                    </TableHeader>
                  </Table>
                  <ScrollArea className="flex-1 h-full border-t min-h-0">
                    <Table>
                      <TableBody>
                        {ingredientRows.map((row) => (
                          <TableRow
                            key={row.id}
                            className="cursor-pointer h-14"
                            onClick={() => openEditIngredient(row.id)}
                          >
                            <TableCell className="pl-3 pr-3">
                              <div className="space-y-1">
                                <p className="font-medium leading-tight">{row.name}</p>
                                <p className="text-xs text-muted-foreground">{row.subtitle}</p>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {row.type === "FIXED" ? (
                                <span className="text-sm text-muted-foreground">-</span>
                              ) : (
                                <>
                                  <span className="text-sm font-medium text-foreground">
                                    {row.quantity.toLocaleString("fr-FR", { maximumFractionDigits: 3 })}
                                  </span>{" "}
                                  <span className="text-muted-foreground">{row.unit}</span>
                                </>
                              )}
                            </TableCell>
                            <TableCell className="text-left whitespace-nowrap">
                              <Badge
                                variant="secondary"
                                className="bg-muted text-foreground text-sm font-medium"
                              >
                                {formatCurrency(row.cost)}
                              </Badge>
                            </TableCell>
                            <TableCell className="pr-3 text-right">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Modifier ${row.name}`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openEditIngredient(row.id)
                                    }}
                                  >
                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={6}>
                                  Modifier l’ingrédient
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!ingredientRows.length && (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                              Ajoutez vos premiers ingrédients.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border bg-sidebar dark:bg-background px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Coût total :</span>
                  <Badge
                    variant="secondary"
                    className="bg-red-500/10 text-red-600 border-red-500/20 text-sm font-medium"
                  >
                    {formatCurrency(purchaseCostTotal)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Coût par portion :</span>
                  <Badge
                    variant="secondary"
                    className="bg-red-500/10 text-red-600 border-red-500/20 text-sm font-medium"
                  >
                    {formatCurrency(purchaseCostPerPortion)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Card className="shadow-sm">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Paramètres de la recette</CardTitle>
              <CardDescription>Modifiez l'aspect générale de votre recette</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Tabs defaultValue="finance">
                <TabsList className="w-full">
                  <TabsTrigger value="finance" className="flex-1">
                    Finances
                  </TabsTrigger>
                  <TabsTrigger value="general" className="flex-1">
                    Informations
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="finance" className="mt-4 space-y-4">
                  <Card className="rounded-md shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <Label>{recipe.saleable ? "Vendable" : "Non vendable"}</Label>
                          <p className="text-xs text-muted-foreground">
                            {recipe.saleable
                              ? "Cette recette est directement vendue a vos client (présent sur votre carte)."
                              : "Cette recette est une préparation interne et n’est pas vendue directement à vos clients."}
                          </p>
                        </div>
                        <Switch
                          checked={recipe.saleable}
                          style={recipe.saleable ? { backgroundColor: "#108FFF" } : undefined}
                          onCheckedChange={toggleSaleable}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {recipe.saleable ? (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-muted-foreground">
                              Prix de vente TTC conseillé :
                            </span>
                            <Badge
                              variant="secondary"
                              className="inline-flex min-w-[88px] justify-center text-sm hover:bg-secondary transition-none"
                            >
                              {formatCurrency(recommendedPriceTtc)}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                          Prix de vente "conseillé" basé sur vos préférences et votre marge cible (Paramètres).
                        </TooltipContent>
                      </Tooltip>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">TVA</Label>
                          <Select
                            value={recipe.vatId}
                            onValueChange={(value) =>
                              setRecipe((prev) => ({ ...prev, vatId: value, updatedAt: new Date() }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {vatOptions.map((opt) => (
                                <SelectItem key={opt.id} value={opt.id}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Tooltip
                          open={priceTtcFocused ? false : priceTtcTooltipOpen}
                          onOpenChange={(open) => {
                            if (!priceTtcFocused) setPriceTtcTooltipOpen(open)
                          }}
                        >
                          <TooltipTrigger asChild>
                            <div className="space-y-2">
                              <Tooltip
                                open={priceTtcFocused ? priceTtcLabelTooltipOpen : false}
                                onOpenChange={(open) => {
                                  if (priceTtcFocused) setPriceTtcLabelTooltipOpen(open)
                                }}
                              >
                                <TooltipTrigger asChild>
                                  <Label className="text-xs text-muted-foreground">
                                    Prix de vente TTC
                                  </Label>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                                  Prix TTC par portion vendue. Utilisé pour le calcul des marges.
                                </TooltipContent>
                              </Tooltip>
                              <InputGroup>
                                <InputGroupInput
                                  inputMode="decimal"
                                  value={priceInclTaxText}
                                  onChange={(e) => setPriceInclTaxText(e.target.value)}
                                  onFocus={() => {
                                    setPriceTtcFocused(true)
                                    setPriceTtcTooltipOpen(false)
                                  }}
                                  onBlur={() => {
                                    setPriceTtcFocused(false)
                                    setPriceTtcLabelTooltipOpen(false)
                                    setRecipe((prev) => ({
                                      ...prev,
                                      priceInclTax: priceInclTaxValue,
                                      updatedAt: new Date(),
                                    }))
                                  }}
                                  placeholder="0"
                                />
                                <InputGroupAddon align="inline-end">€</InputGroupAddon>
                              </InputGroup>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                            Prix TTC par portion vendue. Utilisé pour le calcul des marges.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Tooltip
                      open={portionsFocused ? false : portionsTooltipOpen}
                      onOpenChange={(open) => {
                        if (!portionsFocused) setPortionsTooltipOpen(open)
                      }}
                    >
                      <TooltipTrigger asChild>
                        <div className="space-y-2">
                          <Tooltip
                            open={portionsFocused ? portionsLabelTooltipOpen : false}
                            onOpenChange={(open) => {
                              if (portionsFocused) setPortionsLabelTooltipOpen(open)
                            }}
                          >
                            <TooltipTrigger asChild>
                              <Label className="text-xs text-muted-foreground">Portions</Label>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                              Nombre de portions produites par cette recette. Sert au calcul du coût par portion.
                            </TooltipContent>
                          </Tooltip>
                          <Input
                            value={portionsText}
                            inputMode="decimal"
                            onChange={(e) => setPortionsText(e.target.value)}
                            onFocus={() => {
                              setPortionsFocused(true)
                              setPortionsTooltipOpen(false)
                            }}
                          onBlur={() => {
                            setPortionsFocused(false)
                            setPortionsLabelTooltipOpen(false)
                            setRecipe((prev) => ({
                              ...prev,
                              portions: portionsValue,
                              updatedAt: new Date(),
                            }))
                          }}
                          placeholder="1"
                        />
                      </div>
                    </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                        Nombre de portions produites par cette recette. Sert au calcul du coût par portion.
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip
                      open={portionWeightFocused ? false : portionWeightTooltipOpen}
                      onOpenChange={(open) => {
                        if (!portionWeightFocused) setPortionWeightTooltipOpen(open)
                      }}
                    >
                      <TooltipTrigger asChild>
                        <div className="space-y-2">
                          <Tooltip
                            open={portionWeightFocused ? portionWeightLabelTooltipOpen : false}
                            onOpenChange={(open) => {
                              if (portionWeightFocused) setPortionWeightLabelTooltipOpen(open)
                            }}
                          >
                            <TooltipTrigger asChild>
                              <Label className="text-xs text-muted-foreground">Poids portion (gr)</Label>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                              Poids d’une portion (en grammes). Optionnel, utile pour vos fiches techniques.
                            </TooltipContent>
                          </Tooltip>
                          <InputGroup>
                            <InputGroupInput
                              inputMode="decimal"
                              value={portionWeightText}
                              onChange={(e) => setPortionWeightText(e.target.value)}
                              onFocus={() => {
                                setPortionWeightFocused(true)
                                setPortionWeightTooltipOpen(false)
                              }}
                              onBlur={() => {
                                setPortionWeightFocused(false)
                                setPortionWeightLabelTooltipOpen(false)
                                setRecipe((prev) => ({
                                  ...prev,
                                  portionWeightGrams: portionWeightValue,
                                  updatedAt: new Date(),
                                }))
                              }}
                              placeholder="0"
                            />
                            <InputGroupAddon align="inline-end">g</InputGroupAddon>
                          </InputGroup>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                        Poids d’une portion (en grammes). Optionnel, utile pour vos fiches techniques.
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {recipe.saleable ? (
                    <div className="rounded-md border bg-sidebar dark:bg-background px-4 py-3">
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground leading-tight">
                          Marge hors taxes par portion vendue :
                        </p>
                        {marginHtPerPortion !== null && marginPercent !== null ? (
                          <div className="flex w-full items-center justify-end gap-2">
                            <Badge
                              className="inline-flex min-w-[88px] justify-center text-sm bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              variant="outline"
                            >
                              {formatCurrency(marginHtPerPortion)}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="inline-flex min-w-[88px] justify-center text-sm"
                            >
                              {marginPercent.toLocaleString("fr-FR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              %
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-right leading-tight">—</p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="general" className="mt-4 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="recipe-category" className="text-xs text-muted-foreground">Catégorie</Label>
                      <Select
                        value={recipe.categoryId}
                        onValueChange={(value) => {
                          const nextSub =
                            subcategoryOptionsByCategory[value]?.[0]?.id ?? recipe.subcategoryId
                          setRecipe((prev) => ({
                            ...prev,
                            categoryId: value,
                            subcategoryId: nextSub,
                            updatedAt: new Date(),
                          }))
                        }}
                      >
                        <SelectTrigger id="recipe-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="recipe-subcategory" className="text-xs text-muted-foreground">Sous-catégorie</Label>
                      <Select
                        value={recipe.subcategoryId}
                        onValueChange={(value) =>
                          setRecipe((prev) => ({ ...prev, subcategoryId: value, updatedAt: new Date() }))
                        }
                      >
                        <SelectTrigger id="recipe-subcategory">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategoryOptions.length ? (
                            subcategoryOptions.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id}>
                                {opt.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value={recipe.subcategoryId} disabled>
                              Sélectionnez d&apos;abord une catégorie
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Card className="rounded-md shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <Label>{recipe.active ? "Active" : "Inactive"}</Label>
                          <p className="text-xs text-muted-foreground">
                            {recipe.active
                              ? "Disponible actuellement à la vente et pris en compte dans les analyses."
                              : "Indisponible actuellement à la vente et non prise en compte dans les analyses."}
                          </p>
                        </div>
                        <Switch
                          checked={recipe.active}
                          style={recipe.active ? { backgroundColor: "#108FFF" } : undefined}
                          onCheckedChange={toggleActive}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button
                className="w-full"
                size="lg"
                onClick={handleSave}
                disabled={!hasChanges && !forceSaveOnEntry}
              >
                Enregistrer les paramètres
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
