import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { InvoiceRow } from "../types"

export type ProductInvoicesCardProps = {
  invoiceRows: InvoiceRow[]
  range: { start?: Date; end?: Date }
  euroFormatter: Intl.NumberFormat
}

export const ProductInvoicesCard = ({ invoiceRows, range, euroFormatter }: ProductInvoicesCardProps) => {
  const navigate = useNavigate()

  const parseInvoiceDate = (value: string) => {
    if (!value) return null
    if (value.includes("-")) {
      const parsedDate = new Date(value)
      return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
    }
    const [day, month, year] = value.split("/")
    if (!day || !month || !year) return null
    const parsedDate = new Date(Number(year), Number(month) - 1, Number(day))
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  const formatInvoiceDate = (date: Date) => {
    const formatted = date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    return formatted.replace(".", "").replace(/\s(\d{4})$/, ", $1")
  }

  const filteredInvoiceRows = useMemo(() => {
    const rows =
      range.start && range.end
        ? invoiceRows.filter((invoice) => {
            const parsedDate = parseInvoiceDate(invoice.date)
            if (!parsedDate) return false
            return parsedDate >= range.start! && parsedDate <= range.end!
          })
        : invoiceRows

    return [...rows].sort((a, b) => {
      const dateA = parseInvoiceDate(a.date)?.getTime() ?? 0
      const dateB = parseInvoiceDate(b.date)?.getTime() ?? 0
      return dateB - dateA
    })
  }, [invoiceRows, range.end, range.start])

  return (
    <Card className="lg:col-span-3">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-3">
          <CardTitle>Factures liées au produit</CardTitle>
          <p className="text-sm text-muted-foreground">Factures contenant le produit analysé</p>
        </div>
        <div className="rounded-md border">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-3">Facture</TableHead>
                <TableHead className="w-36">Date</TableHead>
                <TableHead className="w-28 text-center">TTC</TableHead>
                <TableHead className="w-10 text-right" />
              </TableRow>
            </TableHeader>
          </Table>
          <ScrollArea className="max-h-[264px]">
            <Table className="table-fixed w-full">
              <TableBody>
                {filteredInvoiceRows.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-muted/40"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/dashboard/invoices/${invoice.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        navigate(`/dashboard/invoices/${invoice.id}`)
                      }
                    }}
                  >
                    <TableCell className="pl-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{invoice.number}</p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.items} {invoice.items > 1 ? "articles" : "article"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="w-36 text-sm">
                      {(() => {
                        const parsedDate = parseInvoiceDate(invoice.date)
                        return parsedDate ? formatInvoiceDate(parsedDate) : invoice.date
                      })()}
                    </TableCell>
                    <TableCell className="w-28 text-right">
                      <Badge variant="secondary" className="text-sm font-semibold">
                        {euroFormatter.format(invoice.ttc)}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-10 text-right">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredInvoiceRows.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                      Aucune facture sur la période sélectionnée.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
