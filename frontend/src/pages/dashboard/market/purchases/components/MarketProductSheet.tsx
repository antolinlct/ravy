import { ArrowDown, ArrowUp } from "lucide-react"

import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { MarketProductRow } from "../types"

export type ProductMetrics = {
  avgPrice: number | null
  lastPrice: number | null
  updatedAt: string | null
  variation: number | null
  volatility: { min: number; max: number } | null
  interest: number | null
  recommendation: string | null
}

export type ConsultantNote = {
  title: string
  message: string
}

export type InterestTone = {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  className: string
}

export type MarketProductSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedProduct: MarketProductRow | null
  selectedProductMetrics: ProductMetrics | null
  unitPriceFormatter: Intl.NumberFormat
  euroFormatter: Intl.NumberFormat
  consultantNote: ConsultantNote | null
  consultantAvatarSrc: string
  getInterestTone: (interest: number) => InterestTone
}

export function MarketProductSheet({
  open,
  onOpenChange,
  selectedProduct,
  selectedProductMetrics,
  unitPriceFormatter,
  euroFormatter,
  consultantNote,
  consultantAvatarSrc,
  getInterestTone,
}: MarketProductSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{selectedProduct?.productLabel ?? "Détail du produit"}</SheetTitle>
          <SheetDescription>
            {selectedProduct
              ? selectedProduct.supplierLabel
              : "Sélectionnez un produit pour afficher les détails."}
          </SheetDescription>
        </SheetHeader>
        {selectedProduct ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-md border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Volatilité</span>
                <span className="text-sm text-muted-foreground">
                  {selectedProductMetrics?.volatility
                    ? `${euroFormatter.format(
                        selectedProductMetrics.volatility.min
                      )} → ${euroFormatter.format(selectedProductMetrics.volatility.max)}`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Prix moyen</span>
                <div className="flex items-center gap-3">
                  {selectedProductMetrics?.avgPrice !== null &&
                  selectedProductMetrics?.avgPrice !== undefined ? (
                    <Badge variant="secondary" className="px-2.5 py-0.5 text-sm font-semibold">
                      {unitPriceFormatter.format(selectedProductMetrics.avgPrice)}€
                      <span className="ml-1 text-sm text-muted-foreground">
                        /{selectedProduct.unit}
                      </span>
                    </Badge>
                  ) : (
                    <span className="text-sm text-foreground">—</span>
                  )}
                  {selectedProductMetrics?.variation === null ||
                  selectedProductMetrics?.variation === undefined ? (
                    <span className="text-sm text-foreground">—</span>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-sm font-medium",
                        selectedProductMetrics.variation > 0
                          ? "text-red-500"
                          : selectedProductMetrics.variation < 0
                            ? "text-green-500"
                            : "text-muted-foreground"
                      )}
                    >
                      {selectedProductMetrics.variation > 0 ? (
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                      ) : selectedProductMetrics.variation < 0 ? (
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                      ) : null}
                      {selectedProductMetrics.variation > 0 ? "+" : ""}
                      {selectedProductMetrics.variation.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  {selectedProductMetrics?.updatedAt
                    ? `Prix au ${selectedProductMetrics.updatedAt}`
                    : "Prix au —"}
                </span>
                <span className="text-sm text-foreground">
                  {selectedProductMetrics?.lastPrice !== null &&
                  selectedProductMetrics?.lastPrice !== undefined
                    ? `${unitPriceFormatter.format(selectedProductMetrics.lastPrice)}€/${selectedProduct.unit}`
                    : "—"}
                </span>
              </div>
            </div>
            <div className="rounded-md bg-muted/10 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Acheté par</span>
                {selectedProductMetrics?.interest !== null &&
                selectedProductMetrics?.interest !== undefined ? (
                  (() => {
                    const tone = getInterestTone(selectedProductMetrics.interest)
                    const Icon = tone.icon
                    const count = Math.max(
                      1,
                      Math.round((selectedProductMetrics.interest / 100) * 120)
                    )
                    return (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-sm font-medium",
                          tone.className
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                        {count} restaurants / 120
                      </span>
                    )
                  })()
                ) : (
                  <span className="text-sm text-foreground">—</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Recommandations</span>
                {selectedProductMetrics?.recommendation ? (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                      selectedProductMetrics.recommendation === "Bon prix"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : selectedProductMetrics.recommendation === "Très demandé"
                          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300"
                          : selectedProductMetrics.recommendation === "À surveiller"
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                            : selectedProductMetrics.recommendation === "Prix instable"
                              ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                              : selectedProductMetrics.recommendation === "Intérêt faible"
                                ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300"
                                : selectedProductMetrics.recommendation === "Données anciennes"
                                  ? "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300"
                                  : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300"
                    )}
                  >
                    {selectedProductMetrics.recommendation}
                  </span>
                ) : (
                  <span className="text-sm text-foreground">—</span>
                )}
              </div>
            </div>
            {consultantNote ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={consultantAvatarSrc} alt="Consultant" />
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{consultantNote.title}</p>
                  <p className="text-sm text-muted-foreground">{consultantNote.message}</p>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
