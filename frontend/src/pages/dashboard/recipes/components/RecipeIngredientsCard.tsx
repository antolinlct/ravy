import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FileText, Pencil, Plus, ShoppingBasket } from "lucide-react"
import type { IngredientRow } from "../types"
import { formatCurrency } from "../utils"

const summaryBadgeClass = "bg-red-500/10 text-red-600 border-red-500/20 text-sm font-medium"

type RecipeIngredientsCardProps = {
  ingredientRows: IngredientRow[]
  ingredientsCount: number
  purchaseCostTotal: number
  purchaseCostPerPortion: number
  isLoading?: boolean
  onAddArticle: () => void
  onAddSubRecipe: () => void
  onAddFixed: () => void
  onEditIngredient: (id: string) => void
}

export function RecipeIngredientsCard({
  ingredientRows,
  ingredientsCount,
  purchaseCostTotal,
  purchaseCostPerPortion,
  isLoading = false,
  onAddArticle,
  onAddSubRecipe,
  onAddFixed,
  onEditIngredient,
}: RecipeIngredientsCardProps) {
  const skeletonRows = Array.from({ length: 6 })

  return (
    <Card className="shadow-sm h-[595px] flex flex-col overflow-hidden">
      <CardHeader className="p-6 pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle>Ingrédients</CardTitle>
              <Badge variant="secondary">{isLoading ? "—" : ingredientsCount}</Badge>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" className="gap-2" onClick={onAddArticle}>
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
                  <Button variant="secondary" className="gap-2" onClick={onAddSubRecipe}>
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
                  <Button variant="secondary" className="gap-2" onClick={onAddFixed}>
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
                  {isLoading
                    ? skeletonRows.map((_, index) => (
                        <TableRow key={`skeleton-${index}`} className="h-14">
                          <TableCell className="pl-3 pr-3">
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-20 rounded-md" />
                          </TableCell>
                          <TableCell className="pr-3 text-right">
                            <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                          </TableCell>
                        </TableRow>
                      ))
                    : ingredientRows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer h-14"
                          onClick={() => onEditIngredient(row.id)}
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
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    onEditIngredient(row.id)
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
                  {!isLoading && !ingredientRows.length && (
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
            {isLoading ? (
              <Skeleton className="h-6 w-20 rounded-md" />
            ) : (
              <Badge variant="secondary" className={summaryBadgeClass}>
                {formatCurrency(purchaseCostTotal)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Coût par portion :</span>
            {isLoading ? (
              <Skeleton className="h-6 w-20 rounded-md" />
            ) : (
              <Badge variant="secondary" className={summaryBadgeClass}>
                {formatCurrency(purchaseCostPerPortion)}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
