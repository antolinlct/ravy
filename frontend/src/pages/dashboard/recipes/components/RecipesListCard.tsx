import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Separator } from "@/components/ui/separator"
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
  ChevronUp,
  ChevronDown,
  Check,
  Copy,
  CircleX,
  EllipsisVertical,
  Eye,
  Trash2,
} from "lucide-react"
import type { RecipeListCategoryOption, RecipeListItem } from "../types"

const sortValueLabel: Record<string, string> = {
  name: "Recette",
  portionCost: "Coût portion",
  salePrice: "Prix de vente",
  margin: "Marge",
}

type RecipesListCardProps = {
  categoryOptions: RecipeListCategoryOption[]
  filterSubCategoryOptions: RecipeListCategoryOption[]
  listCategory: string
  listSubCategory: string
  onListCategoryChange: (value: string) => void
  onListSubCategoryChange: (value: string) => void
  recipeSearchOpen: boolean
  onRecipeSearchOpenChange: (open: boolean) => void
  recipeSearchValue: string
  onRecipeSearchValueChange: (value: string) => void
  recipesByCategoryAndSub: RecipeListItem[]
  averageMargin: string
  sortedRecipes: RecipeListItem[]
  filteredRecipesCount: number
  activeById: Record<string, boolean>
  sortKey: "name" | "margin" | "portionCost" | "salePrice"
  sortDir: "asc" | "desc"
  onToggleSort: (key: "name" | "margin" | "portionCost" | "salePrice") => void
  onToggleActive: (recipeId: string, active: boolean) => void
  onRowNavigate: (recipeId: string) => void
  onDuplicate: (recipe: RecipeListItem) => void
  onDelete: (recipe: RecipeListItem) => void
  shouldScrollRecipes: boolean
}

export function RecipesListCard({
  categoryOptions,
  filterSubCategoryOptions,
  listCategory,
  listSubCategory,
  onListCategoryChange,
  onListSubCategoryChange,
  recipeSearchOpen,
  onRecipeSearchOpenChange,
  recipeSearchValue,
  onRecipeSearchValueChange,
  recipesByCategoryAndSub,
  averageMargin,
  sortedRecipes,
  filteredRecipesCount,
  activeById,
  sortKey,
  sortDir,
  onToggleSort,
  onToggleActive,
  onRowNavigate,
  onDuplicate,
  onDelete,
  shouldScrollRecipes,
}: RecipesListCardProps) {
  const sortIcon = (key: typeof sortKey) => {
    if (sortKey !== key) return <ChevronsUpDown className="h-4 w-4 opacity-50" />
    return sortDir === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-6 pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle>Recettes</CardTitle>
            <CardDescription>Consultez et gérez ici l&apos;ensemble de vos recettes.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-2">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full gap-4 sm:grid-cols-3 lg:max-w-3xl">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Catégorie</Label>
              <Select value={listCategory} onValueChange={onListCategoryChange}>
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
              <Select value={listSubCategory} onValueChange={onListSubCategoryChange}>
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
              <Popover open={recipeSearchOpen} onOpenChange={onRecipeSearchOpenChange}>
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
                            onRecipeSearchValueChange("")
                            onRecipeSearchOpenChange(false)
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
                              onRecipeSearchValueChange(
                                recipeSearchValue === recipe.id ? "" : recipe.id
                              )
                              onRecipeSearchOpenChange(false)
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
            <span className="text-xl font-semibold self-end text-primary">{averageMargin}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border">
          {(() => {
            const table = (
              <Table>
                <TableHeader>
                  <TableRow className="pl-3">
                    <TableHead className="w-[45%] pl-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-0 text-left font-semibold"
                        onClick={() => onToggleSort("name")}
                      >
                        <span className="mr-1">{sortValueLabel.name}</span>
                        {sortIcon("name")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-32 pr-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-0 text-left font-semibold"
                        onClick={() => onToggleSort("portionCost")}
                      >
                        <span className="mr-1">{sortValueLabel.portionCost}</span>
                        {sortIcon("portionCost")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-32 pr-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-0 text-left font-semibold"
                        onClick={() => onToggleSort("salePrice")}
                      >
                        <span className="mr-1">{sortValueLabel.salePrice}</span>
                        {sortIcon("salePrice")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-28 pr-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-0 text-left font-semibold"
                        onClick={() => onToggleSort("margin")}
                      >
                        <span className="mr-1">{sortValueLabel.margin}</span>
                        {sortIcon("margin")}
                      </Button>
                    </TableHead>
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
                  {sortedRecipes.map((recipe) => {
                    const isActive = Boolean(activeById[recipe.id])

                    return (
                      <TableRow
                        key={recipe.id}
                        className={`pl-3 cursor-pointer${!isActive ? " opacity-60" : ""}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => onRowNavigate(recipe.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            onRowNavigate(recipe.id)
                          }
                        }}
                      >
                        <TableCell className="pl-3 pr-3">
                          <div className="space-y-1">
                            <p className="font-medium leading-tight">{recipe.name}</p>
                            <p className="text-xs text-muted-foreground">{recipe.ingredientsLabel}</p>
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
                              onCheckedChange={(checked) => onToggleActive(recipe.id, checked)}
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
                              <DropdownMenuItem onSelect={() => onRowNavigate(recipe.id)}>
                                <Eye />
                                Voir
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => onDuplicate(recipe)}>
                                <Copy />
                                Dupliquer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => {
                                  onToggleActive(recipe.id, !isActive)
                                }}
                              >
                                {isActive ? <CircleX /> : <CircleCheck />}
                                {isActive ? "Désactiver" : "Activer"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 focus:text-destructive focus:bg-destructive/10 data-[highlighted]:text-destructive data-[highlighted]:bg-destructive/10"
                                onSelect={() => onDelete(recipe)}
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
                  {!filteredRecipesCount && (
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
  )
}
