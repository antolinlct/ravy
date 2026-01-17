import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, HandCoins } from "lucide-react"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { OptimizedProduct } from "../types"
import { EmptyState } from "./empty-state"

type OptimizedProductsCardProps = {
  products: OptimizedProduct[]
  totalMonthlySavings: number
}

export function OptimizedProductsCard({
  products,
  totalMonthlySavings,
}: OptimizedProductsCardProps) {
  const productsScrollRef = useRef<HTMLDivElement | null>(null)
  const [showRightFade, setShowRightFade] = useState(false)
  const diffNumberFormatter = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const monthlyEuroFormatter = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  const hasSavings = totalMonthlySavings > 0

  useEffect(() => {
    const root = productsScrollRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
    if (!viewport) return

    const updateRightFade = () => {
      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth
      setShowRightFade(maxScrollLeft > 0 && viewport.scrollLeft < maxScrollLeft - 4)
    }
    updateRightFade()

    const onWheel = (event: WheelEvent) => {
      if (viewport.scrollWidth <= viewport.clientWidth) return
      if (event.ctrlKey) return

      let delta = event.deltaY
      if (!delta) delta = event.deltaX
      if (!delta) return

      if (event.deltaMode === 1) {
        delta *= 16
      } else if (event.deltaMode === 2) {
        delta *= viewport.clientWidth
      }

      delta *= 0.8

      if (event.cancelable) event.preventDefault()
      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth
      const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, viewport.scrollLeft + delta))
      viewport.scrollLeft = nextScrollLeft
    }

    viewport.addEventListener("scroll", updateRightFade, { passive: true })
    root.addEventListener("wheel", onWheel, { passive: false, capture: true })

    return () => {
      viewport.removeEventListener("scroll", updateRightFade)
      root.removeEventListener("wheel", onWheel, { capture: true })
    }
  }, [])

  return (
    <Card className="md:col-span-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <CardTitle>Produits à optimiser</CardTitle>
          <Button
            asChild
            variant="link"
            className="p-0 h-6 text-muted-foreground hover:text-foreground"
          >
            <Link to="/dashboard/analytics/products" state={{ scrollTo: "bottom" }}>
              Voir l&apos;analyse
            </Link>
          </Button>
        </div>
        <CardDescription className="mt-1">
          Produits dont le prix d&apos;achat est au-dessus du marché.
        </CardDescription>

        <div className="relative mt-4">
          <ScrollArea ref={productsScrollRef} className="w-full" scrollbar="horizontal">
            {products.length === 0 ? (
              <div className="w-full">
                <EmptyState message="Aucun produit a optimiser pour le moment." className="w-full" />
              </div>
            ) : (
              <div className="flex w-max gap-3">
                {products.map((item) => {
                  const unitDiff =
                    item.unitPaid !== null && item.unitMarket !== null
                      ? item.unitPaid - item.unitMarket
                      : null
                  const monthlySavingsLabel = `+${monthlyEuroFormatter.format(Math.round(
                    item.monthlySavings
                  ))}€ / mois`
                  const unitDiffLabel = unitDiff !== null
                    ? `${unitDiff >= 0 ? "+" : "-"}${diffNumberFormatter.format(
                        Math.abs(unitDiff)
                      )}€`
                    : "--"
                  const unitLabel = item.unit ? item.unit.toUpperCase() : "U"

                  return (
                    <div key={item.id} className="w-44 flex-none">
                      <AspectRatio ratio={4 / 5}>
                        <Link
                          to={`/dashboard/analytics/products/${item.id}`}
                          aria-label={`Voir l'analyse de ${item.name}`}
                          className="block h-full"
                        >
                          <Card className="h-full w-full bg-muted/40 transition-colors hover:bg-muted/60">
                            <CardContent className="flex h-full flex-col p-4">
                              <div className="flex flex-col items-start gap-3">
                                <HandCoins className="h-5" color="#848484" />
                                <Badge
                                  variant="outline"
                                  className="w-fit border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400 font-medium text-sm"
                                >
                                  {monthlySavingsLabel}
                                </Badge>
                              </div>

                              <div className="mt-auto">
                                <div className="min-w-0">
                                  <p className="truncate text-xs text-muted-foreground">{item.supplier}</p>
                                  <p className="mt-1 line-clamp-2 text-sm leading-snug text-foreground">
                                    {item.name}
                                  </p>
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-red-500 tabular-nums">
                                      {unitDiffLabel}
                                      <span className=" px-1 text-xs font-normal text-muted-foreground">
                                        / {unitLabel}
                                      </span>
                                    </p>
                                  </div>
                                  <ChevronRight className="h-4 w-4 flex-none text-muted-foreground" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </AspectRatio>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white/90 via-white/60 to-transparent transition-opacity dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-transparent ${
              showRightFade ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {hasSavings ? (
          <>
            <Separator className="my-3" />
            <p className="text-muted-foreground">
              Economies totales possible :{" "}
              <span className="text-green-500">
                {monthlyEuroFormatter.format(Math.round(totalMonthlySavings))}€
              </span>{" "}
              / mois
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
