import { useEffect, useMemo, useRef, useState } from "react"
import { useUser } from "@/context/UserContext"
import { Link } from "react-router-dom"
import {
  ArrowDown,
  ArrowUp,
  ChefHat,
  ArrowRight,
  ChevronRight,
  HandCoins,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Separator } from "@/components/ui/separator"
import { AreaChart as AreaChartBlock } from "@/components/blocks/area-chart"

export default function DashboardHomePage() {
  const user = useUser()
  const variationsScrollRef = useRef<HTMLDivElement | null>(null)
  const productsScrollRef = useRef<HTMLDivElement | null>(null)
  const [showVariationsBottomFade, setShowVariationsBottomFade] = useState(false)
  const [showProductsRightFade, setShowProductsRightFade] = useState(false)
  const displayName = useMemo(() => {
    const full = user?.fullName?.trim()
    if (full) {
      const [first] = full.split(" ")
      return first || full
    }
    return "l'équipe Ravy"
  }, [user?.fullName])
  const currentMonth = useMemo(() => {
    const formatted = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date())
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }, [])
  const diffNumberFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )
  const monthlyEuroFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  )

  const invoiceStats = [
    { name: "Factures importées", value: "18" },
    { name: "TVA collectée", value: "6 120 €" },
    { name: "Dépenses HT", value: "24 300 €" },
  ]

  const latestVariations = [
    { article: "Eau gazeuse 33cl", supplier: "Sysco France", change: "+2,3%" },
    { article: "Filet de poulet", supplier: "Transgourmet", change: "-1,4%" },
    { article: "Beurre AOP 250g", supplier: "France Boissons", change: "+0,9%" },
    { article: "Frites surgelées", supplier: "Brake", change: "-2,1%" },
    { article: "Café moulu 1kg", supplier: "Metro", change: "+1,8%" },
    { article: "Huile d'olive 5L", supplier: "Transgourmet", change: "-0,7%" },
    { article: "Steak haché 15%", supplier: "Sysco France", change: "+3,2%" },
    { article: "Vin rouge AOP", supplier: "France Boissons", change: "-1,9%" },
    { article: "Sucre 5kg", supplier: "Metro", change: "+0,5%" },
    { article: "Lait UHT 1L", supplier: "Brake", change: "-1,2%" },
  ]

  const overpricedProducts = [
    {
      id: "p-1",
      name: "Filet de poulet (origine France) 1kg",
      supplier: "Transgourmet",
      unitPaid: 8.9,
      unitMarket: 8.2,
      monthlyQty: 64,
      unit: "kg",
    },
    {
      id: "p-2",
      name: "Eau gazeuse 33cl (pack de 24)",
      supplier: "Sysco France",
      unitPaid: 0.48,
      unitMarket: 0.39,
      monthlyQty: 420,
      unit: "u",
    },
    {
      id: "p-3",
      name: "Beurre AOP 250g",
      supplier: "France Boissons",
      unitPaid: 2.25,
      unitMarket: 1.95,
      monthlyQty: 120,
      unit: "u",
    },
    {
      id: "p-4",
      name: "Café moulu 1kg (arabica)",
      supplier: "Metro",
      unitPaid: 12.4,
      unitMarket: 11.2,
      monthlyQty: 18,
      unit: "kg",
    },
    {
      id: "p-5",
      name: "Frites surgelées 2,5kg",
      supplier: "Brake",
      unitPaid: 6.5,
      unitMarket: 5.95,
      monthlyQty: 52,
      unit: "kg",
    },
    {
      id: "p-6",
      name: "Huile d'olive 5L",
      supplier: "Transgourmet",
      unitPaid: 36.9,
      unitMarket: 33.5,
      monthlyQty: 6,
      unit: "l",
    },
    {
      id: "p-7",
      name: "Steak haché 15% 10kg",
      supplier: "Sysco France",
      unitPaid: 89,
      unitMarket: 82.5,
      monthlyQty: 5,
      unit: "kg",
    },
    {
      id: "p-8",
      name: "Sucre 5kg",
      supplier: "Metro",
      unitPaid: 5.9,
      unitMarket: 5.2,
      monthlyQty: 14,
      unit: "kg",
    },
  ] as const

  const totalMonthlySavings = overpricedProducts.reduce((sum, item) => {
    const unitDiff = item.unitPaid - item.unitMarket
    return sum + Math.max(0, unitDiff) * item.monthlyQty
  }, 0)

  const recipeMargins = useMemo(
    () => [
      { id: "r-1", name: "Tarte pralines", marginValue: 98.26, margin: "98,26%", active: true, saleable: true },
      { id: "r-2", name: "Salade Lyonnaise XL", marginValue: 79.65, margin: "79,65%", active: false, saleable: true },
      { id: "r-3", name: "Pâte à tarte", marginValue: null, margin: "—", active: false, saleable: false },
      { id: "r-4", name: "Tarte citron", marginValue: 86.14, margin: "86,14%", active: true, saleable: true },
      { id: "r-5", name: "Brownie chocolat", marginValue: 86.92, margin: "86,92%", active: true, saleable: true },
      { id: "r-6", name: "Crème brûlée", marginValue: 72.18, margin: "72,18%", active: true, saleable: true },
      { id: "r-7", name: "Soupe courge", marginValue: 68.5, margin: "68,50%", active: true, saleable: true },
    ],
    []
  )

  const marginSeries = useMemo(() => {
    const today = new Date()
    const days = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - idx))
      return d
    })
    const samples = [68.5, 69.1, 70.2, 70.9, 71.3, 71.9, 72.4]
    return days.map((d, idx) => ({
      date: d.toISOString().slice(0, 10),
      value: samples[idx] ?? samples[samples.length - 1],
    }))
  }, [])

  const marginData = useMemo(() => marginSeries.slice(-5), [marginSeries])

  const formatShortDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  }

  const topLowMargin = useMemo(() => {
    return recipeMargins
      .filter((r) => r.active && r.saleable && r.marginValue !== null)
      .sort((a, b) => (a.marginValue ?? 0) - (b.marginValue ?? 0))
      .slice(0, 5)
  }, [recipeMargins])

  useEffect(() => {
    const root = variationsScrollRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
    if (!viewport) return

    const updateBottomFade = () => {
      const maxScrollTop = viewport.scrollHeight - viewport.clientHeight
      setShowVariationsBottomFade(maxScrollTop > 0 && viewport.scrollTop < maxScrollTop - 4)
    }

    updateBottomFade()
    viewport.addEventListener("scroll", updateBottomFade, { passive: true })
    window.addEventListener("resize", updateBottomFade)

    return () => {
      viewport.removeEventListener("scroll", updateBottomFade)
      window.removeEventListener("resize", updateBottomFade)
    }
  }, [])

  useEffect(() => {
    const root = productsScrollRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
    if (!viewport) return

    const updateRightFade = () => {
      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth
      setShowProductsRightFade(maxScrollLeft > 0 && viewport.scrollLeft < maxScrollLeft - 4)
    }
    updateRightFade()

    const onWheel = (event: WheelEvent) => {
      if (viewport.scrollWidth <= viewport.clientWidth) return
      if (event.ctrlKey) return

      // Always map vertical wheel movement to horizontal scroll on this block.
      // This avoids "inconsistent" feel where some wheel events end up scrolling the page.
      let delta = event.deltaY
      if (!delta) delta = event.deltaX
      if (!delta) return

      // Keep a "classic" and consistent feel: just normalize deltaMode to pixels.
      // deltaMode: 0=pixels, 1=lines, 2=pages
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
    <div className="flex w-full items-start justify-start">
      <div className="w-full space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">Bonjour, {displayName} !</h1>
            </div>
            <p className="text-muted-foreground">Clarté, contrôle et suivi des coûts en un coup d&apos;oeil.</p>
          </div>
        </header>

        <Card className="w-full shadow-sm bg-background">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <CardDescription className="text-sm tracking-wide text-muted-foreground">
                  {currentMonth}
                </CardDescription>
                <CardTitle className="text-xl">Résumé financier</CardTitle>
              </div>
              <dl className="grid w-full gap-4 sm:grid-cols-3 sm:max-w-2xl">
                {invoiceStats.map((item) => (
                  <Card key={item.name} className="p-0 rounded-md">
                    <CardContent className="p-3">
                      <dd className="flex flex-col gap-1">
                        <span className="truncate text-xs text-muted-foreground">{item.name}</span>
                        <span className="text-xl font-semibold self-end text-primary">{item.value}</span>
                      </dd>
                    </CardContent>
                  </Card>
                ))}
              </dl>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-10">
          <Card className="md:col-span-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <CardTitle>Dernières variations</CardTitle>
                <Button variant="link" className="text-muted-foreground hover:text-destructive p-0 h-6">
                  Tout supprimer
                </Button>
              </div>
              <CardDescription className="mt-1">
                Suivi des articles dont les prix ont récemment varié.
              </CardDescription>
              <div className="relative mt-4">
                <ScrollArea ref={variationsScrollRef} className="h-67">
                  <div className="space-y-2">
                    {latestVariations.map((item) => {
                      const isDown = item.change.startsWith("-")
                      return (
                        <div
                          key={item.article}
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
                              className={`text-sm font-semibold ${isDown ? "text-green-500" : "text-red-500"}`}
                            >
                              {item.change}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
                <div
                  className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/90 via-white/60 to-transparent transition-opacity dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-transparent ${
                    showVariationsBottomFade ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <CardTitle>Produits à optimiser</CardTitle>
                <Button variant="link" className="p-0 h-6 text-muted-foreground hover:text-foreground">
                  Voir l&apos;analyse
                </Button>
              </div>
              <CardDescription className="mt-1">
                Produits dont le prix d&apos;achat est au-dessus du marché.
              </CardDescription>

              <div className="relative mt-4">
                <ScrollArea ref={productsScrollRef} className="w-full" scrollbar="horizontal">
                  <div className="flex w-max gap-3">
                    {overpricedProducts.map((item) => {
                      const unitDiff = item.unitPaid - item.unitMarket
                      const monthlySavings = Math.max(0, unitDiff) * item.monthlyQty
                      const monthlySavingsLabel = `+${monthlyEuroFormatter.format(Math.round(monthlySavings))}€ / mois`
                      const unitDiffLabel = `${unitDiff >= 0 ? "+" : "-"}${diffNumberFormatter.format(
                        Math.abs(unitDiff)
                      )}€`
                      return (
                        <div key={item.id} className="w-44 flex-none">
                          <AspectRatio ratio={4 / 5}>
                            <Link
                              to="/dashboard/analytics/products"
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
                                            / {item.unit.toUpperCase()}
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
                </ScrollArea>
                <div
                  className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white/90 via-white/60 to-transparent transition-opacity dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-transparent ${
                    showProductsRightFade ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>

              <Separator className="my-3" />

              <p className="text-muted-foreground">
                Economies totales possible :{" "}
                <span className="text-green-500">
                  {monthlyEuroFormatter.format(Math.round(totalMonthlySavings))}€
                </span>{" "}
                / mois
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-10">
          <Card className="md:col-span-6 h-full">
            <CardContent className="p-6 gap-4 flex flex-col h-full">
              <div className="flex items-center justify-between">
                <CardTitle>Marge moyenne de vos recettes</CardTitle>
                <p className="text-xs text-muted-foreground"> 5 dernières dates </p>
              </div>
              <div className="mt-6 w-full">
                <AreaChartBlock
                  data={marginData}
                  variant="bare"
                  showHeader={false}
                  defaultInterval="day"
                  showDatePicker={false}
                  showIntervalTabs={false}
                  enableZoom={false}
                  enableWheelZoom={false}
                  minYPadding={2}
                  height={280}
                  areaColor="var(--chart-1)"
                  tooltipLabel="Marge"
                  tooltipValueFormatter={(v) => `${diffNumberFormatter.format(v)}%`}
                  xTickFormatter={(date) =>
                    formatShortDate(date instanceof Date ? date.toISOString().slice(0, 10) : `${date}`)
                  }
                  yTickFormatter={(value) => `${Math.round(value)}%`}
                  xAxisProps={{
                    interval: 0,
                  }}
                  chartClassName="h-[290px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <CardTitle>Top 5 recettes à optimiser</CardTitle>
                <Button variant="link" className="p-0 h-6 text-muted-foreground hover:text-foreground">
                  Voir plus
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {topLowMargin.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 hover:bg-muted/60 px-3 py-2 shadow-sm"
                  >
                    <div className="flex flex-col">
                      <p className="text-sm text-foreground">{recipe.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {recipe.margin}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowRight className="h-4 w-4 text-[#848484]" color="#848484" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
