import { useState } from "react"
import { BadgeEuro, FoldHorizontal, Pencil, Percent, TicketPercent, UnfoldHorizontal, Wallet } from "lucide-react"
import { AreaChart as AreaChartBlock } from "@/components/blocks/area-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "../../api"
import type { InvoiceDetail, InvoicePricePoint } from "../../types"

type InvoiceArticlesCardProps = {
  invoice: InvoiceDetail
  isExpanded: boolean
  isBeverageSupplier: boolean
  onToggleExpand: () => void
  onEditItem: (index: number) => void
  priceHistoryById: Record<string, InvoicePricePoint[]>
  fallbackDate: Date
}

export default function InvoiceArticlesCard({
  invoice,
  isExpanded,
  isBeverageSupplier,
  onToggleExpand,
  onEditItem,
  priceHistoryById,
  fallbackDate,
}: InvoiceArticlesCardProps) {
  const [chartOpenIndex, setChartOpenIndex] = useState<number | null>(null)
  const [metricByItem, setMetricByItem] = useState<Record<string, string>>({})

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

  const getHistory = (key: string, unitPrice: string) => {
    const history = priceHistoryById[key] ?? []
    if (history.length) return history
    const value = parseNumber(unitPrice)
    if (!Number.isFinite(value)) return []
    return [
      {
        date: fallbackDate,
        value,
        label: formatShortDateLabel(fallbackDate),
      },
    ]
  }

  const renderChartDialog = (
    itemName: string,
    unitPrice: string,
    delta: string | undefined,
    history: InvoicePricePoint[]
  ) => (
    <DialogContent className="w-full sm:w-[1020px] max-w-[98vw] sm:!max-w-[1100px] bg-transparent p-0 border-none shadow-none">
      <AreaChartBlock
        data={history}
        title={`Prix unitaire - ${itemName}`}
        primaryValue={history.at(-1)?.value ?? parseNumber(unitPrice)}
        primaryValueFormatter={(v) => formatEuroFromNumber(v)}
        changePercent={parseNumber(delta ?? "")}
        currency="EUR"
        defaultInterval="day"
        showDatePicker
        showIntervalTabs
        enableZoom
        minYPadding={2}
        areaColor="var(--chart-1)"
        tooltipLabel={metricByItem[itemName] ?? "Prix unitaire"}
        tooltipValueFormatter={(v) => formatEuroFromNumber(v)}
        yTickFormatter={(v) => formatEuroFromNumber(v)}
        actions={
          <Select
            value={metricByItem[itemName] ?? "Prix unitaire"}
            onValueChange={(value) =>
              setMetricByItem((prev) => ({ ...prev, [itemName]: value }))
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

  if (!isExpanded) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-2">
            <CardTitle>Détail articles</CardTitle>
            <CardDescription>Pour plus de détails, développez le tableau des articles.</CardDescription>
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
                {invoice.items.map((item, index) => {
                  const key = item.masterArticleId ?? item.name
                  const history = getHistory(key, item.unitPrice)
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
                    {renderChartDialog(item.name, item.unitPrice, item.delta, history)}
                  </Dialog>
                  )
                })}
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
          <CardDescription>Colonnes complètes : unité, variation, taxes/remises et total ligne.</CardDescription>
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
              {invoice.items.map((item, index) => {
                const key = item.masterArticleId ?? item.name
                const history = getHistory(key, item.unitPrice)
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
                  {renderChartDialog(item.name, item.unitPrice, item.delta, history)}
                </Dialog>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
