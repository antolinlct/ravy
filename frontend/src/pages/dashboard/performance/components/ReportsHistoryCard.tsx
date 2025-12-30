import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ReportRow = {
  id: string
  period: string
  lastUpdated: string
  revenue: number
  expenses: number
  result: number
  margin: number
}

type ReportsHistoryCardProps = {
  rows: ReportRow[]
  onNavigate: (reportId: string) => void
  formatEuro: (value: number) => string
  formatPercent: (value: number) => string
  headerAction: React.ReactNode
}

export default function ReportsHistoryCard({
  rows,
  onNavigate,
  formatEuro,
  formatPercent,
  headerAction,
}: ReportsHistoryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Rapports financiers</CardTitle>
          <p className="text-sm text-muted-foreground">
            Historique des rapports generes pour votre etablissement.
          </p>
        </div>
        {headerAction}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-3 w-[28%]">Periode</TableHead>
                <TableHead className="w-32 text-left">Chiffre d&apos;affaires</TableHead>
                <TableHead className="w-28 text-left">Coûts</TableHead>
                <TableHead className="w-28 text-left">Résultat</TableHead>
                <TableHead className="w-36 text-left">Marge operationnelle</TableHead>
                <TableHead className="w-10 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate(row.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      onNavigate(row.id)
                    }
                  }}
                >
                  <TableCell className="pl-3 w-[28%]">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{row.period}</p>
                      <p className="text-xs text-muted-foreground">
                        Derniere modif. : {row.lastUpdated}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <Badge
                      variant="secondary"
                      className="inline-flex min-w-[96px] justify-center text-sm font-semibold"
                    >
                      {formatEuro(row.revenue)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left">
                    <span className="inline-flex min-w-[96px] justify-start text-sm font-semibold">
                      {formatEuro(row.expenses)}
                    </span>
                  </TableCell>
                  <TableCell className="text-left">
                    <Badge
                      variant="outline"
                      className="inline-flex min-w-[96px] justify-center text-sm font-semibold"
                    >
                      {formatEuro(row.result)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left text-sm font-semibold">
                    {formatPercent(row.margin)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    Aucun rapport disponible.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
