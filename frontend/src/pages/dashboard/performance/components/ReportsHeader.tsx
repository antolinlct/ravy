import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"

type ReportsHeaderProps = {
  title: string
  subtitle: string
  ctaLabel: string
}

export default function ReportsHeader({ title, subtitle, ctaLabel }: ReportsHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Button variant="secondary" className="gap-2">
        <Info className="h-4 w-4" />
        {ctaLabel}
      </Button>
    </div>
  )
}
