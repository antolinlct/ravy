import { ArrowDown, ArrowUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import ScoreRadial from "./ScoreRadial"

type ScoreGlobalCardProps = {
  score: number
  delta: number
  deltaIsPositive: boolean
  rankingPosition: number
  rankingTotal: number
  rankingSuffix: string
  rankingRewardSrc: string
  monthLabel: string
  tooltip: string
  scoreColor: string
}

export default function ScoreGlobalCard({
  score,
  delta,
  deltaIsPositive,
  rankingPosition,
  rankingTotal,
  rankingSuffix,
  rankingRewardSrc,
  monthLabel,
  tooltip,
  scoreColor,
}: ScoreGlobalCardProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="p-5">
          <CardHeader className="items-center text-center pt-0 px-0 py-0 pb-3">
            <CardTitle>Score global</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            <div className="flex flex-col items-center gap-3">
              <ScoreRadial value={score} color={scoreColor} className="mx-auto" />
              <Badge
                className={`gap-1 text-sm font-semibold ${
                  deltaIsPositive
                    ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/10"
                    : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/10"
                }`}
              >
                {deltaIsPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-3 w-3" />}
                {deltaIsPositive ? "+" : ""}
                {delta} points
              </Badge>
              <CardDescription>{monthLabel}</CardDescription>
              <div className="flex w-full items-center justify-center gap-3 rounded-lg bg-muted/60 px-4 py-2">
                <img
                  src={rankingRewardSrc}
                  alt="Classement"
                  className="-my-3 -ml-3 h-12.5 w-12.5 object-contain"
                />
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">Classement</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-m font-semibold text-foreground">
                      {rankingPosition}
                      <span className="ml-0.5 relative -top-0.5 text-xs font-semibold text-muted-foreground">
                        {rankingSuffix}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">sur {rankingTotal}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} className="max-w-[280px] text-center">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
