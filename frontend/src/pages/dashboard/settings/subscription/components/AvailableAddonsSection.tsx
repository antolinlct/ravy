import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { AvailableAddonItem } from "../utils"

type AvailableAddonsSectionProps = {
  isLoading: boolean
  availableAddons: AvailableAddonItem[]
  addonActionLoadingId: string | null
  onAddAddon: (addon: AvailableAddonItem) => void
}

export function AvailableAddonsSection({
  isLoading,
  availableAddons,
  addonActionLoadingId,
  onAddAddon,
}: AvailableAddonsSectionProps) {
  const isBusy = addonActionLoadingId !== null
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add-ons disponibles</CardTitle>
        <CardDescription>
          Ajoutez des packs pour augmenter vos capacités si besoin.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {isLoading ? (
          [0, 1, 2].map((index) => (
            <div
              key={`available-addon-${index}`}
              className="rounded-lg border p-3 space-y-2 bg-card"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))
        ) : availableAddons.length ? (
          availableAddons.map((addon) => (
            <div key={addon.id} className="rounded-lg border p-3 space-y-2 bg-card">
              <p className="font-semibold">{addon.name}</p>
              <p className="text-sm text-muted-foreground">{addon.detail}</p>
              <p className="text-sm font-medium">{addon.price}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddAddon(addon)}
                disabled={isBusy || !addon.priceStripeId}
              >
                {addonActionLoadingId === addon.id ? "Ajout..." : "Ajouter"}
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Aucun add-on disponible.</p>
        )}
      </CardContent>
    </Card>
  )
}
