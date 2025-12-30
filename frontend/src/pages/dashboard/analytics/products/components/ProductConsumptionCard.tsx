import { useEffect, useRef, useState } from "react"
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
} from "lucide-react"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import MultipleCombobox from "@/components/ui/multiple_combobox"

export type ProductConsumptionItem = {
  id: string
  name: string
  supplier: string
  supplierId: string
  consumption: number
  paidPrice: number
  marketPrice: number
  deltaPct: number
  qty: string
  qtyValue: number
  unit?: string | null
  marketTrend: { from: number; to: number }
}

export type ProductEconomyInsight =
  | {
      mode: "saving"
      productName: string
      amountPerUnit: string
      unitLabel: string
      line2: string
    }
  | {
      mode: "loss"
      productName: string
      line1Lead: string
      line1Trail: string
      line1Tail: string
      line2Prefix: string
      line2Suffix: string
      monthly: string
      yearly: string
      colorClass: string
    }

export type ProductConsumptionCardProps = {
  productTop: "10" | "25" | "50" | "all"
  productTopOptions: ReadonlyArray<{ value: "10" | "25" | "50" | "all"; label: string }>
  onTopChange: (value: "10" | "25" | "50" | "all") => void
  productSuppliersOptions: Array<{ value: string; label: string }>
  productSelectedSuppliers: string[]
  onSuppliersChange: (value: string[]) => void
  productSort: "default" | "asc" | "desc"
  onSortChange: (value: "default" | "asc" | "desc") => void
  products: ProductConsumptionItem[]
  selectedProductId: string | null
  onSelectProductId: (value: string) => void
  selectedProduct: ProductConsumptionItem | null
  selectedProductEconomy: ProductEconomyInsight | null
  consultantAvatarSrc: string
  euroFormatterWith2: Intl.NumberFormat
  diffNumberFormatter: Intl.NumberFormat
}

export const ProductConsumptionCard = ({
  productTop,
  productTopOptions,
  onTopChange,
  productSuppliersOptions,
  productSelectedSuppliers,
  onSuppliersChange,
  productSort,
  onSortChange,
  products,
  selectedProductId,
  onSelectProductId,
  selectedProduct,
  selectedProductEconomy,
  consultantAvatarSrc,
  euroFormatterWith2,
  diffNumberFormatter,
}: ProductConsumptionCardProps) => {
  const productsListRef = useRef<HTMLDivElement | null>(null)
  const [showProductsListFade, setShowProductsListFade] = useState(false)

  const scrollProductItemToTop = (element: HTMLElement | null) => {
    if (!element) return
    const viewport = productsListRef.current?.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
    if (!viewport) {
      element.scrollIntoView({ block: "start", behavior: "smooth" })
      return
    }
    const elementRect = element.getBoundingClientRect()
    const viewportRect = viewport.getBoundingClientRect()
    const offset = elementRect.top - viewportRect.top
    viewport.scrollTo({ top: viewport.scrollTop + offset, behavior: "smooth" })
  }

  useEffect(() => {
    const root = productsListRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
    if (!viewport) return

    const updateBottomFade = () => {
      const maxScrollTop = viewport.scrollHeight - viewport.clientHeight
      setShowProductsListFade(maxScrollTop > 0 && viewport.scrollTop < maxScrollTop - 4)
    }

    updateBottomFade()
    viewport.addEventListener("scroll", updateBottomFade, { passive: true })
    window.addEventListener("resize", updateBottomFade)

    return () => {
      viewport.removeEventListener("scroll", updateBottomFade)
      window.removeEventListener("resize", updateBottomFade)
    }
  }, [])

  const hasProducts = products.length > 0
  const titleLabel = productTop === "all" ? "Produits consommés" : `Top ${productTop} des produits consommés`

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{titleLabel}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Suivi des produits les plus consommés et de leurs écarts de prix.
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <MultipleCombobox
              className="max-w-xs"
              placeholder="Tous les fournisseurs"
              items={productSuppliersOptions}
              value={productSelectedSuppliers}
              onChange={onSuppliersChange}
            />
            <Select value={productTop} onValueChange={(val) => onTopChange(val as typeof productTop)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {productTopOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {!hasProducts ? (
            <div className="col-span-12 flex min-h-[320px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
              Aucun résultat pour ces filtres.
            </div>
          ) : (
            <>
              <div className="lg:col-span-5">
                <div className="relative h-[360px] flex flex-col" ref={productsListRef}>
                  <div className="mb-2 flex items-center justify-between pl-3 pr-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() =>
                          onSortChange(
                            productSort === "default" ? "asc" : productSort === "asc" ? "desc" : "default"
                          )
                        }
                        aria-label="Trier par statut de prix"
                      >
                        {productSort === "default" ? (
                          <ArrowUpDown className="h-4 w-4" />
                        ) : productSort === "asc" ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                      </Button>
                      <span>Produits</span>
                    </div>
                    <span>Valeur consomm&eacute;e /mois</span>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="space-y-2 pr-4">
                      {products.map((item) => {
                        const isSelected = selectedProductId === item.id
                        const delta = item.deltaPct
                        const battery =
                          delta >= 10
                            ? { icon: BatteryLow, color: "text-red-500", ring: "border-red-200/60" }
                            : delta >= 2
                              ? { icon: BatteryLow, color: "text-orange-500", ring: "border-orange-200/60" }
                              : delta >= 0
                                ? { icon: BatteryMedium, color: "text-yellow-500", ring: "border-yellow-200/60" }
                                : { icon: BatteryFull, color: "text-green-500", ring: "border-green-200/60" }
                        return (
                          <button
                            key={item.id}
                            className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left shadow-sm transition-all ${
                              isSelected
                                ? "border-primary/40 bg-muted/60 origin-left scale-[1.02] shadow-md z-10"
                                : "bg-muted/40 hover:bg-muted/60"
                            }`}
                            onClick={(event) => {
                              onSelectProductId(item.id)
                              scrollProductItemToTop(event.currentTarget)
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm ${battery.ring}`}
                              >
                                <battery.icon className={`h-4 w-4 ${battery.color}`} />
                              </div>
                              <div className="min-w-0 text-left">
                                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.supplier}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-sm font-semibold">
                                {euroFormatterWith2.format(item.consumption)}
                              </Badge>
                              {isSelected ? <ArrowRight className="h-4 w-4 text-muted-foreground" /> : null}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                  <div
                    className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/90 via-white/60 to-transparent transition-opacity dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-transparent ${
                      showProductsListFade ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
              </div>
              <div className="lg:col-span-7">
                {selectedProduct ? (
                  <Card className="h-full shadow-none">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const delta = selectedProduct.deltaPct
                          if (delta >= 10) {
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-sm font-semibold hover:bg-red-500/10">
                                    <BatteryLow className="mr-1 h-[18px] w-[18px]" />
                                    Critique
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                                  Critique : votre prix est bien au-dessus du prix moyen du marché.
                                </TooltipContent>
                              </Tooltip>
                            )
                          }
                          if (delta >= 2) {
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-sm font-semibold hover:bg-orange-500/10">
                                    <BatteryLow className="mr-1 h-[18px] w-[18px]" />
                                    A surveiller
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                                  A surveiller : votre prix est au-dessus du prix moyen du marché.
                                </TooltipContent>
                              </Tooltip>
                            )
                          }
                          if (delta >= 0) {
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-sm font-semibold hover:bg-yellow-500/10">
                                    <BatteryMedium className="mr-1 h-[18px] w-[18px]" />
                                    Bon
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                                  Bon : votre prix est proche du prix moyen du marché.
                                </TooltipContent>
                              </Tooltip>
                            )
                          }
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-sm font-semibold hover:bg-green-500/10">
                                  <BatteryFull className="mr-1 h-[18px] w-[18px]" />
                                  Excellent
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                                Excellent : votre prix est en dessous du prix moyen du marché.
                              </TooltipContent>
                            </Tooltip>
                          )
                        })()}
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold leading-tight">{selectedProduct.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedProduct.supplier}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-xs font-medium text-muted-foreground">Prix moyen payé</p>
                          <Badge variant="secondary" className="text-base font-semibold">
                            {euroFormatterWith2.format(selectedProduct.paidPrice)}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="rounded-md bg-muted/30 p-3">
                              <p className="text-xs text-muted-foreground">Quantité vendue</p>
                              <p className="mt-2 text-sm font-semibold">{selectedProduct.qty}</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                            Quantité vendue de ce produit sur le mois dernier
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="rounded-md bg-muted/30 p-3">
                              <p className="text-xs text-muted-foreground">Décallage avec le marché</p>
                              <p
                                className={`mt-2 text-sm font-semibold flex flex-wrap items-center gap-1 ${
                                  selectedProduct.deltaPct >= 10
                                    ? "text-red-500"
                                    : selectedProduct.deltaPct >= 2
                                      ? "text-orange-500"
                                      : selectedProduct.deltaPct >= 0
                                        ? "text-yellow-500"
                                        : "text-green-500"
                                }`}
                              >
                                {selectedProduct.deltaPct > 0 ? (
                                  <ArrowUp className="h-4 w-4" />
                                ) : (
                                  <ArrowDown className="h-4 w-4" />
                                )}
                                <span>
                                  {selectedProduct.deltaPct >= 0 ? "+" : "-"}
                                  {Math.abs(selectedProduct.deltaPct).toFixed(1)}%
                                </span>
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                            {`Différence entre le montant que vous payé par ${selectedProduct.unit ?? "unité"} et le prix payé par vos concurrents.`}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="rounded-md bg-muted/30 p-3">
                              <p className="text-xs text-muted-foreground">Prix payé par le marché</p>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold">
                                  {euroFormatterWith2.format(selectedProduct.marketPrice)}
                                </p>
                                <p
                                  className={`text-sm font-semibold ${
                                    selectedProduct.deltaPct >= 10
                                      ? "text-red-500"
                                      : selectedProduct.deltaPct >= 2
                                        ? "text-orange-500"
                                        : selectedProduct.deltaPct >= 0
                                          ? "text-yellow-500"
                                          : "text-green-500"
                                  }`}
                                >
                                  <span className="text-muted-foreground">(</span>
                                  {selectedProduct.deltaPct >= 0 ? "+" : "-"}
                                  {diffNumberFormatter.format(
                                    Math.abs(selectedProduct.paidPrice - selectedProduct.marketPrice)
                                  )}
                                  €<span className="text-xs text-muted-foreground font-medium">/{selectedProduct.unit ?? "unité"}</span>
                                  <span className="text-muted-foreground">)</span>
                                </p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6} className="max-w-[260px] text-wrap text-center">
                            {`Le marché paye en moyenne ce prix par ${selectedProduct.unit ?? "unité"} avec une volatilité entre ${euroFormatterWith2.format(
                              Math.min(selectedProduct.marketTrend.from, selectedProduct.marketTrend.to)
                            )} et ${euroFormatterWith2.format(
                              Math.max(selectedProduct.marketTrend.from, selectedProduct.marketTrend.to)
                            )}.`}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="-mt-1 flex flex-col items-center">
                          <Avatar className="h-22 w-22">
                            <AvatarImage src={consultantAvatarSrc} alt="Consultant" className="bg-transparent" />
                          </Avatar>
                          <p className="text-xs text-muted-foreground -mt-2">Le consultant</p>
                        </div>
                        <div className="flex-1 rounded-md border bg-muted/20 p-3 space-y-3">
                          {selectedProductEconomy ? (
                            <>
                              {selectedProductEconomy.mode === "saving" ? (
                                <>
                                  <p className="text-sm">
                                    Vous payez le{" "}
                                    <span className="underline decoration-1 underline-offset-2">
                                      {selectedProductEconomy.productName}
                                    </span>{" "}
                                    <span className="text-green-500">
                                      {selectedProductEconomy.amountPerUnit}
                                    </span>{" "}
                                    de moins par {selectedProductEconomy.unitLabel} que le marché, bravo à vous,
                                    continuez comme ça.
                                  </p>
                                  <p className="text-sm text-muted-foreground">{selectedProductEconomy.line2}</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm">
                                    {selectedProductEconomy.line1Lead}
                                    <span className="underline decoration-1 underline-offset-2">
                                      {selectedProductEconomy.productName}
                                    </span>
                                    {selectedProductEconomy.line1Trail}
                                    <span className="text-green-500">
                                      {selectedProductEconomy.monthly}/mois
                                    </span>
                                    {selectedProductEconomy.line1Tail}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedProductEconomy.line2Prefix}
                                    <span className="font-medium text-red-500">
                                      {selectedProductEconomy.yearly}/an
                                    </span>
                                    {selectedProductEconomy.line2Suffix}
                                  </p>
                                </>
                              )}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
                    Aucun produit sélectionné.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
