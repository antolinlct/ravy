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
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowRight,
  Copy,
  ArrowDownToLine,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import FileUpload06 from "@/components/ui/file-upload-06"
import { useEffect, useMemo, useRef, useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useEstablishment } from "@/context/EstablishmentContext"
import MultipleCombobox from "@/components/ui/multiple_combobox"
import { DoubleDatePicker, type DoubleDatePickerValue } from "@/components/blocks/double-datepicker"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const sampleInvoices = [
  {
    id: "1",
    supplier: "FRANCE BOISSONS services",
    supplierValue: "france-boissons",
    reference: "N° 4099304911",
    date: "22 Sep. 25",
    dateValue: new Date("2025-09-22"),
    createdAt: new Date("2025-09-23T10:00:00Z"),
    items: "19 articles",
    ht: "644,18 €",
    tva: "198,88 €",
    ttc: "843,06 €",
    ttcValue: 843.06,
  },
  {
    id: "2",
    supplier: "PepsiCo France",
    supplierValue: "pepsico",
    reference: "N° 5099305012",
    date: "12 Oct. 25",
    dateValue: new Date("2025-10-12"),
    createdAt: new Date("2025-10-13T08:30:00Z"),
    items: "8 articles",
    ht: "312,50 €",
    tva: "62,50 €",
    ttc: "375,00 €",
    ttcValue: 375.0,
  },
]

type SupplierOption = { value: string; label: string; isPending?: boolean }

const initialSupplierOptions: SupplierOption[] = [
  { value: "france-boissons", label: "France Boissons" },
  { value: "pepsico", label: "PepsiCo" },
  { value: "cocacola", label: "Coca-Cola" },
  { value: "metro", label: "Metro" },
]

export default function InvoicesPage() {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [uploaderHasFiles, setUploaderHasFiles] = useState(false)
  const minDate = new Date("2022-01-01")
  const today = new Date()
  const threeMonthsAgo = new Date(today)
  threeMonthsAgo.setMonth(today.getMonth() - 3)
  const [startDate, setStartDate] = useState<Date | undefined>(threeMonthsAgo)
  const [endDate, setEndDate] = useState<Date | undefined>(today)
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])

  const [sheetOpen, setSheetOpen] = useState(false)
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>(startDate)
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>(endDate)
  const [exportSuppliers, setExportSuppliers] = useState<string[]>([])
  const [exportSelectedIds, setExportSelectedIds] = useState<Set<string>>(new Set())
  const [aliasEmail, setAliasEmail] = useState("")
  const [aliasActive, setAliasActive] = useState(false)
  const [copyLabel, setCopyLabel] = useState("Copier l'adresse")
  const copyTimeoutRef = useRef<number | null>(null)
  const { estId } = useEstablishment()
  const supplierOptions = initialSupplierOptions
  const [sortKey, setSortKey] = useState<"createdAt" | "supplier" | "date" | "ht" | "tva" | "ttc">("createdAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    if (!estId) return

    let active = true
    async function loadAlias() {
      try {
        const API_URL = import.meta.env.VITE_API_URL
        const res = await fetch(
          `${API_URL}/establishment_email_alias?establishment_id=${estId}`
        )
        if (!active || !res.ok) return
        const list = await res.json()
        const alias = Array.isArray(list) && list.length > 0 ? list[0] : null
        setAliasEmail(alias?.custom_email || "")
        setAliasActive(Boolean(alias?.enabled))
      } catch {
        /* ignore load errors */
      }
    }

    loadAlias()

    return () => {
      active = false
    }
  }, [estId])

  const handleCopy = async () => {
    if (!aliasActive || !aliasEmail) return
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = null
    }

    navigator.clipboard
      .writeText(aliasEmail)
      .then(() => {
        setCopied(true)
        setCopyLabel("Copié !")
        setTooltipOpen(true)
        copyTimeoutRef.current = window.setTimeout(() => {
          setCopied(false)
          setCopyLabel("Copier l'adresse")
          setTooltipOpen(false)
          copyTimeoutRef.current = null
        }, 1200)
      })
      .catch(() => {
        setCopied(false)
        setCopyLabel("Copier l'adresse")
      })
  }

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])


  const handleFilterDatesChange = ({
    startDate: nextStart,
    endDate: nextEnd,
  }: DoubleDatePickerValue) => {
    setStartDate(nextStart)
    setEndDate(nextEnd)
  }

  const handleExportDatesChange = ({
    startDate: nextStart,
    endDate: nextEnd,
  }: DoubleDatePickerValue) => {
    setExportStartDate(nextStart)
    setExportEndDate(nextEnd)
  }

  const filterInvoices = (
    invoices: typeof sampleInvoices,
    from?: Date,
    to?: Date,
    suppliers?: string[]
  ) => {
    return invoices.filter((inv) => {
      const inSupplier =
        !suppliers?.length || suppliers.includes(inv.supplierValue)
      const inDate =
        (!from || (inv.dateValue && inv.dateValue >= from)) &&
        (!to || (inv.dateValue && inv.dateValue <= to))
      return inSupplier && inDate
    })
  }

  const filteredInvoices = filterInvoices(
    sampleInvoices,
    startDate,
    endDate,
    selectedSuppliers
  )

  const toCurrencyNumber = (value?: string) => {
    if (!value) return null
    const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".")
    const num = parseFloat(normalized)
    return Number.isFinite(num) ? num : null
  }

  const sortedInvoices = useMemo(() => {
    const toValue = (inv: (typeof sampleInvoices)[number]) => {
      if (sortKey === "createdAt") return inv.createdAt ? inv.createdAt.getTime() : 0
      if (sortKey === "supplier") return inv.supplier.toLowerCase()
      if (sortKey === "date") return inv.dateValue ? inv.dateValue.getTime() : 0
      if (sortKey === "ht") return toCurrencyNumber(inv.ht)
      if (sortKey === "tva") return toCurrencyNumber(inv.tva)
      if (sortKey === "ttc") return inv.ttcValue ?? toCurrencyNumber(inv.ttc)
      return null
    }
    const comparator = (a: (typeof sampleInvoices)[number], b: (typeof sampleInvoices)[number]) => {
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

  const exportFilteredInvoices = filterInvoices(
    sampleInvoices,
    exportStartDate,
    exportEndDate,
    exportSuppliers
  )

  const exportTotalTtc = exportFilteredInvoices.reduce((acc, inv) => {
    if (exportSelectedIds.has(inv.id) && typeof inv.ttcValue === "number") {
      return acc + inv.ttcValue
    }
    return acc
  }, 0)

  const handleSheetToggle = (open: boolean) => {
    if (open) {
      setExportStartDate(startDate)
      setExportEndDate(endDate)
      setExportSuppliers(selectedSuppliers)
      setExportSelectedIds(new Set(filteredInvoices.map((inv) => inv.id)))
    }
    setSheetOpen(open)
  }

  const handleRowNavigate = (invoiceId: string) => {
    navigate("/dashboard/invoices/detail", { state: { invoiceId } })
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

  const toggleSort = (key: typeof sortKey) => {
    const nextDir = sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "desc"
    setSortKey(key)
    setSortDir(nextDir)
  }

  const sortIcon = (key: typeof sortKey) => {
    if (sortKey !== key) return <ChevronsUpDown className="h-4 w-4 opacity-50" />
    return sortDir === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  return (
    <div className="flex w-full items-start justify-start">
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-semibold">Factures</p>
            <p className="text-muted-foreground">
              Retrouvez ici l&apos;ensemble de vos factures.
            </p>
          </div>
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/dashboard/invoices/suppliers">
              Gérer mes fournisseurs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Card className="shadow-sm bg-card">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] lg:items-top">
              <div className="flex h-full flex-col items-center gap-4 text-center">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <div className="h-full w-full rounded-full border-[14px] border-muted" />
                  <div className="absolute text-xl font-semibold text-primary">0%</div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-primary">150 factures restantes</p>
                  <p className="text-sm text-muted-foreground">Mise à jour prévue le : 20 Dec. 25</p>
                </div>
              </div>

              <div className="flex h-full flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <CardTitle>Déposez vos factures</CardTitle>
                    <CardDescription>
                      <div className="space-y-3">
                        <p>Transférez vos factures en pièces jointes à cette adresse pour les importer automatiquement :</p>
                        {!uploaderHasFiles && (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                              value={
                                aliasActive && aliasEmail
                                  ? aliasEmail
                                  : "Adresse en cours de vérification, contactez le support si le problème persiste."
                              }
                              readOnly
                              className="bg-muted/50 text-foreground"
                            />
                            <Tooltip
                              open={tooltipOpen}
                              onOpenChange={(open) => {
                                if (copyTimeoutRef.current) return
                                setTooltipOpen(open)
                              }}
                            >
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={handleCopy}
                                  aria-label="Copier l'adresse email"
                                  disabled={!aliasActive || !aliasEmail}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {copied ? "Copié !" : copyLabel}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                <div className="flex flex-1">
                  <FileUpload06 onHasUploadsChange={setUploaderHasFiles} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  minDate={minDate}
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
                  <span className="text-xs font-medium text-muted-foreground invisible">
                    Exporter
                  </span>
                  <Sheet open={sheetOpen} onOpenChange={handleSheetToggle}>
                    <SheetTrigger asChild>
                      <Button>
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
                            minDate={minDate}
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
                          <span>{exportSelectedIds.size} sélectionnée{exportSelectedIds.size > 1 ? "s" : ""}</span>
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
                      <Button disabled={!exportSelectedIds.size}>
                            Lancer l&apos;export
                            <ArrowDownToLine className="h-4 w-4" />
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
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="pl-3">
                        <TableHead className="pl-3 w-[45%] text-left">
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
                    <TableHead className="w-36 pl-3 text-left">
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
                    <TableHead className="w-24 pr-3 text-left">
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
                    <TableHead className="w-24 pr-3 text-left">
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
                    <TableHead className="w-24 pr-3 text-left">
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
                    <TableHead className="w-8 pr-3 text-left" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="pl-3 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleRowNavigate(invoice.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleRowNavigate(invoice.id)
                        }
                      }}
                    >
                      <TableCell className="pl-3 pr-3">
                        <div className="space-y-1">
                          <p className="font-medium leading-tight">{invoice.supplier}</p>
                          <p className="text-xs text-muted-foreground">{invoice.reference}</p>
                        </div>
                      </TableCell>
                      <TableCell className="pl-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <p>{invoice.date}</p>
                          <p className="text-xs text-muted-foreground">{invoice.items}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-left whitespace-nowrap pr-3">
                        <Badge variant="secondary" className="inline-flex min-w-[72px] justify-center text-sm">
                          {invoice.ht}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left whitespace-nowrap pr-3">
                        <span className="inline-flex min-w-[72px] justify-center text-sm">{invoice.tva}</span>
                      </TableCell>
                      <TableCell className="text-left whitespace-nowrap pr-3">
                        <Badge className="inline-flex min-w-[72px] justify-center text-sm" variant="outline">
                          {invoice.ttc}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-3">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredInvoices.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Aucune facture importée pour le moment.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
