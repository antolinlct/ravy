import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useEstablishment } from "@/context/EstablishmentContext"
import { AnalyticsPageHeader } from "./components/AnalyticsPageHeader"
import { ProductSelectionCard } from "./components/ProductSelectionCard"
import { ProductAnalysisCard } from "./components/ProductAnalysisCard"
import { ProductAlternativesCard } from "./components/ProductAlternativesCard"
import { ProductInvoicesCard } from "./components/ProductInvoicesCard"
import { useMasterArticleDetailData, useMasterArticlesList, useSuppliersList } from "./api"
import type { IntervalKey } from "@/components/blocks/area-chart"

export default function ProductDetailPage() {
  const navigate = useNavigate()
  const { id: routeArticleId } = useParams()
  const normalizedRouteRef = useRef<string | null>(null)
  const isUuid = useMemo(
    () => (value?: string) =>
      Boolean(
        value &&
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value)
      ),
    []
  )
  const isValidRouteId = useMemo(
    () => isUuid(routeArticleId),
    [isUuid, routeArticleId]
  )
  const resolvedRouteId = isValidRouteId ? routeArticleId : undefined
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [selectedArticleId, setSelectedArticleId] = useState("")
  const [costMetric, setCostMetric] = useState("Prix unitaire")
  const [costInterval, setCostInterval] = useState<IntervalKey>("week")
  const [costZoomRange, setCostZoomRange] = useState<{ start?: Date; end?: Date }>({})
  const [analysisRange, setAnalysisRange] = useState<{ start?: Date; end?: Date }>(() => {
    const end = new Date()
    const start = new Date(end)
    start.setMonth(end.getMonth() - 3)
    return { start, end }
  })
  const minAnalysisDate = useMemo(() => new Date("2022-01-01"), [])
  const euroFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )
  const euroFormatterNoDecimals = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  )
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    []
  )
  const { estId } = useEstablishment()
  const { suppliers } = useSuppliersList(estId)
  const { masterArticles } = useMasterArticlesList(estId, selectedSupplierId || null)
  const {
    analysis,
    marketComparison,
    recipes,
    alternatives,
    invoiceRows,
    costSeries: rawCostSeries,
    lastPurchaseDate,
    supplierShare,
    supplierMonthlySpend,
  } = useMasterArticleDetailData(estId, selectedArticleId || null, analysisRange.start, analysisRange.end)

  const supplierOptions = useMemo(
    () => suppliers.map((supplier) => ({ id: supplier.id, label: supplier.name })),
    [suppliers]
  )
  const filteredArticles = useMemo(() => masterArticles, [masterArticles])
  const selectedArticle = useMemo(
    () => masterArticles.find((article) => article.id === selectedArticleId),
    [masterArticles, selectedArticleId]
  )
  const isSelectedArticleValid = useMemo(
    () => isUuid(selectedArticleId),
    [isUuid, selectedArticleId]
  )

  useEffect(() => {
    if (resolvedRouteId && resolvedRouteId !== selectedArticleId) {
      setSelectedArticleId(resolvedRouteId)
    }
  }, [resolvedRouteId, selectedArticleId])

  useEffect(() => {
    const analysisSupplierId = analysis?.master_article?.supplier_id
    if (analysisSupplierId && analysisSupplierId !== selectedSupplierId) {
      setSelectedSupplierId(analysisSupplierId)
      return
    }
    if (!supplierOptions.length) return
    if (!selectedSupplierId || !supplierOptions.some((supplier) => supplier.id === selectedSupplierId)) {
      setSelectedSupplierId(supplierOptions[0].id)
    }
  }, [analysis?.master_article?.supplier_id, selectedSupplierId, supplierOptions])

  useEffect(() => {
    if (resolvedRouteId) return
    if (!selectedSupplierId) {
      setSelectedArticleId("")
      return
    }
    if (!filteredArticles.length) {
      setSelectedArticleId("")
      return
    }
    if (!filteredArticles.some((article) => article.id === selectedArticleId)) {
      setSelectedArticleId(filteredArticles[0].id)
    }
  }, [filteredArticles, resolvedRouteId, selectedArticleId, selectedSupplierId])

  const unitCostSeries = useMemo(() => (selectedArticleId ? rawCostSeries : []), [rawCostSeries, selectedArticleId])
  const filteredCostSeries = useMemo(() => {
    if (!unitCostSeries.length) return []
    return unitCostSeries.filter((point) => {
      if (!point.date) return false
      const date = point.date instanceof Date ? point.date : new Date(point.date)
      if (Number.isNaN(date.getTime())) return false
      if (analysisRange.start && date < analysisRange.start) return false
      if (analysisRange.end && date > analysisRange.end) return false
      return true
    })
  }, [analysisRange.end, analysisRange.start, unitCostSeries])
  const zoomedCostSeries = useMemo(() => {
    if (!costZoomRange.start && !costZoomRange.end) return filteredCostSeries
    return filteredCostSeries.filter((point) => {
      if (!point.date) return false
      const date = point.date instanceof Date ? point.date : new Date(point.date)
      if (Number.isNaN(date.getTime())) return false
      if (costZoomRange.start && date < costZoomRange.start) return false
      if (costZoomRange.end && date > costZoomRange.end) return false
      return true
    })
  }, [costZoomRange.end, costZoomRange.start, filteredCostSeries])
  const costSeries = filteredCostSeries
  const latestCostValue = useMemo(() => {
    const lastPoint = zoomedCostSeries[zoomedCostSeries.length - 1]
    return typeof lastPoint?.value === "number" ? lastPoint.value : null
  }, [zoomedCostSeries])
  const costDelta = useMemo(() => {
    if (zoomedCostSeries.length < 2) return null
    const firstPoint = zoomedCostSeries[0]
    const lastPoint = zoomedCostSeries[zoomedCostSeries.length - 1]
    const lastValue = typeof lastPoint?.value === "number" ? lastPoint.value : null
    const firstValue = typeof firstPoint?.value === "number" ? firstPoint.value : null
    if (lastValue === null || firstValue === null || firstValue === 0) return null
    return (lastValue - firstValue) / firstValue
  }, [zoomedCostSeries])
  const costDeltaLabel = useMemo(() => {
    if (costDelta === null) return "--"
    const sign = costDelta > 0 ? "+" : ""
    return `${sign}${percentFormatter.format(costDelta)}`
  }, [costDelta, percentFormatter])
  const costDeltaIsPositive = costDelta !== null && costDelta >= 0
  const avgCost = useMemo(() => {
    const avg = analysis?.stats?.avg_unit_price
    if (typeof avg === "number") return avg
    if (!unitCostSeries.length) return null
    const sum = unitCostSeries.reduce((acc, point) => acc + (point.value ?? 0), 0)
    return sum / unitCostSeries.length
  }, [analysis, unitCostSeries])
  const marketCost = useMemo(() => {
    const avg = marketComparison?.statsMarket.avgPrice
    return typeof avg === "number" ? avg : null
  }, [marketComparison])
  const marketVolatility = useMemo(() => {
    const min = marketComparison?.statsMarket.minPrice
    const max = marketComparison?.statsMarket.maxPrice
    if (typeof min !== "number" || typeof max !== "number") return null
    return {
      from: Math.min(min, max),
      to: Math.max(min, max),
    }
  }, [marketComparison])
  const unitLabel = selectedArticle?.unit ?? marketComparison?.marketUnit ?? "unité"
  const theoreticalConsumption = useMemo(() => {
    const qty = marketComparison?.statsUser.totalQty
    if (typeof qty === "number") return qty
    const totalQty = analysis?.stats?.total_quantity
    return typeof totalQty === "number" ? totalQty : null
  }, [analysis, marketComparison])
  const potentialSavings = useMemo(() => {
    const savings = marketComparison?.comparison.potentialSavings
    return typeof savings === "number" ? savings : null
  }, [marketComparison])
  const recipesRows = useMemo(() => recipes, [recipes])
  const analysisStartLabel = useMemo(() => {
    if (!analysisRange.start) return "--"
    return analysisRange.start.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  }, [analysisRange.start])
  const analysisEndLabel = useMemo(() => {
    if (!analysisRange.end) return "--"
    return analysisRange.end.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  }, [analysisRange.end])
  const analysisEndLabelLong = useMemo(() => {
    if (!analysisRange.end) return "--"
    const formatted = analysisRange.end.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    return formatted.replace(".", "").replace(/\s(\d{4})$/, ", $1")
  }, [analysisRange.end])
  const today = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }, [])
  const analysisEndDate = useMemo(() => {
    if (!analysisRange.end) return null
    const date = new Date(analysisRange.end)
    if (Number.isNaN(date.getTime())) return null
    date.setHours(0, 0, 0, 0)
    return date
  }, [analysisRange.end])
  const costMetricTitle = useMemo(() => {
    if (!analysisEndDate || analysisEndDate >= today) {
      const suffix = ["Réductions", "Taxes"].includes(costMetric) ? "actuelles" : "actuel"
      return `${costMetric} ${suffix}`
    }
    return `${costMetric} au ${analysisEndLabelLong}`
  }, [analysisEndDate, analysisEndLabelLong, costMetric, today])
  const sortedRecipesRows = useMemo(() => {
    const getRank = (row: (typeof recipesRows)[number]) => {
      if (row.isActive && row.isSold) return 0
      if (row.isActive && !row.isSold) return 1
      return 2
    }
    return recipesRows
      .filter((row) => row.isActive)
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const rankDiff = getRank(a.row) - getRank(b.row)
        return rankDiff !== 0 ? rankDiff : a.index - b.index
      })
      .map(({ row }) => row)
  }, [recipesRows])
  const lastPurchaseLabel = useMemo(() => {
    if (!lastPurchaseDate) return "-"
    const date = lastPurchaseDate
    const months = [
      "janv",
      "fevr",
      "mars",
      "avr",
      "mai",
      "juin",
      "juil",
      "août",
      "sept",
      "oct",
      "nov",
      "dec",
    ]
    const day = String(date.getDate()).padStart(2, "0")
    const month = months[date.getMonth()] ?? ""
    return `${day} ${month}, ${date.getFullYear()}`
  }, [lastPurchaseDate])
  const daysSinceLastPurchase = useMemo(() => {
    if (!lastPurchaseDate) return null
    const date = lastPurchaseDate
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    return diffDays
  }, [lastPurchaseDate])
  const supplierShareLabel = useMemo(() => {
    if (supplierShare == null) return "--"
    return percentFormatter.format(supplierShare)
  }, [percentFormatter, supplierShare])
  const hasSelection = Boolean(selectedArticleId)

  useEffect(() => {
    setCostZoomRange({})
  }, [analysisRange.end, analysisRange.start, selectedArticleId])

  useEffect(() => {
    if (!selectedArticleId || !isSelectedArticleValid) return
    if (resolvedRouteId === selectedArticleId) return
    if (!resolvedRouteId && normalizedRouteRef.current === selectedArticleId) return
    normalizedRouteRef.current = selectedArticleId
    navigate(`/dashboard/analytics/products/${selectedArticleId}`, { replace: true })
  }, [isSelectedArticleValid, navigate, resolvedRouteId, selectedArticleId])

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader
        title="Analyses produits"
        subtitle="Suivez la performance de vos produits en détail."
        activeTab="detail"
        onNavigate={(tab) => {
          if (tab === "general") {
            navigate("/dashboard/analytics/products")
          } else {
            navigate(
              selectedArticleId && isSelectedArticleValid
                ? `/dashboard/analytics/products/${selectedArticleId}`
                : "/dashboard/analytics/products"
            )
          }
        }}
      />

      <ProductSelectionCard
        supplierOptions={supplierOptions}
        selectedSupplierId={selectedSupplierId}
        onSupplierSelect={(value) => {
          setSelectedSupplierId(value)
          setSelectedArticleId("")
        }}
        articleOptions={filteredArticles.map((article) => ({ id: article.id, name: article.name }))}
        selectedArticleId={selectedArticleId}
        onArticleSelect={setSelectedArticleId}
        minDate={minAnalysisDate}
        range={analysisRange}
        onRangeChange={setAnalysisRange}
        lastPurchaseLabel={lastPurchaseLabel}
      />

      <ProductAnalysisCard
        hasSelection={hasSelection}
        selectedArticleName={selectedArticle?.name ?? "-"}
        analysisRange={analysisRange}
        costSeries={costSeries}
        costInterval={costInterval}
        onIntervalChange={setCostInterval}
        onZoomChange={setCostZoomRange}
        costMetric={costMetric}
        onCostMetricChange={setCostMetric}
        costMetricTitle={costMetricTitle}
        latestCostValue={latestCostValue}
        costDelta={costDelta}
        costDeltaIsPositive={costDeltaIsPositive}
        costDeltaLabel={costDeltaLabel}
        avgCost={avgCost}
        marketCost={marketCost}
        marketVolatility={marketVolatility}
        unitLabel={unitLabel}
        theoreticalConsumption={theoreticalConsumption}
        potentialSavings={potentialSavings}
        daysSinceLastPurchase={daysSinceLastPurchase}
        supplierShareLabel={supplierShareLabel}
        supplierMonthlySpend={supplierMonthlySpend}
        analysisStartLabel={analysisStartLabel}
        analysisEndLabel={analysisEndLabel}
        recipesRows={sortedRecipesRows}
        euroFormatter={euroFormatter}
        euroFormatterNoDecimals={euroFormatterNoDecimals}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <ProductAlternativesCard alternatives={alternatives} euroFormatter={euroFormatter} />
        <ProductInvoicesCard invoiceRows={invoiceRows} range={analysisRange} euroFormatter={euroFormatter} />
      </div>
    </div>
  )
}
