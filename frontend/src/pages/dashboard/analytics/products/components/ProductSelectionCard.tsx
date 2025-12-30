import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { DoubleDatePicker } from "@/components/blocks/double-datepicker"
import { cn } from "@/lib/utils"

export type ProductSelectionCardProps = {
  supplierOptions: Array<{ id: string; label: string }>
  selectedSupplierId: string
  onSupplierSelect: (value: string) => void
  articleOptions: Array<{ id: string; name: string }>
  selectedArticleId: string
  onArticleSelect: (value: string) => void
  minDate: Date
  range: { start?: Date; end?: Date }
  onRangeChange: (range: { start?: Date; end?: Date }) => void
  lastPurchaseLabel: string
}

export const ProductSelectionCard = ({
  supplierOptions,
  selectedSupplierId,
  onSupplierSelect,
  articleOptions,
  selectedArticleId,
  onArticleSelect,
  minDate,
  range,
  onRangeChange,
  lastPurchaseLabel,
}: ProductSelectionCardProps) => {
  const [supplierComboOpen, setSupplierComboOpen] = useState(false)
  const [articleComboOpen, setArticleComboOpen] = useState(false)

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <CardTitle>Sélectionnez un produit à analyser</CardTitle>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex flex-col gap-2 min-w-[240px]">
              <Label className="text-xs font-medium text-muted-foreground">Fournisseur</Label>
              <Popover open={supplierComboOpen} onOpenChange={setSupplierComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={supplierComboOpen}
                    className="w-full justify-between"
                  >
                    {selectedSupplierId
                      ? supplierOptions.find((opt) => opt.id === selectedSupplierId)?.label
                      : "Sélectionnez un fournisseur"}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Rechercher un fournisseur..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>Aucun fournisseur.</CommandEmpty>
                      <CommandGroup>
                        {supplierOptions.map((opt) => (
                          <CommandItem
                            key={opt.id}
                            value={opt.id}
                            onSelect={(value) => {
                              const next = value === selectedSupplierId ? "" : value
                              onSupplierSelect(next)
                              setSupplierComboOpen(false)
                              setArticleComboOpen(false)
                            }}
                          >
                            {opt.label}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                selectedSupplierId === opt.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2 min-w-[300px]">
              <Label className="text-xs font-medium text-muted-foreground">Produit</Label>
              <Popover open={articleComboOpen} onOpenChange={setArticleComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={articleComboOpen}
                    className="w-full justify-between"
                    disabled={!selectedSupplierId}
                  >
                    {selectedArticleId
                      ? articleOptions.find((opt) => opt.id === selectedArticleId)?.name
                      : selectedSupplierId
                        ? "Sélectionnez un produit"
                        : "Choisissez un fournisseur"}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Rechercher un produit..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>Aucun produit disponible.</CommandEmpty>
                      <CommandGroup>
                        {articleOptions.map((opt) => (
                          <CommandItem
                            key={opt.id}
                            value={opt.id}
                            onSelect={(value) => {
                              const next = value === selectedArticleId ? "" : value
                              onArticleSelect(next)
                              setArticleComboOpen(false)
                            }}
                          >
                            {opt.name}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                selectedArticleId === opt.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <DoubleDatePicker
              className="self-start"
              displayFormat="long"
              showSeparator
              minDate={minDate}
              startDate={range.start}
              endDate={range.end}
              onChange={({ startDate, endDate }) => onRangeChange({ start: startDate, end: endDate })}
            />
          </div>

          <div className="flex flex-col items-start gap-2 self-center lg:items-end">
            <span className="text-xs font-medium text-muted-foreground">Dernier achat le</span>
            <span className="text-xl font-semibold self-end text-primary">{lastPurchaseLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
