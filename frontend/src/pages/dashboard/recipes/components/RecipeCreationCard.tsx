import type { RefObject } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { PlusCircle } from "lucide-react"
import type { RecipeListCategoryOption } from "../types"

const hasError = (createAttempted: boolean, value?: string) => createAttempted && !value

type RecipeCreationCardProps = {
  creationProgress: number
  recipesRemaining: number
  recipeName: string
  onRecipeNameChange: (value: string) => void
  recipeCategory?: string
  onRecipeCategoryChange: (value: string) => void
  recipeSubCategory?: string
  onRecipeSubCategoryChange: (value: string) => void
  categoryOptions: RecipeListCategoryOption[]
  subCategoryOptions: RecipeListCategoryOption[]
  createAttempted: boolean
  canCreateRecipe: boolean
  onCreateAttempt: () => void
  nameInputRef: RefObject<HTMLInputElement | null>
  categoryTriggerRef: RefObject<HTMLButtonElement | null>
  subCategoryTriggerRef: RefObject<HTMLButtonElement | null>
}

export function RecipeCreationCard({
  creationProgress,
  recipesRemaining,
  recipeName,
  onRecipeNameChange,
  recipeCategory,
  onRecipeCategoryChange,
  recipeSubCategory,
  onRecipeSubCategoryChange,
  categoryOptions,
  subCategoryOptions,
  createAttempted,
  canCreateRecipe,
  onCreateAttempt,
  nameInputRef,
  categoryTriggerRef,
  subCategoryTriggerRef,
}: RecipeCreationCardProps) {
  return (
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
                  onChange={(e) => onRecipeNameChange(e.target.value)}
                  ref={nameInputRef}
                  aria-invalid={hasError(createAttempted, recipeName.trim())}
                />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={recipeCategory} onValueChange={onRecipeCategoryChange}>
                  <SelectTrigger
                    ref={categoryTriggerRef}
                    aria-invalid={hasError(createAttempted, recipeCategory)}
                    className={
                      hasError(createAttempted, recipeCategory) ? "border-destructive" : undefined
                    }
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
                <Select value={recipeSubCategory} onValueChange={onRecipeSubCategoryChange}>
                  <SelectTrigger
                    ref={subCategoryTriggerRef}
                    aria-invalid={hasError(createAttempted, recipeSubCategory)}
                    className={
                      hasError(createAttempted, recipeSubCategory)
                        ? "border-destructive"
                        : undefined
                    }
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
              <span className="inline-flex" onClick={onCreateAttempt}>
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
  )
}
