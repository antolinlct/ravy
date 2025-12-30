import { useEffect, useRef } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent, CardDescription } from "@/components/ui/card"

export type VariationTickerItem = {
  id: string
  article: string
  supplier: string
  change: string
  isDown: boolean
}

export const VariationsTickerCard = ({ items }: { items: VariationTickerItem[] }) => {
  const variationsTickerRef = useRef<HTMLDivElement | null>(null)
  const variationsTickerTrackRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const root = variationsTickerRef.current
    const track = variationsTickerTrackRef.current
    if (!root || !track) return

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
  }, [items.length])

  return (
    <Card className="bg-background">
      <CardContent className="p-4">
        <CardDescription>Dernières variations</CardDescription>
        {items.length ? (
          <div className="mt-1 overflow-hidden">
            <div ref={variationsTickerRef} className="relative h-12 w-full overflow-hidden">
              <div
                ref={variationsTickerTrackRef}
                className="absolute left-0 top-0 flex w-max items-center gap-3 pr-6"
              >
                {[...items, ...items].map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex min-w-[220px] flex-none items-end justify-between gap-3 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm ${
                          item.isDown ? "border-green-200/60" : "border-red-200/60"
                        }`}
                      >
                        {item.isDown ? (
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
                    <span className={`text-sm font-semibold ${item.isDown ? "text-green-500" : "text-red-500"}`}>
                      {item.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex h-12 items-center justify-center text-sm text-muted-foreground">
            Aucune variation récente sur la période.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
