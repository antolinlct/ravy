import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const RecipeMarginSkeletonCard = () => (
  <Card>
    <CardContent className="p-6 space-y-6">
      <Skeleton className="h-6 w-64" />
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-[260px] w-full lg:col-span-8" />
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-5 w-28" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

export const RecipeCostSkeletonCard = () => (
  <Card>
    <CardContent className="p-6 space-y-4">
      <Skeleton className="h-6 w-72" />
      <Skeleton className="h-[240px] w-full" />
      <div className="rounded-md border p-4 space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </CardContent>
  </Card>
)
