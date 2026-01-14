import { useMemo, useState } from "react"
import { ArrowDownToLine, ArrowRight, ChevronDown, ChevronUp, ChevronsUpDown, Loader2 } from "lucide-react"
import JSZip from "jszip"
import * as XLSX from "xlsx"
import { useNavigate } from "react-router-dom"
import { usePostHog } from "posthog-js/react"
import { toast } from "sonner"
import api from "@/lib/axiosClient"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import MultipleCombobox from "@/components/ui/multiple_combobox"
import { DoubleDatePicker, type DoubleDatePickerValue } from "@/components/blocks/double-datepicker"
import { filterInvoices, getInvoiceDocumentUrl, toCurrencyNumber } from "../api"
import type { InvoiceListItem, SupplierOption } from "../types"
import { useAccess } from "@/components/access/access-control"

const MIN_DATE = new Date("2022-01-01")

type SortKey = "createdAt" | "supplier" | "date" | "ht" | "tva" | "ttc"

type InvoicesTableCardProps = {
  establishmentId?: string
  invoices: InvoiceListItem[]
  supplierOptions: SupplierOption[]
  isLoading?: boolean
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  pageSize?: number
  startDate?: Date
  endDate?: Date
  onDateRangeChange?: (value: DoubleDatePickerValue) => void
}

export default function InvoicesTableCard({
  establishmentId,
  invoices,
  supplierOptions,
  isLoading,
  hasMore,
  isLoadingMore,
  onLoadMore,
  pageSize,
  startDate,
  endDate,
  onDateRangeChange,
}: InvoicesTableCardProps) {
  const navigate = useNavigate()
  const posthog = usePostHog()
  const { role } = useAccess()
  const isStaff = role === "staff"
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>(startDate)
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>(endDate)
  const [exportSuppliers, setExportSuppliers] = useState<string[]>([])
  const [exportSelectedIds, setExportSelectedIds] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const handleFilterDatesChange = ({ startDate: nextStart, endDate: nextEnd }: DoubleDatePickerValue) => {
    onDateRangeChange?.({ startDate: nextStart, endDate: nextEnd })
  }

  const handleExportDatesChange = ({ startDate: nextStart, endDate: nextEnd }: DoubleDatePickerValue) => {
    setExportStartDate(nextStart)
    setExportEndDate(nextEnd)
  }

  const filteredInvoices = filterInvoices(invoices, startDate, endDate, selectedSuppliers)

  const sortedInvoices = useMemo(() => {
    const toValue = (inv: InvoiceListItem) => {
      if (sortKey === "createdAt") return inv.createdAt ? inv.createdAt.getTime() : 0
      if (sortKey === "supplier") return inv.supplier.toLowerCase()
      if (sortKey === "date") return inv.dateValue ? inv.dateValue.getTime() : 0
      if (sortKey === "ht") return toCurrencyNumber(inv.ht)
      if (sortKey === "tva") return toCurrencyNumber(inv.tva)
      if (sortKey === "ttc") return inv.ttcValue ?? toCurrencyNumber(inv.ttc)
      return null
    }
    const comparator = (a: InvoiceListItem, b: InvoiceListItem) => {
      const av = toValue(a)
      const bv = toValue(b)
      if (av === null && bv === null) return 0
      if (av === null) return 1
      if (bv === null) return -1
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    }
    return [...filteredInvoices].sort(comparator)
  }, [filteredInvoices, sortDir, sortKey])

  const exportFilteredInvoices = filterInvoices(invoices, exportStartDate, exportEndDate, exportSuppliers)
  const exportSelectedInvoices = useMemo(
    () => exportFilteredInvoices.filter((inv) => exportSelectedIds.has(inv.id)),
    [exportFilteredInvoices, exportSelectedIds]
  )

  const shouldScrollInvoices = sortedInvoices.length > 10
  const totalTtc = useMemo(() => {
    return sortedInvoices.reduce((acc, inv) => {
      const ttcValue = inv.ttcValue ?? toCurrencyNumber(inv.ttc) ?? 0
      return acc + ttcValue
    }, 0)
  }, [sortedInvoices])

  const skeletonRows = useMemo(
    () => Array.from({ length: 10 }, (_, index) => `skeleton-${index}`),
    []
  )

  const exportTotalTtc = exportFilteredInvoices.reduce((acc, inv) => {
    if (exportSelectedIds.has(inv.id) && typeof inv.ttcValue === "number") {
      return acc + inv.ttcValue
    }
    return acc
  }, 0)

  const handleSheetToggle = (open: boolean) => {
    if (isStaff && open) return
    if (open) {
      setExportStartDate(startDate)
      setExportEndDate(endDate)
      setExportSuppliers(selectedSuppliers)
      setExportSelectedIds(new Set(filteredInvoices.map((inv) => inv.id)))
    }
    setSheetOpen(open)
  }

  const handleRowNavigate = (invoice: InvoiceListItem) => {
    const baseReference = invoice.reference.startsWith("Facture")
      ? invoice.reference
      : `Facture ${invoice.reference}`
    const breadcrumb = `${baseReference} - ${invoice.supplier}`
    posthog?.capture("invoice_opened", {
      invoice_id: invoice.id,
      supplier_id: invoice.supplierValue,
      supplier: invoice.supplier,
      establishment_id: establishmentId ?? null,
    })
    navigate(`/dashboard/invoices/${invoice.id}`, { state: { invoiceBreadcrumb: breadcrumb } })
  }

  const toggleExportSelection = (id: string) => {
    setExportSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSort = (key: SortKey) => {
    const nextDir = sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "desc"
    setSortKey(key)
    setSortDir(nextDir)
  }

  const toSafeFilename = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[^\w().-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)/g, "")

  const handleExport = async () => {
    if (exporting) return
    if (!exportSelectedInvoices.length) {
      toast.error("Sélectionnez au moins une facture.")
      return
    }
    const exportMode = exportSelectedInvoices.length > 5 ? "backend" : "frontend"
    posthog?.capture("invoice_export_started", {
      count: exportSelectedInvoices.length,
      mode: exportMode,
      establishment_id: establishmentId ?? null,
    })
    setExporting(true)
    try {
      const exportDate = new Date()
      const exportDateLabel = [
        `${exportDate.getDate()}`.padStart(2, "0"),
        `${exportDate.getMonth() + 1}`.padStart(2, "0"),
        exportDate.getFullYear(),
      ].join("-")
      const exportFilenameBase = `ravy-export(${exportDateLabel})`

      if (exportSelectedInvoices.length > 5) {
        if (!establishmentId) {
          toast.error("Établissement manquant pour l'export.")
          posthog?.capture("invoice_export_failed", {
            count: exportSelectedInvoices.length,
            mode: exportMode,
            establishment_id: null,
            reason: "missing_establishment",
          })
          return
        }
        const response = await api.post(
          "/invoices/export",
          {
            establishment_id: establishmentId,
            invoice_ids: exportSelectedInvoices.map((inv) => inv.id),
          },
          { responseType: "blob" }
        )
        const blob = new Blob([response.data], { type: "application/zip" })
        const objectUrl = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = objectUrl
        link.download = `${exportFilenameBase}.zip`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(objectUrl)
        toast.success("Export terminé.")
        posthog?.capture("invoice_export_completed", {
          count: exportSelectedInvoices.length,
          mode: exportMode,
          establishment_id: establishmentId,
          missing_count: 0,
        })
        return
      }

      const formatInvoiceDate = (value?: Date, separator = "-") => {
        if (!value || Number.isNaN(value.getTime())) return exportDateLabel
        const day = `${value.getDate()}`.padStart(2, "0")
        const month = `${value.getMonth() + 1}`.padStart(2, "0")
        const year = `${value.getFullYear()}`
        return [day, month, year].join(separator)
      }
      const getInvoiceFileName = (invoice: InvoiceListItem) => {
        const number = invoice.invoiceNumber || invoice.reference || "facture"
        const dateLabel = formatInvoiceDate(invoice.dateValue, "-")
        const base = `${invoice.supplier}-${number}(${dateLabel})`
        return `${toSafeFilename(base)}.pdf`
      }

      const workbook = XLSX.utils.book_new()
      const rows = exportSelectedInvoices.map((inv) => ({
        Date: formatInvoiceDate(inv.dateValue, "/"),
        Fournisseur: inv.supplier,
        Numéro: inv.invoiceNumber || inv.reference,
        HT: inv.ht,
        TVA: inv.tva,
        TTC: inv.ttc,
        Fichier: getInvoiceFileName(inv),
      }))
      const worksheet = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(workbook, worksheet, "Factures")
      const xlsxBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" })

      const zip = new JSZip()
      zip.file(`${exportFilenameBase}.xlsx`, xlsxBuffer)
      const pdfFolder = zip.folder("factures")
      const missing: string[] = []

      for (const invoice of exportSelectedInvoices) {
        if (!pdfFolder) continue
        const path = invoice.fileStoragePath
        if (!path) {
          missing.push(invoice.reference)
          continue
        }
        const url = await getInvoiceDocumentUrl(path)
        if (!url) {
          missing.push(invoice.reference)
          continue
        }
        try {
          const response = await fetch(url)
          if (!response.ok) {
            missing.push(invoice.reference)
            continue
          }
          const blob = await response.blob()
          pdfFolder.file(getInvoiceFileName(invoice), blob)
        } catch {
          missing.push(invoice.reference)
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const zipUrl = URL.createObjectURL(zipBlob)
      const link = document.createElement("a")
      link.href = zipUrl
      link.download = `${exportFilenameBase}.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(zipUrl)

      if (missing.length) {
        toast.message("Export terminé avec des documents manquants.", {
          description: `${missing.length} facture(s) sans document joint.`,
        })
      } else {
        toast.success("Export terminé.")
      }
      posthog?.capture("invoice_export_completed", {
        count: exportSelectedInvoices.length,
        mode: exportMode,
        establishment_id: establishmentId ?? null,
        missing_count: missing.length,
      })
    } catch {
      posthog?.capture("invoice_export_failed", {
        count: exportSelectedInvoices.length,
        mode: exportMode,
        establishment_id: establishmentId ?? null,
      })
      toast.error("Impossible de générer l'export.")
    } finally {
      setExporting(false)
    }
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ChevronsUpDown className="h-4 w-4 opacity-50" />
    return sortDir === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  return (
    <Card className="shadow-sm bg-card">
      <CardHeader className="p-6 pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle>Factures importées</CardTitle>
            <CardDescription>Consultez ici vos documents comptables</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <DoubleDatePicker
              startDate={startDate}
              endDate={endDate}
              minDate={MIN_DATE}
              onChange={handleFilterDatesChange}
              startButtonClassName="w-[160px]"
              endButtonClassName="w-[160px]"
            />
            <div className="flex flex-col gap-2 self-start">
              <label className="text-xs font-medium text-muted-foreground">Trier par fournisseur</label>
              <MultipleCombobox
                className="max-w-xs"
                placeholder="Sélectionner des fournisseurs"
                items={supplierOptions}
                value={selectedSuppliers}
                onChange={setSelectedSuppliers}
              />
            </div>
            <div className="flex flex-col gap-2 self-start">
              <span className="text-xs font-medium text-muted-foreground invisible">Exporter</span>
              <Sheet open={sheetOpen} onOpenChange={handleSheetToggle}>
                <SheetTrigger asChild>
                  <Button disabled={isStaff}>
                    Exporter
                    <ArrowDownToLine className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="sm:max-w-xl">
                  <SheetHeader>
                    <SheetTitle>Exporter les factures</SheetTitle>
                    <SheetDescription>
                      Choisissez le format et l&apos;intervalle pour générer votre export.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
                      <DoubleDatePicker
                        startDate={exportStartDate}
                        endDate={exportEndDate}
                        minDate={MIN_DATE}
                        onChange={handleExportDatesChange}
                        startButtonClassName="w-full"
                        endButtonClassName="w-full"
                        showSeparator={false}
                        className="sm:col-span-2"
                      />
                      <div className="sm:col-span-2 space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Fournisseurs</label>
                        <MultipleCombobox
                          className="w-full"
                          placeholder="Sélectionner des fournisseurs"
                          items={supplierOptions}
                          value={exportSuppliers}
                          onChange={setExportSuppliers}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Sélection des factures</span>
                      <span>
                        {exportSelectedIds.size} sélectionnée{exportSelectedIds.size > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                      {exportFilteredInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-start gap-3 rounded-md border bg-background px-3 py-3"
                        >
                          <Checkbox
                            className="mt-1"
                            checked={exportSelectedIds.has(inv.id)}
                            onCheckedChange={() => toggleExportSelection(inv.id)}
                            aria-label={`Sélectionner ${inv.supplier}`}
                          />
                          <div className="flex flex-1 flex-col gap-1 text-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                              <div>
                                <p className="font-medium leading-tight">{inv.supplier}</p>
                                <p className="text-xs text-muted-foreground">{inv.reference}</p>
                              </div>
                              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">{inv.date}</span>
                                <span>{inv.ttc}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!exportFilteredInvoices.length && (
                        <div className="rounded-md border border-dashed bg-background p-4 text-center text-sm text-muted-foreground">
                          Aucune facture dans ce filtre.
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      L&apos;export générera un fichier XLSX et un ZIP des documents associés.
                    </p>
                    <div className="flex items-center justify-between text-sm font-medium text-foreground">
                      <span>Total TTC</span>
                      <span>
                        {exportTotalTtc.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <SheetTrigger asChild>
                        <Button variant="ghost">Annuler</Button>
                      </SheetTrigger>
                      <Button disabled={!exportSelectedIds.size || exporting} onClick={handleExport}>
                        {exporting ? "Export en cours..." : "Lancer l'export"}
                        {exporting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowDownToLine className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-2">
        <div className="rounded-md border">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="pl-3">
                <TableHead className="pl-3 w-[38%] text-left">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-0 text-left font-semibold"
                    onClick={() => toggleSort("supplier")}
                  >
                    <span className="mr-1">Fournisseur</span>
                    {sortIcon("supplier")}
                  </Button>
                </TableHead>
                <TableHead className="w-36 px-4 text-left">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-0 text-left font-semibold"
                    onClick={() => toggleSort("date")}
                  >
                    <span className="mr-1">Date</span>
                    {sortIcon("date")}
                  </Button>
                </TableHead>
                <TableHead className="w-24 px-4 text-left">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-0 text-left font-semibold"
                    onClick={() => toggleSort("ht")}
                  >
                    <span className="mr-1">HT</span>
                    {sortIcon("ht")}
                  </Button>
                </TableHead>
                <TableHead className="w-24 px-4 text-left">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-0 text-left font-semibold"
                    onClick={() => toggleSort("tva")}
                  >
                    <span className="mr-1">TVA</span>
                    {sortIcon("tva")}
                  </Button>
                </TableHead>
                <TableHead className="w-24 px-4 text-left">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-0 text-left font-semibold"
                    onClick={() => toggleSort("ttc")}
                  >
                    <span className="mr-1">TTC</span>
                    {sortIcon("ttc")}
                  </Button>
                </TableHead>
                <TableHead className="w-8 pr-4 text-left" />
              </TableRow>
            </TableHeader>
          </Table>
          <ScrollArea className={shouldScrollInvoices ? "h-[550px]" : "max-h-[550px]"}>
            <Table className="table-fixed w-full">
              <TableBody>
                {isLoading && !sortedInvoices.length
                  ? skeletonRows.map((rowId) => (
                      <TableRow key={rowId} className="pl-3">
                        <TableCell className="pl-3 pr-3 w-[38%]">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </TableCell>
                        <TableCell className="w-36 px-4 whitespace-nowrap">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="w-24 px-4 text-left whitespace-nowrap">
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell className="w-24 px-4 text-left whitespace-nowrap">
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="w-24 px-4 text-left whitespace-nowrap">
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell className="w-8 text-right pr-4">
                          <Skeleton className="ml-auto h-4 w-4" />
                        </TableCell>
                      </TableRow>
                    ))
                  : sortedInvoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className="pl-3 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() => handleRowNavigate(invoice)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleRowNavigate(invoice)
                          }
                        }}
                      >
                        <TableCell className="pl-3 pr-3 w-[38%]">
                          <div className="space-y-1">
                            <p className="font-medium leading-tight">{invoice.supplier}</p>
                            <p className="text-xs text-muted-foreground">{invoice.reference}</p>
                          </div>
                        </TableCell>
                        <TableCell className="w-36 px-4 whitespace-nowrap">
                          <p>{invoice.date}</p>
                        </TableCell>
                        <TableCell className="w-24 px-4 text-left whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className="inline-flex min-w-[72px] justify-center text-sm"
                          >
                            {invoice.ht}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-24 px-4 text-left whitespace-nowrap">
                          <span className="inline-flex min-w-[72px] justify-center text-sm">
                            {invoice.tva}
                          </span>
                        </TableCell>
                        <TableCell className="w-24 px-4 text-left whitespace-nowrap">
                          <Badge className="inline-flex min-w-[72px] justify-center text-sm" variant="outline">
                            {invoice.ttc}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-8 text-right pr-4">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                {isLoadingMore
                  ? Array.from({ length: 2 }, (_, index) => (
                      <TableRow key={`loading-more-${index}`} className="pl-3">
                        <TableCell className="pl-3 pr-3 w-[38%]">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell className="w-36 px-4 whitespace-nowrap">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="w-24 px-4 text-left whitespace-nowrap">
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell className="w-24 px-4 text-left whitespace-nowrap">
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="w-24 px-4 text-left whitespace-nowrap">
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell className="w-8 text-right pr-4">
                          <Skeleton className="ml-auto h-4 w-4" />
                        </TableCell>
                      </TableRow>
                    ))
                  : null}
                {!isLoading && !sortedInvoices.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Aucune facture importée pour le moment.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {sortedInvoices.length} facture{sortedInvoices.length > 1 ? "s" : ""} - Total{" "}
            {totalTtc.toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 2,
            })}{" "}
            TTC
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLoadMore?.()}
            disabled={!hasMore || isLoadingMore}
          >
            {isLoadingMore
              ? "Chargement..."
              : hasMore
                ? `Charger +${pageSize ?? 200}`
                : "Toutes les factures sont chargées"}
            {isLoadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowDownToLine className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
