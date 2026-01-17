import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AreaChart as AreaChartBlock } from "@/components/blocks/area-chart"
import { DoubleDatePicker } from "@/components/blocks/double-datepicker"
import MultipleCombobox from "@/components/ui/multiple_combobox"
import { Badge } from "@/components/ui/badge"
import { useEstablishment } from "@/context/EstablishmentContext"
import api from "@/lib/axiosClient"
import { useInvoiceItemHistory, formatEuroFromNumber } from "@/pages/dashboard/invoices/api"
import { useAccess } from "@/components/access/access-control"
import type { LatestVariation } from "../types"
import { formatters } from "../api"
import { EmptyState } from "./empty-state"

type LatestVariationsCardProps = {
  items: LatestVariation[]
  onDismissVariation?: (masterArticleId: string) => void
  onDismissAll?: () => void
}

export function LatestVariationsCard({
  items,
  onDismissVariation,
  onDismissAll,
}: LatestVariationsCardProps) {
  const { role } = useAccess()
  const isStaffOrAccountant = role === "staff" || role === "accountant"
  const { estId } = useEstablishment()
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const variationsScrollRef = useRef<HTMLDivElement | null>(null)
  const [showBottomFade, setShowBottomFade] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [chartItem, setChartItem] = useState<LatestVariation | null>(null)
  const [historyItems, setHistoryItems] = useState<
    {
      id: string
      masterArticleId: string
      article: string
      supplier: string
      supplierId: string | null
      date: string
      changePercent: number
      changeEuro: number | null
      unitPrice: number | null
      isDeleted: boolean
    }[]
  >([])
  const [supplierOptions, setSupplierOptions] = useState<
    { value: string; label: string }[]
  >([])
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{
    startDate?: Date
    endDate?: Date
  }>(() => {
    const end = new Date()
    const start = new Date(end)
    start.setMonth(start.getMonth() - 3)
    return { startDate: start, endDate: end }
  })

  const handleDismiss = async (masterArticleId: string) => {
    if (!onDismissVariation) return
    setPendingIds((prev) => {
      const next = new Set(prev)
      next.add(masterArticleId)
      return next
    })
    try {
      await onDismissVariation(masterArticleId)
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(masterArticleId)
        return next
      })
    }
  }

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

  const fallbackDate = chartItem?.date ? new Date(chartItem.date) : new Date()
  const { history, isLoading: chartHistoryLoading } = useInvoiceItemHistory({
    estId,
    masterArticleId: chartItem?.masterArticleId ?? null,
    fallbackDate,
    unitPrice:
      chartItem?.unitPrice !== null && chartItem?.unitPrice !== undefined
        ? String(chartItem.unitPrice)
        : undefined,
    enabled: Boolean(chartItem),
  })

  const changeFormatter = (value: number) =>
    !Number.isFinite(value) || value === 0
      ? "-%"
      : `${value > 0 ? "+" : ""}${value.toFixed(1).replace(".", ",")}%`
  const primaryValue = history.length ? history[history.length - 1]?.value ?? 0 : 0

  const loadHistory = useMemo(
    () => async (range: { startDate?: Date; endDate?: Date }) => {
      if (!estId) return
      setHistoryLoading(true)
      try {
        const [variationsRes, masterRes, suppliersRes] = await Promise.all([
          api.get("/variations", {
            params: {
              establishment_id: estId,
              order_by: "date",
              direction: "desc",
              limit: 2000,
              ...(range.startDate
                ? { date_gte: range.startDate.toISOString().slice(0, 10) }
                : {}),
              ...(range.endDate
                ? { date_lte: range.endDate.toISOString().slice(0, 10) }
                : {}),
            },
          }),
          api.get("/master_articles", {
            params: {
              establishment_id: estId,
              order_by: "unformatted_name",
              direction: "asc",
              limit: 2000,
            },
          }),
          api.get("/suppliers", {
            params: {
              establishment_id: estId,
              order_by: "name",
              direction: "asc",
              limit: 2000,
            },
          }),
        ])

        const variations = Array.isArray(variationsRes.data) ? variationsRes.data : []
        const masters = Array.isArray(masterRes.data) ? masterRes.data : []
        const suppliers = Array.isArray(suppliersRes.data) ? suppliersRes.data : []

        const masterById = new Map<string, { name?: string; unformatted_name?: string; supplier_id?: string | null }>(
          masters.map((item: { id: string; name?: string; unformatted_name?: string; supplier_id?: string | null }) => [
            item.id,
            item,
          ])
        )
        const supplierById = new Map<string, { name?: string }>(
          suppliers.map((item: { id: string; name?: string }) => [item.id, item])
        )

        setSupplierOptions(
          suppliers.map((item: { id: string; name?: string }) => ({
            value: item.id,
            label: item.name || "Fournisseur",
          }))
        )

        const mapped = variations.map(
          (item: {
            id: string
            master_article_id: string
            date: string
            percentage: number
            old_unit_price?: number | null
            new_unit_price?: number | null
            is_deleted?: boolean | null
          }) => {
            const master = masterById.get(item.master_article_id)
            const supplierId = master?.supplier_id ?? null
            const supplier = supplierId ? supplierById.get(supplierId) : undefined
            const oldPrice =
              typeof item.old_unit_price === "number" ? item.old_unit_price : null
            const newPrice =
              typeof item.new_unit_price === "number" ? item.new_unit_price : null
            const changeEuro =
              oldPrice !== null && newPrice !== null ? newPrice - oldPrice : null
            return {
              id: item.id,
              masterArticleId: item.master_article_id,
              article: master?.name || master?.unformatted_name || "Article",
              supplier: supplier?.name || "Fournisseur",
              supplierId,
              date: item.date,
              changePercent: Number(item.percentage) || 0,
              changeEuro,
              unitPrice: newPrice,
              isDeleted: Boolean(item.is_deleted),
            }
          }
        )

        setHistoryItems(
          mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        )
      } finally {
        setHistoryLoading(false)
      }
    },
    [estId]
  )

  useEffect(() => {
    if (!historyOpen) return
    loadHistory(dateRange)
  }, [dateRange, historyOpen, loadHistory])

  const filteredHistory = useMemo(() => {
    if (!supplierFilter) return historyItems
    return historyItems.filter((item) => item.supplierId === supplierFilter)
  }, [historyItems, supplierFilter])

  return (
    <Card className="md:col-span-4">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <CardTitle>Dernières variations</CardTitle>
          {!isStaffOrAccountant && (
            <Button
              type="button"
              variant="link"
              className="h-6 cursor-pointer p-0 text-muted-foreground hover:text-destructive"
              onClick={async () => {
                if (!onDismissAll) return
                setPendingIds(new Set(items.map((item) => item.masterArticleId)))
                try {
                  await onDismissAll()
                } finally {
                  setPendingIds(new Set())
                }
              }}
              disabled={!items.length}
            >
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
                items
                  .filter((item) => !pendingIds.has(item.masterArticleId))
                  .map((item) => {
                  const isDown = item.changePercent < 0
                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2 shadow-sm hover:bg-muted/60 cursor-pointer"
                      onClick={() => setChartItem(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          setChartItem(item)
                        }
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
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
                        <div className="min-w-0 space-y-0">
                          <p className="truncate text-sm text-foreground">{item.article}</p>
                          <p className="text-xs text-muted-foreground">{item.supplier}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-self-end">
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
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleDismiss(item.masterArticleId)
                            }}
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
        <div className="mt-3">
          <Button
            type="button"
            variant="link"
            className="h-6 cursor-pointer p-0 text-muted-foreground hover:text-primary"
            onClick={() => setHistoryOpen(true)}
          >
            Consulter l&apos;historique de variation
          </Button>
        </div>
      </CardContent>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="!w-[min(820px,92vw)] !max-w-none">
          <DialogHeader>
            <DialogTitle>Historique des variations</DialogTitle>
            <DialogDescription>
              Retrouvez toutes les variations de votre établissement, filtrables par fournisseur et période.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex flex-col gap-2">
                <MultipleCombobox
                  label="Fournisseur"
                  items={supplierOptions}
                  value={supplierFilter ? [supplierFilter] : []}
                  onChange={(values) => {
                    const next = values[values.length - 1]
                    setSupplierFilter(next ?? null)
                  }}
                  placeholder="Tous les fournisseurs"
                  maxShownItems={1}
                  className="w-full sm:w-[260px]"
                />
              </div>
              <DoubleDatePicker
                className="w-full xl:w-auto"
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                startLabel="Du"
                endLabel="Au"
                onChange={(value) => setDateRange(value)}
                displayFormat="short"
              />
            </div>

            <div className="rounded-lg border bg-muted/30">
              <ScrollArea className="h-[360px] max-h-[50vh]">
                <div className="divide-y divide-border/60">
                  {historyLoading ? (
                    <div className="p-4 text-sm text-muted-foreground">Chargement…</div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      Aucune variation sur la période sélectionnée.
                    </div>
                  ) : (
                    filteredHistory.map((item) => (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        className="grid grid-cols-[minmax(0,1fr)_96px_96px_120px] items-center gap-4 p-3 text-sm cursor-pointer hover:bg-muted/40"
                        onClick={() => {
                          setChartItem({
                            id: item.id,
                            masterArticleId: item.masterArticleId,
                            article: item.article,
                            supplier: item.supplier,
                            date: item.date,
                            unitPrice: item.unitPrice,
                            changePercent: item.changePercent,
                          })
                          setHistoryOpen(false)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            setChartItem({
                              id: item.id,
                              masterArticleId: item.masterArticleId,
                              article: item.article,
                              supplier: item.supplier,
                              date: item.date,
                              unitPrice: item.unitPrice,
                              changePercent: item.changePercent,
                            })
                            setHistoryOpen(false)
                          }
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm ${
                              item.changePercent < 0 ? "border-green-200/60" : "border-red-200/60"
                            }`}
                          >
                            {item.changePercent < 0 ? (
                              <ArrowDown className="h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowUp className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium leading-tight text-foreground">
                              {item.article}
                            </p>
                            <p className="text-xs text-muted-foreground">{item.supplier}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end text-right">
                          <Badge
                            variant="secondary"
                            className={`inline-flex min-w-[72px] justify-center border text-sm font-medium ${
                              item.changePercent < 0
                                ? "border-green-500/20 bg-green-500/10 text-green-500"
                                : "border-red-500/20 bg-red-500/10 text-red-600"
                            }`}
                          >
                            {item.changePercent > 0 ? "+" : ""}
                            {formatters.formatPercentValue(item.changePercent)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-end text-right">
                          <span className="text-sm text-muted-foreground">
                            {item.changeEuro !== null ? (
                              <>
                                {item.changeEuro > 0 ? "+" : ""}
                                {item.changeEuro.toLocaleString("fr-FR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 3,
                                })}{" "}
                                €
                              </>
                            ) : (
                              "--"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-end text-right">
                          <span className="text-sm text-muted-foreground">
                            {item.date
                              ? new Intl.DateTimeFormat("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }).format(new Date(item.date))
                              : "--"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(chartItem)}
        onOpenChange={(open) => {
          if (!open) setChartItem(null)
        }}
      >
        <DialogContent className="w-full sm:w-[1020px] max-w-[98vw] sm:!max-w-[1100px]">
          {chartItem && chartHistoryLoading ? (
            <div className="text-sm text-muted-foreground">Chargement…</div>
          ) : chartItem ? (
            <AreaChartBlock
              data={history}
              title={`Prix unitaire - ${chartItem.article}`}
              subtitle="Évolution du prix unitaire sur la période"
              primaryValue={primaryValue}
              primaryValueFormatter={(v) => formatEuroFromNumber(v)}
              changePercent={chartItem.changePercent}
              changeFormatter={changeFormatter}
              positiveChangeClassName="text-red-500"
              negativeChangeClassName="text-green-500"
              currency="EUR"
              defaultInterval="day"
              showDatePicker
              showIntervalTabs
              enableZoom
              minYPadding={2}
              variant="bare"
              areaColor="var(--chart-1)"
              tooltipLabel="Prix unitaire"
              tooltipValueFormatter={(v) => formatEuroFromNumber(v)}
              yTickFormatter={(v) => formatEuroFromNumber(v)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
