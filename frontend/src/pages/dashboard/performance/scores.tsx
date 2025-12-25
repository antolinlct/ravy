import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Calendar, Info } from "lucide-react"
import { Label, PolarAngleAxis, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
import { AreaChart as AreaChartBlock } from "@/components/blocks/area-chart"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import RewardTop1 from "@/assets/rewards/top-1.png"
import RewardTop2 from "@/assets/rewards/top-2.png"
import RewardTop3 from "@/assets/rewards/top-3.png"
import RewardTop10 from "@/assets/rewards/top-10.png"
import RewardTop25 from "@/assets/rewards/top-25.png"
import RewardTop50 from "@/assets/rewards/top-50.png"
import RewardTop100 from "@/assets/rewards/top-100.png"
import ConsultantAvatar from "@/assets/avatar.png"

type ScoreKey = "buy" | "recipes" | "finance"

type ScoreCard = {
  id: ScoreKey
  title: string
  subtitle: string
  detail: string
  value: number
  delta: number
}

const buildScoreConfig = (color: string): ChartConfig => ({
  score: {
    label: "Score",
    color,
  },
})

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

const ScoreRadial = ({
  value,
  color = "var(--chart-2)",
  className,
}: {
  value: number
  color?: string
  className?: string
}) => {
  const normalized = Math.min(Math.max(value, 0), 100)
  const displayValue = `${Math.round(value)}`
  const chartData = [{ name: "score", value: normalized, fill: "var(--color-score)" }]
  const chartConfig = buildScoreConfig(color)
  const innerRadius = 50
  const outerRadius = 80
  const polarRadius: [number, number] = [innerRadius + 6, innerRadius - 6]

  return (
    <ChartContainer
      config={chartConfig}
      className={`aspect-square h-[140px] w-[140px]${className ? ` ${className}` : ""}`}
    >
      <RadialBarChart
        data={chartData}
        startAngle={250}
        endAngle={-110}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          dataKey="value"
          tick={false}
          axisLine={false}
        />
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="first:fill-muted last:fill-background"
          polarRadius={polarRadius}
        />
        <RadialBar dataKey="value" background cornerRadius={10} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">
                      {displayValue}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 22}
                      className="fill-muted-foreground text-xs"
                    >
                      /100
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  )
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Performances</h1>
          <p className="text-sm text-muted-foreground">
            Suivez le score d&apos;optimisation de votre établissement.
          </p>
        </div>
        <Button variant="secondary" className="gap-2">
          <Info className="h-4 w-4" />
          Comprendre mes score
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_minmax(0,3.4fr)]">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="p-5">
              <CardHeader className="items-center text-center pt-0 px-0 py-0 pb-3">
                <CardTitle>Score global</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-0">
                <div className="flex flex-col items-center gap-3">
                  <ScoreRadial value={globalScore} color={getScoreColor(globalScore)} className="mx-auto" />
                  <Badge
                    className={`gap-1 text-sm font-semibold ${
                      globalDeltaIsPositive
                        ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/10"
                        : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/10"
                    }`}
                  >
                    {globalDeltaIsPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-3 w-3" />}
                    {globalDeltaIsPositive ? "+" : ""}
                    {globalDelta} points
                  </Badge>
                  <CardDescription>Décembre 2025</CardDescription>
                  <div className="flex w-full items-center justify-center gap-3 rounded-lg bg-muted/60 px-4 py-2">
                    <img src={globalRankingReward} alt="Classement" className="-my-3 -ml-3 h-12.5 w-12.5 object-contain" />
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">Classement</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-m font-semibold text-foreground">
                          {globalRanking.position}
                          <span className="ml-0.5 relative -top-0.5 text-xs font-semibold text-muted-foreground">
                            {rankingSuffix}
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground">sur {globalRanking.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8} className="max-w-[280px] text-center">
            Basé sur les autres scores : 0,4 × score achat + 0,4 × score recette + 0,2 × score financier.
          </TooltipContent>
        </Tooltip>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle>Evolution du {scoreMetricLabels[scoreMetric]}</CardTitle>
              <CardDescription>Suivi mensuel du score d&apos;optimisation.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={scoreMetric} onValueChange={(value) => setScoreMetric(value as typeof scoreMetric)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(scoreMetricLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={scoreYear} onValueChange={setScoreYear}>
                <SelectTrigger className="w-[120px] gap-2">
                  <Calendar className="h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-h-[240px]">
              <AreaChartBlock
                data={scoreTrendSeries}
                variant="bare"
                showHeader={false}
                showDatePicker={false}
                showIntervalTabs={false}
                defaultInterval="month"
                enableZoom={false}
                enableWheelZoom={false}
                height={240}
                margin={{ left: -40 }}
                tooltipLabel={scoreMetricLabels[scoreMetric]}
                displayDateFormatter={formatScoreMonth}
                valueFormatter={(value) => `${Math.round(value)}`}
                tooltipValueFormatter={(value) => `${Math.round(value)}`}
                yTickFormatter={(value) => `${Math.round(value)}`}
                xTickFormatter={(_date, label) => label}
                yTickCount={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {scoreCards.map((score) => (
          <Tooltip key={score.id}>
            <TooltipTrigger asChild>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-top">
                    <div className="shrink-0 h-[100px] overflow-hidden">
                      <div className="origin-top-left scale-75">
                        <ScoreRadial value={score.value} color={getScoreColor(score.value)} />
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col pt-2">
                      <p className="text-sm font-semibold text-foreground">{score.title}</p>
                      <p className="text-sm text-muted-foreground">{score.subtitle}</p>
                      <Badge
                        variant="secondary"
                        className={`mt-2 w-fit gap-1 ${
                          score.delta >= 0
                            ? "bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/10"
                            : "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/10"
                        }`}
                      >
                        {score.delta >= 0 ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                        {score.delta > 0 ? "+" : ""}
                        {score.delta} points
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8} className="max-w-[280px] text-center">
              {score.detail}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Card>
        <CardContent className="flex items-start gap-6 p-4">
          <div className="-mt-4 -mb-2 flex flex-col items-center">
            <Avatar className="h-22 w-22">
              <AvatarImage src={ConsultantAvatar} alt="Consultant" className="bg-transparent" />
            </Avatar>
            <p className="text-xs text-muted-foreground -mt-1">Le consultant</p>
          </div>
          <div className="flex-1 space-y-2 self-center">
            <p className="text-base">{consultantCopy.lead}</p>
            {consultantCopy.tail ? (
              <p className="text-sm text-muted-foreground">{consultantCopy.tail}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
