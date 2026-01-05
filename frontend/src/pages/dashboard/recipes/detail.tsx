import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import type { SerializedEditorState } from "lexical"
import axios from "axios"
import { toast } from "sonner"
import { Info, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useEstablishment } from "@/context/EstablishmentContext"
import { RecipeDetailHeader } from "./components/RecipeDetailHeader"
import { RecipeIngredientsCard } from "./components/RecipeIngredientsCard"
import { RecipeSettingsCard } from "./components/RecipeSettingsCard"
import { IngredientEditorSheet } from "./components/IngredientEditorSheet"
import { RecipeNavGuardDialog } from "./components/RecipeNavGuardDialog"
import { RecipeDeleteDialog } from "./components/RecipeDeleteDialog"
import { RecipeDuplicateDialog } from "./components/RecipeDuplicateDialog"
import { RecipeRenameDialog } from "./components/RecipeRenameDialog"
import { RecipeDownloadDialog } from "./components/RecipeDownloadDialog"
import {
  createIngredient,
  deleteRecipe,
  deleteIngredient,
  duplicateRecipe,
  clearIngredientsCache,
  fetchIngredients,
  fetchMasterArticles,
  fetchRecipeById,
  fetchRecipeCategories,
  fetchRecipePricePrefs,
  fetchRecipeSubcategories,
  fetchRecipes,
  fetchSuppliers,
  fetchVatRates,
  getCachedRecipes,
  upsertCachedRecipe,
  removeCachedRecipe,
  recomputeIngredient,
  recomputeRecipe,
  generateRecipePdf,
  updateIngredient,
  updateRecipe,
  type ApiIngredient,
  type ApiMasterArticle,
  type ApiRecipe,
  type ApiRecipeCategory,
  type ApiRecipeSubcategory,
  type ApiSupplier,
  type ApiVatRate,
} from "./api"
import type {
  Ingredient,
  IngredientEditorDraft,
  IngredientRow,
  IngredientType,
  PriceMethod,
  RecipeDetail,
  RecipeDetailLocationState,
  RecipeCategoryOption,
  RecipeSubcategoryOption,
  SupplierOption,
  SupplierProductOption,
  VatRateOption,
} from "./types"
import {
  parseNumber,
  parseInstructionsState,
  sameNumber,
  getUniqueRecipeName,
  toInstructionsHtml,
  toPlainText,
  toRecipeDetail,
} from "./utils"

const TECH_IMAGE_BUCKET =
  import.meta.env.VITE_SUPABASE_TECHNICAL_DS_BUCKET || "technical_data_sheet_image"

const normalizeTechnicalImagePath = (raw?: string | null) => {
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  return raw.replace(/^technical_data_sheet_image\//, "")
}

const toStoragePath = (raw?: string | null) => {
  const normalized = normalizeTechnicalImagePath(raw)
  if (!normalized) return null
  return normalized.replace(/^\/+/, "")
}

const buildRecipePdfFilename = (name: string | null | undefined) => {
  const safeName = (name ?? "recette")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim() || "recette"
  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(new Date())
    .replace(/\//g, "-")
  return `Ravy - ${safeName} - ${dateLabel}.pdf`
}

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeVatRate = (raw: number | null | undefined) => {
  const value = toNumber(raw) ?? 0
  if (value <= 0) return 0
  return value > 1 ? value / 100 : value
}

const isMissingIngredientError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false
  if (error.response?.status !== 400) return false
  const detail = (error.response?.data as { detail?: string } | undefined)?.detail
  return typeof detail === "string" && detail.toLowerCase().includes("introuvable")
}

const buildEmptyRecipe = (id: string): RecipeDetail => ({
  id,
  name: "",
  active: false,
  saleable: false,
  vatId: "",
  recommendedRetailPrice: 0,
  portions: 1,
  portionWeightGrams: null,
  priceInclTax: null,
  categoryId: "",
  subcategoryId: "",
  updatedAt: new Date(),
  containsSubRecipe: false,
  purchaseCostPerPortion: null,
  technicalDataSheetInstructions: "",
  technicalDataSheetImagePath: null,
})

type PendingNav =
  | { type: "path"; value: string }
  | { type: "hotkey"; value: string }
  | { type: "callback"; action: () => void }

export default function RecipeDetailPage() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const location = useLocation()
  const state = (location.state ?? {}) as RecipeDetailLocationState
  const { estId } = useEstablishment()

  const recipeId = params.id ?? state.recipeId ?? ""
  const seedRecipe = state.recipe && state.recipe.id ? state.recipe : null
  const [recipe, setRecipe] = useState<RecipeDetail>(() => seedRecipe ?? buildEmptyRecipe(recipeId))
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => state.ingredients ?? [])
  const [forceSaveOnEntry, setForceSaveOnEntry] = useState<boolean>(Boolean(state.forceSaveOnEntry))
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const hasSeedRecipe = Boolean(seedRecipe)
  const [categoryOptions, setCategoryOptions] = useState<RecipeCategoryOption[]>([])
  const [subcategoryOptions, setSubcategoryOptions] = useState<RecipeSubcategoryOption[]>([])
  const [vatOptions, setVatOptions] = useState<VatRateOption[]>([])
  const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([])
  const [masterArticles, setMasterArticles] = useState<ApiMasterArticle[]>([])
  const [subRecipeOptions, setSubRecipeOptions] = useState<RecipeDetail[]>([])

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [duplicateName, setDuplicateName] = useState("")
  const [duplicateSaving, setDuplicateSaving] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(recipe.name)

  const [downloadOpen, setDownloadOpen] = useState(false)
  const [downloadEditorState, setDownloadEditorState] = useState<SerializedEditorState | null>(null)
  const [downloadShowFinancial, setDownloadShowFinancial] = useState(true)
  const [downloadSaving, setDownloadSaving] = useState(false)
  const downloadAbortRef = useRef<AbortController | null>(null)
  const [technicalImageFile, setTechnicalImageFile] = useState<File | null>(null)
  const [technicalImagePath, setTechnicalImagePath] = useState<string | null>(
    recipe.technicalDataSheetImagePath ?? null
  )
  const [technicalImagePreview, setTechnicalImagePreview] = useState<string | null>(null)

  const getSignedTechnicalImageUrl = useCallback(async (raw?: string | null) => {
    if (!raw) return null
    if (/^https?:\/\//i.test(raw)) return raw
    const clean = normalizeTechnicalImagePath(raw)
    if (!clean) return null
    const { data, error } = await supabase.storage
      .from(TECH_IMAGE_BUCKET)
      .createSignedUrl(clean, 60 * 10)
    if (error) return null
    return data?.signedUrl ?? null
  }, [])

  const setPreviewFromPath = useCallback(
    async (raw?: string | null) => {
      if (!raw) {
        setTechnicalImagePreview(null)
        return
      }
      const signed = await getSignedTechnicalImageUrl(raw)
      setTechnicalImagePreview(signed)
    },
    [getSignedTechnicalImageUrl]
  )

  const [portionsText, setPortionsText] = useState(() => String(recipe.portions ?? 1))
  const [portionWeightText, setPortionWeightText] = useState(() =>
    recipe.portionWeightGrams === null ? "" : String(recipe.portionWeightGrams)
  )
  const [priceInclTaxText, setPriceInclTaxText] = useState(() =>
    recipe.priceInclTax === null ? "" : String(recipe.priceInclTax)
  )
  const [pricePrefs, setPricePrefs] = useState<{ method: PriceMethod; value: number }>({
    method: "MULTIPLIER",
    value: 3,
  })
  const [baselineParams, setBaselineParams] = useState({
    vatId: recipe.vatId,
    priceInclTax: recipe.priceInclTax,
    portions: recipe.portions,
    portionWeightGrams: recipe.portionWeightGrams,
    categoryId: recipe.categoryId,
    subcategoryId: recipe.subcategoryId,
    active: recipe.active,
    saleable: recipe.saleable,
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
  const [ingredientSaving, setIngredientSaving] = useState(false)
  const [ingredientDeleting, setIngredientDeleting] = useState(false)
  const [recipeSaving, setRecipeSaving] = useState(false)
  const [ingredientDraft, setIngredientDraft] = useState<IngredientEditorDraft>({
    type: "ARTICLE",
    supplierId: "",
    productId: "",
    quantity: "",
    wastePercent: "0",
  })

  const supplierMap = useMemo(() => {
    return supplierOptions.reduce<Record<string, string>>((acc, opt) => {
      acc[opt.id] = opt.label
      return acc
    }, {})
  }, [supplierOptions])

  const subcategoryOptionsByCategory = useMemo(() => {
    return subcategoryOptions.reduce<Record<string, RecipeSubcategoryOption[]>>((acc, sub) => {
      if (!acc[sub.categoryId]) {
        acc[sub.categoryId] = []
      }
      acc[sub.categoryId].push(sub)
      return acc
    }, {})
  }, [subcategoryOptions])

  const productOptionsBySupplier = useMemo(() => {
    const grouped = masterArticles.reduce<Record<string, SupplierProductOption[]>>((acc, article) => {
      const supplierId = article.supplier_id ?? ""
      if (!supplierId) return acc
      if (!acc[supplierId]) acc[supplierId] = []
      acc[supplierId].push({
        id: article.id,
        label: article.name ?? article.unformatted_name ?? "Produit",
        unit: article.unit ?? "—",
        unitCost: toNumber(article.current_unit_price) ?? 0,
      })
      return acc
    }, {})
    Object.values(grouped).forEach((list) =>
      list.sort((a, b) => a.label.localeCompare(b.label, "fr"))
    )
    return grouped
  }, [masterArticles])

  const masterArticleMap = useMemo(() => {
    return masterArticles.reduce<Record<string, ApiMasterArticle>>((acc, article) => {
      acc[article.id] = article
      return acc
    }, {})
  }, [masterArticles])

  const subRecipeMap = useMemo(() => {
    return subRecipeOptions.reduce<Record<string, RecipeDetail>>((acc, item) => {
      acc[item.id] = item
      return acc
    }, {})
  }, [subRecipeOptions])

  const handleTechnicalImageChange = (file: File | null) => {
    if (!file) {
      setTechnicalImageFile(null)
      void setPreviewFromPath(technicalImagePath)
      return
    }
    const allowed = ["image/png", "image/svg+xml", "image/jpeg", "image/jpg"]
    if (!allowed.includes(file.type)) {
      toast.error("Formats acceptés : png, jpg, svg.")
      return
    }
    if (!technicalImageFile && technicalImagePath) {
      void removeTechnicalImageFromStorage(technicalImagePath)
      void updateRecipe(recipe.id, { technical_data_sheet_image_path: null })
      setRecipe((prev) => ({ ...prev, technicalDataSheetImagePath: null }))
      setTechnicalImagePath(null)
    }
    setTechnicalImageFile(file)
    const objectUrl = URL.createObjectURL(file)
    setTechnicalImagePreview(objectUrl)
  }

  const removeTechnicalImageFromStorage = useCallback(async (rawPath?: string | null) => {
    const path = toStoragePath(rawPath)
    if (!path) return
    const { error } = await supabase.storage.from(TECH_IMAGE_BUCKET).remove([path])
    if (error) {
      toast.error("Impossible de supprimer l'image enregistrée.")
    }
  }, [])

  const handleTechnicalImageRemove = useCallback(async () => {
    if (technicalImageFile) {
      setTechnicalImageFile(null)
      void setPreviewFromPath(technicalImagePath)
      return
    }
    if (!technicalImagePath) {
      setTechnicalImagePreview(null)
      return
    }
    try {
      await updateRecipe(recipe.id, { technical_data_sheet_image_path: null })
      setRecipe((prev) => ({ ...prev, technicalDataSheetImagePath: null }))
      setTechnicalImagePath(null)
      setTechnicalImagePreview(null)
      await removeTechnicalImageFromStorage(technicalImagePath)
    } catch {
      toast.error("Impossible de mettre à jour la recette.")
    }
  }, [removeTechnicalImageFromStorage, recipe.id, technicalImageFile, technicalImagePath, setPreviewFromPath])

  const uploadTechnicalImage = async (): Promise<string | null> => {
    if (!technicalImageFile) return technicalImagePath
    if (!estId) {
      toast.error("Aucun établissement sélectionné.")
      return null
    }
    const safeName = technicalImageFile.name.replace(/\s+/g, "-")
    const path = `${estId}/${recipe.id}-${Date.now()}-${safeName}`
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
    if (!recipeId) return
    setHasLoaded(false)
    setLoadError(null)
    const nextRecipe =
      state.recipe && state.recipe.id === recipeId ? state.recipe : buildEmptyRecipe(recipeId)
    setIngredients(state.ingredients ?? [])
    setRecipe(nextRecipe)
    setForceSaveOnEntry(Boolean(state.forceSaveOnEntry))
    setPortionsText(String(nextRecipe.portions ?? 1))
    setPortionWeightText(
      nextRecipe.portionWeightGrams === null ? "" : String(nextRecipe.portionWeightGrams)
    )
    setPriceInclTaxText(nextRecipe.priceInclTax === null ? "" : String(nextRecipe.priceInclTax))
    setBaselineParams({
      vatId: nextRecipe.vatId,
      priceInclTax: nextRecipe.priceInclTax,
      portions: nextRecipe.portions,
      portionWeightGrams: nextRecipe.portionWeightGrams,
      categoryId: nextRecipe.categoryId,
      subcategoryId: nextRecipe.subcategoryId,
      active: nextRecipe.active,
      saleable: nextRecipe.saleable,
    })
    setTechnicalImagePath(nextRecipe.technicalDataSheetImagePath ?? null)
    void setPreviewFromPath(nextRecipe.technicalDataSheetImagePath ?? null)
    setTechnicalImageFile(null)
    closeIngredientEditor()
  }, [recipeId, setPreviewFromPath, state.forceSaveOnEntry, state.ingredients, state.recipe])

  useEffect(() => {
    if (!hasLoaded) return
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
  }, [
    hasLoaded,
    recipe.active,
    recipe.categoryId,
    recipe.portionWeightGrams,
    recipe.portions,
    recipe.priceInclTax,
    recipe.saleable,
    recipe.subcategoryId,
    recipe.vatId,
  ])

  useEffect(() => {
    setDownloadEditorState(parseInstructionsState(recipe.technicalDataSheetInstructions ?? null))
    setTechnicalImagePath(recipe.technicalDataSheetImagePath ?? null)
    void setPreviewFromPath(recipe.technicalDataSheetImagePath ?? null)
    setTechnicalImageFile(null)
  }, [recipe.technicalDataSheetInstructions, recipe.technicalDataSheetImagePath, recipe.id, setPreviewFromPath])

  useEffect(() => {
    if (!estId) return
    let active = true
    const loadPrefs = async () => {
      const prefs = await fetchRecipePricePrefs(estId)
      if (!active) return
      setPricePrefs(prefs)
    }
    loadPrefs()
    return () => {
      active = false
    }
  }, [estId])

  const loadRecipeData = useCallback(async () => {
    if (!estId || !recipeId) return
    try {
      setLoadError(null)
      setHasLoaded(false)
      const [
        recipeData,
        ingredientsData,
        categoriesData,
        subcategoriesData,
        vatRatesData,
        suppliersData,
        masterArticlesData,
        recipesData,
      ] = await Promise.all([
        fetchRecipeById(recipeId),
        fetchIngredients(estId, recipeId, { useCache: false }),
        fetchRecipeCategories(),
        fetchRecipeSubcategories(),
        fetchVatRates(),
        fetchSuppliers(estId),
        fetchMasterArticles(estId),
        fetchRecipes(estId),
      ])

      if (!recipeData) {
        setLoadError("Recette introuvable.")
        setHasLoaded(true)
        return
      }

      const mappedCategories: RecipeCategoryOption[] = categoriesData
        .map((cat: ApiRecipeCategory) => ({
          id: cat.id,
          label: cat.name ?? "Sans nom",
        }))
      const mappedSubcategories: RecipeSubcategoryOption[] = subcategoriesData
        .map((sub: ApiRecipeSubcategory) => ({
          id: sub.id,
          label: sub.name ?? "Sans nom",
          categoryId: sub.category_id ?? "",
        }))
      const mappedVatRates: VatRateOption[] = vatRatesData.map((rate: ApiVatRate) => {
        const normalizedRate = normalizeVatRate(rate.percentage_rate)
        return {
          id: rate.id,
          label: rate.name ?? `${(normalizedRate * 100).toLocaleString("fr-FR")} %`,
          rate: normalizedRate,
        }
      })
      const mappedSuppliers: SupplierOption[] = suppliersData
        .map((supplier: ApiSupplier) => ({
          id: supplier.id,
          label: supplier.name ?? "Fournisseur",
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr"))

      setCategoryOptions(mappedCategories)
      setSubcategoryOptions(mappedSubcategories)
      setVatOptions(mappedVatRates)
      setSupplierOptions(mappedSuppliers)
      setMasterArticles(masterArticlesData)

      const recipeOptions = recipesData
        .map((item: ApiRecipe) => toRecipeDetail(item))
        .sort((a, b) => a.name.localeCompare(b.name, "fr"))
      setSubRecipeOptions(recipeOptions)

      const masterMap = masterArticlesData.reduce<Record<string, ApiMasterArticle>>((acc, article) => {
        acc[article.id] = article
        return acc
      }, {})
      const recipeMap = recipeOptions.reduce<Record<string, RecipeDetail>>((acc, item) => {
        acc[item.id] = item
        return acc
      }, {})

      const mappedIngredients: Ingredient[] = ingredientsData.map((item: ApiIngredient) => {
        const type = (item.type ?? "ARTICLE") as IngredientType
        if (type === "ARTICLE") {
          const master = item.master_article_id ? masterMap[item.master_article_id] : undefined
          return {
            id: item.id,
            type: "ARTICLE",
            name: master?.name ?? master?.unformatted_name ?? "Produit",
            quantity: toNumber(item.quantity) ?? 0,
            unit: item.unit ?? master?.unit ?? "—",
            unitCost: toNumber(item.gross_unit_price) ?? toNumber(master?.current_unit_price) ?? 0,
            masterArticleId: item.master_article_id ?? undefined,
            supplierId: master?.supplier_id ?? undefined,
            productId: item.master_article_id ?? undefined,
            wastePercent: toNumber(item.percentage_loss) ?? 0,
          }
        }
        if (type === "SUBRECIPE") {
          const subRecipe = item.subrecipe_id ? recipeMap[item.subrecipe_id] : undefined
          return {
            id: item.id,
            type: "SUBRECIPE",
            name: subRecipe?.name ?? "Sous-recette",
            quantity: toNumber(item.quantity) ?? 0,
            unit: item.unit ?? "portion",
            unitCost:
              toNumber(item.gross_unit_price) ?? toNumber(subRecipe?.purchaseCostPerPortion) ?? 0,
            subRecipeId: item.subrecipe_id ?? undefined,
          }
        }
        return {
          id: item.id,
          type: "FIXED",
          name: item.unit ?? "Charge fixe",
          quantity: toNumber(item.quantity) ?? 1,
          unit: "forfait",
          unitCost: toNumber(item.unit_cost) ?? 0,
        }
      })

      const hasSubrecipe = mappedIngredients.some((item) => item.type === "SUBRECIPE")
      const nextRecipe = {
        ...toRecipeDetail(recipeData),
        containsSubRecipe: hasSubrecipe,
      }

      setRecipe(nextRecipe)
      setIngredients(mappedIngredients)
      setHasLoaded(true)
    } catch {
      setLoadError("Impossible de charger les données de la recette.")
      setHasLoaded(true)
    }
  }, [estId, recipeId])

  useEffect(() => {
    loadRecipeData()
  }, [loadRecipeData])

  const editingIngredient = useMemo(() => {
    if (!editingIngredientId) return null
    return ingredients.find((item) => item.id === editingIngredientId) ?? null
  }, [editingIngredientId, ingredients])

  const vatRate = useMemo(() => {
    if (!recipe.vatId) return 0
    const match = vatOptions.find((opt) => opt.id === recipe.vatId)
    return match?.rate ?? 0
  }, [recipe.vatId, vatOptions])

  const ingredientRows = useMemo<IngredientRow[]>(() => {
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
    return subRecipeOptions.filter((item) => item.id !== recipe.id && item.containsSubRecipe !== true)
  }, [recipe.id, subRecipeOptions])

  const openCreateIngredient = (type: IngredientType) => {
    setIngredientEditorMode("create")
    setEditingIngredientId(null)
    if (type === "ARTICLE") {
      setIngredientDraft({
        type,
        supplierId: "",
        productId: "",
        quantity: "",
        wastePercent: "0",
      })
    } else if (type === "SUBRECIPE") {
      setIngredientDraft({
        type,
        categoryId: "",
        subcategoryId: "",
        recipeId: "",
        portionsUsed: "1",
      })
    } else {
      setIngredientDraft({
        type,
        name: "",
        fixedCost: "",
      })
    }
    setIngredientEditorOpen(true)
  }

  const openEditIngredient = (id: string) => {
    const found = ingredients.find((item) => item.id === id)
    if (!found) return
    setIngredientEditorMode("edit")
    setEditingIngredientId(id)

    if (found.type === "ARTICLE") {
      setIngredientDraft({
        type: "ARTICLE",
        supplierId: found.supplierId ?? "",
        productId: found.productId ?? "",
        quantity: String(found.quantity).replace(".", ","),
        wastePercent: String(found.wastePercent ?? 0).replace(".", ","),
      })
    } else if (found.type === "SUBRECIPE") {
      const subId = found.subRecipeId ?? ""
      const subRecipe = subId ? subRecipeMap[subId] : undefined
      setIngredientDraft({
        type: "SUBRECIPE",
        categoryId: subRecipe?.categoryId ?? recipe.categoryId,
        subcategoryId: subRecipe?.subcategoryId ?? recipe.subcategoryId,
        recipeId: subId,
        portionsUsed: String(found.quantity).replace(".", ","),
      })
    } else {
      setIngredientDraft({
        type: "FIXED",
        name: found.name,
        fixedCost: String(found.unitCost).replace(".", ","),
      })
    }

    setIngredientEditorOpen(true)
  }

  const updateContainsSubRecipe = useCallback(
    (nextIngredients: Ingredient[]) => {
      const hasSubrecipe = nextIngredients.some((item) => item.type === "SUBRECIPE")
      setRecipe((prev) => {
        if (prev.containsSubRecipe === hasSubrecipe) return prev
        if (estId && prev.id) {
          updateRecipe(prev.id, { contains_sub_recipe: hasSubrecipe }).catch(() => {})
        }
        return { ...prev, containsSubRecipe: hasSubrecipe }
      })
    },
    [estId]
  )

  const buildIngredientFromDraft = useCallback(
    (ingredientId: string, apiIngredient?: ApiIngredient | null): Ingredient | null => {
      if (ingredientDraft.type === "ARTICLE") {
        const productId = ingredientDraft.productId || apiIngredient?.master_article_id || ""
        const product = productId ? masterArticleMap[productId] : undefined
        if (!productId || !product) return null
        return {
          id: ingredientId,
          type: "ARTICLE",
          name: product.name ?? product.unformatted_name ?? "Produit",
          quantity: parseNumber(ingredientDraft.quantity),
          unit: product.unit ?? "—",
          unitCost: toNumber(product.current_unit_price) ?? 0,
          masterArticleId: productId,
          supplierId: product.supplier_id ?? undefined,
          productId,
          wastePercent: parseNumber(ingredientDraft.wastePercent),
        }
      }

      if (ingredientDraft.type === "SUBRECIPE") {
        const subId = ingredientDraft.recipeId || apiIngredient?.subrecipe_id || ""
        const subRecipe = subId ? subRecipeMap[subId] : undefined
        if (!subId || !subRecipe) return null
        return {
          id: ingredientId,
          type: "SUBRECIPE",
          name: subRecipe.name ?? "Sous-recette",
          quantity: parseNumber(ingredientDraft.portionsUsed),
          unit: "portion",
          unitCost: subRecipe.purchaseCostPerPortion ?? 0,
          subRecipeId: subId,
        }
      }

      const fixedName = ingredientDraft.name.trim()
      return {
        id: ingredientId,
        type: "FIXED",
        name: fixedName || apiIngredient?.unit || "Charge fixe",
        quantity: 1,
        unit: "forfait",
        unitCost: parseNumber(ingredientDraft.fixedCost),
      }
    },
    [ingredientDraft, masterArticleMap, subRecipeMap]
  )

  const upsertIngredient = useCallback(
    (nextIngredient: Ingredient) => {
      setIngredients((prev) => {
        const index = prev.findIndex((item) => item.id === nextIngredient.id)
        const next =
          index === -1
            ? [...prev, nextIngredient]
            : prev.map((item, idx) => (idx === index ? nextIngredient : item))
        updateContainsSubRecipe(next)
        return next
      })
    },
    [updateContainsSubRecipe]
  )

  const handleDeleteIngredient = () => {
    if (!editingIngredientId || !estId) return
    setIngredientDeleting(true)
    deleteIngredient({
      ingredient_id: editingIngredientId,
      establishment_id: estId,
    })
      .then(() => {
        closeIngredientEditor()
        toast.error("L'ingrédient a bien été supprimé de la recette.", {
          icon: <Trash2 className="h-4 w-4 text-destructive" />,
        })
        setIngredients((prev) => {
          const next = prev.filter((item) => item.id !== editingIngredientId)
          updateContainsSubRecipe(next)
          return next
        })
        clearIngredientsCache(estId, recipe.id)
      })
      .catch((error) => {
        if (isMissingIngredientError(error)) {
          closeIngredientEditor()
          setIngredients((prev) => {
            const next = prev.filter((item) => item.id !== editingIngredientId)
            updateContainsSubRecipe(next)
            return next
          })
          clearIngredientsCache(estId, recipe.id)
          toast.message("L'ingrédient était déjà supprimé.", {
            icon: <Info className="h-4 w-4 text-muted-foreground" />,
          })
          return
        }
        toast.error("Impossible de supprimer l'ingrédient.")
      })
      .finally(() => {
        setIngredientDeleting(false)
      })
  }

  const handleSaveIngredient = () => {
    if (!estId || !recipe.id) return
    if (ingredientSaving) return

    const runRecompute = (ingredientId: string) =>
      recomputeIngredient({
        ingredient_id: ingredientId,
        recipe_id: recipe.id,
        establishment_id: estId,
      })

    const finalizeSave = async (data: ApiIngredient | null | undefined, successMessage: string) => {
      const nextId =
        ingredientEditorMode === "edit" && editingIngredientId ? editingIngredientId : data?.id
      if (!nextId) {
        toast.error("Impossible de récupérer l'identifiant de l'ingrédient.")
        return
      }
      const nextIngredient = buildIngredientFromDraft(nextId, data)
      if (nextIngredient) {
        upsertIngredient(nextIngredient)
      }
      if (estId) {
        clearIngredientsCache(estId, recipe.id)
      }
      try {
        await runRecompute(nextId)
      } catch {
        toast.message("Ingrédient enregistré, recalcul en attente.", {
          icon: <Info className="h-4 w-4 text-muted-foreground" />,
        })
      }
      closeIngredientEditor()
      toast.success(successMessage)
    }

    if (ingredientDraft.type === "ARTICLE") {
      const supplierId = ingredientDraft.supplierId
      const productId = ingredientDraft.productId
      const quantity = parseNumber(ingredientDraft.quantity)
      const wastePercent = parseNumber(ingredientDraft.wastePercent)
      const product = masterArticleMap[productId]

      if (!supplierId || !productId || !product) {
        toast.error("Sélectionnez un fournisseur et un produit.")
        return
      }
      if (quantity <= 0) {
        toast.error("La quantité doit être supérieure à 0.")
        return
      }

      const payload = {
        recipe_id: recipe.id,
        establishment_id: estId,
        type: "ARTICLE" as const,
        master_article_id: productId,
        quantity,
        unit: product.unit ?? null,
        percentage_loss: wastePercent,
      }

      const request =
        ingredientEditorMode === "edit" && editingIngredientId
          ? updateIngredient(editingIngredientId, payload)
          : createIngredient(payload)

      setIngredientSaving(true)
      request
        .then((data) =>
          finalizeSave(
            data,
            ingredientEditorMode === "edit" ? "Ingrédient mis à jour." : "Ingrédient ajouté."
          )
        )
        .catch(() => {
          toast.error("Impossible d'enregistrer l'ingrédient.")
        })
        .finally(() => {
          setIngredientSaving(false)
        })
      return
    }

    if (ingredientDraft.type === "SUBRECIPE") {
      const subId = ingredientDraft.recipeId
      const portionsUsed = parseNumber(ingredientDraft.portionsUsed)
      const selected = subId ? subRecipeMap[subId] : undefined

      if (!selected) {
        toast.error("Sélectionnez une recette.")
        return
      }
      if (portionsUsed <= 0 || !Number.isFinite(portionsUsed)) {
        toast.error("Le nombre de portions doit être supérieur à 0.")
        return
      }

      const payload = {
        recipe_id: recipe.id,
        establishment_id: estId,
        type: "SUBRECIPE" as const,
        subrecipe_id: subId,
        quantity: portionsUsed,
        unit: "portion",
      }

      const request =
        ingredientEditorMode === "edit" && editingIngredientId
          ? updateIngredient(editingIngredientId, payload)
          : createIngredient(payload)

      setIngredientSaving(true)
      request
        .then((data) =>
          finalizeSave(
            data,
            ingredientEditorMode === "edit" ? "Sous-recette mise à jour." : "Sous-recette ajoutée."
          )
        )
        .catch(() => {
          toast.error("Impossible d'enregistrer la sous-recette.")
        })
        .finally(() => {
          setIngredientSaving(false)
        })
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

    const payload = {
      recipe_id: recipe.id,
      establishment_id: estId,
      type: "FIXED" as const,
      unit: name,
      unit_cost: fixedCost,
      quantity: 1,
    }

    const request =
      ingredientEditorMode === "edit" && editingIngredientId
        ? updateIngredient(editingIngredientId, payload)
        : createIngredient(payload)

    setIngredientSaving(true)
    request
      .then((data) =>
        finalizeSave(data, ingredientEditorMode === "edit" ? "Charge mise à jour." : "Charge ajoutée.")
      )
      .catch(() => {
        toast.error("Impossible d'enregistrer la charge.")
      })
      .finally(() => {
        setIngredientSaving(false)
      })
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
        Recette <span className="font-semibold">{name}</span> {next ? "activée" : "désactivée"}.
        Enregistrez les paramètres pour confirmer.
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
        Recette <span className="font-semibold">{name}</span> {next ? "rendue vendable" : "rendue non vendable"}.
        Enregistrez les paramètres pour confirmer.
      </>,
      { icon: <Info className="h-4 w-4 text-muted-foreground" /> }
    )
  }

  const handleSave = useCallback(
    async (options?: { redirect?: boolean }) => {
    if (!estId || !recipe.id) return false
    if (recipeSaving) return false
    if (ingredients.length === 0) {
      toast.error("Ajoutez au moins un ingrédient avant d'enregistrer la recette.")
      return false
    }
    const trimmedName = recipe.name.trim()
    if (!trimmedName) {
      toast.error("Renseignez un nom de recette.")
      return false
    }
    if (!recipe.categoryId) {
      toast.error("Sélectionnez une catégorie.")
      return false
    }
    if (!recipe.subcategoryId) {
      toast.error("Sélectionnez une sous-catégorie.")
      return false
    }
    if (recipe.saleable) {
      if (!recipe.vatId) {
        toast.error("Sélectionnez une TVA.")
        return false
      }
      if (priceInclTaxValue === null) {
        toast.error("Renseignez un prix de vente TTC.")
        return false
      }
    }
    const hasSubrecipe = ingredients.some((item) => item.type === "SUBRECIPE")
    const priceTaxValue =
      recipe.saleable && priceInclTaxValue !== null
        ? Math.max(0, priceInclTaxValue - priceExclTax)
        : null
    const recommendedRetailPriceValue =
      Number.isFinite(recommendedPriceTtc) && recommendedPriceTtc > 0 ? recommendedPriceTtc : null

    setRecipeSaving(true)
    try {
      const updated = await updateRecipe(recipe.id, {
        name: trimmedName,
        vat_id: recipe.vatId || null,
        recommanded_retail_price: recommendedRetailPriceValue,
        active: recipe.active,
        saleable: recipe.saleable,
        contains_sub_recipe: hasSubrecipe,
        portion: portionsValue,
        portion_weight: portionWeightValue,
        price_incl_tax: recipe.saleable ? priceInclTaxValue : null,
        price_excl_tax: recipe.saleable ? priceExclTax : null,
        price_tax: priceTaxValue,
        category_id: recipe.categoryId || null,
        subcategory_id: recipe.subcategoryId || null,
        technical_data_sheet_instructions: recipe.technicalDataSheetInstructions ?? null,
        technical_data_sheet_image_path: technicalImagePath ?? null,
      })
      await recomputeRecipe({ recipe_id: recipe.id, establishment_id: estId })
      const refreshed = await fetchRecipeById(recipe.id)
      const rawRecipe = (refreshed ?? updated) as ApiRecipe
      const normalized = toRecipeDetail(rawRecipe)
      setRecipe((prev) => ({
        ...prev,
        ...normalized,
        priceInclTax: recipe.saleable ? priceInclTaxValue : null,
        portions: portionsValue,
        portionWeightGrams: portionWeightValue,
        updatedAt: normalized.updatedAt,
      }))
      if (rawRecipe?.id) {
        upsertCachedRecipe(estId, rawRecipe)
      }
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
      if (options?.redirect) {
        navigate("/dashboard/recipes")
      }
      return true
    } catch {
      toast.error("Impossible d'enregistrer la recette.")
      return false
    } finally {
      setRecipeSaving(false)
    }
  },
    [
      estId,
      ingredients,
      navigate,
      portionWeightValue,
      portionsValue,
      priceExclTax,
      priceInclTaxValue,
      recommendedPriceTtc,
      recipe,
      recipeSaving,
      technicalImagePath,
    ]
  )

  const getExistingRecipeNames = useCallback(async () => {
    if (!estId) return []
    const cached = getCachedRecipes(estId)
    if (cached?.length) {
      return cached.map((item) => item.name)
    }
    try {
      const list = await fetchRecipes(estId, { useCache: true })
      return list.map((item) => item.name)
    } catch {
      return []
    }
  }, [estId])

  const openDuplicate = () => {
    const baseName = `Copie de ${recipe.name}`
    if (!estId) {
      setDuplicateName(baseName)
      setDuplicateOpen(true)
      return
    }
    void (async () => {
      const existingNames = await getExistingRecipeNames()
      setDuplicateName(getUniqueRecipeName(baseName, existingNames))
      setDuplicateOpen(true)
    })()
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

  const performPendingNavigation = useCallback(() => {
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
    } else {
      navigate("/dashboard/recipes")
    }
    setNavConfirmOpen(false)
    setPendingNav(null)
  }, [navigate, pendingNav])

  const confirmNavigate = () => {
    if (ingredients.length === 0) {
      toast.error("Ajoutez au moins un ingrédient avant de quitter cette recette.")
      return
    }
    performPendingNavigation()
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
    if (downloadSaving || !estId) return
    setDownloadSaving(true)
    const controller = new AbortController()
    downloadAbortRef.current = controller
    try {
      const previousImagePath = technicalImagePath
      let nextImagePath = technicalImagePath
      let signedImageUrl: string | null = null
      if (technicalImageFile) {
        const uploaded = await uploadTechnicalImage()
        if (!uploaded) return
        nextImagePath = uploaded
        setTechnicalImagePath(uploaded)
        setTechnicalImageFile(null)
        signedImageUrl = await getSignedTechnicalImageUrl(uploaded)
        setTechnicalImagePreview(signedImageUrl)
        setRecipe((prev) => ({
          ...prev,
          technicalDataSheetImagePath: uploaded,
        }))
      }

      const fallbackState = parseInstructionsState(recipe.technicalDataSheetInstructions ?? null)
      const instructionsState = downloadEditorState ?? fallbackState
      const instructionsText = instructionsState ? toPlainText(instructionsState).trim() : ""
      const instructionsHtml = instructionsState ? toInstructionsHtml(instructionsState) : ""
      const instructionsSerialized = instructionsState ? JSON.stringify(instructionsState) : null
      if (instructionsSerialized !== recipe.technicalDataSheetInstructions) {
        setRecipe((prev) => ({
          ...prev,
          technicalDataSheetInstructions: instructionsSerialized ?? "",
        }))
      }

      const updates: Partial<ApiRecipe> = {}
      if (instructionsSerialized !== recipe.technicalDataSheetInstructions) {
        updates.technical_data_sheet_instructions = instructionsSerialized
      }
      if (nextImagePath !== recipe.technicalDataSheetImagePath) {
        updates.technical_data_sheet_image_path = nextImagePath ?? null
      }
      if (Object.keys(updates).length) {
        await updateRecipe(recipe.id, updates)
      }
      if (
        technicalImageFile &&
        previousImagePath &&
        toStoragePath(previousImagePath) !== toStoragePath(nextImagePath)
      ) {
        await removeTechnicalImageFromStorage(previousImagePath)
      }

      const hasSubrecipe = ingredients.some((item) => item.type === "SUBRECIPE")
      const priceTaxValue =
        recipe.saleable && priceInclTaxValue !== null
          ? Math.max(0, priceInclTaxValue - priceExclTax)
          : null

      const pdfRecipe: ApiRecipe = {
        id: recipe.id,
        establishment_id: estId,
        name: recipe.name,
        vat_id: recipe.vatId || null,
        recommanded_retail_price: recipe.recommendedRetailPrice || null,
        active: recipe.active,
        saleable: recipe.saleable,
        contains_sub_recipe: hasSubrecipe,
        purchase_cost_total: purchaseCostTotal,
        portion: portionsValue,
        purchase_cost_per_portion: purchaseCostPerPortion,
        technical_data_sheet_instructions: instructionsText || null,
        current_margin: marginHtPerPortion ?? null,
        portion_weight: portionWeightValue,
        price_excl_tax: recipe.saleable ? priceExclTax : null,
        price_incl_tax: recipe.saleable ? priceInclTaxValue : null,
        price_tax: recipe.saleable ? priceTaxValue : null,
        category_id: recipe.categoryId || null,
        subcategory_id: recipe.subcategoryId || null,
        technical_data_sheet_image_path: nextImagePath ?? null,
      }

      if (!signedImageUrl) {
        signedImageUrl = await getSignedTechnicalImageUrl(nextImagePath)
      }

      const pdfIngredients = ingredients.map((item) => {
        const lossPercent = item.type === "ARTICLE" ? item.wastePercent ?? 0 : null
        const lossFactor = lossPercent ? 1 + lossPercent / 100 : 1
        const netUnitCost = item.unitCost * lossFactor
        const subRecipe =
          item.type === "SUBRECIPE" ? subRecipeMap[item.subRecipeId ?? ""] : undefined
        const portionWeight = item.type === "SUBRECIPE" ? subRecipe?.portionWeightGrams ?? null : null
        return {
          name: item.name,
          type: item.type,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: netUnitCost,
          loss_percent: lossPercent,
          portion_weight: portionWeight,
          supplier:
            item.type === "ARTICLE" ? supplierMap[item.supplierId ?? ""] ?? null : null,
        }
      })

      const blob = await generateRecipePdf(
        {
          recipe: pdfRecipe,
          ingredients: pdfIngredients,
          include_financials: downloadShowFinancial,
          technical_image_url: signedImageUrl,
          instructions_html: instructionsHtml || null,
        },
        { signal: controller.signal }
      )

      const filename = buildRecipePdfFilename(recipe.name)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.rel = "noopener"
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      setDownloadOpen(false)
      toast.success(
        <>
          Téléchargement de <span className="font-semibold">{recipe.name}</span> prêt.
        </>
      )
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === "ERR_CANCELED") {
        return
      }
      toast.error("Impossible de générer la fiche technique.")
    } finally {
      setDownloadSaving(false)
      downloadAbortRef.current = null
    }
  }

  const handleDownloadOpenChange = (open: boolean) => {
    if (!open && downloadSaving) {
      downloadAbortRef.current?.abort()
      downloadAbortRef.current = null
      setDownloadSaving(false)
    }
    setDownloadOpen(open)
  }

  const confirmDuplicate = async () => {
    const nextName = duplicateName.trim()
    if (!nextName) return
    if (!estId) {
      toast.error("Sélectionnez un établissement pour dupliquer la recette.")
      return
    }
    if (duplicateSaving) return
    setDuplicateSaving(true)
    const existingNames = await getExistingRecipeNames()
    const resolvedName = getUniqueRecipeName(nextName, existingNames)
    if (resolvedName !== nextName) {
      setDuplicateName(resolvedName)
      toast(`Nom déjà utilisé, renommé en "${resolvedName}".`)
    }
    duplicateRecipe({
      recipe_id: recipe.id,
      establishment_id: estId,
      new_name: resolvedName,
    })
      .then(async (result) => {
        const nextId = result?.new_recipe_id
        if (!nextId) {
          toast.error("Impossible de dupliquer la recette.")
          return
        }
        let cachedRecipe = null as ApiRecipe | null
        try {
          cachedRecipe = await fetchRecipeById(nextId)
        } catch {
          cachedRecipe = null
        }
        if (cachedRecipe) {
          upsertCachedRecipe(
            String(cachedRecipe.establishment_id ?? estId),
            cachedRecipe
          )
        } else {
          upsertCachedRecipe(estId, {
            id: nextId,
            establishment_id: estId,
            name: resolvedName,
            active: false,
            saleable: recipe.saleable,
            portion: recipe.portions,
            portion_weight: recipe.portionWeightGrams,
            price_incl_tax: recipe.priceInclTax,
            category_id: recipe.categoryId || null,
            subcategory_id: recipe.subcategoryId || null,
            vat_id: recipe.vatId || null,
            purchase_cost_per_portion: recipe.purchaseCostPerPortion ?? null,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            technical_data_sheet_instructions: recipe.technicalDataSheetInstructions ?? "",
            technical_data_sheet_image_path: recipe.technicalDataSheetImagePath ?? null,
          })
        }
        toast.success(
          <>
            Recette <span className="font-semibold">{resolvedName}</span> dupliquée
          </>
        )
        setDuplicateOpen(false)
        navigate(`/dashboard/recipes/${nextId}`, {
          replace: false,
          state: {
            recipeId: nextId,
          } satisfies RecipeDetailLocationState,
        })
      })
      .catch(() => {
        toast.error("Impossible de dupliquer la recette.")
      })
      .finally(() => {
        setDuplicateSaving(false)
      })
  }

  const confirmDeleteRecipe = () => {
    if (!estId) return
    if (deleteSaving) return
    setDeleteSaving(true)
    deleteRecipe({
      recipe_id: recipe.id,
      establishment_id: estId,
    })
      .then((result) => {
        setDeleteOpen(false)
        const deletedIds = new Set<string>(result?.deleted_recipes ?? [recipe.id])
        deletedIds.forEach((id) => removeCachedRecipe(estId, id))
        clearIngredientsCache(estId)
        toast.success(
          <>
            Recette <span className="font-semibold">{recipe.name}</span> supprimée
          </>
        )
        navigate("/dashboard/recipes")
      })
      .catch(() => {
        toast.error("Impossible de supprimer la recette.")
      })
      .finally(() => {
        setDeleteSaving(false)
      })
  }

  const confirmDeleteAndLeave = () => {
    if (!estId) return
    if (deleteSaving) return
    setDeleteSaving(true)
    deleteRecipe({
      recipe_id: recipe.id,
      establishment_id: estId,
    })
      .then((result) => {
        const deletedIds = new Set<string>(result?.deleted_recipes ?? [recipe.id])
        deletedIds.forEach((id) => removeCachedRecipe(estId, id))
        clearIngredientsCache(estId)
        toast.success(
          <>
            Recette <span className="font-semibold">{recipe.name}</span> supprimée
          </>
        )
        performPendingNavigation()
      })
      .catch(() => {
        toast.error("Impossible de supprimer la recette.")
      })
      .finally(() => {
        setDeleteSaving(false)
      })
  }

  const openRename = () => {
    setRenameValue(recipe.name)
    setRenameOpen(true)
  }

  const confirmRename = () => {
    const next = renameValue.trim()
    if (!next || !estId) return
    updateRecipe(recipe.id, { name: next })
      .then((updated) => {
        const normalized = toRecipeDetail(updated as ApiRecipe)
        setRecipe((prev) => ({ ...prev, name: normalized.name, updatedAt: normalized.updatedAt }))
        setRenameOpen(false)
        toast.success("Nom mis à jour.")
        loadRecipeData()
      })
      .catch(() => {
        toast.error("Impossible de renommer la recette.")
      })
  }

  const handlePriceInclTaxFocus = () => {
    setPriceTtcFocused(true)
    setPriceTtcTooltipOpen(false)
  }

  const handlePriceInclTaxBlur = () => {
    setPriceTtcFocused(false)
    setPriceTtcLabelTooltipOpen(false)
    setRecipe((prev) => ({
      ...prev,
      priceInclTax: priceInclTaxValue,
      updatedAt: new Date(),
    }))
  }

  const handlePortionsFocus = () => {
    setPortionsFocused(true)
    setPortionsTooltipOpen(false)
  }

  const handlePortionsBlur = () => {
    setPortionsFocused(false)
    setPortionsLabelTooltipOpen(false)
    setRecipe((prev) => ({
      ...prev,
      portions: portionsValue,
      updatedAt: new Date(),
    }))
  }

  const handlePortionWeightFocus = () => {
    setPortionWeightFocused(true)
    setPortionWeightTooltipOpen(false)
  }

  const handlePortionWeightBlur = () => {
    setPortionWeightFocused(false)
    setPortionWeightLabelTooltipOpen(false)
    setRecipe((prev) => ({
      ...prev,
      portionWeightGrams: portionWeightValue,
      updatedAt: new Date(),
    }))
  }

  const handleCategoryChange = (value: string) => {
    const nextSub = subcategoryOptionsByCategory[value]?.[0]?.id ?? recipe.subcategoryId
    setRecipe((prev) => ({
      ...prev,
      categoryId: value,
      subcategoryId: nextSub,
      updatedAt: new Date(),
    }))
  }

  if (!recipeId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
        Recette introuvable.
      </div>
    )
  }

  if (!estId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
        Sélectionnez un établissement pour accéder à cette recette.
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
        {loadError}
      </div>
    )
  }

  if (!hasLoaded && !hasSeedRecipe) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
        Chargement de la recette...
      </div>
    )
  }

  return (
    <div className="space-y-6" onClickCapture={handleNavClickCapture}>
      <RecipeNavGuardDialog
        open={navConfirmOpen}
        onOpenChange={(open) => {
          setNavConfirmOpen(open)
          if (!open) setPendingNav(null)
        }}
        ingredientsCount={ingredients.length}
        onConfirmLeave={confirmNavigate}
        onSaveAndLeave={async () => {
          const saved = await handleSave()
          if (saved) {
            confirmNavigate()
          }
        }}
        onDeleteAndLeave={confirmDeleteAndLeave}
      />

      <RecipeDeleteDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) {
            setDeleteSaving(false)
          }
        }}
        recipeName={recipe.name}
        onConfirm={confirmDeleteRecipe}
        isDeleting={deleteSaving}
      />

      <RecipeDuplicateDialog
        open={duplicateOpen}
        onOpenChange={(open) => {
          setDuplicateOpen(open)
          if (!open) setDuplicateSaving(false)
        }}
        recipeName={recipe.name}
        duplicateName={duplicateName}
        onDuplicateNameChange={setDuplicateName}
        onConfirm={confirmDuplicate}
        isDuplicating={duplicateSaving}
      />

      <RecipeRenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        renameValue={renameValue}
        onRenameValueChange={setRenameValue}
        onConfirm={confirmRename}
      />

      <RecipeDownloadDialog
        open={downloadOpen}
        onOpenChange={handleDownloadOpenChange}
        recipeName={recipe.name}
        technicalImageFile={technicalImageFile}
        technicalImagePreview={technicalImagePreview}
        onTechnicalImageChange={handleTechnicalImageChange}
        onTechnicalImageRemove={handleTechnicalImageRemove}
        downloadEditorState={downloadEditorState}
        onDownloadEditorStateChange={setDownloadEditorState}
        downloadShowFinancial={downloadShowFinancial}
        onDownloadShowFinancialChange={setDownloadShowFinancial}
        isDownloading={downloadSaving}
        onConfirm={confirmDownload}
      />

      <IngredientEditorSheet
        open={ingredientEditorOpen}
        onOpenChange={(open) => {
          setIngredientEditorOpen(open)
          if (!open) setEditingIngredientId(null)
        }}
        mode={ingredientEditorMode}
        editingIngredientName={editingIngredient?.name ?? null}
        draft={ingredientDraft}
        setDraft={setIngredientDraft}
        availableSubRecipes={availableSubRecipes}
        currentRecipeId={recipe.id}
        supplierOptions={supplierOptions}
        productOptionsBySupplier={productOptionsBySupplier}
        categoryOptions={categoryOptions}
        subcategoryOptionsByCategory={subcategoryOptionsByCategory}
        isSaving={ingredientSaving}
        isDeleting={ingredientDeleting}
        onSave={handleSaveIngredient}
        onDelete={ingredientEditorMode === "edit" ? handleDeleteIngredient : undefined}
      />

      <RecipeDetailHeader
        recipeName={recipe.name}
        formattedUpdatedAt={formattedUpdatedAt}
        onBack={() => requestNavigate("/dashboard/recipes")}
        onRename={openRename}
        onDuplicate={() => {
          if (navigationBlocked) {
            setPendingNav({ type: "callback", action: openDuplicate })
            setNavConfirmOpen(true)
            return
          }
          openDuplicate()
        }}
        onDownload={() => {
          if (navigationBlocked) {
            setPendingNav({ type: "callback", action: openDownload })
            setNavConfirmOpen(true)
            return
          }
          openDownload()
        }}
        onDelete={() => setDeleteOpen(true)}
      />

      <div className="grid gap-4 lg:grid-cols-12 items-start">
        <div className="space-y-4 lg:col-span-8">
          <RecipeIngredientsCard
            ingredientRows={ingredientRows}
            ingredientsCount={ingredients.length}
            purchaseCostTotal={purchaseCostTotal}
            purchaseCostPerPortion={purchaseCostPerPortion}
            isLoading={!hasLoaded}
            onAddArticle={() => openCreateIngredient("ARTICLE")}
            onAddSubRecipe={() => openCreateIngredient("SUBRECIPE")}
            onAddFixed={() => openCreateIngredient("FIXED")}
            onEditIngredient={openEditIngredient}
          />
        </div>

        <div className="space-y-4 lg:col-span-4">
          <RecipeSettingsCard
            recipe={recipe}
            recommendedPriceTtc={recommendedPriceTtc}
            marginHtPerPortion={marginHtPerPortion}
            marginPercent={marginPercent}
            priceInclTaxText={priceInclTaxText}
            portionsText={portionsText}
            portionWeightText={portionWeightText}
            priceTtcFocused={priceTtcFocused}
            priceTtcTooltipOpen={priceTtcTooltipOpen}
            priceTtcLabelTooltipOpen={priceTtcLabelTooltipOpen}
            portionsFocused={portionsFocused}
            portionsTooltipOpen={portionsTooltipOpen}
            portionsLabelTooltipOpen={portionsLabelTooltipOpen}
            portionWeightFocused={portionWeightFocused}
            portionWeightTooltipOpen={portionWeightTooltipOpen}
            portionWeightLabelTooltipOpen={portionWeightLabelTooltipOpen}
            onToggleSaleable={toggleSaleable}
            onToggleActive={toggleActive}
            onVatChange={(value) => setRecipe((prev) => ({ ...prev, vatId: value, updatedAt: new Date() }))}
            onPriceInclTaxTextChange={setPriceInclTaxText}
            onPriceInclTaxFocus={handlePriceInclTaxFocus}
            onPriceInclTaxBlur={handlePriceInclTaxBlur}
            onPriceTtcTooltipOpenChange={setPriceTtcTooltipOpen}
            onPriceTtcLabelTooltipOpenChange={setPriceTtcLabelTooltipOpen}
            onPortionsTextChange={setPortionsText}
            onPortionsFocus={handlePortionsFocus}
            onPortionsBlur={handlePortionsBlur}
            onPortionsTooltipOpenChange={setPortionsTooltipOpen}
            onPortionsLabelTooltipOpenChange={setPortionsLabelTooltipOpen}
            onPortionWeightTextChange={setPortionWeightText}
            onPortionWeightFocus={handlePortionWeightFocus}
            onPortionWeightBlur={handlePortionWeightBlur}
            onPortionWeightTooltipOpenChange={setPortionWeightTooltipOpen}
            onPortionWeightLabelTooltipOpenChange={setPortionWeightLabelTooltipOpen}
            onCategoryChange={handleCategoryChange}
            onSubcategoryChange={(value) =>
              setRecipe((prev) => ({ ...prev, subcategoryId: value, updatedAt: new Date() }))
            }
            onSave={() => handleSave({ redirect: true })}
            saveDisabled={(!hasChanges && !forceSaveOnEntry) || ingredients.length === 0}
            isSaving={recipeSaving}
            categoryOptions={categoryOptions}
            subcategoryOptionsByCategory={subcategoryOptionsByCategory}
            vatOptions={vatOptions}
          />
        </div>
      </div>
    </div>
  )
}
