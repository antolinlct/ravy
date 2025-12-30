import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DoubleDatePicker } from "@/components/blocks/double-datepicker"
import { AreaChart as AreaChartBlock, type IntervalKey } from "@/components/blocks/area-chart"
import MultipleCombobox from "@/components/ui/multiple_combobox"

export type SupplierExpenseItem = {
  id: string
  name: string
  label: string
  totalHT: number
  invoices: number
}

export type SupplierSpendCardProps = {
  selectedLabel: string
  labelOptions: string[]
  labelDisplay: Record<string, string>
  selectedSuppliers: string[]
  supplierOptions: Array<{ value: string; label: string }>
  onLabelChange: (value: string) => void
  onSuppliersChange: (value: string[]) => void
  range: { start?: Date; end?: Date }
  onRangeChange: (range: { start?: Date; end?: Date }) => void
  minDate: Date
  interval: IntervalKey
  onIntervalChange: (value: IntervalKey) => void
  hasSuppliers: boolean
  supplierSeries: Array<{ date?: Date | string; value?: number; label?: string }>
  supplierExpenses: SupplierExpenseItem[]
  totalSupplierHT: number
  euroFormatter: Intl.NumberFormat
  euroFormatter0: Intl.NumberFormat
}

export const SupplierSpendCard = ({
  selectedLabel,
  labelOptions,
  labelDisplay,
  selectedSuppliers,
  supplierOptions,
  onLabelChange,
  onSuppliersChange,
  range,
  onRangeChange,
  minDate,
  interval,
  onIntervalChange,
  hasSuppliers,
  supplierSeries,
  supplierExpenses,
  totalSupplierHT,
  euroFormatter,
  euroFormatter0,
}: SupplierSpendCardProps) => {
  const suppliersScrollRef = useRef<HTMLDivElement | null>(null)
  const [showSuppliersBottomFade, setShowSuppliersBottomFade] = useState(false)

  useEffect(() => {
    const root = suppliersScrollRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
    if (!viewport) return

    const updateBottomFade = () => {
      const maxScrollTop = viewport.scrollHeight - viewport.clientHeight
      setShowSuppliersBottomFade(maxScrollTop > 0 && viewport.scrollTop < maxScrollTop - 4)
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
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Dépenses fournisseurs</CardTitle>
            <CardDescription>Évolution des dépenses fournisseurs hors taxes.</CardDescription>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">Label</p>
              <Select value={selectedLabel} onValueChange={onLabelChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filtrer par label" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-muted-foreground">
                    Tous les labels
                  </SelectItem>
                  {labelOptions
                    .filter((label) => label !== "all")
                    .map((label) => (
                      <SelectItem key={label} value={label}>
                        {labelDisplay[label] ?? label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 min-w-[240px]">
              <p className="text-xs font-medium text-muted-foreground">Fournisseur</p>
              <MultipleCombobox
                className="max-w-xs"
                placeholder="Sélectionner des fournisseurs"
                items={supplierOptions}
                value={selectedSuppliers}
                onChange={onSuppliersChange}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <DoubleDatePicker
              displayFormat="long"
              showSeparator
              minDate={minDate}
              startDate={range.start}
              endDate={range.end}
              onChange={({ startDate, endDate }) => onRangeChange({ start: startDate, end: endDate })}
            />
            <div className="flex flex-col gap-2 self-start">
              <div className="h-[16px]" aria-hidden />
              <Tabs value={interval} onValueChange={(value) => onIntervalChange(value as IntervalKey)}>
                <TabsList>
                  <TabsTrigger value="day" className="text-sm data-[state=inactive]:font-normal">
                    Jour
                  </TabsTrigger>
                  <TabsTrigger value="week" className="text-sm data-[state=inactive]:font-normal">
                    Semaine
                  </TabsTrigger>
                  <TabsTrigger value="month" className="text-sm data-[state=inactive]:font-normal">
                    Mois
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 mt-6">
          {hasSuppliers ? (
            <>
              <div className="lg:col-span-8">
                {supplierSeries.length ? (
                  <AreaChartBlock
                    key={`suppliers-${interval}-${range.start?.toISOString() ?? ""}-${range.end?.toISOString() ?? ""}`}
                    data={supplierSeries}
                    variant="bare"
                    showHeader={false}
                    showDatePicker={false}
                    showIntervalTabs={false}
                    enableZoom={false}
                    defaultInterval={interval}
                    startDate={range.start}
                    endDate={range.end}
                    areaColor="var(--chart-1)"
                    height={300}
                    margin={{ left: -10 }}
                    tooltipLabel="Dépenses HT"
                    valueFormatter={(value) => euroFormatter.format(value)}
                    tooltipValueFormatter={(value) => euroFormatter.format(value)}
                    xTickFormatter={(_date, label) => label}
                    yTickFormatter={(value) => euroFormatter0.format(Math.round(value))}
                    yTickCount={4}
                  />
                ) : (
                  <div className="flex h-[300px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
                    Aucune dépense sur la période sélectionnée.
                  </div>
                )}
              </div>
              <div className="lg:col-span-4">
                <div className="flex h-[300px] flex-col overflow-hidden ">
                  <div className="relative flex-1 min-h-0" ref={suppliersScrollRef}>
                    <ScrollArea className="h-full">
                      <div className="space-y-2">
                        {supplierExpenses.map((supplier) => (
                          <div
                            key={supplier.id}
                            className="flex items-center justify-between gap-3 rounded-lg border bg-muted/60 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{supplier.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {labelDisplay[supplier.label] ?? supplier.label}
                                {" · "}
                                {supplier.invoices} factures
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-sm font-medium hover:bg-red-500/10">
                                {euroFormatter.format(supplier.totalHT)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div
                      className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/90 via-white/60 to-transparent transition-opacity dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-transparent ${
                        showSuppliersBottomFade ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total hors taxes</span>
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-sm font-medium">
                      {euroFormatter.format(totalSupplierHT)}
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-12 flex h-[300px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
              Aucun résultat pour ces filtres.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
