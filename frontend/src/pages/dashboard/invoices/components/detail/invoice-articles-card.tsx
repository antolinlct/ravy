import { useMemo, useState } from "react"
import { BadgeEuro, FoldHorizontal, Pencil, Percent, TicketPercent, UnfoldHorizontal, Wallet } from "lucide-react"
import { AreaChart as AreaChartBlock } from "@/components/blocks/area-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  computeUnitPriceGross,
  formatCurrencyDisplay,
  formatEuroFromNumber,
  formatShortDateLabel,
  parseNumber,
  useInvoiceItemHistory,
} from "../../api"
import type { InvoiceDetail, InvoiceItem, InvoicePricePoint } from "../../types"

type InvoiceArticlesCardProps = {
  invoice: InvoiceDetail
  isExpanded: boolean
  isBeverageSupplier: boolean
  isLoading?: boolean
  onToggleExpand: () => void
  onEditItem: (index: number) => void
  establishmentId?: string | null
  fallbackDate: Date
}

export default function InvoiceArticlesCard({
  invoice,
  isExpanded,
  isBeverageSupplier,
  isLoading,
  onToggleExpand,
  onEditItem,
  establishmentId,
  fallbackDate,
}: InvoiceArticlesCardProps) {
  const [chartOpenIndex, setChartOpenIndex] = useState<number | null>(null)
  const [metricByItem, setMetricByItem] = useState<Record<string, string>>({})
  const activeItem = useMemo(
    () => (chartOpenIndex !== null ? invoice.items[chartOpenIndex] : null),
    [chartOpenIndex, invoice.items]
  )
  const activeMasterId = activeItem?.masterArticleId ?? null
  const activeUnitPrice = activeItem?.unitPrice ?? ""
  const { history: activeHistory, isLoading: isHistoryLoading } = useInvoiceItemHistory({
    estId: establishmentId,
    masterArticleId: activeMasterId,
    fallbackDate,
    unitPrice: activeUnitPrice,
    enabled: chartOpenIndex !== null,
  })

  const parseMetricValue = (value?: string | null) => {
    if (!value || value === "—") return null
    return parseNumber(value)
  }

  const renderDelta = (delta?: string) => {
    const normalized = (delta || "").replace("%", "").replace(/\s+/g, "").replace(",", ".")
    const value = normalized ? parseFloat(normalized) : NaN
    if (!Number.isFinite(value) || value === 0) {
      return <span className="text-xs text-muted-foreground">-</span>
    }

    const isPositive = value > 0
    const formatted = `${isPositive ? "+" : ""}${value.toLocaleString("fr-FR", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 1,
    })}%`
    const colorClass = isPositive ? "text-red-500" : "text-green-500"

    return <span className={`inline-flex items-center text-xs font-medium ${colorClass}`}>{formatted}</span>
  }

  const resolveMetricValue = (metric: string, item: InvoiceItem) => {
    switch (metric) {
      case "Taxes":
        return parseMetricValue(item.dutiesTaxes)
      case "Réductions":
        return parseMetricValue(item.discount)
      case "Prix brut": {
        const base = parseMetricValue(item.unitPrice)
        const duties = parseMetricValue(item.dutiesTaxes) ?? 0
        const discount = parseMetricValue(item.discount) ?? 0
        if (base === null) return null
        return base + duties - discount
      }
      case "Prix unitaire":
      default:
        return parseMetricValue(item.unitPrice)
    }
  }

  const buildMetricHistory = (
    baseHistory: InvoicePricePoint[],
    metricValue: number,
    fallbackDate: Date
  ) => {
    if (baseHistory.length) {
      return baseHistory.map((point) => ({ ...point, value: metricValue }))
    }
    return [
      {
        date: fallbackDate,
        value: metricValue,
        label: formatShortDateLabel(fallbackDate),
      },
    ]
  }

  const renderChartDialog = (
    item: InvoiceItem,
    history: InvoicePricePoint[],
    historyLoading: boolean
  ) => {
    const metric = metricByItem[item.name] ?? "Prix unitaire"
    const rawMetricValue = resolveMetricValue(metric, item)
    const metricValue = Number.isFinite(rawMetricValue ?? NaN) ? (rawMetricValue as number) : 0
    const metricHistory =
      metric === "Prix unitaire"
        ? history
        : buildMetricHistory(history, metricValue, fallbackDate)
    const changePercent = metric === "Prix unitaire" ? parseNumber(item.delta ?? "") : 0
    const hasChange = Number.isFinite(changePercent) && changePercent !== 0
    const changeFormatter = (value: number) =>
      !Number.isFinite(value) || value === 0
        ? "-%"
        : `${value > 0 ? "+" : ""}${value.toFixed(1).replace(".", ",")}%`
    const EmptyIcon = () => null
    const primaryValue =
      rawMetricValue === null ? "—" : metricValue

    if (historyLoading) {
      return (
        <DialogContent className="w-full sm:w-[1020px] max-w-[98vw] sm:!max-w-[1100px] bg-background p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-[360px] w-full" />
          </div>
        </DialogContent>
      )
    }

    return (
      <DialogContent className="w-full sm:w-[1020px] max-w-[98vw] sm:!max-w-[1100px] bg-transparent p-0 border-none shadow-none">
        <AreaChartBlock
          data={metricHistory}
          title={`${metric} - ${item.name}`}
          subtitle={`Évolution ${metric.toLocaleLowerCase("fr-FR")} sur la période`}
          primaryValue={primaryValue}
          primaryValueFormatter={(v) => formatEuroFromNumber(v)}
          changePercent={changePercent}
          changeFormatter={changeFormatter}
          positiveChangeClassName={hasChange ? undefined : "text-muted-foreground"}
          negativeChangeClassName={hasChange ? undefined : "text-muted-foreground"}
          positiveIcon={hasChange ? undefined : EmptyIcon}
          negativeIcon={hasChange ? undefined : EmptyIcon}
          currency="EUR"
          defaultInterval="day"
          showDatePicker
          showIntervalTabs
          enableZoom
          minYPadding={2}
          areaColor="var(--chart-1)"
          tooltipLabel={metric}
          tooltipValueFormatter={(v) => formatEuroFromNumber(v)}
          yTickFormatter={(v) => formatEuroFromNumber(v)}
          actions={
            <Select
              value={metric}
              onValueChange={(value) =>
                setMetricByItem((prev) => ({ ...prev, [item.name]: value }))
              }
            >
              <SelectTrigger className="w-fit min-w-[160px] bg-background dark:bg-secondary shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="text-xs font-normal text-muted-foreground">Données</SelectLabel>
                  <SelectItem value="Prix unitaire">
                    <span className="flex items-center gap-2">
                      <Wallet className="size-4" color="var(--muted-foreground)" />
                      Prix unitaire
                    </span>
                  </SelectItem>
                  <SelectItem value="Taxes">
                    <span className="flex items-center gap-2">
                      <Percent className="size-4" color="var(--muted-foreground)" />
                      Taxes
                    </span>
                  </SelectItem>
                  <SelectItem value="Réductions">
                    <span className="flex items-center gap-2">
                      <TicketPercent className="size-4" color="var(--muted-foreground)" />
                      Réductions
                    </span>
                  </SelectItem>
                  <SelectItem value="Prix brut">
                    <span className="flex items-center gap-2">
                      <BadgeEuro className="size-4" color="var(--muted-foreground)" />
                      Prix brut
                    </span>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          }
          margin={{ left: -15, right: 20, top: 0, bottom: 0 }}
        />
      </DialogContent>
    )
  }

  if (!isExpanded) {
    const description = isLoading
      ? "Chargement des articles..."
      : "Pour plus de détails, développez le tableau des articles."
    return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-2">
            <CardTitle>Détail articles</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="secondary" onClick={onToggleExpand}>
            <UnfoldHorizontal />
            Développer
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[400px] rounded-md border [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted/30 [&::-webkit-scrollbar-track]:bg-transparent">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Nom article</TableHead>
                  <TableHead className="px-3 text-right">Prix unitaire</TableHead>
                  <TableHead className="px-3 text-right">Var(±)</TableHead>
                  <TableHead className="px-3 text-right w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`invoice-item-skeleton-${index}`}>
                      <TableCell className="px-4">
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell className="px-3 text-right">
                        <Skeleton className="ml-auto h-4 w-20" />
                      </TableCell>
                      <TableCell className="px-3 text-right">
                        <Skeleton className="ml-auto h-4 w-10" />
                      </TableCell>
                      <TableCell className="px-3 text-right">
                        <Skeleton className="ml-auto h-7 w-7 rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : invoice.items.length ? (
                  invoice.items.map((item, index) => {
                    const isActive = chartOpenIndex === index
                    const history = isActive ? activeHistory : []
                    const historyLoading = isActive ? isHistoryLoading : false
                    return (
                    <Dialog
                      key={item.name}
                      open={chartOpenIndex === index}
                      onOpenChange={(open) => setChartOpenIndex(open ? index : null)}
                    >
                      <DialogTrigger asChild>
                        <TableRow
                          role="button"
                          tabIndex={0}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setChartOpenIndex(index)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault()
                              setChartOpenIndex(index)
                            }
                          }}
                        >
                          <TableCell className="px-4">
                            <span className="font-sm">{item.name}</span>
                          </TableCell>
                          <TableCell className="px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-sm font-semibold">{item.unitPrice}</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{item.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 text-right">{renderDelta(item.delta)}</TableCell>
                          <TableCell className="px-3 text-right">
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-7 w-7"
                                    aria-label={`Modifier ${item.name}`}
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      onEditItem(index)
                                    }}
                                  >
                                    <Pencil color="#848484" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Modifier l&apos;article</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      </DialogTrigger>
                      {renderChartDialog(item, history, historyLoading)}
                    </Dialog>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Aucun article disponible pour cette facture.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

    return (
    <Card className="lg:col-span-12">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-2">
          <CardTitle>Détail articles — étendu</CardTitle>
          <CardDescription>
            {isLoading
              ? "Chargement des articles..."
              : "Colonnes complètes : unité, variation, taxes/remises et total ligne."}
          </CardDescription>
        </div>
        <Button variant="secondary" onClick={onToggleExpand}>
          <FoldHorizontal />
          Réduire
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-[360px] rounded-md border [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted/30 [&::-webkit-scrollbar-track]:bg-transparent">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 min-w-[220px]">Nom article</TableHead>
                <TableHead className="px-3 text-right min-w-[140px]">Prix unitaire brut</TableHead>
                {isBeverageSupplier && (
                  <>
                    <TableHead className="px-3 text-center min-w-[100px]">Réductions</TableHead>
                    <TableHead className="px-3 text-center min-w-[110px]">Taxes</TableHead>
                  </>
                )}
                <TableHead className="px-3 text-right min-w-[140px]">Prix unitaire</TableHead>
                <TableHead className="px-3 text-right min-w-[90px]">Var(±)</TableHead>
                <TableHead className="px-3 text-right min-w-[90px]">Quantité</TableHead>
                <TableHead className="px-3 text-right min-w-[120px]">Total</TableHead>
                <TableHead className="px-3 text-right w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={`invoice-item-extended-skeleton-${index}`}>
                    <TableCell className="px-4">
                      <Skeleton className="h-4 w-44" />
                    </TableCell>
                    <TableCell className="px-3 text-right">
                      <Skeleton className="ml-auto h-4 w-20" />
                    </TableCell>
                    {isBeverageSupplier && (
                      <>
                        <TableCell className="px-3 text-right">
                          <Skeleton className="ml-auto h-4 w-16" />
                        </TableCell>
                        <TableCell className="px-3 text-right">
                          <Skeleton className="ml-auto h-4 w-16" />
                        </TableCell>
                      </>
                    )}
                    <TableCell className="px-3 text-right">
                      <Skeleton className="ml-auto h-4 w-20" />
                    </TableCell>
                    <TableCell className="px-3 text-right">
                      <Skeleton className="ml-auto h-4 w-10" />
                    </TableCell>
                    <TableCell className="px-3 text-right">
                      <Skeleton className="ml-auto h-4 w-12" />
                    </TableCell>
                    <TableCell className="px-3 text-right">
                      <Skeleton className="ml-auto h-4 w-16" />
                    </TableCell>
                    <TableCell className="px-3 text-right">
                      <Skeleton className="ml-auto h-7 w-7 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : invoice.items.length ? (
                invoice.items.map((item, index) => {
                  const isActive = chartOpenIndex === index
                  const history = isActive ? activeHistory : []
                  const historyLoading = isActive ? isHistoryLoading : false
                  return (
                  <Dialog
                    key={`${item.name}-extended`}
                    open={chartOpenIndex === index}
                    onOpenChange={(open) => setChartOpenIndex(open ? index : null)}
                  >
                    <DialogTrigger asChild>
                      <TableRow
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setChartOpenIndex(index)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            setChartOpenIndex(index)
                          }
                        }}
                      >
                        <TableCell className="px-4">
                          <span className="font-sm">{item.name}</span>
                        </TableCell>
                        <TableCell className="px-3 text-right text-sm font-sm">
                          {computeUnitPriceGross(item)}
                        </TableCell>
                        {isBeverageSupplier && (
                          <>
                            <TableCell className="px-3 text-right text-sm text-muted-foreground">
                              {formatCurrencyDisplay(item.discount)}
                            </TableCell>
                            <TableCell className="px-3 text-center text-sm text-muted-foreground">
                              {formatCurrencyDisplay(item.dutiesTaxes)}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm font-sm">{item.unitPrice}</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{item.unit}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 text-right">{renderDelta(item.delta)}</TableCell>
                        <TableCell className="px-3 text-right text-sm text-muted-foreground">
                          {item.quantity ?? "—"}
                        </TableCell>
                        <TableCell className="px-3 text-right font-sm">
                          {item.lineTotal ?? "—"}
                        </TableCell>
                        <TableCell className="px-3 text-right">
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-7 w-7"
                                  aria-label={`Modifier ${item.name}`}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    onEditItem(index)
                                  }}
                                >
                                  <Pencil color="var(--muted-foreground)" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Modifier l&apos;article</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    </DialogTrigger>
                    {renderChartDialog(item, history, historyLoading)}
                  </Dialog>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={isBeverageSupplier ? 9 : 7}
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                  >
                    Aucun article disponible pour cette facture.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
