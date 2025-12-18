import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  Copy,
  Download,
  FileDown,
  Info,
  Pencil,
  Plus,
  ReceiptText,
  ShoppingBasket,
  Trash2,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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

const ingredientTypeLabel = (type: IngredientType) => {
  switch (type) {
    case "ARTICLE":
      return "Produit"
    case "SUBRECIPE":
      return "Sous-recette"
    case "FIXED":
      return "Coût fixe"
  }
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
  },
}

const mockIngredientsByRecipe: Record<string, Ingredient[]> = {
  "r-1": [
    { id: "ing-1", type: "SUBRECIPE", name: "Pâte à tarte", quantity: 1, unit: "portion", unitCost: 0.2, subRecipeId: "r-3" },
    { id: "ing-2", type: "ARTICLE", name: "PRALINE CONCASSEE ST 1 KG", quantity: 0.1, unit: "ST", unitCost: 4.03, supplierId: "sup-metro", productId: "prod-praline", wastePercent: 0 },
    { id: "ing-3", type: "ARTICLE", name: "OEUF ALV. MOY. 53/63G X180", quantity: 0.45, unit: "PC", unitCost: 0.22, supplierId: "sup-metro", productId: "prod-egg", wastePercent: 0 },
    { id: "ing-4", type: "ARTICLE", name: "CREME 30%MG UHT 1L X12", quantity: 0.028, unit: "L", unitCost: 3.89, supplierId: "sup-metro", productId: "prod-cream", wastePercent: 0 },
    { id: "ing-5", type: "ARTICLE", name: "CREME S/PRESS. UHT DEBIC...", quantity: 0.03, unit: "PC", unitCost: 6.73, supplierId: "sup-transgourmet", productId: "prod-cream-press", wastePercent: 0 },
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

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [duplicateName, setDuplicateName] = useState("")
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(recipe.name)

  const [downloadOpen, setDownloadOpen] = useState(false)
  const [downloadInstructions, setDownloadInstructions] = useState("")
  const [downloadShowFinancial, setDownloadShowFinancial] = useState(true)

  const [portionsText, setPortionsText] = useState(() => String(initialRecipe.portions ?? 1))
  const [portionWeightText, setPortionWeightText] = useState(() =>
    initialRecipe.portionWeightGrams === null ? "" : String(initialRecipe.portionWeightGrams)
  )
  const [priceInclTaxText, setPriceInclTaxText] = useState(() =>
    initialRecipe.priceInclTax === null ? "" : String(initialRecipe.priceInclTax)
  )

  const [priceTtcFocused, setPriceTtcFocused] = useState(false)
  const [portionsFocused, setPortionsFocused] = useState(false)
  const [portionWeightFocused, setPortionWeightFocused] = useState(false)

  const [priceTtcTooltipOpen, setPriceTtcTooltipOpen] = useState(false)
  const [priceTtcLabelTooltipOpen, setPriceTtcLabelTooltipOpen] = useState(false)
  const [portionsTooltipOpen, setPortionsTooltipOpen] = useState(false)
  const [portionsLabelTooltipOpen, setPortionsLabelTooltipOpen] = useState(false)
  const [portionWeightTooltipOpen, setPortionWeightTooltipOpen] = useState(false)
  const [portionWeightLabelTooltipOpen, setPortionWeightLabelTooltipOpen] = useState(false)

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

  useEffect(() => {
    setPortionsText(String(recipe.portions ?? 1))
    setPortionWeightText(recipe.portionWeightGrams === null ? "" : String(recipe.portionWeightGrams))
    setPriceInclTaxText(recipe.priceInclTax === null ? "" : String(recipe.priceInclTax))
  }, [recipe.id])

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
      return { ...item, cost }
    })
  }, [ingredients])

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
    return Object.values(mockRecipes).filter((item) => item.id !== recipe.id)
  }, [recipe.id])

  const editorSubcategoryOptions = useMemo(() => {
    if (ingredientDraft.type !== "SUBRECIPE") return []
    return subcategoryOptionsByCategory[ingredientDraft.categoryId] ?? []
  }, [ingredientDraft])

  const editorSubRecipeOptions = useMemo(() => {
    if (ingredientDraft.type !== "SUBRECIPE") return []
    return availableSubRecipes.filter(
      (item) =>
        item.categoryId === ingredientDraft.categoryId &&
        item.subcategoryId === ingredientDraft.subcategoryId
    )
  }, [availableSubRecipes, ingredientDraft])

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
        categoryId: recipe.categoryId,
        subcategoryId: recipe.subcategoryId,
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
      const subRecipe = subId ? mockRecipes[subId] : undefined
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

  const handleDeleteIngredient = () => {
    if (!editingIngredientId) return
    setIngredients((prev) => prev.filter((item) => item.id !== editingIngredientId))
    setIngredientEditorOpen(false)
    toast.message("Ingrédient supprimé.")
  }

  const handleSaveIngredient = () => {
    const upsert = (next: Ingredient) => {
      setIngredients((prev) => {
        if (ingredientEditorMode === "edit" && editingIngredientId) {
          return prev.map((item) => (item.id === editingIngredientId ? next : item))
        }
        return [...prev, next]
      })
      setIngredientEditorOpen(false)
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
      if (portionsUsed <= 0) {
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
    if (next) {
      toast.success(
        <>
          Recette <span className="font-semibold">{name}</span> activée
        </>
      )
      return
    }
    toast.message(
      <>
        Recette <span className="font-semibold">{name}</span> désactivée
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
    if (next) {
      toast.success(
        <>
          Recette <span className="font-semibold">{name}</span> vendable
        </>
      )
      return
    }
    toast.message(
      <>
        Recette <span className="font-semibold">{name}</span> non vendable
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

  const confirmDownload = () => {
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
    <div className="space-y-6">
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
          <div className="space-y-3">
            <Label htmlFor="download-instructions" className="text-base">
              Instructions de la recette
            </Label>
            <Textarea
              id="download-instructions"
              value={downloadInstructions}
              onChange={(e) => setDownloadInstructions(e.target.value)}
              placeholder="Ajoutez des instructions…"
              className="min-h-48"
            />
          </div>
          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={downloadShowFinancial}
                onCheckedChange={(checked) => setDownloadShowFinancial(checked === true)}
                id="download-financial"
              />
              <Label htmlFor="download-financial" className="font-normal">
                Afficher les données financières
              </Label>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setDownloadOpen(false)} className="gap-2">
                <X className="h-4 w-4" />
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
          if (!open) setEditingIngredientId(null)
        }}
      >
        <SheetContent side="right" className="sm:max-w-xl">
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fournisseur</Label>
                    <Select
                      value={ingredientDraft.supplierId}
                      onValueChange={(value) =>
                        setIngredientDraft((prev) =>
                          prev.type === "ARTICLE"
                            ? { ...prev, supplierId: value, productId: "" }
                            : prev
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un fournisseur" />
                      </SelectTrigger>
                      <SelectContent>
                        {supplierOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Produit</Label>
                    <Select
                      value={ingredientDraft.productId}
                      onValueChange={(value) =>
                        setIngredientDraft((prev) =>
                          prev.type === "ARTICLE" ? { ...prev, productId: value } : prev
                        )
                      }
                      disabled={!ingredientDraft.supplierId}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            ingredientDraft.supplierId
                              ? "Sélectionnez un produit"
                              : "Choisissez d’abord un fournisseur"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {editorArticleProducts.length ? (
                          editorArticleProducts.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.label}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="__empty__" disabled>
                            Aucun produit disponible
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Quantité</Label>
                    <Input
                      value={ingredientDraft.quantity}
                      inputMode="decimal"
                      onChange={(e) =>
                        setIngredientDraft((prev) =>
                          prev.type === "ARTICLE" ? { ...prev, quantity: e.target.value } : prev
                        )
                      }
                      placeholder="—"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Perte (%)</Label>
                      <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <Input
                      value={ingredientDraft.wastePercent}
                      inputMode="decimal"
                      onChange={(e) =>
                        setIngredientDraft((prev) =>
                          prev.type === "ARTICLE" ? { ...prev, wastePercent: e.target.value } : prev
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Coût unitaire</span>
                    <Badge variant="outline" className="border-sky-100 bg-sky-50 text-sky-700">
                      {editorSelectedProduct ? formatCurrency(editorSelectedProduct.unitCost) : "—"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Coût net</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" variant="outline">
                      {formatCurrency(
                        parseNumber(ingredientDraft.quantity) *
                          (editorSelectedProduct?.unitCost ?? 0) *
                          (1 + parseNumber(ingredientDraft.wastePercent) / 100)
                      )}
                    </Badge>
                  </div>
                </div>
              </>
            ) : null}

            {ingredientDraft.type === "SUBRECIPE" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select
                      value={ingredientDraft.categoryId}
                      onValueChange={(value) => {
                        const nextSub =
                          subcategoryOptionsByCategory[value]?.[0]?.id ?? ingredientDraft.subcategoryId
                        setIngredientDraft((prev) =>
                          prev.type === "SUBRECIPE"
                            ? { ...prev, categoryId: value, subcategoryId: nextSub, recipeId: "" }
                            : prev
                        )
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
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
                  <div className="space-y-2">
                    <Label>Sous-catégorie</Label>
                    <Select
                      value={ingredientDraft.subcategoryId}
                      onValueChange={(value) =>
                        setIngredientDraft((prev) =>
                          prev.type === "SUBRECIPE" ? { ...prev, subcategoryId: value, recipeId: "" } : prev
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une sous-catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {editorSubcategoryOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nom recette</Label>
                    <Select
                      value={ingredientDraft.recipeId}
                      onValueChange={(value) =>
                        setIngredientDraft((prev) =>
                          prev.type === "SUBRECIPE" ? { ...prev, recipeId: value } : prev
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisissez une recette" />
                      </SelectTrigger>
                      <SelectContent>
                        {editorSubRecipeOptions.length ? (
                          editorSubRecipeOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="__empty__" disabled>
                            Aucune recette disponible
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 items-end">
                  <div className="space-y-2">
                    <Label>Nombre portion</Label>
                    <Input
                      value={ingredientDraft.portionsUsed}
                      inputMode="decimal"
                      onChange={(e) =>
                        setIngredientDraft((prev) =>
                          prev.type === "SUBRECIPE" ? { ...prev, portionsUsed: e.target.value } : prev
                        )
                      }
                      placeholder="1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Coût portion</span>
                    <Badge variant="outline" className="border-sky-100 bg-sky-50 text-sky-700">
                      {ingredientDraft.recipeId
                        ? formatCurrency(
                            (() => {
                              const selected = mockRecipes[ingredientDraft.recipeId]
                              const list = mockIngredientsByRecipe[ingredientDraft.recipeId] ?? []
                              const total = list.reduce((sum, item) => {
                                const wasteMultiplier = 1 + Math.max(0, item.wastePercent ?? 0) / 100
                                return sum + Math.max(0, item.quantity) * Math.max(0, item.unitCost) * wasteMultiplier
                              }, 0)
                              return total / Math.max(1, selected.portions || 1)
                            })()
                          )
                        : "—"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Coût net</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" variant="outline">
                      {ingredientDraft.recipeId
                        ? formatCurrency(
                            (() => {
                              const selected = mockRecipes[ingredientDraft.recipeId]
                              const list = mockIngredientsByRecipe[ingredientDraft.recipeId] ?? []
                              const total = list.reduce((sum, item) => {
                                const wasteMultiplier = 1 + Math.max(0, item.wastePercent ?? 0) / 100
                                return sum + Math.max(0, item.quantity) * Math.max(0, item.unitCost) * wasteMultiplier
                              }, 0)
                              const perPortion = total / Math.max(1, selected.portions || 1)
                              return perPortion * parseNumber(ingredientDraft.portionsUsed)
                            })()
                          )
                        : formatCurrency(0)}
                    </Badge>
                  </div>
                </div>
              </>
            ) : null}

            {ingredientDraft.type === "FIXED" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
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
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label>Prix net</Label>
                    <div className="h-9 flex items-center">
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" variant="outline">
                        {formatCurrency(parseNumber(ingredientDraft.fixedCost))}
                      </Badge>
                    </div>
                  </div>
                </div>
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
                <Button variant="secondary" onClick={() => setIngredientEditorOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveIngredient}>Enregistrer</Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="h-10 w-10">
          <Link to="/dashboard/recipes">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Retour</span>
          </Link>
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
          <Button variant="secondary" className="gap-2" onClick={openDuplicate}>
            <Copy className="h-4 w-4" />
            Dupliquer
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={openDownload}
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
          <Card className="shadow-sm">
            <CardHeader className="p-6 pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>Ingrédients</CardTitle>
                    <Badge variant="secondary">{ingredients.length}</Badge>
                  </div>
                  <CardDescription>
                    Ajoutez des produits, des sous-recettes ou des charges fixes.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => openCreateIngredient("ARTICLE")}
                  >
                    <ShoppingBasket className="h-4 w-4" />
                    Ajouter un produit
                  </Button>
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => openCreateIngredient("SUBRECIPE")}
                  >
                    <ReceiptText className="h-4 w-4" />
                    Ajouter une recette
                  </Button>
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => openCreateIngredient("FIXED")}
                  >
                    <Plus className="h-4 w-4" />
                    Autre
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="overflow-hidden rounded-md border">
                <ScrollArea className={ingredients.length > 8 ? "h-[392px]" : undefined}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-3 text-left">Ingrédient</TableHead>
                        <TableHead className="w-40 text-left">Quantité</TableHead>
                        <TableHead className="w-32 text-left">Coût</TableHead>
                        <TableHead className="w-12 pr-3 text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingredientRows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer"
                          onClick={() => openEditIngredient(row.id)}
                        >
                          <TableCell className="pl-3 pr-3">
                            <div className="space-y-1">
                              <p className="font-medium leading-tight">{row.name}</p>
                              <p className="text-xs text-muted-foreground">{ingredientTypeLabel(row.type)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="text-sm text-primary">
                              {row.quantity.toLocaleString("fr-FR", { maximumFractionDigits: 3 })}{" "}
                              {row.unit}
                            </span>
                          </TableCell>
                          <TableCell className="text-left whitespace-nowrap">
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" variant="outline">
                              {formatCurrency(row.cost)}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-3 text-right">
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

              <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Coût/portion :</span>
                  <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">
                    {formatCurrency(purchaseCostPerPortion)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Coût total :</span>
                  <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">
                    {formatCurrency(purchaseCostTotal)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Card className="shadow-sm">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Paramètres</CardTitle>
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
                              {formatCurrency(recipe.recommendedRetailPrice)}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap">
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
                                <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap">
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
                          <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap">
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
                            <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap">
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
                      <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap">
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
                            <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap">
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
                      <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap">
                        Poids d’une portion (en grammes). Optionnel, utile pour vos fiches techniques.
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {recipe.saleable ? (
                    <div className="rounded-md border bg-muted/30 px-4 py-3">
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
              <Button className="w-full" size="lg" onClick={handleSave}>
                Enregistrer les paramètres
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
