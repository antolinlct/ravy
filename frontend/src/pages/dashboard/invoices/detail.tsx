import { useState } from "react"
import { ArrowLeft, Download, Trash2, RefreshCcw, Pencil, PencilRuler, UnfoldHorizontal, FoldHorizontal } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { toast } from "sonner"

const mockInvoice = {
  number: "N°4099304911",
  lastModified: "06 Nov. 25",
  supplier: "FRANCE BOISSONS services",
  supplierType: "beverage" as const,
  date: "Lun 22 Sept. 2025",
  importedAt: "21 Sep. 25",
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
  const [itemForm, setItemForm] = useState({ unit: "", unitPrice: "", dutiesTaxes: "", discount: "" })
  const [articlesExpanded, setArticlesExpanded] = useState(false)
  const isBeverageSupplier = invoice.supplierType === "beverage"

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
      dutiesTaxes: item.dutiesTaxes ?? "",
      discount: item.discount ?? "",
    })
    setItemSheetOpen(true)
  }

  const closeItemSheet = () => {
    setItemSheetOpen(false)
    setEditingItemIndex(null)
    setItemForm({ unit: "", unitPrice: "", dutiesTaxes: "", discount: "" })
  }

  const handleItemSave = () => {
    if (editingItemIndex === null) return
    const unit = itemForm.unit.trim()
    const unitPrice = itemForm.unitPrice.trim()
    const dutiesTaxes = itemForm.dutiesTaxes.trim()
    const discount = itemForm.discount.trim()

    if (!unit || !unitPrice) {
      toast.error("Unité et prix unitaire sont requis.")
      return
    }

    const currentItem = invoice.items[editingItemIndex]
    const quantity = currentItem.quantity ?? ""
    const qtyNumber = parseNumber(quantity)
    const priceNumber = parseNumber(unitPrice)
    const lineTotalNumber = qtyNumber ? qtyNumber * priceNumber : NaN
    const lineTotal = Number.isFinite(lineTotalNumber) ? formatEuroFromNumber(lineTotalNumber) : currentItem.lineTotal

    setInvoice((prev) => {
      const items = prev.items.map((item, idx) =>
        idx === editingItemIndex
          ? {
              ...item,
              unit,
              unitPrice: formatEuroValue(unitPrice),
              lineTotal: lineTotal || item.lineTotal,
              dutiesTaxes: isBeverageSupplier ? dutiesTaxes : item.dutiesTaxes,
              discount: isBeverageSupplier ? discount : item.discount,
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
          <Button variant="destructive" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12 items-start">
        <Card className={`border-dashed lg:col-span-5 ${articlesExpanded ? "lg:max-h-[244px] overflow-auto" : ""}`}>
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
          <CardContent>
            <div className="overflow-hidden rounded-lg border bg-muted/40">
              <AspectRatio ratio={210 / 297} className="mx-auto w-full max-w-[620px] bg-background shadow-sm border">
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  Aperçu du PDF (format A4, responsive)
                </div>
              </AspectRatio>
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
                    Vue rapide : nom, prix unitaire, variation. Développez pour plus de détails.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => setArticlesExpanded(true)}>
                  <UnfoldHorizontal className="h-4 w-4" />
                  Développer
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-4">Nom article</TableHead>
                        <TableHead className="px-3 text-right">Prix unitaire</TableHead>
                        <TableHead className="px-3 text-center">Var(±)</TableHead>
                        <TableHead className="px-3 text-right w-12">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((item, index) => (
                        <TableRow key={item.name}>
                          <TableCell className="px-4">
                            <span className="font-medium">{item.name}</span>
                          </TableCell>
                          <TableCell className="px-3 text-right font-semibold">{item.unitPrice}</TableCell>
                          <TableCell className="px-3 text-center text-sm text-muted-foreground">{item.delta ?? "—"}</TableCell>
                          <TableCell className="px-3 text-right">
                            <Button variant="ghost" size="icon" aria-label={`Modifier ${item.name}`} onClick={() => openItemSheet(index)}>
                              <PencilRuler className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
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
              <Button variant="ghost" size="sm" className="gap-2" onClick={() => setArticlesExpanded(false)}>
                <FoldHorizontal className="h-4 w-4" />
                Réduire
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 min-w-[220px]">Nom article</TableHead>
                      <TableHead className="px-3 text-center min-w-[80px]">Unité</TableHead>
                      <TableHead className="px-3 text-center min-w-[90px]">Quantité</TableHead>
                      <TableHead className="px-3 text-right min-w-[120px]">Prix unitaire</TableHead>
                      <TableHead className="px-3 text-center min-w-[90px]">Var(±)</TableHead>
                      {isBeverageSupplier && (
                        <>
                          <TableHead className="px-3 text-center min-w-[110px]">Duties &amp; taxes</TableHead>
                          <TableHead className="px-3 text-center min-w-[100px]">Discount</TableHead>
                        </>
                      )}
                      <TableHead className="px-3 text-right min-w-[120px]">Total ligne</TableHead>
                      <TableHead className="px-3 text-right w-12">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item, index) => (
                      <TableRow key={item.name}>
                        <TableCell className="px-4">
                          <span className="font-medium">{item.name}</span>
                        </TableCell>
                        <TableCell className="px-3 text-center text-sm text-muted-foreground">{item.unit}</TableCell>
                        <TableCell className="px-3 text-center text-sm text-muted-foreground">{item.quantity ?? "—"}</TableCell>
                        <TableCell className="px-3 text-right font-semibold">{item.unitPrice}</TableCell>
                        <TableCell className="px-3 text-center text-sm text-muted-foreground">{item.delta ?? "—"}</TableCell>
                        {isBeverageSupplier && (
                          <>
                            <TableCell className="px-3 text-center text-sm text-muted-foreground">
                              {item.dutiesTaxes ?? "—"}
                            </TableCell>
                            <TableCell className="px-3 text-center text-sm text-muted-foreground">
                              {item.discount ?? "—"}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="px-3 text-right font-semibold">{item.lineTotal ?? "—"}</TableCell>
                        <TableCell className="px-3 text-right">
                          <Button variant="ghost" size="icon" aria-label={`Modifier ${item.name}`} onClick={() => openItemSheet(index)}>
                            <PencilRuler className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
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
            <SheetDescription>Mettre à jour l&apos;unité, le prix et les ajustements.</SheetDescription>
          </SheetHeader>

          {editingItemIndex !== null && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Nom de l&apos;article</Label>
                <p className="text-sm font-medium text-foreground">{invoice.items[editingItemIndex].name}</p>
              </div>
              <div className="space-y-2">
                <Label>Unité</Label>
                <Input
                  value={itemForm.unit}
                  required
                  onChange={(e) => setItemForm((prev) => ({ ...prev, unit: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Prix unitaire</Label>
                <InputGroup>
                  <InputGroupInput
                    value={itemForm.unitPrice}
                    required
                    onChange={(e) => setItemForm((prev) => ({ ...prev, unitPrice: e.target.value }))}
                  />
                  <InputGroupAddon align="inline-end">€</InputGroupAddon>
                </InputGroup>
              </div>
              {isBeverageSupplier && (
                <>
                  <div className="space-y-2">
                    <Label>Duties &amp; taxes</Label>
                    <InputGroup>
                      <InputGroupInput
                        value={itemForm.dutiesTaxes}
                        onChange={(e) => setItemForm((prev) => ({ ...prev, dutiesTaxes: e.target.value }))}
                      />
                      <InputGroupAddon align="inline-end">%</InputGroupAddon>
                    </InputGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Discount</Label>
                    <InputGroup>
                      <InputGroupInput
                        value={itemForm.discount}
                        onChange={(e) => setItemForm((prev) => ({ ...prev, discount: e.target.value }))}
                      />
                      <InputGroupAddon align="inline-end">%</InputGroupAddon>
                    </InputGroup>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Total ligne (auto)</Label>
                <InputGroup>
                  <InputGroupInput
                    value={
                      (() => {
                        const currentItem = invoice.items[editingItemIndex]
                        const qty = parseNumber(currentItem.quantity ?? "")
                        const total = qty ? formatEuroFromNumber(qty * parseNumber(itemForm.unitPrice)) : ""
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
            <Button variant="ghost" onClick={closeItemSheet}>
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
