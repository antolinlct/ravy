import { useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChefHat,
  CircleCheck,
  CircleHelp,
  ChevronsUpDown,
  Check,
  Copy,
  CircleX,
  EllipsisVertical,
  Eye,
  Info,
  PlusCircle,
  Trash2,
} from "lucide-react"

type RecipeStatus = "Active" | "Brouillon"

type Recipe = {
  id: string
  name: string
  ingredientsLabel: string
  status: RecipeStatus
  category: string
  subCategory: string
  portionCost: string
  salePrice: string | null
  margin: string | null
  marginValue: number | null
}

const initialRecipes: Recipe[] = [
  {
    id: "r-1",
    name: "Tarte pralines",
    ingredientsLabel: "5 ingrédients",
    status: "Active",
    category: "desserts",
    subCategory: "sucre",
    portionCost: "0,13 €",
    salePrice: "8,00 €",
    margin: "98,26%",
    marginValue: 98.26,
  },
  {
    id: "r-2",
    name: "Salade Lyonnaise XL",
    ingredientsLabel: "7 ingrédients",
    status: "Brouillon",
    category: "plats",
    subCategory: "sale",
    portionCost: "2,57 €",
    salePrice: "13,90 €",
    margin: "79,65%",
    marginValue: 79.65,
  },
  {
    id: "r-3",
    name: "Pâte à tarte",
    ingredientsLabel: "4 ingrédients",
    status: "Brouillon",
    category: "desserts",
    subCategory: "sucre",
    portionCost: "0,20 €",
    salePrice: null as string | null,
    margin: null as string | null,
    marginValue: null as number | null,
  },
  {
    id: "r-4",
    name: "Tarte citron",
    ingredientsLabel: "9 ingrédients",
    status: "Active",
    category: "desserts",
    subCategory: "sucre",
    portionCost: "1,01 €",
    salePrice: "8,00 €",
    margin: "86,14%",
    marginValue: 86.14,
  },
  {
    id: "r-5",
    name: "Brownie chocolat",
    ingredientsLabel: "6 ingrédients",
    status: "Active",
    category: "desserts",
    subCategory: "sucre",
    portionCost: "0,85 €",
    salePrice: "6,50 €",
    margin: "86,92%",
    marginValue: 86.92,
  },
]

const categoryOptions = [
  { value: "entrees", label: "Entrées" },
  { value: "plats", label: "Plats" },
  { value: "desserts", label: "Desserts" },
  { value: "boissons", label: "Boissons" },
] as const

const subCategoryOptions = [
  { value: "sale", label: "Salé" },
  { value: "sucre", label: "Sucré" },
  { value: "vegetarien", label: "Végétarien" },
  { value: "sans-alcool", label: "Sans alcool" },
] as const

const filterSubCategoryByCategory: Record<
  (typeof categoryOptions)[number]["value"],
  { value: string; label: string }[]
> = {
  entrees: [
    { value: "sale", label: "Salé" },
    { value: "vegetarien", label: "Végétarien" },
  ],
  plats: [
    { value: "sale", label: "Salé" },
    { value: "vegetarien", label: "Végétarien" },
  ],
  desserts: [
    { value: "sucre", label: "Sucré" },
  ],
  boissons: [
    { value: "sans-alcool", label: "Sans alcool" },
  ],
}

export default function RecipesPage() {
  const navigate = useNavigate()
  const creationProgress = 24
  const recipesRemaining = 76

  const [recipes, setRecipes] = useState<Recipe[]>(() => [...initialRecipes])
  const visibleRecipes = recipes

  const [recipeName, setRecipeName] = useState("")
  const [recipeCategory, setRecipeCategory] = useState<string | undefined>()
  const [recipeSubCategory, setRecipeSubCategory] = useState<string | undefined>()
  const [createAttempted, setCreateAttempted] = useState(false)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const categoryTriggerRef = useRef<HTMLButtonElement | null>(null)
  const subCategoryTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [activeById, setActiveById] = useState<Record<string, boolean>>(() => {
    return Object.fromEntries(initialRecipes.map((recipe) => [recipe.id, recipe.status === "Active"]))
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [recipeToDuplicate, setRecipeToDuplicate] = useState<Recipe | null>(null)
  const [duplicateName, setDuplicateName] = useState("")
  const [listCategory, setListCategory] = useState<string>("__all__")
  const [listSubCategory, setListSubCategory] = useState<string>("__all__")
  const [recipeSearchOpen, setRecipeSearchOpen] = useState(false)
  const [recipeSearchValue, setRecipeSearchValue] = useState("")

  const filterSubCategoryOptions = useMemo(() => {
    if (listCategory === "__all__") return []
    return filterSubCategoryByCategory[listCategory as keyof typeof filterSubCategoryByCategory] ?? []
  }, [listCategory])

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

  const shouldScrollRecipes = filteredRecipes.length > 8

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

  const setRecipeActive = (recipeId: string, active: boolean) => {
    setActiveById((prev) => ({ ...prev, [recipeId]: active }))
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? { ...recipe, status: active ? "Active" : "Brouillon" }
          : recipe
      )
    )
  }

  const handleDuplicateOpen = (recipe: Recipe) => {
    setRecipeToDuplicate(recipe)
    setDuplicateName(`Copie de ${recipe.name}`)
    setDuplicateDialogOpen(true)
  }

  const handleDuplicateConfirm = () => {
    if (!recipeToDuplicate) return
    const nextName = duplicateName.trim()
    if (!nextName) {
      toast.error("Le nom de la recette est requis.")
      return
    }

    const newRecipe: Recipe = {
      ...recipeToDuplicate,
      id: `${recipeToDuplicate.id}-copy-${Date.now()}`,
      name: nextName,
      status: "Brouillon",
    }

    setRecipes((prev) => [newRecipe, ...prev])
    setActiveById((prev) => ({ ...prev, [newRecipe.id]: false }))
    setDuplicateDialogOpen(false)
    toast.success(
      <>
        Recette <span className="font-semibold">{nextName}</span> dupliquée
      </>
    )
  }

  const handleDeleteOpen = (recipe: Recipe) => {
    setRecipeToDelete(recipe)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!recipeToDelete) return
    const deletedId = recipeToDelete.id
    const deletedName = recipeToDelete.name

    setRecipes((prev) => prev.filter((recipe) => recipe.id !== deletedId))
    setActiveById((prev) => {
      const next = { ...prev }
      delete next[deletedId]
      return next
    })
    setDeleteDialogOpen(false)
    if (recipeSearchValue === deletedId) setRecipeSearchValue("")
    toast.success(
      <>
        Recette <span className="font-semibold">{deletedName}</span> supprimée
      </>
    )
  }

  const handleRowNavigate = (recipeId: string) => {
    navigate(`/dashboard/recipes/${recipeId}`, { state: { recipeId } })
  }

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
  }

  return (
    <div className="flex w-full items-start justify-start">
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setRecipeToDelete(null)
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
            >
              Supprimer
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
              onChange={(e) => setDuplicateName(e.target.value)}
              placeholder="Nom de la recette"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDuplicateDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleDuplicateConfirm}
              disabled={!duplicateName.trim()}
            >
              Dupliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="w-full space-y-4">
        <div className="space-y-1">
          <p className="text-2xl font-semibold">Recettes</p>
          <p className="text-muted-foreground">
            Cette section est dédiée à la création et à la gestion de vos recettes.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
              <div className="flex h-full flex-col items-center gap-4 text-center">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <div className="h-full w-full rounded-full border-[14px] border-muted" />
                  <div className="absolute text-xl font-semibold text-primary">
                    {creationProgress}%
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-primary">
                    {recipesRemaining} recettes restantes
                  </p>
                </div>
              </div>

              <div className="flex h-full flex-col gap-4">
                <div className="space-y-1">
                  <CardTitle>Créez une nouvelle recette</CardTitle>
                  <CardDescription>
                    Entrez le nom, la catégorie et la sous-catégorie de la recette que vous
                    souhaitez créer.
                  </CardDescription>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <Label htmlFor="recipe-name">Nom</Label>
                    <Input
                      id="recipe-name"
                      placeholder="Indiquez le nom de votre recette"
                      value={recipeName}
                      onChange={(e) => setRecipeName(e.target.value)}
                      ref={nameInputRef}
                      aria-invalid={createAttempted && !recipeName.trim()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select value={recipeCategory} onValueChange={setRecipeCategory}>
                      <SelectTrigger
                        ref={categoryTriggerRef}
                        aria-invalid={createAttempted && !recipeCategory}
                        className={createAttempted && !recipeCategory ? "border-destructive" : undefined}
                      >
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sous-catégorie</Label>
                    <Select value={recipeSubCategory} onValueChange={setRecipeSubCategory}>
                      <SelectTrigger
                        ref={subCategoryTriggerRef}
                        aria-invalid={createAttempted && !recipeSubCategory}
                        className={createAttempted && !recipeSubCategory ? "border-destructive" : undefined}
                      >
                        <SelectValue placeholder="Sélectionnez une sous-catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {subCategoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <span className="inline-flex" onClick={handleCreateAttempt}>
                    <Button className="gap-2" disabled={!canCreateRecipe}>
                      Créer une recette
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-6 pb-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <CardTitle>Recettes</CardTitle>
                <CardDescription>
                  Consultez et gérez ici l&apos;ensemble de vos recettes.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-2">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid w-full gap-4 sm:grid-cols-3 lg:max-w-3xl">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Catégorie</Label>
                  <Select
                    value={listCategory}
                    onValueChange={(value) => {
                      if (value === "__all__") {
                        setListCategory("__all__")
                        setListSubCategory("__all__")
                        return
                      }
                      setListCategory(value)
                      setListSubCategory("__all__")
                      setRecipeSearchValue("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="__all__"
                        className="text-muted-foreground focus:text-accent-foreground"
                      >
                        Toutes les catégories
                      </SelectItem>
                      {categoryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Sous-catégorie</Label>
                  <Select
                    value={listSubCategory}
                    onValueChange={(value) => {
                      if (value === "__all__") {
                        setListSubCategory("__all__")
                        return
                      }
                      setListSubCategory(value)
                      setRecipeSearchValue("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="__all__"
                        className="text-muted-foreground focus:text-accent-foreground"
                      >
                        Toutes les sous-catégories
                      </SelectItem>
                      {listCategory === "__all__" ? (
                        <SelectItem value="__none__" disabled>
                          Aucune sous-catégorie disponible
                        </SelectItem>
                      ) : (
                        filterSubCategoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Recette</Label>
                  <Popover open={recipeSearchOpen} onOpenChange={setRecipeSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={recipeSearchOpen}
                        className="w-full justify-between"
                      >
                        {recipeSearchValue
                          ? recipesByCategoryAndSub.find((recipe) => recipe.id === recipeSearchValue)?.name
                          : "Toutes les recettes"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Rechercher une recette..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>Aucune recette trouvée.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="__all__"
                              onSelect={() => {
                                setRecipeSearchValue("")
                                setRecipeSearchOpen(false)
                              }}
                              className="text-muted-foreground data-[selected=true]:text-accent-foreground"
                            >
                              Toutes les recettes
                              <Check
                                className={cn(
                                  "ml-auto",
                                  !recipeSearchValue ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                            {recipesByCategoryAndSub.map((recipe) => (
                              <CommandItem
                                key={recipe.id}
                                value={recipe.name}
                                onSelect={() => {
                                  setRecipeSearchValue(recipeSearchValue === recipe.id ? "" : recipe.id)
                                  setRecipeSearchOpen(false)
                                }}
                              >
                                {recipe.name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    recipeSearchValue === recipe.id ? "opacity-100" : "opacity-0"
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

              <div className="flex flex-col items-start gap-2 lg:items-end">
                <span className="text-xs font-medium text-muted-foreground">Marge moyenne</span>
                <span className="text-xl font-semibold self-end text-primary">
                  {averageMargin}
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-md border">
              {(() => {
                const table = (
                  <Table>
                    <TableHeader>
                      <TableRow className="pl-3">
                        <TableHead className="w-[45%] pl-3 text-left">Recette</TableHead>
                        <TableHead className="w-32 pr-3 text-left">Coût portion</TableHead>
                        <TableHead className="w-32 pr-3 text-left">Prix de vente</TableHead>
                        <TableHead className="w-28 pr-3 text-left">Marge</TableHead>
                        <TableHead className="w-24 pr-3 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <span>Active</span>
                            <HoverCard openDelay={0} closeDelay={0}>
                              <HoverCardTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Aide sur le statut Active"
                                  className="h-5 w-5 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                                >
                                  <CircleHelp className="h-4 w-4" />
                                </Button>
                              </HoverCardTrigger>
                              <HoverCardContent align="end" className="w-80 text-left">
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold">Statut de la recette</p>
                                  <Separator />
                                  <div className="space-y-3 text-sm text-muted-foreground">
                                    <div className="space-y-1">
                                      <p className="font-medium text-foreground">Active</p>
                                      <ul className="list-disc space-y-1 pl-4">
                                        <li>Recette disponible dans votre carte.</li>
                                        <li>Prise en compte dans l&apos;analyse, les marges et les moyennes.</li>
                                      </ul>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="font-medium text-foreground">Désactivée</p>
                                      <ul className="list-disc space-y-1 pl-4">
                                        <li>Recette en brouillon / non vendue actuellement.</li>
                                        <li>Exclue des analyses et des calculs (utile pour tester ou archiver).</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        </TableHead>
                        <TableHead className="w-12 pr-3 text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecipes.map((recipe) => {
                        const isActive = Boolean(activeById[recipe.id])

                        return (
                          <TableRow
                            key={recipe.id}
                            className={`pl-3 cursor-pointer${!isActive ? " opacity-60" : ""}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleRowNavigate(recipe.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                handleRowNavigate(recipe.id)
                              }
                            }}
                          >
                            <TableCell className="pl-3 pr-3">
                              <div className="space-y-1">
                                <p className="font-medium leading-tight">{recipe.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {recipe.ingredientsLabel}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-left whitespace-nowrap pr-3">
                              <span className="inline-flex min-w-[72px] justify-center text-sm text-destructive">
                                {recipe.portionCost}
                              </span>
                            </TableCell>
                            <TableCell className="text-left whitespace-nowrap pr-3">
                              {recipe.salePrice ? (
                                <Badge
                                  variant="secondary"
                                  className="inline-flex min-w-[72px] justify-center text-sm"
                                >
                                  {recipe.salePrice}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="inline-flex min-w-[88px] justify-center text-sm"
                                >
                                  Non vendue
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-left whitespace-nowrap pr-3">
                              {recipe.margin ? (
                                <Badge
                                  variant="outline"
                                  className="inline-flex min-w-[72px] justify-center text-sm"
                                >
                                  {recipe.margin}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="inline-flex min-w-[72px] justify-center text-sm"
                                >
                                  —
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell
                              className="pr-3 text-right"
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              <div className="flex justify-end">
                            <Switch
                              aria-label={`Modifier le statut de la recette ${recipe.name}`}
                              checked={isActive}
                              className="scale-90 data-[state=checked]:!bg-[#108FFF]"
                              style={isActive ? { backgroundColor: "#108FFF" } : undefined}
                              onCheckedChange={(checked) => {
                                setRecipeActive(recipe.id, checked)
                                if (checked) {
                                  toast.success(
                                    <>
                                      Recette{" "}
                                      <span className="font-semibold">{recipe.name}</span>{" "}
                                          activée
                                        </>
                                      )
                                    } else {
                                      toast.message(
                                        <>
                                          Recette{" "}
                                          <span className="font-semibold">{recipe.name}</span>{" "}
                                          désactivée
                                        </>,
                                        {
                                          icon: <Info className="h-4 w-4 text-muted-foreground" />,
                                        }
                                      )
                                    }
                                  }}
                                />
                              </div>
                            </TableCell>
                            <TableCell
                              className="pr-3 text-right"
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Actions pour ${recipe.name}`}
                                  >
                                    <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  sideOffset={4}
                                  className="min-w-56 rounded-lg"
                                >
                                  <DropdownMenuLabel className="p-1 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                      <ChefHat className="h-4 w-4 text-muted-foreground" />
                                      <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{recipe.name}</span>
                                        <span className="truncate text-xs text-muted-foreground">
                                          {recipe.ingredientsLabel}
                                        </span>
                                      </div>
                                    </div>
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onSelect={() => handleRowNavigate(recipe.id)}
                                  >
                                    <Eye />
                                    Voir
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => handleDuplicateOpen(recipe)}
                                  >
                                    <Copy />
                                    Dupliquer
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      const next = !isActive
                                      setRecipeActive(recipe.id, next)
                                      if (next) {
                                        toast.success(
                                          <>
                                            Recette{" "}
                                            <span className="font-semibold">{recipe.name}</span>{" "}
                                            activée
                                          </>
                                        )
                                      } else {
                                        toast.message(
                                          <>
                                            Recette{" "}
                                            <span className="font-semibold">{recipe.name}</span>{" "}
                                            désactivée
                                          </>,
                                          {
                                            icon: <Info className="h-4 w-4 text-muted-foreground" />,
                                          }
                                        )
                                      }
                                    }}
                                  >
                                    {isActive ? <CircleX /> : <CircleCheck />}
                                    {isActive ? "Désactiver" : "Activer"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 focus:text-destructive focus:bg-destructive/10 data-[highlighted]:text-destructive data-[highlighted]:bg-destructive/10"
                                    onSelect={() => handleDeleteOpen(recipe)}
                                  >
                                    <Trash2 />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {!filteredRecipes.length && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            Aucune recette ne correspond à ces filtres.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )

                if (!shouldScrollRecipes) return table
                return <ScrollArea className="h-[456px]">{table}</ScrollArea>
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
