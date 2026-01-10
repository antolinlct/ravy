import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { UsageItem } from "../utils"

type UsageSectionProps = {
  usage: UsageItem[]
  isFree: boolean
}

export function UsageSection({ usage, isFree }: UsageSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Suivi de la consommation</p>
      {usage.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.key} className="border">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  <Icon className={item.iconClassName} />
                  {item.label}
                </span>
                <span className="text-muted-foreground">{item.detail}</span>
              </div>
              <Progress value={item.value} />
              <p className="text-sm text-muted-foreground">{item.quota}</p>
            </CardContent>
          </Card>
        )
      })}
      {isFree ? (
        <p className="text-sm text-muted-foreground">
          Passez à un plan payant pour débloquer plus de capacité.
        </p>
      ) : null}
    </div>
  )
}
