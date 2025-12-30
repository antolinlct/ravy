import { useMemo, useState } from "react"
import RewardTop1 from "@/assets/rewards/top-1.png"
import RewardTop2 from "@/assets/rewards/top-2.png"
import RewardTop3 from "@/assets/rewards/top-3.png"
import RewardTop10 from "@/assets/rewards/top-10.png"
import RewardTop25 from "@/assets/rewards/top-25.png"
import RewardTop50 from "@/assets/rewards/top-50.png"
import RewardTop100 from "@/assets/rewards/top-100.png"
import ConsultantAvatar from "@/assets/avatar.png"
import ScoreHeader from "./components/ScoreHeader"
import ScoreGlobalCard from "./components/ScoreGlobalCard"
import ScoreTrendCard from "./components/ScoreTrendCard"
import ScoreSummaryGrid from "./components/ScoreSummaryGrid"
import ScoreConsultantCard from "./components/ScoreConsultantCard"

type ScoreKey = "buy" | "recipes" | "finance"

type ScoreCard = {
  id: ScoreKey
  title: string
  subtitle: string
  detail: string
  value: number
  delta: number
}

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

export default function PerformanceScoresPage() {
  const globalScore = 83
  const globalDelta = 12
  const globalDeltaIsPositive = globalDelta >= 0
  const globalRanking = { position: 1, total: 14 }
  const globalRankingReward = getRankingReward(globalRanking.position)
  const rankingSuffix = globalRanking.position === 1 ? "er" : "ème"
  const currentYear = new Date().getFullYear()
  const startYear = 2023
  const yearOptions = Array.from(
    { length: currentYear - startYear + 1 },
    (_, index) => `${startYear + index}`
  )
  const [scoreYear, setScoreYear] = useState(`${currentYear}`)
  const [scoreMetric, setScoreMetric] = useState<"global" | "buy" | "recipes" | "finance">("global")

  const monthLabels = [
    "Janv.",
    "Fév.",
    "Mars",
    "Avr.",
    "Mai",
    "Juin",
    "Juil.",
    "Août",
    "Sept.",
    "Oct.",
    "Nov.",
    "Déc.",
  ]
  const scoreMetricLabels = {
    global: "Score global",
    buy: "Score achat",
    recipes: "Score recettes",
    finance: "Score financier",
  } as const
  const scoreTrendValues = {
    global: [72, 74, 75, 76, 78, 80, 82, 83, 84, 85, 84, 83],
    buy: [18, 20, 22, 19, 21, 24, 26, 23, 25, 22, 20, 19],
    recipes: [48, 50, 52, 54, 55, 57, 58, 60, 59, 58, 57, 57],
    finance: [64, 66, 67, 69, 70, 72, 73, 74, 75, 76, 76, 75],
  }
  const scoreTrendSeries = useMemo(
    () =>
      scoreTrendValues[scoreMetric].map((value, index) => ({
        label: monthLabels[index],
        value,
        date: `${scoreYear}-${String(index + 1).padStart(2, "0")}-01`,
      })),
    [scoreMetric, scoreYear]
  )
  const formatScoreMonth = (date: Date) => {
    const formatted = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }
  const scoreCards: ScoreCard[] = [
    {
      id: "buy",
      title: "Score achat",
      subtitle: "Qualité de vos achats clés",
      detail: "Évalue la qualité de vos achats : négociation des prix et contrôle des produits clés.",
      value: 12,
      delta: -6,
    },
    {
      id: "recipes",
      title: "Score recettes",
      subtitle: "Optimisation de vos recettes",
      detail: "Mesure la rentabilité de vos plats : coûts matière maîtrisés et marges réalisées.",
      value: 57,
      delta: 3,
    },
    {
      id: "finance",
      title: "Score financier",
      subtitle: "Performance de vos finances",
      detail: "Suit l'équilibre financier global : rentabilité et cohérence entre ventes et dépenses.",
      value: 75,
      delta: 1,
    },
  ]
  const consultantMessages: Record<ScoreKey, { lead: string; tail: string }> = {
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
  const consultantCopy = consultantMessages[weakestScore.id]

  return (
    <div className="space-y-4">
      <ScoreHeader
        title="Performances"
        subtitle="Suivez le score d'optimisation de votre établissement."
        ctaLabel="Comprendre mes score"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_minmax(0,3.4fr)]">
        <ScoreGlobalCard
          score={globalScore}
          delta={globalDelta}
          deltaIsPositive={globalDeltaIsPositive}
          rankingPosition={globalRanking.position}
          rankingTotal={globalRanking.total}
          rankingSuffix={rankingSuffix}
          rankingRewardSrc={globalRankingReward}
          monthLabel="Décembre 2025"
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

      <ScoreSummaryGrid scores={scoreCards} getScoreColor={getScoreColor} />

      <ScoreConsultantCard
        avatarSrc={ConsultantAvatar}
        lead={consultantCopy.lead}
        tail={consultantCopy.tail}
      />
    </div>
  )
}
