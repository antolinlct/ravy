import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DoubleDatePicker } from "@/components/blocks/double-datepicker"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type RecipeSelectionCardProps = {
  categoryOptions: Array<{ value: string; label: string }>
  filteredSubCategoryOptions: Array<{ value: string; label: string }>
  selectedCategory: string
  selectedSubCategory: string
  onCategoryChange: (value: string) => void
  onSubCategoryChange: (value: string) => void
  recipeOptions: Array<{ id: string; name: string }>
  selectedRecipeId: string
  onRecipeSelect: (value: string) => void
  minAnalysisDate: Date
  range: { start?: Date; end?: Date }
  onRangeChange: (range: { start?: Date; end?: Date }) => void
}

export const RecipeSelectionCard = ({
  categoryOptions,
  filteredSubCategoryOptions,
  selectedCategory,
  selectedSubCategory,
  onCategoryChange,
  onSubCategoryChange,
  recipeOptions,
  selectedRecipeId,
  onRecipeSelect,
  minAnalysisDate,
  range,
  onRangeChange,
}: RecipeSelectionCardProps) => {
  const [recipeSearchOpen, setRecipeSearchOpen] = useState(false)

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <CardTitle>Sélectionnez une recette à analyser</CardTitle>
        </div>
        <div className="grid w-full items-start gap-4 grid-cols-[180px_220px_260px_340px]">
          <div className="flex flex-col gap-2 min-w-0">
            <Label className="text-xs font-medium text-muted-foreground">Catégorie</Label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                if (value === "__all__") {
                  onCategoryChange("__all__")
                  onSubCategoryChange("__all__")
                  onRecipeSelect("")
                  return
                }
                onCategoryChange(value)
                onSubCategoryChange("__all__")
                onRecipeSelect("")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__" className="text-muted-foreground focus:text-accent-foreground">
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

          <div className="flex flex-col gap-2 min-w-0">
            <Label className="text-xs font-medium text-muted-foreground">Sous-catégorie</Label>
            <Select
              value={selectedSubCategory}
              onValueChange={(value) => {
                if (value === "__all__") {
                  onSubCategoryChange("__all__")
                  onRecipeSelect("")
                  return
                }
                onSubCategoryChange(value)
                onRecipeSelect("")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les sous-catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__" className="text-muted-foreground focus:text-accent-foreground">
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

          <div className="flex flex-col gap-2 min-w-[200px]">
            <Label className="text-xs font-medium text-muted-foreground">Recette</Label>
            <Popover open={recipeSearchOpen} onOpenChange={setRecipeSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={recipeSearchOpen}
                  className="w-full justify-between"
                >
                  {selectedRecipeId
                    ? recipeOptions.find((opt) => opt.id === selectedRecipeId)?.name
                    : "Sélectionnez une recette"}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Rechercher une recette..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>Aucune recette trouvée.</CommandEmpty>
                    <CommandGroup>
                      {recipeOptions.map((opt) => (
                        <CommandItem
                          key={opt.id}
                          value={opt.name}
                          onSelect={() => {
                            onRecipeSelect(selectedRecipeId === opt.id ? "" : opt.id)
                            setRecipeSearchOpen(false)
                          }}
                        >
                          {opt.name}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedRecipeId === opt.id ? "opacity-100" : "opacity-0"
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

          <DoubleDatePicker
            className="self-start"
            displayFormat="long"
            showSeparator
            minDate={minAnalysisDate}
            startDate={range.start}
            endDate={range.end}
            onChange={({ startDate, endDate }) => onRangeChange({ start: startDate, end: endDate })}
          />
        </div>
      </CardContent>
    </Card>
  )
}
