import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useEstablishment } from "@/context/EstablishmentContext"
import { resolveRecipeMarginRatio, useRecipeCatalog, useRecipeDetailData, useRecipeMetrics } from "./api"
import type { IntervalKey } from "@/components/blocks/area-chart"
import { AnalyticsPageHeader } from "./components/AnalyticsPageHeader"
import { RecipeSelectionCard } from "./components/RecipeSelectionCard"
import { RecipeMarginDetailCard } from "./components/RecipeMarginDetailCard"
import { RecipeCostCard } from "./components/RecipeCostCard"
import { RecipeCostSkeletonCard, RecipeMarginSkeletonCard } from "./components/RecipeAnalysisSkeletons"
import type { RecipeIngredientRow } from "./types"
import { AccessLockedCard } from "@/components/access/AccessLockedCard"
import { useAccess } from "@/components/access/access-control"
import { useEstablishmentPlanCode } from "@/context/EstablishmentDataContext"
import { RecipePlanPreview } from "@/pages/dashboard/recipes/components/RecipePlanPreview"

export default function RecipeAnalyticsDetailPage() {
  const navigate = useNavigate()
  const { id: routeRecipeId } = useParams<{ id?: string }>()
  const { estId } = useEstablishment()
  const { can } = useAccess()
  const planCode = useEstablishmentPlanCode()
  const [selectedCategory, setSelectedCategory] = useState("__all__")
  const [selectedSubCategory, setSelectedSubCategory] = useState("__all__")
  const [selectedRecipeId, setSelectedRecipeId] = useState(routeRecipeId ?? "")
  const [costInterval, setCostInterval] = useState<IntervalKey>("week")
  const [costZoomRange, setCostZoomRange] = useState<{ start?: Date; end?: Date }>({})
  const [analysisRange, setAnalysisRange] = useState<{ start?: Date; end?: Date }>(() => {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 30)
    start.setHours(0, 0, 0, 0)
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
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    []
  )

  const { recipes, categories, subcategories } = useRecipeCatalog(estId)
  const {
    ingredients,
    period,
    marginSeries: rawMarginSeries,
    costSeries: rawCostSeries,
    isLoading: isDetailLoading,
  } = useRecipeDetailData(estId, selectedRecipeId || null, analysisRange.start, analysisRange.end)

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
  const filteredSubCategoryOptions = useMemo(() => {
    if (selectedCategory === "__all__") return []
    return subCategoryOptions.filter((opt) => opt.categoryId === selectedCategory)
  }, [selectedCategory, subCategoryOptions])

  const recipesByCategoryAndSub = useMemo(() => {
    return recipes.filter((recipe) => {
      if (!recipe.active) return false
      if (selectedCategory !== "__all__" && recipe.categoryId !== selectedCategory) return false
      if (selectedSubCategory !== "__all__" && recipe.subcategoryId !== selectedSubCategory) return false
      return true
    })
  }, [recipes, selectedCategory, selectedSubCategory])

  const selectedRecipe = useMemo(
    () => recipes.find((recipe) => recipe.id === selectedRecipeId),
    [recipes, selectedRecipeId]
  )

  useEffect(() => {
    if (!routeRecipeId) return
    if (routeRecipeId !== selectedRecipeId) {
      setSelectedRecipeId(routeRecipeId)
    }
  }, [routeRecipeId, selectedRecipeId])

  useEffect(() => {
    if (!selectedRecipeId) return
    if (typeof window === "undefined") return
    const detailPath = `/dashboard/analytics/recipes/${selectedRecipeId}`
    window.sessionStorage.setItem("sidebar.analytics.recipes.detail", detailPath)
  }, [selectedRecipeId])

  useEffect(() => {
    if (!recipesByCategoryAndSub.length) {
      setSelectedRecipeId("")
      return
    }
    if (!recipesByCategoryAndSub.some((recipe) => recipe.id === selectedRecipeId)) {
      const nextId = recipesByCategoryAndSub[0].id
      setSelectedRecipeId(nextId)
      if (routeRecipeId !== nextId) {
        navigate(`/dashboard/analytics/recipes/${nextId}`, { replace: true })
      }
    }
  }, [navigate, recipesByCategoryAndSub, routeRecipeId, selectedRecipeId])

  useEffect(() => {
    if (analysisRange.start || analysisRange.end) return
    if (!period?.start || !period?.end) return
    setAnalysisRange({ start: period.start ?? undefined, end: period.end ?? undefined })
  }, [analysisRange.end, analysisRange.start, period?.end, period?.start])

  const filteredMarginSeries = useMemo(() => {
    if (!rawMarginSeries.length) return []
    return rawMarginSeries.filter((point) => {
      if (!point.date) return false
      const date = point.date instanceof Date ? point.date : new Date(point.date)
      if (Number.isNaN(date.getTime())) return false
      if (analysisRange.start && date < analysisRange.start) return false
      if (analysisRange.end && date > analysisRange.end) return false
      return true
    })
  }, [analysisRange.end, analysisRange.start, rawMarginSeries])

  const filteredCostPerPortionSeries = useMemo(() => {
    if (!rawCostSeries.length) return []
    return rawCostSeries.filter((point) => {
      if (!point.date) return false
      const date = point.date instanceof Date ? point.date : new Date(point.date)
      if (Number.isNaN(date.getTime())) return false
      if (analysisRange.start && date < analysisRange.start) return false
      if (analysisRange.end && date > analysisRange.end) return false
      return true
    })
  }, [analysisRange.end, analysisRange.start, rawCostSeries])

  const zoomedMarginSeries = useMemo(() => {
    if (!costZoomRange.start && !costZoomRange.end) return filteredMarginSeries
    return filteredMarginSeries.filter((point) => {
      if (!point.date) return false
      const date = point.date instanceof Date ? point.date : new Date(point.date)
      if (Number.isNaN(date.getTime())) return false
      if (costZoomRange.start && date < costZoomRange.start) return false
      if (costZoomRange.end && date > costZoomRange.end) return false
      return true
    })
  }, [costZoomRange.end, costZoomRange.start, filteredMarginSeries])

  const latestMarginValue = useMemo(() => {
    const lastPoint = zoomedMarginSeries[zoomedMarginSeries.length - 1]
    return typeof lastPoint?.value === "number" ? lastPoint.value : null
  }, [zoomedMarginSeries])

  const marginDelta = useMemo(() => {
    if (zoomedMarginSeries.length < 2) return null
    const firstPoint = zoomedMarginSeries[0]
    const lastPoint = zoomedMarginSeries[zoomedMarginSeries.length - 1]
    const lastValue = typeof lastPoint?.value === "number" ? lastPoint.value : null
    const firstValue = typeof firstPoint?.value === "number" ? firstPoint.value : null
    if (lastValue === null || firstValue === null || firstValue === 0) return null
    return (lastValue - firstValue) / firstValue
  }, [zoomedMarginSeries])

  const marginDeltaLabel = useMemo(() => {
    if (marginDelta === null) return "--"
    const sign = marginDelta > 0 ? "+" : ""
    return `${sign}${percentFormatter.format(marginDelta)}`
  }, [marginDelta, percentFormatter])

  const marginDeltaIsPositive = marginDelta !== null && marginDelta >= 0

  const { overallMarginRatio, categoryMarginRatio } = useRecipeMetrics(
    recipes,
    selectedCategory === "__all__" ? null : selectedCategory
  )

  const currentMarginRatio = useMemo(() => {
    if (latestMarginValue !== null) return latestMarginValue
    if (!selectedRecipe) return null
    return resolveRecipeMarginRatio(selectedRecipe)
  }, [latestMarginValue, selectedRecipe])

  const targetMargin = overallMarginRatio
  const targetMarginDelta =
    currentMarginRatio !== null && targetMargin !== null
      ? (currentMarginRatio - targetMargin) * 100
      : null
  const categoryMargin = categoryMarginRatio
  const categoryMarginDelta =
    currentMarginRatio !== null && categoryMargin !== null
      ? (currentMarginRatio - categoryMargin) * 100
      : null

  const monthlySales = null
  const monthlySalesDelta = null
  const monthlyRevenue = null
  const monthlyRevenueShare = null

  const pointsFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    []
  )
  const formatPoints = (value: number) => {
    const sign = value > 0 ? "+" : ""
    return `${sign}${pointsFormatter.format(value)} pts`
  }

  const sortedIngredientRows = useMemo(() => {
    const rank: Record<string, number> = {
      ARTICLE: 0,
      SUBRECIPE: 1,
      FIXED: 2,
    }
    return [...ingredients].sort((a, b) => {
      const typeDiff = (rank[a.type] ?? 99) - (rank[b.type] ?? 99)
      if (typeDiff !== 0) return typeDiff
      if (a.type === "ARTICLE" && b.type === "ARTICLE") {
        return (b.weightShare ?? 0) - (a.weightShare ?? 0)
      }
      return 0
    })
  }, [ingredients])

  const analysisStartDate = analysisRange.start ?? period?.start ?? null
  const analysisEndDate = analysisRange.end ?? period?.end ?? null

  const analysisStartLabel = useMemo(() => {
    if (!analysisStartDate) return "--"
    return analysisStartDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  }, [analysisStartDate])

  const analysisEndLabel = useMemo(() => {
    if (!analysisEndDate) return "--"
    return analysisEndDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  }, [analysisEndDate])

  const analysisEndLabelLong = useMemo(() => {
    if (!analysisEndDate) return "--"
    const formatted = analysisEndDate.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    return formatted.replace(".", "").replace(/\s(\d{4})$/, ", $1")
  }, [analysisEndDate])

  const today = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }, [])

  const analysisEndDateOnly = useMemo(() => {
    if (!analysisEndDate) return null
    const date = new Date(analysisEndDate)
    if (Number.isNaN(date.getTime())) return null
    date.setHours(0, 0, 0, 0)
    return date
  }, [analysisEndDate])

  const isEndCurrentOrFuture = analysisEndDateOnly ? analysisEndDateOnly >= today : true
  const marginTitle = useMemo(() => {
    if (isEndCurrentOrFuture) return "Marge actuelle"
    return `Marge au ${analysisEndLabelLong}`
  }, [analysisEndLabelLong, isEndCurrentOrFuture])

  const costTitle = useMemo(() => {
    if (isEndCurrentOrFuture) return "Coût d'achat actuel"
    return `Coût d'achat au ${analysisEndLabelLong}`
  }, [analysisEndLabelLong, isEndCurrentOrFuture])

  const costPerPortionDelta = useMemo(() => {
    if (filteredCostPerPortionSeries.length < 2) return null
    const firstPoint = filteredCostPerPortionSeries[0]
    const lastPoint = filteredCostPerPortionSeries[filteredCostPerPortionSeries.length - 1]
    const firstValue = typeof firstPoint?.value === "number" ? firstPoint.value : null
    const lastValue = typeof lastPoint?.value === "number" ? lastPoint.value : null
    if (firstValue === null || lastValue === null || firstValue === 0) return null
    return (lastValue - firstValue) / firstValue
  }, [filteredCostPerPortionSeries])

  const costPerPortionDeltaLabel = useMemo(() => {
    if (costPerPortionDelta === null) return "--"
    const sign = costPerPortionDelta > 0 ? "+" : ""
    return `${sign}${percentFormatter.format(costPerPortionDelta)}`
  }, [costPerPortionDelta, percentFormatter])

  const costPerPortionLatest = useMemo(() => {
    const lastPoint = filteredCostPerPortionSeries[filteredCostPerPortionSeries.length - 1]
    return typeof lastPoint?.value === "number" ? lastPoint.value : null
  }, [filteredCostPerPortionSeries])

  const handleIngredientNavigate = useCallback(
    (row: RecipeIngredientRow) => {
      if (row.type === "ARTICLE" && row.masterArticleId) {
        window.scrollTo({ top: 0, behavior: "smooth" })
        navigate(`/dashboard/analytics/products/${row.masterArticleId}`)
        return
      }
      if (row.type === "SUBRECIPE" && row.subrecipeId) {
        window.scrollTo({ top: 0, behavior: "smooth" })
        navigate(`/dashboard/analytics/recipes/${row.subrecipeId}`)
      }
    },
    [navigate]
  )

  const hasSelection = Boolean(selectedRecipeId)
  const showMarginCard = !hasSelection || selectedRecipe?.saleable !== false
  const showDetailSkeleton = hasSelection && isDetailLoading
  const activeRecipeId = selectedRecipeId || recipesByCategoryAndSub[0]?.id

  useEffect(() => {
    setCostZoomRange({})
  }, [analysisRange.end, analysisRange.start, selectedRecipeId])

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader
        title="Analyses recettes"
        subtitle="Analysez la performance de vos recettes en détail."
        activeTab="detail"
        onNavigate={(tab) => {
          if (tab === "general") {
            navigate("/dashboard/analytics/recipes")
          } else if (activeRecipeId) {
            navigate(`/dashboard/analytics/recipes/${activeRecipeId}`)
          }
        }}
      />

      <RecipeSelectionCard
        categoryOptions={categoryOptions}
        filteredSubCategoryOptions={filteredSubCategoryOptions}
        selectedCategory={selectedCategory}
        selectedSubCategory={selectedSubCategory}
        onCategoryChange={setSelectedCategory}
        onSubCategoryChange={setSelectedSubCategory}
        recipeOptions={recipesByCategoryAndSub.map((recipe) => ({ id: recipe.id, name: recipe.name }))}
        selectedRecipeId={selectedRecipeId}
        onRecipeSelect={(value) => {
          setSelectedRecipeId(value)
          if (value && value !== routeRecipeId) {
            navigate(`/dashboard/analytics/recipes/${value}`)
          }
        }}
        minAnalysisDate={minAnalysisDate}
        range={analysisRange}
        onRangeChange={setAnalysisRange}
      />

      {showMarginCard
        ? showDetailSkeleton
          ? <RecipeMarginSkeletonCard />
          : (
              <RecipeMarginDetailCard
                hasSelection={hasSelection}
                selectedRecipeName={selectedRecipe?.name ?? "-"}
                filteredMarginSeries={filteredMarginSeries}
                costInterval={costInterval}
                onIntervalChange={setCostInterval}
                analysisRange={analysisRange}
                onZoomChange={setCostZoomRange}
                marginTitle={marginTitle}
                latestMarginValue={latestMarginValue}
                marginDelta={marginDelta}
                marginDeltaIsPositive={marginDeltaIsPositive}
                marginDeltaLabel={marginDeltaLabel}
                targetMargin={targetMargin}
                targetMarginDelta={targetMarginDelta}
                categoryMargin={categoryMargin}
                categoryMarginDelta={categoryMarginDelta}
                monthlySales={monthlySales}
                monthlySalesDelta={monthlySalesDelta}
                monthlyRevenue={monthlyRevenue}
                monthlyRevenueShare={monthlyRevenueShare}
                formatPoints={formatPoints}
                euroFormatter={euroFormatter}
                percentFormatter={percentFormatter}
              />
            )
        : null}

      {showDetailSkeleton ? (
        <RecipeCostSkeletonCard />
      ) : (
        <RecipeCostCard
          hasSelection={hasSelection}
          selectedRecipeName={selectedRecipe?.name ?? "-"}
          filteredCostPerPortionSeries={filteredCostPerPortionSeries}
          costTitle={costTitle}
          costPerPortionLatest={costPerPortionLatest}
          costPerPortionDelta={costPerPortionDelta}
          costPerPortionDeltaLabel={costPerPortionDeltaLabel}
          analysisStartLabel={analysisStartLabel}
          analysisEndLabel={analysisEndLabel}
          sortedIngredientRows={sortedIngredientRows}
          onIngredientNavigate={handleIngredientNavigate}
          euroFormatter={euroFormatter}
          percentFormatter={percentFormatter}
        />
      )}
    </div>
  )
}
