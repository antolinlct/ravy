import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2 } from "lucide-react"
import type { RecipeCategoryOption, RecipeDetail, RecipeSubcategoryOption, VatRateOption } from "../types"
import { formatCurrency } from "../utils"

type RecipeSettingsCardProps = {
  recipe: RecipeDetail
  recommendedPriceTtc: number
  marginHtPerPortion: number | null
  marginPercent: number | null
  priceInclTaxText: string
  portionsText: string
  portionWeightText: string
  priceTtcFocused: boolean
  priceTtcTooltipOpen: boolean
  priceTtcLabelTooltipOpen: boolean
  portionsFocused: boolean
  portionsTooltipOpen: boolean
  portionsLabelTooltipOpen: boolean
  portionWeightFocused: boolean
  portionWeightTooltipOpen: boolean
  portionWeightLabelTooltipOpen: boolean
  onToggleSaleable: (next: boolean) => void
  onToggleActive: (next: boolean) => void
  onVatChange: (value: string) => void
  onPriceInclTaxTextChange: (value: string) => void
  onPriceInclTaxFocus: () => void
  onPriceInclTaxBlur: () => void
  onPriceTtcTooltipOpenChange: (open: boolean) => void
  onPriceTtcLabelTooltipOpenChange: (open: boolean) => void
  onPortionsTextChange: (value: string) => void
  onPortionsFocus: () => void
  onPortionsBlur: () => void
  onPortionsTooltipOpenChange: (open: boolean) => void
  onPortionsLabelTooltipOpenChange: (open: boolean) => void
  onPortionWeightTextChange: (value: string) => void
  onPortionWeightFocus: () => void
  onPortionWeightBlur: () => void
  onPortionWeightTooltipOpenChange: (open: boolean) => void
  onPortionWeightLabelTooltipOpenChange: (open: boolean) => void
  onCategoryChange: (value: string) => void
  onSubcategoryChange: (value: string) => void
  onSave: () => void
  saveDisabled: boolean
  isSaving?: boolean
  categoryOptions: RecipeCategoryOption[]
  subcategoryOptionsByCategory: Record<string, RecipeSubcategoryOption[]>
  vatOptions: VatRateOption[]
  readOnly?: boolean
}

export function RecipeSettingsCard({
  recipe,
  recommendedPriceTtc,
  marginHtPerPortion,
  marginPercent,
  priceInclTaxText,
  portionsText,
  portionWeightText,
  priceTtcFocused,
  priceTtcTooltipOpen,
  priceTtcLabelTooltipOpen,
  portionsFocused,
  portionsTooltipOpen,
  portionsLabelTooltipOpen,
  portionWeightFocused,
  portionWeightTooltipOpen,
  portionWeightLabelTooltipOpen,
  onToggleSaleable,
  onToggleActive,
  onVatChange,
  onPriceInclTaxTextChange,
  onPriceInclTaxFocus,
  onPriceInclTaxBlur,
  onPriceTtcTooltipOpenChange,
  onPriceTtcLabelTooltipOpenChange,
  onPortionsTextChange,
  onPortionsFocus,
  onPortionsBlur,
  onPortionsTooltipOpenChange,
  onPortionsLabelTooltipOpenChange,
  onPortionWeightTextChange,
  onPortionWeightFocus,
  onPortionWeightBlur,
  onPortionWeightTooltipOpenChange,
  onPortionWeightLabelTooltipOpenChange,
  onCategoryChange,
  onSubcategoryChange,
  onSave,
  saveDisabled,
  isSaving = false,
  categoryOptions,
  subcategoryOptionsByCategory,
  vatOptions,
  readOnly = false,
}: RecipeSettingsCardProps) {
  const subcategoryOptions = subcategoryOptionsByCategory[recipe.categoryId] ?? []

  return (
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
                    onCheckedChange={onToggleSaleable}
                    disabled={readOnly}
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
                    <Select value={recipe.vatId} onValueChange={onVatChange}>
                      <SelectTrigger disabled={readOnly}>
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
                      if (!priceTtcFocused) onPriceTtcTooltipOpenChange(open)
                    }}
                  >
                    <TooltipTrigger asChild>
                      <div className="space-y-2">
                        <Tooltip
                          open={priceTtcFocused ? priceTtcLabelTooltipOpen : false}
                          onOpenChange={(open) => {
                            if (priceTtcFocused) onPriceTtcLabelTooltipOpenChange(open)
                          }}
                        >
                          <TooltipTrigger asChild>
                            <Label className="text-xs text-muted-foreground">Prix de vente TTC</Label>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                            Prix TTC par portion vendue. Utilisé pour le calcul des marges.
                          </TooltipContent>
                        </Tooltip>
                        <InputGroup>
                          <InputGroupInput
                            inputMode="decimal"
                            value={priceInclTaxText}
                            onChange={(event) => onPriceInclTaxTextChange(event.target.value)}
                            onFocus={onPriceInclTaxFocus}
                            onBlur={onPriceInclTaxBlur}
                            placeholder="0"
                            disabled={readOnly}
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
                  if (!portionsFocused) onPortionsTooltipOpenChange(open)
                }}
              >
                <TooltipTrigger asChild>
                  <div className="space-y-2">
                    <Tooltip
                      open={portionsFocused ? portionsLabelTooltipOpen : false}
                      onOpenChange={(open) => {
                        if (portionsFocused) onPortionsLabelTooltipOpenChange(open)
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
                      onChange={(event) => onPortionsTextChange(event.target.value)}
                      onFocus={onPortionsFocus}
                      onBlur={onPortionsBlur}
                      placeholder="1"
                      disabled={readOnly}
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
                  if (!portionWeightFocused) onPortionWeightTooltipOpenChange(open)
                }}
              >
                <TooltipTrigger asChild>
                  <div className="space-y-2">
                    <Tooltip
                      open={portionWeightFocused ? portionWeightLabelTooltipOpen : false}
                      onOpenChange={(open) => {
                        if (portionWeightFocused) onPortionWeightLabelTooltipOpenChange(open)
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
                        onChange={(event) => onPortionWeightTextChange(event.target.value)}
                        onFocus={onPortionWeightFocus}
                        onBlur={onPortionWeightBlur}
                        placeholder="0"
                        disabled={readOnly}
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
                <Label htmlFor="recipe-category" className="text-xs text-muted-foreground">
                  Catégorie
                </Label>
                <Select value={recipe.categoryId} onValueChange={onCategoryChange}>
                  <SelectTrigger id="recipe-category" disabled={readOnly}>
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
                <Label htmlFor="recipe-subcategory" className="text-xs text-muted-foreground">
                  Sous-catégorie
                </Label>
                <Select value={recipe.subcategoryId} onValueChange={onSubcategoryChange}>
                  <SelectTrigger id="recipe-subcategory" disabled={readOnly}>
                    <SelectValue
                      placeholder={
                        recipe.categoryId ? "Sélectionnez une sous-catégorie" : "Sélectionnez une catégorie"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {!recipe.categoryId ? (
                      <SelectItem value="__missing_category__" disabled>
                        Sélectionnez une catégorie
                      </SelectItem>
                    ) : subcategoryOptions.length ? (
                      subcategoryOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__empty_subcategory__" disabled>
                        Aucune sous-catégorie disponible
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
                    onCheckedChange={onToggleActive}
                    disabled={readOnly}
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
          onClick={onSave}
          disabled={readOnly || saveDisabled || isSaving}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSaving ? "Enregistrement..." : "Enregistrer les paramètres"}
        </Button>
      </CardFooter>
    </Card>
  )
}
