import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import ScoreRadial from "./ScoreRadial"

type ScoreCardData = {
  id: string
  title: string
  subtitle: string
  detail: string
  value: number
  delta: number
}

type ScoreSummaryGridProps = {
  scores: ScoreCardData[]
  getScoreColor: (value: number) => string
}

export default function ScoreSummaryGrid({ scores, getScoreColor }: ScoreSummaryGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {scores.map((score) => (
        (() => {
          const isPositive = score.delta > 0
          const isNegative = score.delta < 0
          const isZero = score.delta === 0
          const badgeClass = isZero
            ? "bg-muted text-muted-foreground border border-border/60 hover:bg-muted"
            : isPositive
              ? "bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/10"
              : "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/10"
          const deltaLabel = isZero
            ? "0 point"
            : `${isPositive ? "+" : ""}${score.delta} points`

          return (
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
                      className={`mt-2 w-fit gap-1 ${badgeClass}`}
                    >
                      {isZero ? (
                        <Minus className="h-3.5 w-3.5" />
                      ) : isPositive ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )}
                      {deltaLabel}
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
          )
        })()
      ))}
    </div>
  )
}
