import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { toast } from "sonner"
import {
  computeUnitPriceGross,
  formatEuroFromNumber,
  parseNumber,
  supplierLabelStyle,
  toCurrencyInputValue,
  updateArticle,
} from "../../api"
import type { InvoiceDetail } from "../../types"

type InvoiceItemSheetProps = {
  open: boolean
  editingIndex: number | null
  invoice: InvoiceDetail
  isBeverageSupplier: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: React.Dispatch<React.SetStateAction<InvoiceDetail | null>>
}

type ItemFormState = {
  unit: string
  unitPrice: string
  unitPriceGross: string
  dutiesTaxes: string
  discount: string
  quantity: string
}

const EMPTY_FORM: ItemFormState = {
  unit: "",
  unitPrice: "",
  unitPriceGross: "",
  dutiesTaxes: "",
  discount: "",
  quantity: "",
}

export default function InvoiceItemSheet({
  open,
  editingIndex,
  invoice,
  isBeverageSupplier,
  onOpenChange,
  onUpdate,
}: InvoiceItemSheetProps) {
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_FORM)

  useEffect(() => {
    if (editingIndex === null || !open) {
      setItemForm(EMPTY_FORM)
      return
    }
    const item = invoice.items[editingIndex]
    setItemForm({
      unit: item.unit,
      unitPrice: toCurrencyInputValue(item.unitPrice),
      unitPriceGross: toCurrencyInputValue(computeUnitPriceGross(item)),
      dutiesTaxes: toCurrencyInputValue(item.dutiesTaxes),
      discount: toCurrencyInputValue(item.discount),
      quantity: item.quantity ?? "",
    })
  }, [editingIndex, invoice, open])

  const closeSheet = () => {
    onOpenChange(false)
    setItemForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (editingIndex === null) return
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

    const currentItem = invoice.items[editingIndex]
    const qtyValue = quantity || currentItem.quantity || ""
    const qtyNumber = parseNumber(qtyValue)
    const dutiesValue = dutiesTaxes ? parseNumber(dutiesTaxes) : 0
    const discountValue = discount ? parseNumber(discount) : 0
    const netPriceNumber = unitPrice
      ? parseNumber(unitPrice)
      : unitPriceGross
        ? parseNumber(unitPriceGross) - dutiesValue + discountValue
        : NaN
    const netPriceFormatted = Number.isFinite(netPriceNumber)
      ? formatEuroFromNumber(netPriceNumber)
      : currentItem.unitPrice
    const lineTotalNumber = qtyNumber && Number.isFinite(netPriceNumber) ? qtyNumber * netPriceNumber : NaN
    const lineTotal = Number.isFinite(lineTotalNumber)
      ? formatEuroFromNumber(lineTotalNumber)
      : currentItem.lineTotal

    const articleId = invoice.items[editingIndex].id
    if (!articleId) {
      toast.error("Impossible de mettre à jour l'article.")
      return
    }
    try {
      await updateArticle(articleId, {
        unit,
        quantity: qtyNumber || null,
        unit_price: Number.isFinite(netPriceNumber) ? netPriceNumber : null,
        gross_unit_price: unitPriceGross ? parseNumber(unitPriceGross) : null,
        duties_and_taxes: dutiesTaxes ? parseNumber(dutiesTaxes) : null,
        discounts: discount ? parseNumber(discount) : null,
        total: Number.isFinite(lineTotalNumber) ? lineTotalNumber : null,
      })
      onUpdate((prev) => {
        if (!prev) return prev
        const items = prev.items.map((item, idx) =>
          idx === editingIndex
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
      closeSheet()
    } catch {
      toast.error("Impossible de mettre à jour l'article.")
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) {
          setItemForm(EMPTY_FORM)
        }
      }}
    >
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Modifier l&apos;article</SheetTitle>
          <SheetDescription>Modifiez les informations de l&apos;article ci-dessous.</SheetDescription>
        </SheetHeader>

        {editingIndex !== null && (
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
              {invoice.items[editingIndex].name}
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
                      const currentItem = invoice.items[editingIndex]
                      const qty = parseNumber(itemForm.quantity ?? currentItem.quantity ?? "")
                      const netPrice = parseNumber(itemForm.unitPrice || currentItem.unitPrice)
                      const total = qty && Number.isFinite(netPrice)
                        ? formatEuroFromNumber(qty * netPrice)
                        : ""
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
          <Button variant="secondary" onClick={closeSheet}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={editingIndex === null}>
            Enregistrer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
