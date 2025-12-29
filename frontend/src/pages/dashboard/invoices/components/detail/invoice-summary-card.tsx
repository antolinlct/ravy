import { useState } from "react"
import { Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { formatEuroValue, formatInvoiceNumber, normalizeEuroValue, normalizeInvoiceNumber, updateInvoice } from "../../api"
import type { InvoiceDetail } from "../../types"

type InvoiceSummaryCardProps = {
  invoice: InvoiceDetail
  onUpdate: React.Dispatch<React.SetStateAction<InvoiceDetail | null>>
  invoiceId: string
}

export default function InvoiceSummaryCard({ invoice, onUpdate, invoiceId }: InvoiceSummaryCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formValues, setFormValues] = useState({
    number: normalizeInvoiceNumber(invoice.number),
    ht: normalizeEuroValue(invoice.totals.ht),
    tva: normalizeEuroValue(invoice.totals.tva),
    ttc: normalizeEuroValue(invoice.totals.ttc),
  })

  const resetForm = () => {
    setFormValues({
      number: normalizeInvoiceNumber(invoice.number),
      ht: normalizeEuroValue(invoice.totals.ht),
      tva: normalizeEuroValue(invoice.totals.tva),
      ttc: normalizeEuroValue(invoice.totals.ttc),
    })
  }

  const openEdit = () => {
    resetForm()
    setEditOpen(true)
  }

  const handleSave = async () => {
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

    const payload = {
      invoice_number: formatInvoiceNumber(trimmed.number).replace(/^N°\s*/, "").trim(),
      total_excl_tax: Number(trimmed.ht.replace(",", ".")),
      total_tax: Number(trimmed.tva.replace(",", ".")),
      total_incl_tax: Number(trimmed.ttc.replace(",", ".")),
    }

    setIsSaving(true)
    try {
      await updateInvoice(invoiceId, payload)
      onUpdate((prev) =>
        prev
          ? {
              ...prev,
              number: formatInvoiceNumber(trimmed.number),
              totals: {
                ht: formatEuroValue(trimmed.ht),
                tva: formatEuroValue(trimmed.tva),
                ttc: formatEuroValue(trimmed.ttc),
              },
            }
          : prev
      )
      toast.success("Facture mise à jour.")
      setEditOpen(false)
    } catch {
      toast.error("Impossible de mettre à jour la facture.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
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
                        <Button onClick={handleSave} disabled={isSaving}>
                          Enregistrer
                        </Button>
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
  )
}
