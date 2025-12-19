import { useEffect, useRef, useState, type WheelEventHandler } from "react"
import {
  ArrowLeft,
  Download,
  Trash2,
  RefreshCcw,
  Pencil,
  UnfoldHorizontal,
  FoldHorizontal,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import DialogArticleChart from "@/components/blocks/dialog-article-chart"
import PdfToolbar from "@/components/blocks/pdf-toolbar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

const mockInvoice = {
  number: "N°4099304911",
  lastModified: "06 Nov. 25",
  supplier: "FRANCE BOISSONS services",
  supplierType: "beverage" as const,
  date: "Lun 22 Sept. 2025",
  importedAt: "21 Sep. 25",
  documentUrl: "https://dummyimage.com/1200x1700/f7f7f7/0f172a&text=Document",
  pageCount: 2,
  totals: {
    ht: "644,18 €",
    tva: "198,88 €",
    ttc: "843,06 €",
  },
  items: [
    { name: "122708 IPA DULION 7° FUT 30 L", unit: "U", quantity: "10", unitPrice: "6,87 €", lineTotal: "68,70 €", delta: "-1%", dutiesTaxes: "5%", discount: "10%" },
    { name: "92706 BADOIT ROUGE VP...", unit: "U", quantity: "20", unitPrice: "1,36 €", lineTotal: "27,20 €", delta: "+2%", dutiesTaxes: "3%", discount: "0%" },
    { name: "122707 BLONDE ENGAGEE...", unit: "U", quantity: "8", unitPrice: "5,47 €", lineTotal: "43,76 €", delta: "-0,5%", dutiesTaxes: "5%", discount: "5%" },
    { name: "123750 SOLEIA NECTAR...", unit: "U", quantity: "12", unitPrice: "1,11 €", lineTotal: "13,32 €", delta: "0%", dutiesTaxes: "2%", discount: "0%" },
    { name: "82334 COCA-COLA ZERO...", unit: "U", quantity: "18", unitPrice: "1,13 €", lineTotal: "20,34 €", delta: "+1%", dutiesTaxes: "3%", discount: "0%" },
    { name: "112590 FRIGOLET SIROP", unit: "U", quantity: "6", unitPrice: "4,09 €", lineTotal: "24,54 €", delta: "-1%", dutiesTaxes: "2%", discount: "0%" },
  ],
}

const normalizeInvoiceNumber = (value: string) => value.replace(/^N°\s*/, "").trim()
const normalizeEuroValue = (value: string) => value.replace(/\s*€\s*/, "").trim()
const formatInvoiceNumber = (value: string) => (value ? `N°${normalizeInvoiceNumber(value)}` : "")
const formatEuroValue = (value: string) => {
  const clean = normalizeEuroValue(value)
  return clean ? `${clean} €` : ""
}
const parseNumber = (value: string) => {
  const normalized = value.replace(/[^\d.,-]/g, "").replace(",", ".")
  const num = parseFloat(normalized)
  return Number.isFinite(num) ? num : 0
}
const formatEuroFromNumber = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 })
    : ""

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const ZOOM_MIN = 0.25
const ZOOM_MAX = 3
const ZOOM_STEP = 0.1
const PINCH_SENSITIVITY = 350

const computeUnitPriceGross = (item: (typeof mockInvoice.items)[number]) => {
  const base = parseNumber(item.unitPrice)
  const duties = item.dutiesTaxes ? parseNumber(item.dutiesTaxes) : 0
  const discount = item.discount ? parseNumber(item.discount) : 0
  const gross = base + duties - discount
  return Number.isFinite(gross) ? formatEuroFromNumber(gross) : "—"
}

const formatCurrencyDisplay = (value?: string) => {
  if (!value) return "—"
  const num = parseNumber(value)
  if (Number.isFinite(num)) {
    return formatEuroFromNumber(num)
  }
  const normalized = normalizeEuroValue(value)
  return normalized ? formatEuroValue(normalized) : "—"
}

const toCurrencyInputValue = (value?: string) => value?.replace(/[€%]/g, "").trim() ?? ""

const supplierLabelStyle = (label: string) => {
  const base =
    "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium transition-colors"
  const map: Record<string, string> = {
    Boissons: "bg-sky-500/10 text-sky-500 border-sky-500/30",
    Alimentaire: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    "Charges fixes": "bg-rose-500/10 text-rose-500 border-rose-500/30",
    "Charges variables": "bg-amber-500/10 text-amber-600 border-amber-500/30",
    Autres: "bg-muted/40 text-foreground border-border",
    "Frais généraux": "bg-muted/40 text-foreground border-border",
  }
  return `${base} ${map[label] ?? map.Autres}`
}

export default function InvoiceDetailPage() {
  const [invoice, setInvoice] = useState(mockInvoice)
  const [editOpen, setEditOpen] = useState(false)
  const [formValues, setFormValues] = useState({
    number: normalizeInvoiceNumber(invoice.number),
    ht: normalizeEuroValue(invoice.totals.ht),
    tva: normalizeEuroValue(invoice.totals.tva),
    ttc: normalizeEuroValue(invoice.totals.ttc),
  })
  const [itemSheetOpen, setItemSheetOpen] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [itemForm, setItemForm] = useState({
    unit: "",
    unitPrice: "",
    unitPriceGross: "",
    dutiesTaxes: "",
    discount: "",
    quantity: "",
  })
  const [articlesExpanded, setArticlesExpanded] = useState(false)
  const [chartOpenIndex, setChartOpenIndex] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const readerRef = useRef<HTMLDivElement | null>(null)
  const scrollTicking = useRef(false)
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false)
  const isBeverageSupplier = invoice.supplierType === "beverage"
  const pageCount = invoice.pageCount ?? 1

  useEffect(() => {
    setCurrentPage((prev) => clamp(prev, 1, pageCount))
  }, [pageCount])

  const handlePinchZoom: WheelEventHandler<HTMLDivElement> = (event) => {
    if (!event.ctrlKey) return
    event.preventDefault()
    const delta = -event.deltaY / PINCH_SENSITIVITY
    setZoom((prev) => clamp(prev + delta, ZOOM_MIN, ZOOM_MAX))
  }

  const handleZoomIn = () => setZoom((prev) => clamp(prev + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX))
  const handleZoomOut = () => setZoom((prev) => clamp(prev - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX))
  const handleResetZoom = () => setZoom(1)

  const scrollToPage = (page: number) => {
    const target = pageRefs.current[page - 1]
    const container = readerRef.current
    if (target && container) {
      const targetRect = target.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const offset = targetRect.top - containerRect.top + container.scrollTop
      container.scrollTo({ top: offset, behavior: "smooth" })
    } else if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }

  const updateCurrentPageOnScroll = () => {
    const container = readerRef.current
    if (!container || pageRefs.current.length === 0) return

    const containerRect = container.getBoundingClientRect()
    let closestIndex = currentPage - 1
    let smallestDistance = Number.POSITIVE_INFINITY

    pageRefs.current.forEach((node, index) => {
      if (!node) return
      const rect = node.getBoundingClientRect()
      const distance = Math.abs(rect.top - containerRect.top)
      if (distance < smallestDistance) {
        smallestDistance = distance
        closestIndex = index
      }
    })

    const nextPage = clamp(closestIndex + 1, 1, pageCount)
    setCurrentPage((prev) => (prev === nextPage ? prev : nextPage))
  }

  const handleScroll = () => {
    if (scrollTicking.current) return
    scrollTicking.current = true
    requestAnimationFrame(() => {
      updateCurrentPageOnScroll()
      scrollTicking.current = false
    })
  }

  const handlePrevPage = () =>
    setCurrentPage((prev) => {
      const next = clamp(prev - 1, 1, pageCount)
      if (next !== prev) {
        setZoom(1)
        scrollToPage(next)
      }
      return next
    })

  const handleNextPage = () =>
    setCurrentPage((prev) => {
      const next = clamp(prev + 1, 1, pageCount)
      if (next !== prev) {
        setZoom(1)
        scrollToPage(next)
      }
      return next
    })

  const handleOpenDocument = () => {
    if (!invoice.documentUrl) {
      toast.error("Document non disponible.")
      return
    }
    window.open(invoice.documentUrl, "_blank", "noreferrer")
  }

  const handleShareDocument = () => {
    if (!invoice.documentUrl) {
      toast.error("Document non disponible.")
      return
    }
    const subject = encodeURIComponent(`Facture ${invoice.number}`)
    const body = encodeURIComponent(`Voici le lien du document : ${invoice.documentUrl}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const openEdit = () => {
    resetForm()
    setEditOpen(true)
  }

  const resetForm = () => {
    setFormValues({
      number: normalizeInvoiceNumber(invoice.number),
      ht: normalizeEuroValue(invoice.totals.ht),
      tva: normalizeEuroValue(invoice.totals.tva),
      ttc: normalizeEuroValue(invoice.totals.ttc),
    })
  }

  const openItemSheet = (index: number) => {
    const item = invoice.items[index]
    setEditingItemIndex(index)
    setItemForm({
      unit: item.unit,
      unitPrice: normalizeEuroValue(item.unitPrice),
      unitPriceGross: toCurrencyInputValue(computeUnitPriceGross(item)),
      dutiesTaxes: toCurrencyInputValue(item.dutiesTaxes),
      discount: toCurrencyInputValue(item.discount),
      quantity: item.quantity ?? "",
    })
    setItemSheetOpen(true)
  }

  const closeItemSheet = () => {
    setItemSheetOpen(false)
    setEditingItemIndex(null)
    setItemForm({ unit: "", unitPrice: "", unitPriceGross: "", dutiesTaxes: "", discount: "", quantity: "" })
  }

  const handleItemSave = () => {
    if (editingItemIndex === null) return
    const unit = itemForm.unit.trim()
    const unitPrice = itemForm.unitPrice.trim()
    const unitPriceGross = itemForm.unitPriceGross.trim()
    const dutiesTaxes = itemForm.dutiesTaxes.trim()
    const discount = itemForm.discount.trim()
    const quantity = itemForm.quantity.trim()

    if (!unit || (!unitPrice && !unitPriceGross)) {
      toast.error("Unité et prix unitaire sont requis.")
      return
    }

    const currentItem = invoice.items[editingItemIndex]
    const qtyValue = quantity || currentItem.quantity || ""
    const qtyNumber = parseNumber(qtyValue)
    const dutiesValue = dutiesTaxes ? parseNumber(dutiesTaxes) : 0
    const discountValue = discount ? parseNumber(discount) : 0
    const netPriceNumber = unitPrice
      ? parseNumber(unitPrice)
      : unitPriceGross
        ? parseNumber(unitPriceGross) - dutiesValue + discountValue
        : NaN
    const netPriceFormatted = Number.isFinite(netPriceNumber) ? formatEuroFromNumber(netPriceNumber) : currentItem.unitPrice
    const lineTotalNumber = qtyNumber && Number.isFinite(netPriceNumber) ? qtyNumber * netPriceNumber : NaN
    const lineTotal = Number.isFinite(lineTotalNumber) ? formatEuroFromNumber(lineTotalNumber) : currentItem.lineTotal

    setInvoice((prev) => {
      const items = prev.items.map((item, idx) =>
        idx === editingItemIndex
          ? {
              ...item,
              unit,
              unitPrice: netPriceFormatted || item.unitPrice,
              quantity: qtyValue || item.quantity,
              lineTotal: lineTotal || item.lineTotal,
              dutiesTaxes: isBeverageSupplier
                ? dutiesTaxes
                  ? formatEuroFromNumber(parseNumber(dutiesTaxes))
                  : ""
                : item.dutiesTaxes,
              discount: isBeverageSupplier
                ? discount
                  ? formatEuroFromNumber(parseNumber(discount))
                  : ""
                : item.discount,
            }
          : item
      )
      return { ...prev, items }
    })
    toast.success("Article mis à jour.")
    closeItemSheet()
  }

  const handleSave = () => {
    const trimmed = {
      number: formValues.number.trim(),
      ht: formValues.ht.trim(),
      tva: formValues.tva.trim(),
      ttc: formValues.ttc.trim(),
    }
    const hasEmpty = Object.values(trimmed).some((value) => value.length === 0)
    if (hasEmpty) {
      toast.error("Tous les champs sont requis.")
      return
    }

    setInvoice((prev) => ({
      ...prev,
      number: formatInvoiceNumber(trimmed.number),
      totals: {
        ht: formatEuroValue(trimmed.ht),
        tva: formatEuroValue(trimmed.tva),
        ttc: formatEuroValue(trimmed.ttc),
      },
    }))
    toast.success("Facture mise à jour.")
    setEditOpen(false)
  }

  const renderDelta = (delta?: string) => {
    const normalized = (delta || "").replace("%", "").replace(/\s+/g, "").replace(",", ".")
    const value = normalized ? parseFloat(normalized) : NaN
    if (!Number.isFinite(value) || value === 0) {
      return <span className="text-xs text-muted-foreground">-</span>
    }

    const isPositive = value > 0
    const Icon = isPositive ? ArrowUp : ArrowDown
    const formatted = `${isPositive ? "+" : ""}${value.toLocaleString("fr-FR", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 1,
    })}%`
    const colorClass = isPositive ? "text-red-500" : "text-green-500"

    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${colorClass}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {formatted}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="h-10 w-10">
          <Link to="/dashboard/invoices">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Retour</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Facture {invoice.number}</h1>
          <p className="text-sm text-muted-foreground">Dernière modification le : {invoice.lastModified}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Télécharger
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Confirmez la suppression de la facture et de son document associé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90 dark:text-foreground"
                  onClick={() => toast.success("Facture supprimée.")}
                >
                  Confirmer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12 items-start">
        <Card
          className={`border-dashed lg:col-span-5 overflow-hidden ${articlesExpanded ? "lg:max-h-[244px]" : ""}`}
        >
          {!articlesExpanded && (
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-2">
                <CardTitle>Document</CardTitle>
                <CardDescription>Facture importée le {invoice.importedAt}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" className="gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Remplacer
                </Button>
              </div>
            </CardHeader>
          )}
          <CardContent className="p-0">
            <div className="relative">
              <div
                className={`max-h-[75vh] overflow-auto border-t bg-muted/40 [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted/60 [&::-webkit-scrollbar-track]:bg-transparent ${
                  articlesExpanded ? "h-[244px]" : ""
                }`}
                ref={readerRef}
                onWheel={handlePinchZoom}
                onScroll={handleScroll}
              >
                <div className="px-3 pb-24">
                  <div className="mx-auto w-full space-y-4">
                    {Array.from({ length: pageCount }).map((_, index) => (
                      <div
                        key={`page-${index + 1}`}
                        ref={(node) => {
                          pageRefs.current[index] = node
                        }}
                        className="transition-transform duration-150 ease-out"
                        style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
                      >
                        <AspectRatio ratio={210 / 297} className="w-full border bg-background shadow-sm">
                          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                            Aperçu du document {pageCount > 1 ? `(page ${index + 1})` : ""}
                          </div>
                        </AspectRatio>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex w-full justify-center">
                <PdfToolbar
                  className="pointer-events-auto"
                  zoom={zoom}
                  minZoom={ZOOM_MIN}
                  maxZoom={ZOOM_MAX}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onResetZoom={handleResetZoom}
                  page={currentPage}
                  pageCount={pageCount}
                  onPrevPage={handlePrevPage}
                  onNextPage={handleNextPage}
                  onOpen={handleOpenDocument}
                  onShare={handleShareDocument}
                  collapsed={toolbarCollapsed}
                  onToggleCollapse={() => setToolbarCollapsed((prev) => !prev)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-7">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="space-y-2">
                <CardTitle>Détail facture</CardTitle>
                <CardDescription>Résumé compact des infos clés.</CardDescription>
              </div>
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" onClick={openEdit}>
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Modifier la facture</DialogTitle>
                    <DialogDescription>Actualisez les informations principales.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid w-full items-center gap-3">
                      <Label>Numéro de facture</Label>
                      <InputGroup>
                        <InputGroupInput
                          value={formValues.number}
                          required
                          onChange={(e) => setFormValues((prev) => ({ ...prev, number: e.target.value }))}
                        />
                        <InputGroupAddon align="inline-start">N°</InputGroupAddon>
                      </InputGroup>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="grid w-full max-w-sm items-center gap-3">
                        <Label>HT</Label>
                        <InputGroup>
                          <InputGroupInput
                            value={formValues.ht}
                            required
                            onChange={(e) => setFormValues((prev) => ({ ...prev, ht: e.target.value }))}
                          />
                          <InputGroupAddon align="inline-end">€</InputGroupAddon>
                        </InputGroup>
                      </div>
                      <div className="grid w-full max-w-sm items-center gap-3">
                        <Label>TVA</Label>
                        <InputGroup>
                          <InputGroupInput
                            value={formValues.tva}
                            required
                            onChange={(e) => setFormValues((prev) => ({ ...prev, tva: e.target.value }))}
                          />
                          <InputGroupAddon align="inline-end">€</InputGroupAddon>
                        </InputGroup>
                      </div>
                      <div className="grid w-full max-w-sm items-center gap-3">
                        <Label>TTC</Label>
                        <InputGroup>
                          <InputGroupInput
                            value={formValues.ttc}
                            required
                            onChange={(e) => setFormValues((prev) => ({ ...prev, ttc: e.target.value }))}
                          />
                          <InputGroupAddon align="inline-end">€</InputGroupAddon>
                        </InputGroup>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <Button variant="outline" onClick={resetForm}>
                        Réinitialiser
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => setEditOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleSave}>Enregistrer</Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border bg-muted/30 p-4">
                <div className="flex flex-wrap items-start gap-4 sm:gap-6">
                  <div className="space-y-1">
                    <p className="text-xs tracking-wide text-muted-foreground">Fournisseur</p>
                    <p className="text-sm font-semibold">{invoice.supplier}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs tracking-wide text-muted-foreground">Numéro</p>
                    <p className="text-sm font-semibold">{invoice.number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs tracking-wide text-muted-foreground">Date</p>
                    <p className="text-sm font-semibold">{invoice.date}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <div className="rounded-md border px-3 py-2 flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">HT</p>
                  <Badge variant="secondary" className="justify-center text-sm px-2">
                    {invoice.totals.ht}
                  </Badge>
                </div>
                <div className="rounded-md border px-3 py-2 flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">TVA</p>
                  <Badge variant="outline" className="border-none justify-center text-sm px-2">
                    {invoice.totals.tva}
                  </Badge>
                </div>
                <div className="rounded-md border px-3 py-2 flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">TTC</p>
                  <Badge variant="outline" className="justify-center text-sm text-primary px-2">
                    {invoice.totals.ttc}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {!articlesExpanded && (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-2">
                  <CardTitle>Détail articles</CardTitle>
                  <CardDescription>
                    Pour plus de détails, développez le tableau des articles.
                  </CardDescription>
                </div>
                <Button variant="secondary" onClick={() => setArticlesExpanded(true)}>
                  <UnfoldHorizontal />
                  Développer
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-[400px] rounded-md border [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted/30 [&::-webkit-scrollbar-track]:bg-transparent">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-4">Nom article</TableHead>
                        <TableHead className="px-3 text-right">Prix unitaire</TableHead>
                        <TableHead className="px-3 text-right">Var(±)</TableHead>
                        <TableHead className="px-3 text-right w-12">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((item, index) => (
                        <DialogArticleChart
                          key={item.name}
                          articleName={item.name}
                          currency="EUR"
                          currentValue={parseNumber(item.unitPrice)}
                          changePercent={parseNumber(item.delta)}
                          open={chartOpenIndex === index}
                          onOpenChange={(open) =>
                            setChartOpenIndex(open ? index : null)
                          }
                          trigger={
                            <TableRow
                              role="button"
                              tabIndex={0}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setChartOpenIndex(index)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault()
                                  setChartOpenIndex(index)
                                }
                              }}
                            >
                              <TableCell className="px-4">
                                <span className="font-sm">{item.name}</span>
                              </TableCell>
                              <TableCell className="px-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-sm font-semibold">{item.unitPrice}</span>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">{item.unit}</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-3 text-right">{renderDelta(item.delta)}</TableCell>
                              <TableCell className="px-3 text-right">
                                <TooltipProvider delayDuration={100}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="h-7 w-7"
                                        aria-label={`Modifier ${item.name}`}
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          openItemSheet(index)
                                        }}
                                      >
                                        <Pencil color="#848484" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Modifier l&apos;article</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          }
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {articlesExpanded && (
          <Card className="lg:col-span-12">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-2">
                <CardTitle>Détail articles — étendu</CardTitle>
                <CardDescription>Colonnes complètes : unité, variation, taxes/remises et total ligne.</CardDescription>
              </div>
              <Button variant="secondary" onClick={() => setArticlesExpanded(false)}>
                <FoldHorizontal />
                Réduire
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[360px] rounded-md border [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted/30 [&::-webkit-scrollbar-track]:bg-transparent">
                <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-4 min-w-[220px]">Nom article</TableHead>
                        <TableHead className="px-3 text-right min-w-[140px]">Prix unitaire brut</TableHead>
                        {isBeverageSupplier && (
                          <>
                            <TableHead className="px-3 text-center min-w-[100px]">Réductions</TableHead>
                            <TableHead className="px-3 text-center min-w-[110px]">Taxes</TableHead>
                          </>
                        )}
                        <TableHead className="px-3 text-right min-w-[140px]">Prix unitaire</TableHead>
                        <TableHead className="px-3 text-right min-w-[90px]">Var(±)</TableHead>
                        <TableHead className="px-3 text-right min-w-[90px]">Quantité</TableHead>
                        <TableHead className="px-3 text-right min-w-[120px]">Total</TableHead>
                        <TableHead className="px-3 text-right w-12">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {invoice.items.map((item, index) => (
                      <DialogArticleChart
                        key={`${item.name}-extended`}
                        articleName={item.name}
                        currency="EUR"
                        currentValue={parseNumber(item.unitPrice)}
                        changePercent={parseNumber(item.delta)}
                        open={chartOpenIndex === index}
                        onOpenChange={(open) =>
                          setChartOpenIndex(open ? index : null)
                        }
                        trigger={
                          <TableRow
                            role="button"
                            tabIndex={0}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setChartOpenIndex(index)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                setChartOpenIndex(index)
                              }
                            }}
                          >
                            <TableCell className="px-4">
                              <span className="font-sm">{item.name}</span>
                            </TableCell>
                            <TableCell className="px-3 text-right text-sm font-sm">
                              {computeUnitPriceGross(item)}
                            </TableCell>
                            {isBeverageSupplier && (
                              <>
                                <TableCell className="px-3 text-right text-sm text-muted-foreground">
                                  {formatCurrencyDisplay(item.discount)}
                                </TableCell>
                                <TableCell className="px-3 text-center text-sm text-muted-foreground">
                                  {formatCurrencyDisplay(item.dutiesTaxes)}
                                </TableCell>
                              </>
                            )}
                            <TableCell className="px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-sm font-sm">{item.unitPrice}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.unit}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-3 text-right">{renderDelta(item.delta)}</TableCell>
                            <TableCell className="px-3 text-right text-sm text-muted-foreground">{item.quantity ?? "—"}</TableCell>
                            <TableCell className="px-3 text-right font-sm">{item.lineTotal ?? "—"}</TableCell>
                            <TableCell className="px-3 text-right">
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-7 w-7"
                                      aria-label={`Modifier ${item.name}`}
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        openItemSheet(index)
                                      }}>
                                      <Pencil color="var(--muted-foreground)"/>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Modifier l&apos;article</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        }
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet
        open={itemSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeItemSheet()
          }
        }}
      >
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Modifier l&apos;article</SheetTitle>
            <SheetDescription>Modifiez les informations de l'article ci-dessous.</SheetDescription>
          </SheetHeader>

          {editingItemIndex !== null && (
            <div className="mt-6 space-y-4">
              <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{invoice.supplier}</p>
                  <span className={supplierLabelStyle(isBeverageSupplier ? "Boissons" : "Autres")}>
                    {isBeverageSupplier ? "Boissons" : "Autres"}
                  </span>
                </div>
                <div className="gap-2 text-sm text-muted-foreground flex items-center justify-between">
                  <p>Facture N°{invoice.number}</p>
                  <p className="text-sm text-foreground">{invoice.date}</p>
                </div>
              </div>
              <p className="text-base font-semibold text-foreground">
                {invoice.items[editingItemIndex].name}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prix unitaire brut</Label>
                  <InputGroup>
                    <InputGroupInput
                      value={itemForm.unitPriceGross}
                      onChange={(e) => setItemForm((prev) => ({ ...prev, unitPriceGross: e.target.value }))}
                    />
                    <InputGroupAddon align="inline-end">€</InputGroupAddon>
                  </InputGroup>
                </div>
                <div className="space-y-2">
                  <Label>Unité</Label>
                  <Input
                    value={itemForm.unit}
                    required
                    onChange={(e) => setItemForm((prev) => ({ ...prev, unit: e.target.value }))}
                  />
                </div>
              </div>

              {isBeverageSupplier && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Taxes</Label>
                    <InputGroup>
                      <InputGroupInput
                        value={itemForm.dutiesTaxes}
                        onChange={(e) => setItemForm((prev) => ({ ...prev, dutiesTaxes: e.target.value }))}
                      />
                      <InputGroupAddon align="inline-end">€</InputGroupAddon>
                    </InputGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Réductions</Label>
                    <InputGroup>
                      <InputGroupInput
                        value={itemForm.discount}
                        onChange={(e) => setItemForm((prev) => ({ ...prev, discount: e.target.value }))}
                      />
                      <InputGroupAddon align="inline-end">€</InputGroupAddon>
                    </InputGroup>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prix unitaire</Label>
                  <InputGroup>
                    <InputGroupInput
                      value={itemForm.unitPrice}
                      onChange={(e) => setItemForm((prev) => ({ ...prev, unitPrice: e.target.value }))}
                    />
                    <InputGroupAddon align="inline-end">€</InputGroupAddon>
                  </InputGroup>
                </div>
                <div className="space-y-2">
                  <Label>Quantité</Label>
                  <Input
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Total ligne (auto)</Label>
                <InputGroup>
                  <InputGroupInput
                    value={
                      (() => {
                        const currentItem = invoice.items[editingItemIndex]
                        const qty = parseNumber(itemForm.quantity ?? currentItem.quantity ?? "")
                        const netPrice = parseNumber(itemForm.unitPrice || currentItem.unitPrice)
                        const total = qty && Number.isFinite(netPrice) ? formatEuroFromNumber(qty * netPrice) : ""
                        return total || currentItem.lineTotal || "—"
                      })()
                    }
                    readOnly
                  />
                  <InputGroupAddon align="inline-end">€</InputGroupAddon>
                </InputGroup>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={closeItemSheet}>
              Annuler
            </Button>
            <Button onClick={handleItemSave} disabled={editingItemIndex === null}>
              Enregistrer
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
