import { useMemo } from "react"
import { ChefHat } from "lucide-react"
import { useUser } from "@/context/UserContext"
import { useDashboardHomeData } from "./api"
import { SummaryCard } from "./components/summary-card"
import { LatestVariationsCard } from "./components/latest-variations-card"
import { OptimizedProductsCard } from "./components/optimized-products-card"
import { MarginChartCard } from "./components/margin-chart-card"
import { TopLowMarginCard } from "./components/top-low-margin-card"
import type { InvoiceStatItem } from "./types"
import { useIsMobile } from "@/hooks/use-mobile"

const FALLBACK_INVOICE_STATS: InvoiceStatItem[] = [
  { name: "Factures importées", value: "--" },
  { name: "TVA collectée", value: "--" },
  { name: "Dépenses HT", value: "--" },
]

export default function DashboardHomePage() {
  const user = useUser()
  const isMobile = useIsMobile()
  const { data, currentMonthLabel } = useDashboardHomeData()

  const displayName = useMemo(() => {
    const full = user?.fullName?.trim()
    if (full) {
      const [first] = full.split(" ")
      return first || full
    }
    return "l'équipe Ravy"
  }, [user?.fullName])

  const invoiceStats = data.invoiceStats.length ? data.invoiceStats : FALLBACK_INVOICE_STATS

  return (
    <div className="flex w-full items-start justify-start">
      <div className="w-full space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">Bonjour, {displayName} !</h1>
            </div>
            <p className="text-muted-foreground">Clarté, contrôle et suivi des coûts en un coup d&apos;oeil.</p>
          </div>
        </header>

        <SummaryCard currentMonth={currentMonthLabel} invoiceStats={invoiceStats} />

        <div className="grid gap-4 md:grid-cols-10">
          <LatestVariationsCard items={data.latestVariations} />
          <OptimizedProductsCard
            products={data.optimizedProducts}
            totalMonthlySavings={data.totalMonthlySavings}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-10">
          <MarginChartCard series={data.marginSeries} />
          {!isMobile && <TopLowMarginCard items={data.topLowMargin} />}
        </div>
      </div>
    </div>
  )
}
