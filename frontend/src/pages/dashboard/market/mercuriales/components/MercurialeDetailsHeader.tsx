import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft } from "lucide-react"

type MercurialeDetailsHeaderProps = {
  supplierName: string
  updatedAtLabel: string
  activeLevel: string
  levels: string[]
  levelLabels: Record<string, string>
  onBack: () => void
}

export default function MercurialeDetailsHeader({
  supplierName,
  updatedAtLabel,
  activeLevel,
  levels,
  levelLabels,
  onBack,
}: MercurialeDetailsHeaderProps) {
  return (
    <div className="flex items-stretch gap-3">
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 self-center"
        onClick={onBack}
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Retour</span>
      </Button>
      <div className="flex-1">
        <h1 className="text-2xl font-semibold">{supplierName}</h1>
        <p className="text-sm text-muted-foreground">Dernière mise à jour le {updatedAtLabel}</p>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="min-w-[220px] border bg-background shadow-none self-stretch">
            <CardContent className="h-full px-3 py-2 flex items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Votre niveau :</span>
                <div className="flex items-center gap-2">
                  {levels.map((level) => (
                    <Badge
                      key={level}
                      variant={level === activeLevel ? "default" : "secondary"}
                      className={
                        level === activeLevel
                          ? "px-2 py-0.5 text-xs shadow-sm pointer-events-none"
                          : "px-2 py-0.5 text-xs text-muted-foreground pointer-events-none"
                      }
                    >
                      {levelLabels[level] ?? level}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6} className="max-w-[260px] text-wrap text-center">
          Le niveau d&apos;accès donne droit à des prix plus ou moins faibles. Il est fixé en
          fonction de votre capacité d&apos;achat.
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
