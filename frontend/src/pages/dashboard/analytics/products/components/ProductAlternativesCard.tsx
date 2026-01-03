import { useEffect, useRef, useState } from "react"
import { BrainCircuit } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { AlternativeItem } from "../types"

export type ProductAlternativesCardProps = {
  alternatives: AlternativeItem[]
  euroFormatter: Intl.NumberFormat
}

export const ProductAlternativesCard = ({ alternatives, euroFormatter }: ProductAlternativesCardProps) => {
  const alternativesScrollRef = useRef<HTMLDivElement | null>(null)
  const [showAlternativesBottomFade, setShowAlternativesBottomFade] = useState(false)

  useEffect(() => {
    const root = alternativesScrollRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
    if (!viewport) return

    const updateBottomFade = () => {
      const maxScrollTop = viewport.scrollHeight - viewport.clientHeight
      setShowAlternativesBottomFade(maxScrollTop > 0 && viewport.scrollTop < maxScrollTop - 4)
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
    <Card className="lg:col-span-2">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Produits alternatifs</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-xs font-medium">
                  <BrainCircuit className="mr-1 h-3.5 w-3.5" />
                  Version bêta
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                Notre IA travaille à améliorer la pertinence des alternatives proposées.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground">Alternatives potentielles au produit analysé</p>
        </div>
        <div className="flex h-[304px] flex-col overflow-hidden">
          <div className="relative flex-1 min-h-0" ref={alternativesScrollRef}>
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {alternatives.length ? (
                  alternatives.map((item, index) => (
                    <div
                      key={item.id || `alt-${index}`}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-muted/60 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.supplier}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-sm font-semibold">
                          {item.price !== null ? euroFormatter.format(item.price) : "--"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                    Aucune alternative trouvée pour ce produit.
                  </div>
                )}
              </div>
            </ScrollArea>
            <div
              className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/90 via-white/60 to-transparent transition-opacity dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-transparent ${
                showAlternativesBottomFade ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
