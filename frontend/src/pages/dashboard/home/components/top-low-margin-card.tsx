import { ArrowRight } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { RecipeMarginItem } from "../types"
import { formatters } from "../api"
import { EmptyState } from "./empty-state"

type TopLowMarginCardProps = {
  items: RecipeMarginItem[]
}

export function TopLowMarginCard({ items }: TopLowMarginCardProps) {
  const navigate = useNavigate()

  return (
    <Card className="md:col-span-4">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <CardTitle>Top 5 recettes à optimiser</CardTitle>
          <Button variant="link" className="p-0 h-6 text-muted-foreground hover:text-foreground" asChild>
            <Link to="/dashboard/analytics/recipes">Voir plus</Link>
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {items.length === 0 ? (
            <EmptyState message="Aucune recette a optimiser pour le moment." />
          ) : (
            items.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => navigate(`/dashboard/analytics/recipes/${recipe.id}`)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border bg-muted/40 hover:bg-muted/60 px-3 py-2 text-left shadow-sm"
              >
                <div className="flex flex-col">
                  <p className="text-sm text-foreground">{recipe.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {formatters.formatPercentValue(recipe.marginValue)}
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground">
                    <ArrowRight className="h-4 w-4 text-[#848484]" color="#848484" />
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
