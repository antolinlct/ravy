import { useEffect, useRef, useState } from "react"
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAccess } from "@/components/access/access-control"
import type { LatestVariation } from "../types"
import { formatters } from "../api"
import { EmptyState } from "./empty-state"

type LatestVariationsCardProps = {
  items: LatestVariation[]
}

export function LatestVariationsCard({ items }: LatestVariationsCardProps) {
  const { role } = useAccess()
  const isStaffOrAccountant = role === "staff" || role === "accountant"
  const variationsScrollRef = useRef<HTMLDivElement | null>(null)
  const [showBottomFade, setShowBottomFade] = useState(false)

  useEffect(() => {
    const root = variationsScrollRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
    if (!viewport) return

    const updateBottomFade = () => {
      const maxScrollTop = viewport.scrollHeight - viewport.clientHeight
      setShowBottomFade(maxScrollTop > 0 && viewport.scrollTop < maxScrollTop - 4)
    }

    updateBottomFade()
    viewport.addEventListener("scroll", updateBottomFade, { passive: true })
    window.addEventListener("resize", updateBottomFade)

    return () => {
      viewport.removeEventListener("scroll", updateBottomFade)
      window.removeEventListener("resize", updateBottomFade)
    }
  }, [])

  return (
    <Card className="md:col-span-4">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <CardTitle>Dernières variations</CardTitle>
          {!isStaffOrAccountant && (
            <Button variant="link" className="text-muted-foreground hover:text-destructive p-0 h-6">
              Tout supprimer
            </Button>
          )}
        </div>
        <CardDescription className="mt-1">
          Suivi des articles dont les prix ont récemment varié.
        </CardDescription>
        <div className="relative mt-4">
          <ScrollArea ref={variationsScrollRef} className="h-67">
            <div className="space-y-2">
              {items.length === 0 ? (
                <EmptyState message="Aucune variation a afficher." />
              ) : (
                items.map((item) => {
                  const isDown = item.changePercent < 0
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 hover:bg-muted/60 px-3 py-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm ${
                            isDown ? "border-green-200/60" : "border-red-200/60"
                          }`}
                        >
                          {isDown ? (
                            <ArrowDown className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowUp className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="space-y-0">
                          <p className="text-sm text-foreground">{item.article}</p>
                          <p className="text-xs text-muted-foreground">{item.supplier}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            isDown ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {item.changePercent > 0 ? "+" : ""}
                          {formatters.formatPercentValue(item.changePercent)}
                        </span>
                        {!isStaffOrAccountant && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/90 via-white/60 to-transparent transition-opacity dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-transparent ${
              showBottomFade ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </CardContent>
    </Card>
  )
}
