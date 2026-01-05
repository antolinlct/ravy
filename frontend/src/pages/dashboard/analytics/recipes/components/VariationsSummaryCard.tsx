import { useEffect, useRef } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { RecipeKpi, RecipeVariation } from "../types"

export type VariationsSummaryCardProps = {
  activeRecipesCount: number
  inactiveRecipesCount: number
  variations: RecipeVariation[]
  kpis: RecipeKpi[]
  euroFormatter: Intl.NumberFormat
  percentFormatter: Intl.NumberFormat
  percentValueFormatter: Intl.NumberFormat
}

export const VariationsSummaryCard = ({
  activeRecipesCount,
  inactiveRecipesCount,
  variations,
  kpis,
  euroFormatter,
  percentFormatter,
  percentValueFormatter,
}: VariationsSummaryCardProps) => {
  const variationsTickerRef = useRef<HTMLDivElement | null>(null)
  const variationsTickerTrackRef = useRef<HTMLDivElement | null>(null)

  const shouldAnimate = variations.length > 3

  useEffect(() => {
    const root = variationsTickerRef.current
    const track = variationsTickerTrackRef.current
    if (!root || !track || !shouldAnimate) {
      if (track) {
        track.style.willChange = ""
        track.style.transform = ""
      }
      return
    }

    let frameId = 0
    let lastTime = 0
    const speed = 18
    let offset = 0

    track.style.willChange = "transform"

    const tick = (time: number) => {
      if (!lastTime) lastTime = time
      const delta = time - lastTime
      lastTime = time

      const loopWidth = track.scrollWidth / 2
      if (loopWidth > 0 && loopWidth > root.clientWidth) {
        offset -= (delta * speed) / 1000
        if (Math.abs(offset) >= loopWidth) {
          offset = 0
        }
        track.style.transform = `translateX(${offset}px)`
      }

      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(frameId)
      track.style.willChange = ""
      track.style.transform = ""
    }
  }, [shouldAnimate, variations.length])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="bg-background">
          <CardContent className="space-y-5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Variations de vos recettes sur 30 jours</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2">
                <span>Recettes actives</span>
                <Badge variant="secondary" className="text-xs font-medium">
                  {activeRecipesCount}
                </Badge>
                <span>-</span>
                <span>Recettes inactives</span>
                <Badge variant="secondary" className="text-xs font-medium">
                  {inactiveRecipesCount}
                </Badge>
              </CardDescription>
            </div>
            <div className="overflow-hidden">
              {variations.length ? (
                <div ref={variationsTickerRef} className="relative h-12 w-full overflow-hidden">
                  <div
                    ref={variationsTickerTrackRef}
                    className="absolute left-0 top-0 flex w-max items-center gap-3 pr-6"
                  >
                    {(shouldAnimate ? [...variations, ...variations] : variations).map((item, index) => {
                      const change = item.changePercent
                      const isDown = typeof change === "number" && change < 0
                      const changeLabel =
                        typeof change !== "number"
                          ? "--"
                          : `${change > 0 ? "+" : ""}${change.toFixed(1).replace(".", ",")}%`
                      const marginLabel =
                        typeof item.marginPercent !== "number"
                          ? "--"
                          : `${item.marginPercent.toFixed(1).replace(".", ",")}%`
                      return (
                        <div
                          key={`${item.id}-${index}`}
                          className="flex min-w-[220px] flex-none items-end justify-between gap-3 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm ${
                                isDown ? "border-red-200/60" : "border-green-200/60"
                              }`}
                            >
                              {isDown ? (
                                <ArrowDown className="h-4 w-4 text-red-500" />
                              ) : (
                                <ArrowUp className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <div className="space-y-0">
                              <p className="text-sm text-foreground">{item.recipe}</p>
                              <p className="text-xs text-muted-foreground">Marge actuelle : {marginLabel}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-semibold ${isDown ? "text-red-500" : "text-green-500"}`}>
                            {changeLabel}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex h-12 items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
                  Aucune variation récente disponible.
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map((item) => {
                const delta = item.delta
                const isUp = typeof delta === "number" && delta >= 0
                const deltaLabel = typeof delta !== "number" ? "--" : percentFormatter.format(delta)
                const valueLabel =
                  typeof item.value !== "number"
                    ? "--"
                    : item.format === "currency"
                      ? euroFormatter.format(item.value)
                      : item.format === "percent"
                        ? `${percentValueFormatter.format(item.value)}%`
                        : percentValueFormatter.format(item.value)

                return (
                  <Card key={item.id} className="border-0 bg-muted/40 rounded-md shadow-none">
                    <CardContent className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-lg font-semibold tabular-nums">{valueLabel}</span>
                          {typeof delta !== "number" ? (
                            <span className="text-sm text-muted-foreground">--</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {isUp ? (
                                <ArrowUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowDown className="h-4 w-4 text-red-500" />
                              )}
                              <span className={`text-sm font-semibold ${isUp ? "text-green-500" : "text-red-500"}`}>
                                {deltaLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} className="max-w-[280px] text-center">
        Variations des 30 derniers jours, uniquement pour les recettes actives et vendables.
      </TooltipContent>
    </Tooltip>
  )
}
