import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useEstablishment } from "@/context/EstablishmentContext"
import { useRecipeOverviewData } from "./api"
import type { IntervalKey } from "@/components/blocks/area-chart"
import type { RecipeKpi, RecipeMarginItem, RecipeVariation } from "./types"
import { AnalyticsPageHeader } from "./components/AnalyticsPageHeader"
import { VariationsSummaryCard } from "./components/VariationsSummaryCard"
import { RecipeMarginsCard } from "./components/RecipeMarginsCard"

export default function RecipeAnalyticsPage() {
  const navigate = useNavigate()
  const { estId } = useEstablishment()
  const [selectedCategory, setSelectedCategory] = useState<string>("__all__")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("__all__")
  const [marginInterval, setMarginInterval] = useState<IntervalKey>("week")
  const [marginSortBy, setMarginSortBy] = useState<"margin" | "name">("margin")
  const [marginSortDirection, setMarginSortDirection] = useState<"desc" | "asc">("desc")
  const minMarginDate = useMemo(() => new Date("2022-01-01"), [])
  const [marginRange, setMarginRange] = useState<{ start?: Date; end?: Date }>(() => ({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(),
  }))

  const { recipes, categories, subcategories, marginSeries: marginSeriesBase, marginItems, kpis, variations } =
    useRecipeOverviewData(estId, marginRange.start, marginRange.end)

  const tickerVariations = useMemo<RecipeVariation[]>(
    () => variations.filter((item): item is RecipeVariation => Boolean(item)),
    [variations]
  )
  const safeKpis = useMemo(() => kpis.filter((item): item is RecipeKpi => Boolean(item)), [kpis])

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
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    []
  )
  const percentValueFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )

  const activeRecipesCount = useMemo(() => recipes.filter((recipe) => recipe.active).length, [recipes])
  const inactiveRecipesCount = useMemo(() => recipes.filter((recipe) => !recipe.active).length, [recipes])

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories]
  )
  const subCategoryOptions = useMemo(
    () =>
      subcategories.map((subcategory) => ({
        value: subcategory.id,
        label: subcategory.name,
        categoryId: subcategory.categoryId,
      })),
    [subcategories]
  )
  const filteredSubCategories = useMemo(() => {
    if (selectedCategory === "__all__") return []
    return subCategoryOptions
      .filter((opt) => opt.categoryId === selectedCategory)
      .map((opt) => ({ value: opt.value, label: opt.label }))
  }, [selectedCategory, subCategoryOptions])

  const filteredMargins = useMemo(() => {
    const filtered = marginItems
      .filter((item) => selectedCategory === "__all__" || item.categoryId === selectedCategory)
      .filter((item) => selectedSubCategory === "__all__" || item.subcategoryId === selectedSubCategory)

    return filtered.sort((a, b) => {
      if (marginSortBy === "name") {
        const direction = marginSortDirection === "asc" ? 1 : -1
        return a.name.localeCompare(b.name, "fr-FR", { sensitivity: "base" }) * direction
      }
      const aMargin = a.marginPercent ?? 0
      const bMargin = b.marginPercent ?? 0
      return marginSortDirection === "desc" ? bMargin - aMargin : aMargin - bMargin
    })
  }, [marginItems, marginSortBy, marginSortDirection, selectedCategory, selectedSubCategory])
  const safeMargins = useMemo(
    () => filteredMargins.filter((item): item is RecipeMarginItem => Boolean(item)),
    [filteredMargins]
  )

  const averageMargin = useMemo(() => {
    const values = safeMargins
      .map((item) => item.marginPercent)
      .filter((value): value is number => typeof value === "number" && !Number.isNaN(value))
    if (!values.length) return null
    return values.reduce((acc, value) => acc + value, 0) / values.length
  }, [safeMargins])

  const marginSeries = useMemo(() => {
    const start = marginRange.start
    const end = marginRange.end
    return marginSeriesBase.filter((point) => {
      const d = point.date instanceof Date ? point.date : new Date(point.date ?? "")
      if (!d || Number.isNaN(d.getTime())) return false
      if (start && d < start) return false
      if (end && d > end) return false
      return true
    })
  }, [marginSeriesBase, marginRange.end, marginRange.start])

  const marginPeriodDelta = useMemo(() => {
    if (marginSeries.length < 2) return null
    const firstPoint = marginSeries[0]
    const lastPoint = marginSeries[marginSeries.length - 1]
    if (!firstPoint || !lastPoint) return null
    const first = typeof firstPoint.value === "number" ? firstPoint.value : null
    const last = typeof lastPoint.value === "number" ? lastPoint.value : null
    if (first === null || last === null || first === 0) return null
    return ((last - first) / first) * 100
  }, [marginSeries])

  const marginPeriodDeltaLabel = useMemo(() => {
    if (marginPeriodDelta === null) return "--"
    const sign = marginPeriodDelta > 0 ? "+" : ""
    return `${sign}${marginPeriodDelta.toFixed(2).replace(".", ",")}%`
  }, [marginPeriodDelta])

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader
        title="Analyses recettes"
        subtitle="Vue générale des performances et coûts de vos recettes."
        activeTab="general"
        onNavigate={(tab) => {
          if (tab === "detail") {
            navigate("/dashboard/analytics/recipes/detail")
          } else {
            navigate("/dashboard/analytics/recipes")
          }
        }}
      />

      <VariationsSummaryCard
        activeRecipesCount={activeRecipesCount}
        inactiveRecipesCount={inactiveRecipesCount}
        variations={tickerVariations}
        kpis={safeKpis}
        euroFormatter={euroFormatter}
        percentFormatter={percentFormatter}
        percentValueFormatter={percentValueFormatter}
      />

      <RecipeMarginsCard
        averageMargin={averageMargin}
        marginPeriodDelta={marginPeriodDelta}
        marginPeriodDeltaLabel={marginPeriodDeltaLabel}
        categoryOptions={categoryOptions}
        filteredSubCategories={filteredSubCategories}
        selectedCategory={selectedCategory}
        selectedSubCategory={selectedSubCategory}
        onCategoryChange={setSelectedCategory}
        onSubCategoryChange={setSelectedSubCategory}
        marginRange={marginRange}
        onRangeChange={setMarginRange}
        minMarginDate={minMarginDate}
        marginInterval={marginInterval}
        onIntervalChange={setMarginInterval}
        marginSeries={marginSeries}
        margins={safeMargins}
        marginSortBy={marginSortBy}
        marginSortDirection={marginSortDirection}
        onSortByChange={setMarginSortBy}
        onSortDirectionChange={setMarginSortDirection}
        euroFormatter={euroFormatter}
      />
    </div>
  )
}
