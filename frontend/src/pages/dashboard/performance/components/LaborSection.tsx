import { Card, CardContent, CardHeader } from "@/components/ui/card"

type LaborSectionProps = {
  laborCopy: {
    efficiencyTitle: string
    efficiencyTooltip: string
    efficiencyRevenueLabel: string
    efficiencyResultLabel: string
    efficiencyNote: string
    payrollTitle: string
    payrollTooltip: string
    payrollTotalLabel: string
    payrollPerEmployeeLabel: string
    payrollNotePrefix: string
    payrollNoteSuffix: string
  }
  reportData: {
    revenue_per_employee: number
    result_per_employee: number
    labor_cost_total: number
    salary_per_employee: number
    labor_cost_ratio: number
  }
  reportDeltas: {
    revenue_per_employee: number | null
    result_per_employee: number | null
    labor_cost_total: number | null
  }
  formatEuro: (value: number) => string
  formatPercent: (value: number) => string
  renderInfoHeader: (title: string, tooltip: string) => React.ReactNode
  renderDelta: (delta: number | null) => React.ReactNode
}

export default function LaborSection({
  laborCopy,
  reportData,
  reportDeltas,
  formatEuro,
  formatPercent,
  renderInfoHeader,
  renderDelta,
}: LaborSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg border border-border/60 p-4 space-y-2">
          <CardHeader className="p-0">
            {renderInfoHeader(laborCopy.efficiencyTitle, laborCopy.efficiencyTooltip)}
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{laborCopy.efficiencyRevenueLabel}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-semibold">{formatEuro(reportData.revenue_per_employee)}</span>
                  {renderDelta(reportDeltas.revenue_per_employee)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{laborCopy.efficiencyResultLabel}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-semibold">{formatEuro(reportData.result_per_employee)}</span>
                  {renderDelta(reportDeltas.result_per_employee)}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{laborCopy.efficiencyNote}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-border/60 p-4 space-y-2">
          <CardHeader className="p-0">
            {renderInfoHeader(laborCopy.payrollTitle, laborCopy.payrollTooltip)}
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{laborCopy.payrollTotalLabel}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-semibold">{formatEuro(reportData.labor_cost_total)}</span>
                  {renderDelta(reportDeltas.labor_cost_total)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{laborCopy.payrollPerEmployeeLabel}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-semibold">{formatEuro(reportData.salary_per_employee)}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {laborCopy.payrollNotePrefix} {formatPercent(reportData.labor_cost_ratio)}{" "}
              {laborCopy.payrollNoteSuffix}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
