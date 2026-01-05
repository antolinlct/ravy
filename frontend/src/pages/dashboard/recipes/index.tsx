import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { buttonVariants, Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Info, Loader2 } from "lucide-react"
import { useEstablishment } from "@/context/EstablishmentContext"
import { RecipesPageHeader } from "./components/RecipesPageHeader"
import { RecipeCreationCard } from "./components/RecipeCreationCard"
import { RecipesListCard } from "./components/RecipesListCard"
import {
  createRecipe,
  deleteRecipe,
  duplicateRecipe,
  fetchIngredients,
  fetchRecipeCategories,
  fetchRecipeSubcategories,
  fetchRecipes,
  fetchVatRates,
  clearIngredientsCache,
  getCachedRecipes,
  removeCachedRecipe,
  recomputeRecipe,
  updateRecipe,
  type ApiRecipe,
  type ApiVatRate,
} from "./api"
import type { RecipeListCategoryOption, RecipeListItem } from "./types"
import { getUniqueRecipeName, toRecipeDetail } from "./utils"

const parseCurrency = (value: string | null | undefined) => {
  if (!value) return null
  const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".")
  const num = parseFloat(normalized)
  return Number.isFinite(num) ? num : null
}

const formatCurrencyValue = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return "--"
  const numeric = typeof value === "string" ? Number(value) : value
  if (!Number.isFinite(numeric)) return "--"
  return numeric.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
}

const formatPercentValue = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return null
  const numeric = typeof value === "string" ? Number(value) : value
  if (!Number.isFinite(numeric)) return null
  return `${numeric.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

const parseDateValue = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export default function RecipesPage() {
  const navigate = useNavigate()
  const { estId } = useEstablishment()
  const [defaultVatId, setDefaultVatId] = useState<string | null>(null)

  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [recipesById, setRecipesById] = useState<Record<string, ApiRecipe>>({})
  const visibleRecipes = recipes

  const [recipeName, setRecipeName] = useState("")
  const [recipeCategory, setRecipeCategory] = useState<string | undefined>()
  const [recipeSubCategory, setRecipeSubCategory] = useState<string | undefined>()
  const [createAttempted, setCreateAttempted] = useState(false)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const categoryTriggerRef = useRef<HTMLButtonElement | null>(null)
  const subCategoryTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [activeById, setActiveById] = useState<Record<string, boolean>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recipeToDelete, setRecipeToDelete] = useState<RecipeListItem | null>(null)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [recipeToDuplicate, setRecipeToDuplicate] = useState<RecipeListItem | null>(null)
  const [duplicateName, setDuplicateName] = useState("")
  const [duplicateSaving, setDuplicateSaving] = useState(false)
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [listCategory, setListCategory] = useState<string>("__all__")
  const [listSubCategory, setListSubCategory] = useState<string>("__all__")
  const [recipeSearchOpen, setRecipeSearchOpen] = useState(false)
  const [recipeSearchValue, setRecipeSearchValue] = useState("")
  const [sortKey, setSortKey] = useState<
    "updatedAt" | "name" | "margin" | "portionCost" | "salePrice"
  >("updatedAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [categoryOptions, setCategoryOptions] = useState<RecipeListCategoryOption[]>([])
  const [subCategoryOptions, setSubCategoryOptions] = useState<RecipeListCategoryOption[]>([])

  const activeRecipesCount = useMemo(
    () => recipes.filter((recipe) => recipe.status === "Active").length,
    [recipes]
  )
  const creationProgress = useMemo(() => {
    if (!recipes.length) return 0
    return Math.round((activeRecipesCount / recipes.length) * 100)
  }, [activeRecipesCount, recipes.length])
  const recipesRemaining = useMemo(
    () => Math.max(0, recipes.length - activeRecipesCount),
    [activeRecipesCount, recipes.length]
  )

  const filterSubCategoryOptions = useMemo(() => {
    if (listCategory === "__all__") return []
    return subCategoryOptions.filter((option) => option.categoryId === listCategory)
  }, [listCategory, subCategoryOptions])

  const creationSubCategoryOptions = useMemo(() => {
    if (!recipeCategory) return []
    return subCategoryOptions.filter((option) => option.categoryId === recipeCategory)
  }, [recipeCategory, subCategoryOptions])

  const recipesByCategoryAndSub = useMemo(() => {
    const effectiveCategory = listCategory === "__all__" ? undefined : listCategory
    const effectiveSubCategory = listSubCategory === "__all__" ? undefined : listSubCategory

    return visibleRecipes.filter((recipe) => {
      const inCategory = !effectiveCategory || recipe.category === effectiveCategory
      const inSub = !effectiveSubCategory || recipe.subCategory === effectiveSubCategory
      return inCategory && inSub
    })
  }, [listCategory, listSubCategory, visibleRecipes])

  const filteredRecipes = useMemo(() => {
    if (!recipeSearchValue) return recipesByCategoryAndSub
    return recipesByCategoryAndSub.filter((recipe) => recipe.id === recipeSearchValue)
  }, [recipeSearchValue, recipesByCategoryAndSub])

  const sortedRecipes = useMemo(() => {
    const toValue = (recipe: RecipeListItem) => {
      if (sortKey === "updatedAt") return recipe.updatedAt?.getTime() ?? null
      if (sortKey === "name") return recipe.name?.toLowerCase() ?? ""
      if (sortKey === "margin") return recipe.marginValue ?? null
      if (sortKey === "portionCost") return parseCurrency(recipe.portionCost)
      if (sortKey === "salePrice") return parseCurrency(recipe.salePrice)
      return null
    }
    const comparator = (a: RecipeListItem, b: RecipeListItem) => {
      const av = toValue(a)
      const bv = toValue(b)
      if (av === null && bv === null) return 0
      if (av === null) return 1
      if (bv === null) return -1
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    }
    return [...filteredRecipes].sort(comparator)
  }, [filteredRecipes, sortDir, sortKey])

  const shouldScrollRecipes = sortedRecipes.length > 8

  const canCreateRecipe = useMemo(() => {
    return Boolean(recipeName.trim()) && Boolean(recipeCategory) && Boolean(recipeSubCategory)
  }, [recipeCategory, recipeName, recipeSubCategory])

  const averageMargin = useMemo(() => {
    const margins = filteredRecipes
      .map((item) => item.marginValue)
      .filter((value): value is number => typeof value === "number")
    if (!margins.length) return "—"
    const avg = margins.reduce((sum, value) => sum + value, 0) / margins.length
    return `${avg.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
  }, [filteredRecipes])

  const handleToggleActive = (recipeId: string, active: boolean) => {
    if (!estId) return
    const previous = activeById[recipeId]
    setActiveById((prev) => ({ ...prev, [recipeId]: active }))
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId ? { ...recipe, status: active ? "Active" : "Brouillon" } : recipe
      )
    )

    updateRecipe(recipeId, { active })
      .then(() => recomputeRecipe({ recipe_id: recipeId, establishment_id: estId }))
      .catch(() => {
        setActiveById((prev) => ({ ...prev, [recipeId]: previous }))
        setRecipes((prev) =>
          prev.map((recipe) =>
            recipe.id === recipeId
              ? { ...recipe, status: previous ? "Active" : "Brouillon" }
              : recipe
          )
        )
        toast.error("Impossible de mettre à jour la recette.")
      })
  }

  const handleDuplicateOpen = (recipe: RecipeListItem) => {
    const cached = estId ? getCachedRecipes(estId) : null
    const existingNames = cached?.map((item) => item.name) ?? recipes.map((item) => item.name)
    setRecipeToDuplicate(recipe)
    setDuplicateName(getUniqueRecipeName(`Copie de ${recipe.name}`, existingNames))
    setDuplicateDialogOpen(true)
  }

  const handleDuplicateConfirm = () => {
    if (!recipeToDuplicate || !estId) return
    if (duplicateSaving) return
    const nextName = duplicateName.trim()
    if (!nextName) {
      toast.error("Le nom de la recette est requis.")
      return
    }

    setDuplicateSaving(true)
    const existingNames = recipes
      .filter((recipe) => recipe.id !== recipeToDuplicate.id)
      .map((recipe) => recipe.name)
    const resolvedName = getUniqueRecipeName(nextName, existingNames)
    if (resolvedName !== nextName) {
      setDuplicateName(resolvedName)
      toast(`Nom déjà utilisé, renommé en "${resolvedName}".`)
    }
    duplicateRecipe({
      recipe_id: recipeToDuplicate.id,
      establishment_id: estId,
      new_name: resolvedName,
    })
      .then(() => {
        setDuplicateDialogOpen(false)
        toast.success(
          <>
            Recette <span className="font-semibold">{resolvedName}</span> dupliquée
          </>
        )
        loadRecipes(false)
      })
      .catch(() => {
        toast.error("Impossible de dupliquer la recette.")
      })
      .finally(() => {
        setDuplicateSaving(false)
      })
  }

  const handleDeleteOpen = (recipe: RecipeListItem) => {
    setRecipeToDelete(recipe)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!recipeToDelete || !estId) return
    if (deleteSaving) return
    const deletedId = recipeToDelete.id
    const deletedName = recipeToDelete.name

    setDeleteSaving(true)
    deleteRecipe({
      recipe_id: deletedId,
      establishment_id: estId,
    })
      .then((result) => {
        setDeleteDialogOpen(false)
        const deletedIds = new Set<string>(result?.deleted_recipes ?? [deletedId])
        if (recipeSearchValue && deletedIds.has(recipeSearchValue)) setRecipeSearchValue("")
        deletedIds.forEach((id) => removeCachedRecipe(estId, id))
        clearIngredientsCache(estId)
        setRecipes((prev) => prev.filter((recipe) => !deletedIds.has(recipe.id)))
        setRecipesById((prev) => {
          const next = { ...prev }
          deletedIds.forEach((id) => {
            delete next[id]
          })
          return next
        })
        setActiveById((prev) => {
          const next = { ...prev }
          deletedIds.forEach((id) => {
            delete next[id]
          })
          return next
        })
        toast.success(
          <>
            Recette <span className="font-semibold">{deletedName}</span> supprimée
          </>
        )
      })
      .catch(() => {
        toast.error("Impossible de supprimer la recette.")
      })
      .finally(() => {
        setDeleteSaving(false)
      })
  }

  const handleRowNavigate = (recipeId: string) => {
    const cached = recipesById[recipeId]
    navigate(`/dashboard/recipes/${recipeId}`, {
      state: {
        recipeId,
        recipe: cached ? toRecipeDetail(cached) : undefined,
      },
    })
  }

  const toggleSort = (key: typeof sortKey) => {
    const nextDir = sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "desc"
    setSortKey(key)
    setSortDir(nextDir)
  }

  const loadRecipes = useCallback(async (useCache = true) => {
    if (!estId) return
    try {
      const [recipesData, ingredientsData, categoriesData, subcategoriesData, vatRatesData] = await Promise.all([
        fetchRecipes(estId, { useCache }),
        fetchIngredients(estId, undefined, { useCache }),
        fetchRecipeCategories(),
        fetchRecipeSubcategories(),
        fetchVatRates(),
      ])

      const vatTarget = vatRatesData.find((rate: ApiVatRate) => {
        const value = Number(rate.percentage_rate)
        if (!Number.isFinite(value)) return false
        return Math.abs(value - 0.1) < 0.0001 || Math.abs(value - 10) < 0.0001
      })
      setDefaultVatId(vatTarget?.id ?? vatRatesData[0]?.id ?? null)

      const nextCategoryOptions = categoriesData
        .map((cat) => ({
          value: cat.id,
          label: cat.name ?? "Sans nom",
        }))
      const nextSubCategoryOptions = subcategoriesData
        .map((sub) => ({
          value: sub.id,
          label: sub.name ?? "Sans nom",
          categoryId: sub.category_id ?? "",
        }))

      const ingredientsCountMap = ingredientsData.reduce<Record<string, number>>((acc, item) => {
        if (!item.recipe_id) return acc
        acc[item.recipe_id] = (acc[item.recipe_id] ?? 0) + 1
        return acc
      }, {})

      const nextRecipes = recipesData.map<RecipeListItem>((recipe) => {
        const marginValue = Number.isFinite(Number(recipe.current_margin))
          ? Number(recipe.current_margin)
          : null
        const margin = formatPercentValue(marginValue)
        const price = recipe.saleable ? formatCurrencyValue(recipe.price_incl_tax ?? null) : null
        const updatedAt = parseDateValue(recipe.updated_at) ?? parseDateValue(recipe.created_at)

        const ingredientsCount = ingredientsCountMap[recipe.id] ?? 0
        return {
          id: recipe.id,
          name: recipe.name ?? "Recette sans nom",
          ingredientsLabel: `${ingredientsCount} ingrédient${ingredientsCount > 1 ? "s" : ""}`,
          status: recipe.active ? "Active" : "Brouillon",
          category: recipe.category_id ?? "",
          subCategory: recipe.subcategory_id ?? "",
          portionCost: formatCurrencyValue(recipe.purchase_cost_per_portion ?? null),
          salePrice: price,
          margin,
          marginValue,
          updatedAt,
        }
      })

      setCategoryOptions(nextCategoryOptions)
      setSubCategoryOptions(nextSubCategoryOptions)
      setRecipes(nextRecipes)
      setRecipesById(Object.fromEntries(recipesData.map((recipe) => [recipe.id, recipe])))
      setActiveById(
        Object.fromEntries(nextRecipes.map((recipe) => [recipe.id, recipe.status === "Active"]))
      )
    } catch {
      toast.error("Impossible de charger vos recettes.")
    }
  }, [estId])

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  const handleCreateAttempt = () => {
    setCreateAttempted(true)

    if (!canCreateRecipe) {
      if (!recipeName.trim()) {
        nameInputRef.current?.focus()
      } else if (!recipeCategory) {
        categoryTriggerRef.current?.focus()
      } else if (!recipeSubCategory) {
        subCategoryTriggerRef.current?.focus()
      }
      return
    }

    if (!estId) {
      toast.error("Sélectionnez un établissement avant de créer une recette.")
      return
    }

    createRecipe({
      establishment_id: estId,
      name: recipeName.trim(),
      category_id: recipeCategory,
      subcategory_id: recipeSubCategory,
      active: false,
      saleable: true,
      contains_sub_recipe: false,
      vat_id: defaultVatId ?? undefined,
      portion: 1,
    })
      .then((created) => {
        toast.success("Recette créée.")
        setRecipeName("")
        setRecipeCategory(undefined)
        setRecipeSubCategory(undefined)
        setCreateAttempted(false)
        navigate(`/dashboard/recipes/${created.id}`, {
          state: {
            recipeId: created.id,
            recipe: toRecipeDetail(created),
            forceSaveOnEntry: true,
          },
        })
      })
      .catch(() => {
        toast.error("Impossible de créer la recette.")
      })
  }

  return (
    <div className="flex w-full items-start justify-start">
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) {
            setRecipeToDelete(null)
            setDeleteSaving(false)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la recette</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Voulez-vous supprimer{" "}
              <span className="font-semibold">{recipeToDelete?.name}</span> ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className={buttonVariants({ variant: "destructive" })}
              disabled={deleteSaving}
            >
              {deleteSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={duplicateDialogOpen}
        onOpenChange={(open) => {
          setDuplicateDialogOpen(open)
          if (!open) {
            setRecipeToDuplicate(null)
            setDuplicateName("")
            setDuplicateSaving(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dupliquer la recette</DialogTitle>
            <DialogDescription>
              Choisissez le nom de la nouvelle recette créée à partir de{" "}
              <span className="font-semibold">{recipeToDuplicate?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="duplicate-recipe-name">Nom</Label>
            <Input
              id="duplicate-recipe-name"
              value={duplicateName}
              onChange={(event) => setDuplicateName(event.target.value)}
              placeholder="Nom de la recette"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDuplicateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleDuplicateConfirm}
              disabled={!duplicateName.trim() || duplicateSaving}
            >
              {duplicateSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Duplication...
                </>
              ) : (
                "Dupliquer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="w-full space-y-4">
        <RecipesPageHeader />

        <RecipeCreationCard
          creationProgress={creationProgress}
          recipesRemaining={recipesRemaining}
          recipeName={recipeName}
          onRecipeNameChange={setRecipeName}
          recipeCategory={recipeCategory}
          onRecipeCategoryChange={setRecipeCategory}
          recipeSubCategory={recipeSubCategory}
          onRecipeSubCategoryChange={setRecipeSubCategory}
          categoryOptions={categoryOptions}
          subCategoryOptions={creationSubCategoryOptions}
          createAttempted={createAttempted}
          canCreateRecipe={canCreateRecipe}
          onCreateAttempt={handleCreateAttempt}
          nameInputRef={nameInputRef}
          categoryTriggerRef={categoryTriggerRef}
          subCategoryTriggerRef={subCategoryTriggerRef}
        />

        <RecipesListCard
          categoryOptions={categoryOptions}
          filterSubCategoryOptions={filterSubCategoryOptions}
          listCategory={listCategory}
          listSubCategory={listSubCategory}
          onListCategoryChange={(value) => {
            if (value === "__all__") {
              setListCategory("__all__")
              setListSubCategory("__all__")
              return
            }
            setListCategory(value)
            setListSubCategory("__all__")
            setRecipeSearchValue("")
          }}
          onListSubCategoryChange={(value) => {
            if (value === "__all__") {
              setListSubCategory("__all__")
              return
            }
            setListSubCategory(value)
            setRecipeSearchValue("")
          }}
          recipeSearchOpen={recipeSearchOpen}
          onRecipeSearchOpenChange={setRecipeSearchOpen}
          recipeSearchValue={recipeSearchValue}
          onRecipeSearchValueChange={setRecipeSearchValue}
          recipesByCategoryAndSub={recipesByCategoryAndSub}
          averageMargin={averageMargin}
          sortedRecipes={sortedRecipes}
          filteredRecipesCount={filteredRecipes.length}
          activeById={activeById}
          sortKey={sortKey}
          sortDir={sortDir}
          onToggleSort={toggleSort}
          onToggleActive={(recipeId, active) => {
            handleToggleActive(recipeId, active)
            const selected = recipes.find((item) => item.id === recipeId)
            if (!selected) return
            if (active) {
              toast.success(
                <>
                  Recette <span className="font-semibold">{selected.name}</span> activée
                </>
              )
            } else {
              toast.message(
                <>
                  Recette <span className="font-semibold">{selected.name}</span> désactivée
                </>,
                { icon: <Info className="h-4 w-4 text-muted-foreground" /> }
              )
            }
          }}
          onRowNavigate={handleRowNavigate}
          onDuplicate={handleDuplicateOpen}
          onDelete={handleDeleteOpen}
          shouldScrollRecipes={shouldScrollRecipes}
        />
      </div>
    </div>
  )
}
