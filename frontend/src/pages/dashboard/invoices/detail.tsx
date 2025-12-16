import { useState } from "react"
import { ArrowLeft, Download, Trash2, RefreshCcw, Pencil, FileText } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"

const mockInvoice = {
  number: "N°4099304911",
  lastModified: "06 Nov. 25",
  supplier: "FRANCE BOISSONS services",
  date: "Lun 22 Sept. 2025",
  importedAt: "21 Sep. 25",
  totals: {
    ht: "644,18 €",
    tva: "198,88 €",
    ttc: "843,06 €",
  },
  items: [
    { name: "122708 IPA DULION 7° FUT 30 L", unit: "U", unitPrice: "6,87 €", delta: "-" },
    { name: "92706 BADOIT ROUGE VP...", unit: "U", unitPrice: "1,36 €", delta: "-" },
    { name: "122707 BLONDE ENGAGEE...", unit: "U", unitPrice: "5,47 €", delta: "-" },
    { name: "123750 SOLEIA NECTAR...", unit: "U", unitPrice: "1,11 €", delta: "-" },
    { name: "82334 COCA-COLA ZERO...", unit: "U", unitPrice: "1,13 €", delta: "-" },
    { name: "112590 FRIGOLET SIROP", unit: "U", unitPrice: "4,09 €", delta: "-" },
  ],
}

const normalizeInvoiceNumber = (value: string) => value.replace(/^N°\s*/, "").trim()
const normalizeEuroValue = (value: string) => value.replace(/\s*€\s*/, "").trim()
const formatInvoiceNumber = (value: string) => (value ? `N°${normalizeInvoiceNumber(value)}` : "")
const formatEuroValue = (value: string) => {
  const clean = normalizeEuroValue(value)
  return clean ? `${clean} €` : ""
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

  const openEdit = () => {
    setFormValues({
      number: normalizeInvoiceNumber(invoice.number),
      ht: normalizeEuroValue(invoice.totals.ht),
      tva: normalizeEuroValue(invoice.totals.tva),
      ttc: normalizeEuroValue(invoice.totals.ttc),
    })
    setEditOpen(true)
  }

  const handleSave = () => {
    setInvoice((prev) => ({
      ...prev,
      number: formatInvoiceNumber(formValues.number),
      totals: {
        ht: formatEuroValue(formValues.ht),
        tva: formatEuroValue(formValues.tva),
        ttc: formatEuroValue(formValues.ttc),
      },
    }))
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
        <Card className="border-dashed lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
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
                        onChange={(e) => setFormValues((prev) => ({ ...prev, number: e.target.value }))}
                      />
                      <InputGroupAddon align="inline-start">
                        N°
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="grid w-full max-w-sm items-center gap-3">
                      <Label>HT</Label>
                      <InputGroup>
                        <InputGroupInput
                          value={formValues.ht}
                          onChange={(e) => setFormValues((prev) => ({ ...prev, ht: e.target.value }))}
                        />
                        <InputGroupAddon align="inline-end">
                          €
                        </InputGroupAddon>
                      </InputGroup>
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-3">
                      <Label>TVA</Label>
                      <InputGroup>
                        <InputGroupInput
                          value={formValues.tva}
                          onChange={(e) => setFormValues((prev) => ({ ...prev, tva: e.target.value }))}
                        />
                        <InputGroupAddon align="inline-end">
                          €
                        </InputGroupAddon>
                      </InputGroup>
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-3">
                      <Label>TTC</Label>
                      <InputGroup>
                        <InputGroupInput
                          value={formValues.ttc}
                          onChange={(e) => setFormValues((prev) => ({ ...prev, ttc: e.target.value }))}
                        />
                        <InputGroupAddon align="inline-end">
                          €
                        </InputGroupAddon>
                      </InputGroup>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setEditOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleSave}>Enregistrer</Button>
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

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>Détail articles</CardTitle>
              <CardDescription>
                Le fournisseur de cette facture n&apos;est pas alimentaire. Des erreurs de détection peuvent donc apparaître.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4">Nom article</TableHead>
                      <TableHead className="px-3 text-center">Unité</TableHead>
                      <TableHead className="px-3 text-right">Prix unitaire</TableHead>
                      <TableHead className="px-3 text-center">Var(±)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockInvoice.items.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="px-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 text-center text-sm text-muted-foreground">{item.unit}</TableCell>
                        <TableCell className="px-3 text-right font-semibold">{item.unitPrice}</TableCell>
                        <TableCell className="px-3 text-center text-muted-foreground">{item.delta}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
