import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Check, ChevronsUpDown, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  IngredientEditorDraft,
  RecipeCategoryOption,
  RecipeDetail,
  RecipeSubcategoryOption,
  SupplierOption,
  SupplierProductOption,
} from "../types"
import { formatCurrency, parseNumber } from "../utils"

const accordionClass = "mt-15 min-h-0 border bg-background shadow-none"

type IngredientEditorSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  editingIngredientName?: string | null
  draft: IngredientEditorDraft
  setDraft: React.Dispatch<React.SetStateAction<IngredientEditorDraft>>
  availableSubRecipes: RecipeDetail[]
  currentRecipeId: string
  supplierOptions: SupplierOption[]
  productOptionsBySupplier: Record<string, SupplierProductOption[]>
  categoryOptions: RecipeCategoryOption[]
  subcategoryOptionsByCategory: Record<string, RecipeSubcategoryOption[]>
  onSave: () => void
  onDelete?: () => void
}

export function IngredientEditorSheet({
  open,
  onOpenChange,
  mode,
  editingIngredientName,
  draft,
  setDraft,
  availableSubRecipes,
  currentRecipeId,
  supplierOptions,
  productOptionsBySupplier,
  categoryOptions,
  subcategoryOptionsByCategory,
  onSave,
  onDelete,
}: IngredientEditorSheetProps) {
  const [supplierComboOpen, setSupplierComboOpen] = useState(false)
  const [productComboOpen, setProductComboOpen] = useState(false)
  const [subRecipeComboOpen, setSubRecipeComboOpen] = useState(false)

  const editorSubcategoryOptions = useMemo(() => {
    if (draft.type !== "SUBRECIPE") return []
    return subcategoryOptionsByCategory[draft.categoryId] ?? []
  }, [draft, subcategoryOptionsByCategory])

  const editorSubRecipeOptions = useMemo(() => {
    if (draft.type !== "SUBRECIPE") return []
    return availableSubRecipes
  }, [availableSubRecipes, draft])

  const selectedSubRecipe = useMemo(() => {
    if (draft.type !== "SUBRECIPE") return null
    return editorSubRecipeOptions.find((opt) => opt.id === draft.recipeId) ?? null
  }, [editorSubRecipeOptions, draft])

  const editorArticleProducts = useMemo(() => {
    if (draft.type !== "ARTICLE") return []
    return productOptionsBySupplier[draft.supplierId] ?? []
  }, [draft, productOptionsBySupplier])

  const editorSelectedProduct = useMemo(() => {
    if (draft.type !== "ARTICLE") return null
    return editorArticleProducts.find((item) => item.id === draft.productId) ?? null
  }, [editorArticleProducts, draft])

  const resetAndClose = () => {
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-xl"
        onInteractOutside={(event) => {
          event.preventDefault()
          resetAndClose()
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault()
          resetAndClose()
        }}
      >
        <SheetHeader>
          <SheetTitle>
            {mode === "create"
              ? draft.type === "ARTICLE"
                ? "Ajouter un produit"
                : draft.type === "SUBRECIPE"
                  ? "Ajouter une recette"
                  : "Ajouter une charge"
              : `Modifier ${editingIngredientName ?? "l’ingrédient"}`}
          </SheetTitle>
          <SheetDescription>
            {draft.type === "ARTICLE"
              ? "Sélectionnez un produit issu de vos factures."
              : draft.type === "SUBRECIPE"
                ? "Ajoutez une recette existante à cette recette."
                : "Ajoutez un coût fixe (ex: main d’œuvre, gaz…)."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {draft.type === "ARTICLE" ? (
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
                        {draft.supplierId
                          ? supplierOptions.find((opt) => opt.id === draft.supplierId)?.label
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
                                  const next = value === draft.supplierId ? "" : value
                                  setDraft((prev) =>
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
                                    draft.supplierId === opt.id ? "opacity-100" : "opacity-0"
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
                  <Popover open={productComboOpen} onOpenChange={setProductComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={productComboOpen}
                        className="w-full justify-between"
                        disabled={!draft.supplierId}
                      >
                        {draft.productId
                          ? editorArticleProducts.find((opt) => opt.id === draft.productId)?.label
                          : draft.supplierId
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
                                  const next = value === draft.productId ? "" : value
                                  setDraft((prev) =>
                                    prev.type === "ARTICLE" ? { ...prev, productId: next } : prev
                                  )
                                  setProductComboOpen(false)
                                }}
                              >
                                {opt.label}
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    draft.productId === opt.id ? "opacity-100" : "opacity-0"
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
                      value={draft.quantity}
                      inputMode="decimal"
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev.type === "ARTICLE" ? { ...prev, quantity: event.target.value } : prev
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
                      value={draft.wastePercent}
                      inputMode="decimal"
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev.type === "ARTICLE" ? { ...prev, wastePercent: event.target.value } : prev
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
                      <Badge variant="secondary" className="bg-red-500/10 text-red-600 text-sm font-medium">
                        {formatCurrency(
                          parseNumber(draft.quantity) *
                            (editorSelectedProduct?.unitCost ?? 0) *
                            (1 + parseNumber(draft.wastePercent) / 100)
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}

          {draft.type === "SUBRECIPE" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    value={draft.categoryId}
                    onValueChange={(value) => {
                      const normalized = value === "__all__" ? "" : value
                      const nextSub = normalized
                        ? subcategoryOptionsByCategory[normalized]?.[0]?.id ?? ""
                        : ""
                      setDraft((prev) =>
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
                    value={draft.subcategoryId}
                    onValueChange={(value) =>
                      setDraft((prev) => {
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
                        {draft.recipeId
                          ? editorSubRecipeOptions.find((opt) => opt.id === draft.recipeId)?.name
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
                                if (opt.id === currentRecipeId) return false
                                const catOk = !draft.categoryId || opt.categoryId === draft.categoryId
                                const subOk =
                                  !draft.subcategoryId || opt.subcategoryId === draft.subcategoryId
                                return catOk && subOk
                              })
                              .map((opt) => (
                                <CommandItem
                                  key={opt.id}
                                  value={opt.id}
                                  onSelect={(value) => {
                                    const next = value === draft.recipeId ? "" : value
                                    setDraft((prev) =>
                                      prev.type === "SUBRECIPE" ? { ...prev, recipeId: next } : prev
                                    )
                                    setSubRecipeComboOpen(false)
                                  }}
                                >
                                  {opt.name}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      draft.recipeId === opt.id ? "opacity-100" : "opacity-0"
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
                      value={draft.portionsUsed}
                      inputMode="decimal"
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev.type === "SUBRECIPE" ? { ...prev, portionsUsed: event.target.value } : prev
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
                      <Badge variant="secondary" className="bg-muted text-foreground text-sm font-medium">
                        {draft.recipeId
                          ? formatCurrency(
                              (() => {
                                const selected = availableSubRecipes.find((item) => item.id === draft.recipeId)
                                const costPerPortion = selected?.purchaseCostPerPortion ?? 0
                                return costPerPortion
                              })()
                            )
                          : "—"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Coût net de la sous-recette :</span>
                      <Badge variant="secondary" className="bg-red-500/10 text-red-600 text-sm font-medium">
                        {draft.recipeId
                          ? formatCurrency(
                              (() => {
                                if (!selectedSubRecipe) return 0
                                const perPortion = selectedSubRecipe.purchaseCostPerPortion ?? 0
                                return perPortion * parseNumber(draft.portionsUsed)
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

          {draft.type === "FIXED" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-10">
                <div className="space-y-2 sm:col-span-6">
                  <Label>Nom de votre charge additionnelle</Label>
                  <Input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((prev) =>
                        prev.type === "FIXED" ? { ...prev, name: event.target.value } : prev
                      )
                    }
                    placeholder="Gaz, Main-d’œuvre, Serviettes, Autres…"
                  />
                </div>
                <div className="space-y-2 sm:col-span-4">
                  <Label>Coût fixe</Label>
                  <InputGroup>
                    <InputGroupInput
                      value={draft.fixedCost}
                      inputMode="decimal"
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev.type === "FIXED" ? { ...prev, fixedCost: event.target.value } : prev
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
                      {formatCurrency(parseNumber(draft.fixedCost))}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            {mode === "edit" ? (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={resetAndClose}>
                Annuler
              </Button>
              <Button onClick={onSave}>Enregistrer</Button>
            </div>
          </div>

          {draft.type === "ARTICLE" ? (
            <Card className={accordionClass}>
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

          {draft.type === "SUBRECIPE" ? (
            <Card className={accordionClass}>
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

          {draft.type === "FIXED" ? (
            <Card className={accordionClass}>
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
  )
}
