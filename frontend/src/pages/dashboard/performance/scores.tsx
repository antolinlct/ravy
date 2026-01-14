import { useEffect, useMemo, useState } from "react"
import RewardTop1 from "@/assets/rewards/top-1.png"
import RewardTop2 from "@/assets/rewards/top-2.png"
import RewardTop3 from "@/assets/rewards/top-3.png"
import RewardTop10 from "@/assets/rewards/top-10.png"
import RewardTop25 from "@/assets/rewards/top-25.png"
import RewardTop50 from "@/assets/rewards/top-50.png"
import RewardTop100 from "@/assets/rewards/top-100.png"
import ConsultantAvatar from "@/assets/avatar.png"
import { AccessLockedCard } from "@/components/access/AccessLockedCard"
import { useAccess } from "@/components/access/access-control"
import { useEstablishmentPlanCode } from "@/context/EstablishmentDataContext"
import ScoreHeader from "./components/ScoreHeader"
import ScoreGlobalCard from "./components/ScoreGlobalCard"
import ScoreTrendCard from "./components/ScoreTrendCard"
import ScoreSummaryGrid from "./components/ScoreSummaryGrid"
import ScoreConsultantCard from "./components/ScoreConsultantCard"
import { PerformancePlanPreview } from "./components/PerformancePlanPreview"
import { getReportMonthDate, usePerformanceScoresData } from "./api"

const getScoreColor = (value: number) => {
  if (value <= 50) return "var(--chart-2)"
  if (value <= 74) return "var(--chart-3)"
  return "var(--chart-1)"
}

const getRankingReward = (rank: number) => {
  if (rank <= 1) return RewardTop1
  if (rank === 2) return RewardTop2
  if (rank === 3) return RewardTop3
  if (rank <= 10) return RewardTop10
  if (rank <= 25) return RewardTop25
  if (rank <= 50) return RewardTop50
  return RewardTop100
}

const safeScoreValue = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null

const buildScoreDelta = (current?: number | null, previous?: number | null) => {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0
  return Math.round(Number(current) - Number(previous))
}

const formatScoreMonth = (date: Date) => {
  const formatted = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

type ScoreTrendPoint = {
  label: string
  value: number
  date: Date
  isLive?: boolean
}

export default function PerformanceScoresPage() {
  const { can } = useAccess()
  const planCode = useEstablishmentPlanCode()
  const { reports, liveScores, globalRanking, isLoading, error } = usePerformanceScoresData()

  const sortedReports = useMemo(() => {
    return reports
      .map((report) => ({
        report,
        monthDate: getReportMonthDate(report),
      }))
      .filter((item): item is { report: typeof reports[number]; monthDate: Date } => Boolean(item.monthDate))
      .sort((a, b) => b.monthDate.getTime() - a.monthDate.getTime())
  }, [reports])

  const latestReport = sortedReports[0]?.report
  const previousReport = sortedReports[1]?.report
  const latestMonth = sortedReports[0]?.monthDate ?? null

  const getLiveScoreEntry = (type: "global" | "purchase" | "recipe" | "financial") => {
    const candidates = liveScores.filter(
      (score) => score.type === type && Number.isFinite(score.value)
    )
    if (!candidates.length) return null
    return [...candidates].sort((a, b) => {
      const aTime = a.updated_at
        ? new Date(a.updated_at).getTime()
        : a.created_at
          ? new Date(a.created_at).getTime()
          : 0
      const bTime = b.updated_at
        ? new Date(b.updated_at).getTime()
        : b.created_at
          ? new Date(b.created_at).getTime()
          : 0
      return bTime - aTime
    })[0]
  }

  const getLiveScoreValue = (type: "global" | "purchase" | "recipe" | "financial") => {
    const match = getLiveScoreEntry(type)
    return safeScoreValue(match?.value)
  }

  const liveGlobalValue = getLiveScoreValue("global")
  const liveBuyValue = getLiveScoreValue("purchase")
  const liveRecipeValue = getLiveScoreValue("recipe")
  const liveFinanceValue = getLiveScoreValue("financial")

  const reportGlobalValue = safeScoreValue(latestReport?.score_global)
  const reportBuyValue = safeScoreValue(latestReport?.score_purchase)
  const reportRecipeValue = safeScoreValue(latestReport?.score_recipe)
  const reportFinanceValue = safeScoreValue(latestReport?.score_financial)

  const previousGlobalValue = safeScoreValue(previousReport?.score_global)
  const previousBuyValue = safeScoreValue(previousReport?.score_purchase)
  const previousRecipeValue = safeScoreValue(previousReport?.score_recipe)
  const previousFinanceValue = safeScoreValue(previousReport?.score_financial)

  const globalScore = liveGlobalValue ?? reportGlobalValue ?? 0
  const buyScore = liveBuyValue ?? reportBuyValue ?? 0
  const recipeScore = liveRecipeValue ?? reportRecipeValue ?? 0
  const financeScore = liveFinanceValue ?? reportFinanceValue ?? 0

  const globalDelta =
    liveGlobalValue !== null && reportGlobalValue !== null
      ? Math.round(liveGlobalValue - reportGlobalValue)
      : buildScoreDelta(reportGlobalValue, previousGlobalValue)
  const buyDelta =
    liveBuyValue !== null && reportBuyValue !== null
      ? Math.round(liveBuyValue - reportBuyValue)
      : buildScoreDelta(reportBuyValue, previousBuyValue)
  const recipeDelta =
    liveRecipeValue !== null && reportRecipeValue !== null
      ? Math.round(liveRecipeValue - reportRecipeValue)
      : buildScoreDelta(reportRecipeValue, previousRecipeValue)
  const financeDelta =
    liveFinanceValue !== null && reportFinanceValue !== null
      ? Math.round(liveFinanceValue - reportFinanceValue)
      : buildScoreDelta(reportFinanceValue, previousFinanceValue)

  const globalDeltaIsPositive = globalDelta >= 0
  const resolvedRanking = globalRanking ?? { position: 1, total: 1 }
  const rankingSuffix = resolvedRanking.position === 1 ? "er" : "ème"
  const globalRankingReward = getRankingReward(resolvedRanking.position)
  const isReportPenalty = useMemo(() => {
    const previousMonth = new Date()
    previousMonth.setDate(1)
    previousMonth.setHours(0, 0, 0, 0)
    previousMonth.setMonth(previousMonth.getMonth() - 1)
    return !sortedReports.some(
      (item) =>
        item.monthDate.getFullYear() === previousMonth.getFullYear() &&
        item.monthDate.getMonth() === previousMonth.getMonth()
    )
  }, [sortedReports])
  const subtitleCopy = isReportPenalty
    ? "Vos scores sont pénalisés : le rapport du mois précédent n’a pas été renseigné."
    : "Suivez le score d'optimisation de votre établissement."
  const subtitleClassName = isReportPenalty ? "text-sm text-red-500" : undefined

  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => {
    const years = new Set<number>()
    sortedReports.forEach((item) => years.add(item.monthDate.getFullYear()))
    liveScores.forEach((score) => {
      const dateValue = score.updated_at ?? score.created_at
      if (!dateValue) return
      const date = new Date(dateValue)
      if (Number.isNaN(date.getTime())) return
      years.add(date.getFullYear())
    })
    years.add(currentYear)
    return Array.from(years)
      .sort((a, b) => b - a)
      .map((value) => `${value}`)
  }, [sortedReports, liveScores, currentYear])

  const [scoreYear, setScoreYear] = useState(`${currentYear}`)
  const [scoreMetric, setScoreMetric] = useState<"global" | "buy" | "recipes" | "finance">("global")

  useEffect(() => {
    if (!yearOptions.includes(scoreYear)) {
      setScoreYear(yearOptions[0] ?? `${currentYear}`)
    }
  }, [currentYear, scoreYear, yearOptions])

  const scoreMetricLabels = {
    global: "Score global",
    buy: "Score achat",
    recipes: "Score recettes",
    finance: "Score financier",
  } as const

  const scoreTrendSeries = useMemo(() => {
    const year = Number(scoreYear)
    const points: ScoreTrendPoint[] = sortedReports
      .filter((item) => item.monthDate.getFullYear() === year)
      .map((item) => {
        const metricValue =
          scoreMetric === "global"
            ? safeScoreValue(item.report.score_global)
            : scoreMetric === "buy"
              ? safeScoreValue(item.report.score_purchase)
              : scoreMetric === "recipes"
                ? safeScoreValue(item.report.score_recipe)
                : safeScoreValue(item.report.score_financial)

        if (metricValue === null) return null

        return {
          label: item.monthDate.toISOString(),
          value: metricValue,
          date: item.monthDate,
        }
      })
      .filter((item): item is ScoreTrendPoint => Boolean(item))

    const metricToLiveType = {
      global: "global",
      buy: "purchase",
      recipes: "recipe",
      finance: "financial",
    } as const
    const liveType = metricToLiveType[scoreMetric]
    const liveScore = getLiveScoreEntry(liveType)
    const liveValue = safeScoreValue(liveScore?.value)
    const rawLiveDateValue = liveScore?.updated_at ?? liveScore?.created_at
    const rawLiveDate = rawLiveDateValue ? new Date(rawLiveDateValue) : null
    if (
      liveValue !== null &&
      rawLiveDate &&
      !Number.isNaN(rawLiveDate.getTime()) &&
      rawLiveDate.getFullYear() === year
    ) {
      points.push({
        label: `live-${rawLiveDate.toISOString()}`,
        value: liveValue,
        date: rawLiveDate,
        isLive: true,
      })
    }

    return points.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [scoreMetric, scoreYear, sortedReports, liveScores])

  const scoreCards = [
    {
      id: "buy",
      title: "Score achat",
      subtitle: "Qualité de vos achats clés",
      detail: "Évalue la qualité de vos achats : négociation des prix et contrôle des produits clés.",
      value: buyScore,
      delta: buyDelta,
    },
    {
      id: "recipes",
      title: "Score recettes",
      subtitle: "Optimisation de vos recettes",
      detail: "Mesure la rentabilité de vos plats : coûts matière maîtrisés et marges réalisées.",
      value: recipeScore,
      delta: recipeDelta,
    },
    {
      id: "finance",
      title: "Score financier",
      subtitle: "Performance de vos finances",
      detail: "Suit l'équilibre financier global : rentabilité et cohérence entre ventes et dépenses.",
      value: financeScore,
      delta: financeDelta,
    },
  ]

  const consultantMessages: Record<"buy" | "recipes" | "finance", { lead: string; tail: string }> = {
    buy: {
      lead: "Vos achats freinent votre marge !",
      tail:
        "Concentrez-vous sur vos 10 produits les plus achetés, comparez les fournisseurs et négociez les volumes : ce sont souvent des gains immédiats sur la facture du mois.",
    },
    recipes: {
      lead: "Vos recettes tirent la rentabilité vers le bas !",
      tail:
        "Ajustez les portions, recalculez les coûts matière et repositionnez certains prix : quelques réglages suffisent à regagner des points de marge dès les prochains services.",
    },
    finance: {
      lead: "Vos ventes ne soutiennent pas encore assez l'activité !",
      tail:
        "Agissez sur les frais fixes et variables, et adaptez vos plannings aux pics d'affluence : un pilotage progressif améliore rapidement la trésorerie.",
    },
  }

  const weakestScore = scoreCards.reduce((lowest, item) => (item.value < lowest.value ? item : lowest))
  const consultantCopy = consultantMessages[weakestScore.id as keyof typeof consultantMessages]

  if (!can("performance")) {
    return <AccessLockedCard />
  }
  const planValue = typeof planCode === "string" ? planCode.toUpperCase() : null
  const planLocked = planValue === "PLAN_APERO" || planValue === "PLAN_PLAT"
  if (planLocked) {
    return <PerformancePlanPreview />
  }

  return (
    <div className="space-y-4">
      <ScoreHeader
        title="Performances"
        subtitle={subtitleCopy}
        subtitleClassName={subtitleClassName}
        ctaLabel="Comprendre mes score"
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_minmax(0,3.4fr)]">
        <ScoreGlobalCard
          score={globalScore}
          delta={globalDelta}
          deltaIsPositive={globalDeltaIsPositive}
          rankingPosition={resolvedRanking.position}
          rankingTotal={resolvedRanking.total}
          rankingSuffix={rankingSuffix}
          rankingRewardSrc={globalRankingReward}
          monthLabel={latestMonth ? formatScoreMonth(latestMonth) : "Dernier mois"}
          tooltip="Basé sur les autres scores : 0,4 × score achat + 0,4 × score recette + 0,2 × score financier."
          scoreColor={getScoreColor(globalScore)}
        />
        <ScoreTrendCard
          metric={scoreMetric}
          metricLabels={scoreMetricLabels}
          year={scoreYear}
          yearOptions={yearOptions}
          onMetricChange={(value) => setScoreMetric(value as typeof scoreMetric)}
          onYearChange={setScoreYear}
          series={scoreTrendSeries}
          formatMonthLabel={formatScoreMonth}
        />
      </div>

      {isLoading && !scoreTrendSeries.length ? (
        <p className="text-sm text-muted-foreground">Chargement des scores...</p>
      ) : null}

      <ScoreSummaryGrid scores={scoreCards} getScoreColor={getScoreColor} />

      <ScoreConsultantCard
        avatarSrc={ConsultantAvatar}
        lead={consultantCopy.lead}
        tail={consultantCopy.tail}
      />
    </div>
  )
}
