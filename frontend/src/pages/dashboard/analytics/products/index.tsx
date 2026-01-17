import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useEstablishment } from "@/context/EstablishmentContext"
import ConsultantAvatar from "@/assets/avatar.png"
import { AccessLockedCard } from "@/components/access/AccessLockedCard"
import { useAccess } from "@/components/access/access-control"
import {
  buildSupplierOptions,
  buildSupplierSeries,
  formatVariationLabel,
  supplierLabelDisplay,
  useProductOverviewData,
} from "./api"
import type { SupplierLabel } from "./types"
import { getBatteryTextClass, getDeltaTier } from "./utils"
import { AnalyticsPageHeader } from "./components/AnalyticsPageHeader"
import { SupplierSpendCard } from "./components/SupplierSpendCard"
import { VariationsTickerCard } from "./components/VariationsTickerCard"
import { ProductConsumptionCard } from "./components/ProductConsumptionCard"

export default function ProductAnalyticsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { estId } = useEstablishment()
  const { can } = useAccess()
  const [selectedLabel, setSelectedLabel] = useState<string>("all")
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [supplierInterval, setSupplierInterval] = useState<"day" | "week" | "month">("week")
  const minSupplierDate = useMemo(() => new Date("2022-01-01"), [])
  const [supplierRange, setSupplierRange] = useState<{ start?: Date; end?: Date }>(() => {
    const end = new Date()
    const start = new Date(end)
    start.setMonth(end.getMonth() - 3)
    return { start, end }
  })
  const {
    suppliers,
    masterArticles,
    invoices,
    financialIngredients,
    variations,
  } = useProductOverviewData(estId, supplierRange.start, supplierRange.end)
  const diffNumberFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )
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
  const euroFormatter0 = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  )
  const euroFormatterWith2 = euroFormatter

  const productSuppliersOptions = useMemo(() => buildSupplierOptions(suppliers), [suppliers])
  const [productSelectedSuppliers, setProductSelectedSuppliers] = useState<string[]>([])
  const [productTop, setProductTop] = useState<"10" | "25" | "50" | "all">("10")
  const [productSort, setProductSort] = useState<"default" | "asc" | "desc">("default")

  const suppliersById = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier])), [suppliers])
  const masterArticlesById = useMemo(
    () => new Map(masterArticles.map((article) => [article.id, article])),
    [masterArticles]
  )
  const quantityFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    []
  )
  const productBaseItems = useMemo(
    () =>
      financialIngredients
        .filter((ingredient) => ingredient.masterArticleId)
        .map((ingredient) => {
          const master = ingredient.masterArticleId ? masterArticlesById.get(ingredient.masterArticleId) : undefined
          const supplier = master?.supplierId ? suppliersById.get(master.supplierId) : undefined
          const unit = master?.unit ?? "unité"
          const qtyValue = ingredient.quantity ?? 0
          const qtyLabel =
            qtyValue > 0 ? `${quantityFormatter.format(qtyValue)} ${unit}` : `-- ${unit}`
          const paidPrice = qtyValue > 0 ? ingredient.consumedValue / qtyValue : 0
          const marketPrice = qtyValue > 0 ? paidPrice - ingredient.marketGapValue : paidPrice
          const deltaPct = ingredient.marketGapPercentage * 100
          return {
            id: ingredient.masterArticleId as string,
            name: master?.name ?? "Article",
            supplier: supplier?.name ?? "Fournisseur",
            supplierId: master?.supplierId ?? "",
            consumption: ingredient.consumedValue,
            paidPrice,
            marketPrice,
            deltaPct,
            qty: qtyLabel,
            qtyValue,
            unit,
            marketTrend: { from: marketPrice, to: marketPrice },
          }
        }),
    [financialIngredients, masterArticlesById, quantityFormatter, suppliersById]
  )
  const productTopOptions = [
    { value: "10", label: "Top 10" },
    { value: "25", label: "Top 25" },
    { value: "50", label: "Top 50" },
    { value: "all", label: "Tous" },
  ] as const
  const topProductBaseItems = useMemo(() => {
    let list = productBaseItems.filter(
      (product) =>
        productSelectedSuppliers.length === 0 ||
        productSelectedSuppliers.includes(product.supplierId)
    )
    list = [...list].sort((a, b) => b.consumption - a.consumption)
    const limit = productTop === "all" ? list.length : Number(productTop)
    return list.slice(0, limit)
  }, [productBaseItems, productSelectedSuppliers, productTop])

  const filteredProductItems = useMemo(() => {
    let list = [...topProductBaseItems]
    if (productSort !== "default") {
      const direction = productSort === "asc" ? 1 : -1
      list = [...list].sort((a, b) => {
        const tierDiff = getDeltaTier(a.deltaPct) - getDeltaTier(b.deltaPct)
        if (tierDiff !== 0) return tierDiff * direction
        return b.consumption - a.consumption
      })
    }
    return list
  }, [productSort, topProductBaseItems])

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const selectedProduct = useMemo(
    () => filteredProductItems.find((p) => p.id === selectedProductId) ?? filteredProductItems[0] ?? null,
    [filteredProductItems, selectedProductId]
  )
  useEffect(() => {
    if (!selectedProductId && filteredProductItems.length > 0) {
      setSelectedProductId(filteredProductItems[0].id)
    }
  }, [filteredProductItems, selectedProductId])
  const selectedProductEconomy = useMemo(() => {
    if (!selectedProduct) return null
    const qtyValue = selectedProduct.qtyValue ?? 0
    const deltaPerUnit = selectedProduct.paidPrice - selectedProduct.marketPrice
    const monthlyDelta = deltaPerUnit * qtyValue
    const yearlyDelta = monthlyDelta * 12
    const absDeltaPerUnit = euroFormatterWith2.format(Math.abs(deltaPerUnit))
    const absMonthly = euroFormatterWith2.format(Math.abs(monthlyDelta))
    const absYearly = euroFormatterWith2.format(Math.abs(yearlyDelta))
    const productName = selectedProduct.name
    const unitLabel = selectedProduct.unit ?? "unité"
    const tier = getDeltaTier(selectedProduct.deltaPct)
    const colorClass = getBatteryTextClass(selectedProduct.deltaPct)

    if (tier === 0) {
      return {
        mode: "saving" as const,
        productName,
        amountPerUnit: absDeltaPerUnit,
        unitLabel,
        line2: "Aucune conséquence négative sur votre restaurant.",
      }
    }
    if (tier === 1) {
      return {
        mode: "loss" as const,
        productName,
        line1Lead: "Vous payez le ",
        line1Trail: " légèrement plus cher que le marché. Vous pourriez gagner ",
        line1Tail: " en négociant mieux vos achats.",
        line2Prefix: "Vous perdez actuellement ",
        line2Suffix: " à cause de ce produit.",
        monthly: absMonthly,
        yearly: absYearly,
        colorClass,
      }
    }
    if (tier === 2) {
      return {
        mode: "loss" as const,
        productName,
        line1Lead: "Vous payez le ",
        line1Trail: " trop cher par rapport au marché. Vous pourriez gagner ",
        line1Tail: " en négociant mieux vos achats.",
        line2Prefix: "Vous perdez actuellement ",
        line2Suffix: " à cause de ce produit.",
        monthly: absMonthly,
        yearly: absYearly,
        colorClass,
      }
    }
    return {
      mode: "loss" as const,
      productName,
      line1Lead: "Vous payez le ",
      line1Trail: " beaucoup trop cher par rapport au marché. Vous pourriez gagner ",
      line1Tail: " en négociant mieux vos achats.",
      line2Prefix: "Vous perdez actuellement ",
      line2Suffix: " à cause de ce produit.",
      monthly: absMonthly,
      yearly: absYearly,
      colorClass,
    }
  }, [selectedProduct, euroFormatterWith2])

  useEffect(() => {
    if (filteredProductItems.length === 0) {
      setSelectedProductId(null)
    } else if (!selectedProduct || !filteredProductItems.some((p) => p.id === selectedProduct.id)) {
      setSelectedProductId(filteredProductItems[0].id)
    }
  }, [filteredProductItems, selectedProduct])

  const supplierLabelEnum = useMemo(() => Object.keys(supplierLabelDisplay) as SupplierLabel[], [])
  const labelOptions = useMemo(() => ["all", ...supplierLabelEnum], [supplierLabelEnum])

  const filteredSuppliers = useMemo(
    () =>
      suppliers.filter(
        (supplier) =>
          (selectedLabel === "all" || supplier.label === selectedLabel) &&
          (selectedSuppliers.length === 0 || selectedSuppliers.includes(supplier.id))
      ),
    [selectedLabel, selectedSuppliers, suppliers]
  )
  const supplierTotalsById = useMemo(() => {
    const totals = new Map<string, { total: number; count: number }>()
    invoices.forEach((invoice) => {
      const supplierId = invoice.supplierId
      if (!supplierId) return
      if (selectedLabel !== "all") {
        const supplier = suppliersById.get(supplierId)
        if (!supplier || supplier.label !== selectedLabel) return
      }
      if (selectedSuppliers.length && !selectedSuppliers.includes(supplierId)) return
      if (supplierRange.start || supplierRange.end) {
        if (!invoice.date) return
        const date = new Date(invoice.date)
        if (Number.isNaN(date.getTime())) return
        if (supplierRange.start && date < supplierRange.start) return
        if (supplierRange.end && date > supplierRange.end) return
      }
      const current = totals.get(supplierId) ?? { total: 0, count: 0 }
      current.total += invoice.totalHt
      current.count += 1
      totals.set(supplierId, current)
    })
    return totals
  }, [invoices, selectedLabel, selectedSuppliers, supplierRange.end, supplierRange.start, suppliersById])
  const supplierExpenses = useMemo(
    () =>
      filteredSuppliers
        .map((supplier) => {
          const totals = supplierTotalsById.get(supplier.id) ?? { total: 0, count: 0 }
          return {
            id: supplier.id,
            name: supplier.name,
            label: supplier.label ?? "OTHER",
            totalHT: totals.total,
            invoices: totals.count,
          }
        })
        .sort((a, b) => b.totalHT - a.totalHT),
    [filteredSuppliers, supplierTotalsById]
  )
  const totalSupplierHT = useMemo(
    () => supplierExpenses.reduce((sum, supplier) => sum + supplier.totalHT, 0),
    [supplierExpenses]
  )
  const supplierOptionsDetailed = useMemo(
    () =>
      suppliers
        .filter((supplier) => selectedLabel === "all" || supplier.label === selectedLabel)
        .map((supplier) => ({
          value: supplier.id,
          label: supplier.name,
        })),
    [selectedLabel, suppliers]
  )
  const filteredSupplierInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const supplierId = invoice.supplierId
        if (!supplierId) return false
        if (selectedLabel !== "all") {
          const supplier = suppliersById.get(supplierId)
          if (!supplier || supplier.label !== selectedLabel) return false
        }
        if (selectedSuppliers.length && !selectedSuppliers.includes(supplierId)) return false
        if (supplierRange.start || supplierRange.end) {
          if (!invoice.date) return false
          const date = new Date(invoice.date)
          if (Number.isNaN(date.getTime())) return false
          if (supplierRange.start && date < supplierRange.start) return false
          if (supplierRange.end && date > supplierRange.end) return false
        }
        return true
      }),
    [invoices, selectedLabel, selectedSuppliers, supplierRange.end, supplierRange.start, suppliersById]
  )

  useEffect(() => {
    if (selectedLabel === "all") return
    setSelectedSuppliers((prev) => {
      const next = prev.filter((id) => {
        const sup = supplierExpenses.find((s) => s.id === id)
        return sup ? sup.label === selectedLabel : false
      })
      if (next.length === prev.length && next.every((value, index) => value === prev[index])) {
        return prev
      }
      return next
    })
  }, [selectedLabel, supplierExpenses])

  const supplierSeries = useMemo(
    () => buildSupplierSeries(filteredSupplierInvoices, supplierInterval),
    [filteredSupplierInvoices, supplierInterval]
  )
  const latestVariations = useMemo(
    () =>
      variations
        .map((variation) => {
          const master = variation.masterArticleId ? masterArticlesById.get(variation.masterArticleId) : undefined
          const supplier = master?.supplierId ? suppliersById.get(master.supplierId) : undefined
          return {
            id: variation.id,
            article: master?.name ?? "Article",
            supplier: supplier?.name ?? "Fournisseur",
            change: formatVariationLabel(variation.percentage),
            isDown: (variation.percentage ?? 0) < 0,
          }
        })
        .slice(0, 10),
    [masterArticlesById, suppliersById, variations]
  )

  useEffect(() => {
    const scrollTo = (location.state as { scrollTo?: string } | null)?.scrollTo
    if (scrollTo !== "bottom") return

    const target = document.getElementById("analytics-products-bottom")
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
    }
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  if (!can("analytics")) {
    return <AccessLockedCard />
  }

  return (
    <div className="flex w-full items-start justify-start">
      <div className="w-full min-w-0 space-y-4">
        <AnalyticsPageHeader
          title="Analyses produits"
          subtitle="Vue générale des coûts et économies potentielles."
          activeTab="general"
          onNavigate={(tab) => {
            if (tab === "detail") {
              const detailId = selectedProductId || filteredProductItems[0]?.id || masterArticles[0]?.id
              if (detailId) {
                navigate(`/dashboard/analytics/products/${detailId}`)
              } else {
                navigate("/dashboard/analytics/products")
              }
            } else {
              navigate("/dashboard/analytics/products")
            }
          }}
        />

        <SupplierSpendCard
          selectedLabel={selectedLabel}
          labelOptions={labelOptions}
          labelDisplay={supplierLabelDisplay}
          selectedSuppliers={selectedSuppliers}
          supplierOptions={supplierOptionsDetailed}
          onLabelChange={setSelectedLabel}
          onSuppliersChange={setSelectedSuppliers}
          range={supplierRange}
          onRangeChange={setSupplierRange}
          minDate={minSupplierDate}
          interval={supplierInterval}
          onIntervalChange={setSupplierInterval}
          hasSuppliers={filteredSuppliers.length > 0}
          supplierSeries={supplierSeries}
          supplierExpenses={supplierExpenses}
          totalSupplierHT={totalSupplierHT}
          euroFormatter={euroFormatter}
          euroFormatter0={euroFormatter0}
        />

        <VariationsTickerCard items={latestVariations} />

        <ProductConsumptionCard
          productTop={productTop}
          productTopOptions={productTopOptions}
          onTopChange={setProductTop}
          productSuppliersOptions={productSuppliersOptions}
          productSelectedSuppliers={productSelectedSuppliers}
          onSuppliersChange={setProductSelectedSuppliers}
          productSort={productSort}
          onSortChange={setProductSort}
          products={filteredProductItems}
          selectedProductId={selectedProductId}
          onSelectProductId={setSelectedProductId}
          selectedProduct={selectedProduct}
          selectedProductEconomy={selectedProductEconomy}
          consultantAvatarSrc={ConsultantAvatar}
          euroFormatterWith2={euroFormatterWith2}
          diffNumberFormatter={diffNumberFormatter}
        />
        <div id="analytics-products-bottom" className="h-px" />
      </div>
    </div>
  )
}
