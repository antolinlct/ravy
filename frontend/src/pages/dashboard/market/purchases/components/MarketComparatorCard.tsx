import { useMemo, useState } from "react"
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { Check, ChevronsUpDown } from "lucide-react"

import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { DoubleDatePicker } from "@/components/blocks/double-datepicker"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import type { IntervalKey } from "@/components/blocks/area-chart"
import { cn } from "@/lib/utils"
import type { MarketProductOption, MarketSupplierOption } from "../types"

export type ComparisonChartPoint = {
  date: Date
  label: string
  left: number | null
  right: number | null
}

export type PriceStats = {
  min: number
  max: number
  avg: number
  last: number | null
}

export type MarketComparatorCardProps = {
  comparisonRange: { start?: Date; end?: Date }
  onRangeChange: (range: { start?: Date; end?: Date }) => void
  comparisonInterval: IntervalKey
  onIntervalChange: (interval: IntervalKey) => void
  supplierOptions: MarketSupplierOption[]
  productOptions: MarketProductOption[]
  leftSupplierId: string
  leftProductId: string
  rightSupplierId: string
  rightProductId: string
  onLeftSupplierChange: (value: string) => void
  onLeftProductChange: (value: string) => void
  onRightSupplierChange: (value: string) => void
  onRightProductChange: (value: string) => void
  leftProductLabel: string
  rightProductLabel: string
  hasLeftSelection: boolean
  hasRightSelection: boolean
  hasChartValues: boolean
  comparisonChartData: ComparisonChartPoint[]
  comparisonChartConfig: ChartConfig
  leftStats: PriceStats | null
  rightStats: PriceStats | null
  euroFormatter: Intl.NumberFormat
  consultantMessage: React.ReactNode
  consultantAvatarSrc: string
  formatTooltipDate: (date: Date) => string
}

export function MarketComparatorCard({
  comparisonRange,
  onRangeChange,
  comparisonInterval,
  onIntervalChange,
  supplierOptions,
  productOptions,
  leftSupplierId,
  leftProductId,
  rightSupplierId,
  rightProductId,
  onLeftSupplierChange,
  onLeftProductChange,
  onRightSupplierChange,
  onRightProductChange,
  leftProductLabel,
  rightProductLabel,
  hasLeftSelection,
  hasRightSelection,
  hasChartValues,
  comparisonChartData,
  comparisonChartConfig,
  leftStats,
  rightStats,
  euroFormatter,
  consultantMessage,
  consultantAvatarSrc,
  formatTooltipDate,
}: MarketComparatorCardProps) {
  const [leftSupplierOpen, setLeftSupplierOpen] = useState(false)
  const [leftProductOpen, setLeftProductOpen] = useState(false)
  const [leftInvoicesOnly, setLeftInvoicesOnly] = useState(false)
  const [rightSupplierOpen, setRightSupplierOpen] = useState(false)
  const [rightProductOpen, setRightProductOpen] = useState(false)
  const [rightInvoicesOnly, setRightInvoicesOnly] = useState(false)

  const leftProducts = useMemo(
    () => productOptions.filter((product) => product.supplierId === leftSupplierId),
    [leftSupplierId, productOptions]
  )
  const rightProducts = useMemo(
    () => productOptions.filter((product) => product.supplierId === rightSupplierId),
    [rightSupplierId, productOptions]
  )
  const showConsultant = hasLeftSelection && hasRightSelection

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <CardTitle>Comparateur du marché</CardTitle>
          <p className="text-sm text-muted-foreground">
            Analysez vos prix d&apos;achat face aux références du marché.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DoubleDatePicker
            displayFormat="long"
            showSeparator
            showStartLabel={false}
            showEndLabel={false}
            className="sm:items-center"
            startButtonClassName="w-[160px]"
            endButtonClassName="w-[160px]"
            startDate={comparisonRange.start}
            endDate={comparisonRange.end}
            onChange={({ startDate, endDate }) =>
              onRangeChange({ start: startDate, end: endDate })
            }
          />
          <div className="flex items-center">
            <Tabs value={comparisonInterval} onValueChange={(value) => onIntervalChange(value as IntervalKey)}>
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-[color:var(--chart-1)]">Produit 1</CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={leftInvoicesOnly}
                    onCheckedChange={(checked) => setLeftInvoicesOnly(checked === true)}
                    aria-label="Uniquement mes factures"
                    className="data-[state=checked]:bg-[#108FFF] data-[state=checked]:border-[#108FFF]"
                  />
                  <span className="text-sm text-muted-foreground">Uniquement mes factures</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[2fr_3fr]">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Fournisseur</Label>
                  <Popover open={leftSupplierOpen} onOpenChange={setLeftSupplierOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={leftSupplierOpen}
                        className="w-full justify-between"
                      >
                        {leftSupplierId
                          ? supplierOptions.find((opt) => opt.id === leftSupplierId)?.label
                          : "Sélectionnez un fournisseur"}
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Rechercher un fournisseur..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>Aucun fournisseur.</CommandEmpty>
                          <CommandGroup>
                            {supplierOptions.map((opt) => (
                              <CommandItem
                                key={opt.id}
                                value={opt.id}
                                onSelect={(value) => {
                                  const next = value === leftSupplierId ? "" : value
                                  onLeftSupplierChange(next)
                                  onLeftProductChange("")
                                  setLeftSupplierOpen(false)
                                  setLeftProductOpen(false)
                                }}
                              >
                                {opt.label}
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    leftSupplierId === opt.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Produit</Label>
                  <Popover open={leftProductOpen} onOpenChange={setLeftProductOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={leftProductOpen}
                        className="w-full justify-between"
                        disabled={!leftSupplierId}
                      >
                        {leftProductId
                          ? leftProducts.find((opt) => opt.id === leftProductId)?.label
                          : leftSupplierId
                            ? "Sélectionnez un produit"
                            : "Choisissez un fournisseur"}
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Rechercher un produit..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>Aucun produit disponible.</CommandEmpty>
                          <CommandGroup>
                            {leftProducts.map((opt) => (
                              <CommandItem
                                key={opt.id}
                                value={opt.id}
                                onSelect={(value) => {
                                  const next = value === leftProductId ? "" : value
                                  onLeftProductChange(next)
                                  setLeftProductOpen(false)
                                }}
                              >
                                {opt.label}
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    leftProductId === opt.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-[color:var(--chart-5)]">Produit 2</CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={rightInvoicesOnly}
                    onCheckedChange={(checked) => setRightInvoicesOnly(checked === true)}
                    aria-label="Uniquement mes factures"
                    className="data-[state=checked]:bg-[#108FFF] data-[state=checked]:border-[#108FFF]"
                  />
                  <span className="text-sm text-muted-foreground">Uniquement mes factures</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[2fr_3fr]">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Fournisseur</Label>
                  <Popover open={rightSupplierOpen} onOpenChange={setRightSupplierOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={rightSupplierOpen}
                        className="w-full justify-between"
                      >
                        {rightSupplierId
                          ? supplierOptions.find((opt) => opt.id === rightSupplierId)?.label
                          : "Sélectionnez un fournisseur"}
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Rechercher un fournisseur..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>Aucun fournisseur.</CommandEmpty>
                          <CommandGroup>
                            {supplierOptions.map((opt) => (
                              <CommandItem
                                key={opt.id}
                                value={opt.id}
                                onSelect={(value) => {
                                  const next = value === rightSupplierId ? "" : value
                                  onRightSupplierChange(next)
                                  onRightProductChange("")
                                  setRightSupplierOpen(false)
                                  setRightProductOpen(false)
                                }}
                              >
                                {opt.label}
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    rightSupplierId === opt.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Produit</Label>
                  <Popover open={rightProductOpen} onOpenChange={setRightProductOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={rightProductOpen}
                        className="w-full justify-between"
                        disabled={!rightSupplierId}
                      >
                        {rightProductId
                          ? rightProducts.find((opt) => opt.id === rightProductId)?.label
                          : rightSupplierId
                            ? "Sélectionnez un produit"
                            : "Choisissez un fournisseur"}
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Rechercher un produit..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>Aucun produit disponible.</CommandEmpty>
                          <CommandGroup>
                            {rightProducts.map((opt) => (
                              <CommandItem
                                key={opt.id}
                                value={opt.id}
                                onSelect={(value) => {
                                  const next = value === rightProductId ? "" : value
                                  onRightProductChange(next)
                                  setRightProductOpen(false)
                                }}
                              >
                                {opt.label}
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    rightProductId === opt.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          {hasLeftSelection || hasRightSelection ? (
            hasChartValues ? (
              <ChartContainer config={comparisonChartConfig} className="h-[260px] w-full">
                <RechartsAreaChart data={comparisonChartData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={72}
                    tickFormatter={(value) => euroFormatter.format(value as number)}
                  />
                  <ChartTooltip
                    cursor={{ strokeDasharray: "4 4" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const point = payload[0]?.payload as ComparisonChartPoint | undefined
                      const date = point?.date
                      return (
                        <div className="min-w-[12rem] rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                          {date ? (
                            <div className="text-sm text-muted-foreground">
                              {formatTooltipDate(date)}
                            </div>
                          ) : null}
                          <div className="my-2 h-px bg-border/60" />
                          <div className="space-y-1">
                            {hasLeftSelection ? (
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="inline-block h-2 w-2 rounded-sm"
                                    style={{ backgroundColor: "var(--color-left)" }}
                                  />
                                  <span className="text-muted-foreground">{leftProductLabel}</span>
                                </div>
                                <span className="font-medium">
                                  {point?.left !== undefined && point?.left !== null
                                    ? euroFormatter.format(point.left)
                                    : "—"}
                                </span>
                              </div>
                            ) : null}
                            {hasRightSelection ? (
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="inline-block h-2 w-2 rounded-sm"
                                    style={{ backgroundColor: "var(--color-right)" }}
                                  />
                                  <span className="text-muted-foreground">{rightProductLabel}</span>
                                </div>
                                <span className="font-medium">
                                  {point?.right !== undefined && point?.right !== null
                                    ? euroFormatter.format(point.right)
                                    : "—"}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    }}
                  />
                  {hasLeftSelection ? (
                    <Area
                      type="monotone"
                      dataKey="left"
                      yAxisId="left"
                      stroke="var(--color-left)"
                      fill="var(--color-left)"
                      fillOpacity={0.16}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  ) : null}
                  {hasRightSelection ? (
                    <Area
                      type="monotone"
                      dataKey="right"
                      yAxisId="left"
                      stroke="var(--color-right)"
                      fill="var(--color-right)"
                      fillOpacity={0.16}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  ) : null}
                </RechartsAreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                Aucune donnée disponible sur cette période.
              </div>
            )
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              Sélectionnez un produit pour comparer.
            </div>
          )}
        </div>
        <Card className="rounded-md border-0 bg-transparent shadow-none">
          <CardContent className="space-y-4 p-0">
            {hasLeftSelection || hasRightSelection ? (
              <div
                className={cn(
                  "grid gap-4",
                  hasLeftSelection && hasRightSelection ? "lg:grid-cols-2" : "grid-cols-1"
                )}
              >
                {hasLeftSelection ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: "var(--chart-1)" }} />
                      {leftProductLabel}
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Volatilité</div>
                          <div className="text-sm font-medium">
                            {leftStats
                              ? `${euroFormatter.format(leftStats.min)} → ${euroFormatter.format(leftStats.max)}`
                              : "—"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Prix d&apos;achat moyen</div>
                          <div className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm font-medium">
                            {leftStats ? euroFormatter.format(leftStats.avg) : "—"}
                            {leftStats ? <span className="text-xs text-muted-foreground">/u</span> : null}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Dernier prix</div>
                          <div className="text-sm font-medium">
                            {leftStats?.last !== null && leftStats?.last !== undefined
                              ? euroFormatter.format(leftStats.last)
                              : "—"}
                            {leftStats ? <span className="ml-1 text-xs text-muted-foreground">/u</span> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {hasRightSelection ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: "var(--chart-5)" }} />
                      {rightProductLabel}
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Volatilité</div>
                          <div className="text-sm font-medium">
                            {rightStats
                              ? `${euroFormatter.format(rightStats.min)} → ${euroFormatter.format(rightStats.max)}`
                              : "—"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Prix d&apos;achat moyen</div>
                          <div className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm font-medium">
                            {rightStats ? euroFormatter.format(rightStats.avg) : "—"}
                            {rightStats ? <span className="text-xs text-muted-foreground">/u</span> : null}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Dernier prix</div>
                          <div className="text-sm font-medium">
                            {rightStats?.last !== null && rightStats?.last !== undefined
                              ? euroFormatter.format(rightStats.last)
                              : "—"}
                            {rightStats ? <span className="ml-1 text-xs text-muted-foreground">/u</span> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Sélectionnez des produits pour afficher les indicateurs.
              </div>
            )}
            {showConsultant ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={consultantAvatarSrc}
                      alt="Consultant"
                      className="bg-transparent"
                    />
                  </Avatar>
                </div>
                <p className="flex-1 text-sm text-foreground leading-relaxed">{consultantMessage}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
