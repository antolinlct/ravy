import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import type { InvoiceStatItem } from "../types"

type SummaryCardProps = {
  currentMonth: string
  invoiceStats: InvoiceStatItem[]
}

export function SummaryCard({ currentMonth, invoiceStats }: SummaryCardProps) {
  return (
    <Card className="w-full shadow-sm bg-background">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <CardDescription className="text-sm tracking-wide text-muted-foreground">
              {currentMonth}
            </CardDescription>
            <CardTitle className="text-xl">Résumé financier</CardTitle>
          </div>
          <dl className="grid w-full gap-4 sm:grid-cols-3 sm:max-w-2xl">
            {invoiceStats.map((item) => (
              <Card key={item.name} className="p-0 rounded-md">
                <CardContent className="p-3">
                  <dd className="flex flex-col gap-1">
                    <span className="truncate text-xs text-muted-foreground">{item.name}</span>
                    <span className="text-xl font-semibold self-end text-primary">{item.value}</span>
                  </dd>
                </CardContent>
              </Card>
            ))}
          </dl>
        </div>
      </CardContent>
    </Card>
  )
}
