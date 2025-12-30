import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart, Label } from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

const buildScoreConfig = (color: string): ChartConfig => ({
  score: {
    label: "Score",
    color,
  },
})

type ScoreRadialProps = {
  value: number
  color?: string
  className?: string
}

export default function ScoreRadial({ value, color = "var(--chart-2)", className }: ScoreRadialProps) {
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
        <PolarAngleAxis type="number" domain={[0, 100]} dataKey="value" tick={false} axisLine={false} />
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
                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 22} className="fill-muted-foreground text-xs">
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
