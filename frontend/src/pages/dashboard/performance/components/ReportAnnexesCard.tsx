import { useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type SupplierOption = { id: string; label: string }
type TheoreticalProduct = {
  id: string
  name: string
  supplierId: string
  avgPrice: number
  consumptionHt: number
  quantity: string
}
type RecipeEfficiency = {
  id: string
  name: string
  category: string
  subcategory: string
  avgCost: number
  revenue: number
  revenueShare: number
}

type ReportAnnexesCardProps = {
  reportMonth: string
  supplierOptions: SupplierOption[]
  theoreticalProducts: TheoreticalProduct[]
  recipesEfficiency: RecipeEfficiency[]
  formatEuro: (value: number) => string
}

export default function ReportAnnexesCard({
  reportMonth,
  supplierOptions,
  theoreticalProducts,
  recipesEfficiency,
  formatEuro,
}: ReportAnnexesCardProps) {
  const [annexesOpen, setAnnexesOpen] = useState(false)
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("__all__")
  const [selectedSubCategory, setSelectedSubCategory] = useState("__all__")
  const [productSortKey, setProductSortKey] = useState<"name" | "consumption" | null>(null)
  const [productSortDirection, setProductSortDirection] = useState<"none" | "asc" | "desc">("none")
  const [recipeSortKey, setRecipeSortKey] = useState<"name" | "revenue" | null>(null)
  const [recipeSortDirection, setRecipeSortDirection] = useState<"none" | "asc" | "desc">("none")

  const filteredProducts = selectedSupplierId
    ? theoreticalProducts.filter((product) => product.supplierId === selectedSupplierId)
    : theoreticalProducts

  const categoryOptions = [
    { value: "__all__", label: "Toutes les catégories" },
    { value: "plats", label: "Plats" },
    { value: "entrees", label: "Entrées" },
    { value: "desserts", label: "Desserts" },
    { value: "snacking", label: "Snacking" },
  ]
  const subCategoryOptionsMap: Record<string, { value: string; label: string }[]> = {
    plats: [
      { value: "grillades", label: "Grillades" },
      { value: "boucherie", label: "Boucherie" },
      { value: "poisson", label: "Poisson" },
    ],
    entrees: [
      { value: "salades", label: "Salades" },
      { value: "tartares", label: "Tartares" },
    ],
    desserts: [
      { value: "tartes", label: "Tartes" },
      { value: "glaces", label: "Glaces" },
    ],
    snacking: [
      { value: "burgers", label: "Burgers" },
      { value: "sandwiches", label: "Sandwiches" },
    ],
  }
  const filteredSubCategoryOptions =
    selectedCategory === "__all__" ? [] : subCategoryOptionsMap[selectedCategory] ?? []

  const filteredRecipes = recipesEfficiency.filter((recipe) => {
    const matchesCategory = selectedCategory === "__all__" || recipe.category === selectedCategory
    const matchesSubCategory = selectedSubCategory === "__all__" || recipe.subcategory === selectedSubCategory
    return matchesCategory && matchesSubCategory
  })

  const sortedProducts = useMemo(() => {
    const items = [...filteredProducts]
    if (!productSortKey || productSortDirection === "none") return items
    const direction = productSortDirection === "asc" ? 1 : -1
    return items.sort((a, b) => {
      if (productSortKey === "name") {
        return a.name.localeCompare(b.name, "fr", { sensitivity: "base" }) * direction
      }
      return (a.consumptionHt - b.consumptionHt) * direction
    })
  }, [filteredProducts, productSortKey, productSortDirection])

  const sortedRecipes = useMemo(() => {
    const items = [...filteredRecipes]
    if (!recipeSortKey || recipeSortDirection === "none") return items
    const direction = recipeSortDirection === "asc" ? 1 : -1
    return items.sort((a, b) => {
      if (recipeSortKey === "name") {
        return a.name.localeCompare(b.name, "fr", { sensitivity: "base" }) * direction
      }
      return (a.revenue - b.revenue) * direction
    })
  }, [filteredRecipes, recipeSortKey, recipeSortDirection])

  const renderSortIcon = (
    activeKey: string | null,
    direction: "none" | "asc" | "desc",
    key: string
  ) => {
    if (activeKey !== key || direction === "none") {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
    }
    return direction === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    )
  }

  const toggleProductSort = (key: "name" | "consumption") => {
    if (productSortKey !== key) {
      setProductSortKey(key)
      setProductSortDirection("asc")
      return
    }
    setProductSortDirection((current) => {
      if (current === "none") return "asc"
      if (current === "asc") return "desc"
      setProductSortKey(null)
      return "none"
    })
  }
  const toggleRecipeSort = (key: "name" | "revenue") => {
    if (recipeSortKey !== key) {
      setRecipeSortKey(key)
      setRecipeSortDirection("asc")
      return
    }
    setRecipeSortDirection((current) => {
      if (current === "none") return "asc"
      if (current === "asc") return "desc"
      setRecipeSortKey(null)
      return "none"
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Informations annexes</CardTitle>
          <p className="text-sm text-muted-foreground">Détails complémentaires sur le rapport</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setAnnexesOpen((prev) => !prev)}
          aria-expanded={annexesOpen}
        >
          {annexesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="sr-only">
            {annexesOpen ? "Réduire les informations annexes" : "Afficher les informations annexes"}
          </span>
        </Button>
      </CardHeader>
      {annexesOpen ? (
        <CardContent className="pt-0">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-lg border-0 bg-muted/40 p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-base font-semibold">
                  Consommation théorique de vos produits du mois de {reportMonth}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Fournisseur</p>
                <Popover open={supplierSearchOpen} onOpenChange={setSupplierSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={supplierSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedSupplierId
                        ? supplierOptions.find((opt) => opt.id === selectedSupplierId)?.label
                        : "Tous les fournisseurs"}
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher un fournisseur..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>Aucun fournisseur trouvé.</CommandEmpty>
                        <CommandGroup>
                          {supplierOptions.map((opt) => (
                            <CommandItem
                              key={opt.id}
                              value={opt.label}
                              onSelect={() => {
                                setSelectedSupplierId(selectedSupplierId === opt.id ? "" : opt.id)
                                setSupplierSearchOpen(false)
                              }}
                            >
                              {opt.label}
                              <Check
                                className={`ml-auto h-4 w-4 ${
                                  selectedSupplierId === opt.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="overflow-hidden rounded-lg border border-border/60">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow className="pl-4">
                      <TableHead className="pl-4 text-left w-[60%]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-fit justify-start gap-2 px-0 text-left font-semibold"
                          onClick={() => toggleProductSort("name")}
                        >
                          <span className="mr-1 truncate">Produits</span>
                          {renderSortIcon(productSortKey, productSortDirection, "name")}
                        </Button>
                      </TableHead>
                      <TableHead className="pr-4 text-right w-[40%]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-8 w-fit justify-end gap-2 px-0 text-right font-semibold"
                          onClick={() => toggleProductSort("consumption")}
                        >
                          <span className="mr-1 truncate">Consommation HT</span>
                          {renderSortIcon(productSortKey, productSortDirection, "consumption")}
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
                <ScrollArea className="h-[380px]">
                  <Table className="table-fixed">
                    <TableBody>
                      {sortedProducts.length ? (
                        sortedProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="pl-4 align-top w-[60%]">
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Prix achat moyen:{" "}
                                  <span className="text-red-500">{formatEuro(product.avgPrice)}</span>
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="pr-4 text-right align-top w-[40%]">
                              <div className="space-y-1 text-right">
                                <Badge variant="secondary" className="text-sm font-semibold">
                                  {formatEuro(product.consumptionHt)}
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  Qté. consommée: {product.quantity}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="px-4 py-6 text-sm text-muted-foreground">
                            Aucun produit pour ces filtres.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </Card>
            <Card className="rounded-lg border-0 bg-muted/40 p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-base font-semibold">Efficacité de vos recettes du mois de {reportMonth}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Catégorie</p>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value)
                      setSelectedSubCategory("__all__")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className={opt.value === "__all__" ? "text-muted-foreground" : undefined}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Sous-catégorie</p>
                  <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les sous-catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="__all__"
                        className="text-muted-foreground focus:text-accent-foreground"
                      >
                        Toutes les sous-catégories
                      </SelectItem>
                      {selectedCategory === "__all__" ? (
                        <SelectItem value="__none__" disabled>
                          Aucune sous-catégorie disponible
                        </SelectItem>
                      ) : (
                        filteredSubCategoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-border/60">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow className="pl-4">
                      <TableHead className="pl-4 text-left w-[60%]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-fit justify-start gap-2 px-0 text-left font-semibold"
                          onClick={() => toggleRecipeSort("name")}
                        >
                          <span className="mr-1 truncate">Recettes</span>
                          {renderSortIcon(recipeSortKey, recipeSortDirection, "name")}
                        </Button>
                      </TableHead>
                      <TableHead className="pr-4 text-right w-[40%]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-8 w-fit justify-end gap-2 px-0 text-right font-semibold"
                          onClick={() => toggleRecipeSort("revenue")}
                        >
                          <span className="mr-1 truncate">Revenus HT</span>
                          {renderSortIcon(recipeSortKey, recipeSortDirection, "revenue")}
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
                <ScrollArea className="h-[380px]">
                  <Table className="table-fixed">
                    <TableBody>
                      {sortedRecipes.length ? (
                        sortedRecipes.map((recipe) => (
                          <TableRow key={recipe.id}>
                            <TableCell className="pl-4 align-top w-[60%]">
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{recipe.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Coût moyen:{" "}
                                  <span className="text-red-500">{formatEuro(recipe.avgCost)}</span>
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="pr-4 text-right align-top w-[40%]">
                              <div className="space-y-1 text-right">
                                <Badge variant="secondary" className="text-sm font-semibold">
                                  {formatEuro(recipe.revenue)}
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  Part du CA: {recipe.revenueShare.toFixed(1).replace(".", ",")}%
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="px-4 py-6 text-sm text-muted-foreground">
                            Aucune recette pour ces filtres.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </Card>
          </div>
        </CardContent>
      ) : null}
    </Card>
  )
}
