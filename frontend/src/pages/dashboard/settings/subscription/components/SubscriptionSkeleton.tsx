import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SubscriptionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-44" />
        <div className="flex flex-wrap gap-2 pt-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-44" />
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-44" />
        <div className="grid gap-2 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={`addon-slot-skeleton-${index}`}
              className="rounded-md border p-3 space-y-2 bg-card"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        {[0, 1, 2].map((index) => (
          <Card key={`usage-skeleton-${index}`} className="border">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
