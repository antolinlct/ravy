import { Calendar } from "lucide-react"
import { AreaChart as AreaChartBlock } from "@/components/blocks/area-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ScoreTrendPoint = {
  label: string
  value: number
  date: string
}

type ScoreTrendCardProps = {
  metric: string
  metricLabels: Record<string, string>
  year: string
  yearOptions: string[]
  onMetricChange: (value: string) => void
  onYearChange: (value: string) => void
  series: ScoreTrendPoint[]
  formatMonthLabel: (date: Date) => string
}

export default function ScoreTrendCard({
  metric,
  metricLabels,
  year,
  yearOptions,
  onMetricChange,
  onYearChange,
  series,
  formatMonthLabel,
}: ScoreTrendCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>Evolution du {metricLabels[metric]}</CardTitle>
          <CardDescription>Suivi mensuel du score d&apos;optimisation.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={metric} onValueChange={onMetricChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(metricLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={onYearChange}>
            <SelectTrigger className="w-[120px] gap-2">
              <Calendar className="h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-[240px]">
          <AreaChartBlock
            data={series}
            variant="bare"
            showHeader={false}
            showDatePicker={false}
            showIntervalTabs={false}
            defaultInterval="month"
            enableZoom={false}
            enableWheelZoom={false}
            height={240}
            margin={{ left: -40 }}
            tooltipLabel={metricLabels[metric]}
            displayDateFormatter={formatMonthLabel}
            valueFormatter={(value) => `${Math.round(value)}`}
            tooltipValueFormatter={(value) => `${Math.round(value)}`}
            yTickFormatter={(value) => `${Math.round(value)}`}
            xTickFormatter={(_date, label) => label}
            yTickCount={4}
          />
        </div>
      </CardContent>
    </Card>
  )
}
