import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useEstablishment } from "@/context/EstablishmentContext"
import { AccessLockedCard } from "@/components/access/AccessLockedCard"
import { useAccess } from "@/components/access/access-control"
import { useEstablishmentPlanCode } from "@/context/EstablishmentDataContext"
import { RecipePlanPreview } from "@/pages/dashboard/recipes/components/RecipePlanPreview"
import { buildRecipeKpis, useRecipeOverviewData } from "./api"
import type { IntervalKey } from "@/components/blocks/area-chart"
import type { RecipeKpi, RecipeMarginItem, RecipeVariation } from "./types"
import { AnalyticsPageHeader } from "./components/AnalyticsPageHeader"
import { VariationsSummaryCard } from "./components/VariationsSummaryCard"
import { RecipeMarginsCard } from "./components/RecipeMarginsCard"

export default function RecipeAnalyticsPage() {
  const navigate = useNavigate()
  const { estId } = useEstablishment()
  const { can } = useAccess()
  const planCode = useEstablishmentPlanCode()
  const [selectedCategory, setSelectedCategory] = useState<string>("__all__")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("__all__")
  const [marginInterval, setMarginInterval] = useState<IntervalKey>("week")
  const [marginSortBy, setMarginSortBy] = useState<"margin" | "name">("margin")
  const [marginSortDirection, setMarginSortDirection] = useState<"desc" | "asc">("desc")
  const minMarginDate = useMemo(() => new Date("2022-01-01"), [])
  const [marginRange, setMarginRange] = useState<{ start?: Date; end?: Date }>(() => {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 30)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  })

  const {
    recipes,
    categories,
    subcategories,
    historyRows,
    marginSeries: marginSeriesBase,
    marginItems,
    variations,
  } = useRecipeOverviewData(estId, marginRange.start, marginRange.end)

  const variationsRange = useMemo(() => {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 30)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }, [])

  const variationsKpis = useMemo(
    () => buildRecipeKpis(recipes, historyRows, marginSeriesBase, variationsRange.start, variationsRange.end),
    [historyRows, marginSeriesBase, recipes, variationsRange.end, variationsRange.start]
  )

  const tickerVariations = useMemo<RecipeVariation[]>(
    () =>
      variations.filter(
        (item): item is RecipeVariation =>
          Boolean(item) &&
          typeof item.changePercent === "number" &&
          item.changePercent !== 0
      ),
    [variations]
  )
  const safeKpis = useMemo(
    () => variationsKpis.filter((item): item is RecipeKpi => Boolean(item)),
    [variationsKpis]
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

  const filteredRecipeIds = useMemo(() => {
    const ids = new Set<string>()
    recipes.forEach((recipe) => {
      if (selectedCategory !== "__all__" && recipe.categoryId !== selectedCategory) return
      if (selectedSubCategory !== "__all__" && recipe.subcategoryId !== selectedSubCategory) return
      ids.add(recipe.id)
    })
    return ids
  }, [recipes, selectedCategory, selectedSubCategory])

  const marginSeries = useMemo(() => {
    const start = marginRange.start
    const end = marginRange.end
    const hasCategoryFilter = selectedCategory !== "__all__" || selectedSubCategory !== "__all__"
    if (!hasCategoryFilter || !historyRows.length) {
      return marginSeriesBase.filter((point) => {
        const d = point.date instanceof Date ? point.date : new Date(point.date ?? "")
        if (!d || Number.isNaN(d.getTime())) return false
        if (start && d < start) return false
        if (end && d > end) return false
        return true
      })
    }

    const totalsByDate = new Map<string, { total: number; count: number }>()

    historyRows.forEach((row) => {
      if (!row.recipe_id || !filteredRecipeIds.has(row.recipe_id)) return
      if (!row.date) return
      const parsedDate = new Date(row.date)
      if (Number.isNaN(parsedDate.getTime())) return
      if (start && parsedDate < start) return
      if (end && parsedDate > end) return
      const rawValue = typeof row.margin === "number" ? row.margin : null
      if (rawValue === null) return
      const normalizedValue = Math.abs(rawValue) <= 1 ? rawValue * 100 : rawValue
      const key = parsedDate.toISOString().slice(0, 10)
      const current = totalsByDate.get(key) ?? { total: 0, count: 0 }
      totalsByDate.set(key, {
        total: current.total + normalizedValue,
        count: current.count + 1,
      })
    })

    return Array.from(totalsByDate.entries())
      .map(([dateKey, stats]) => ({
        date: new Date(dateKey),
        value: stats.count ? stats.total / stats.count : 0,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [
    filteredRecipeIds,
    historyRows,
    marginRange.end,
    marginRange.start,
    marginSeriesBase,
    selectedCategory,
    selectedSubCategory,
  ])

  const averageMargin = useMemo(() => {
    const lastPoint = marginSeries[marginSeries.length - 1]
    if (lastPoint && typeof lastPoint.value === "number") return lastPoint.value
    const values = safeMargins
      .map((item) => item.marginPercent)
      .filter((value): value is number => typeof value === "number" && !Number.isNaN(value))
    if (!values.length) return null
    return values.reduce((acc, value) => acc + value, 0) / values.length
  }, [marginSeries, safeMargins])

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

  const firstRecipeId = recipes[0]?.id

  if (!can("analytics")) {
    return <AccessLockedCard />
  }
  const planValue = typeof planCode === "string" ? planCode.toUpperCase() : null
  const hasRecipeAccess = planValue
    ? planValue === "PLAN_FREE" || planValue === "PLAN_PLAT" || planValue === "PLAN_MENU"
    : false

  if (!hasRecipeAccess) {
    return <RecipePlanPreview />
  }

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader
        title="Analyses recettes"
        subtitle="Vue générale des performances et coûts de vos recettes."
        activeTab="general"
        onNavigate={(tab) => {
          if (tab === "detail") {
            if (firstRecipeId) {
              navigate(`/dashboard/analytics/recipes/${firstRecipeId}`)
            } else {
              navigate("/dashboard/analytics/recipes")
            }
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
