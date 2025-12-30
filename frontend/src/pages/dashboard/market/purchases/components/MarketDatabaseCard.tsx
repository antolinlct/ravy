import { useState } from "react"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community"
import type {
  ColDef,
  GetRowIdParams,
  PostSortRowsParams,
  RowClassParams,
  RowHeightParams,
} from "ag-grid-community"
import { Expand, Search, Shrink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import MultipleCombobox from "@/components/ui/multiple_combobox"
import { cn } from "@/lib/utils"
import type { MarketGridRow } from "../types"

ModuleRegistry.registerModules([AllCommunityModule])

export type MarketStatus = { tone: string; label: string } | null

export type ColumnOption = { id: string; label: string }

export type MarketDatabaseCardProps = {
  supplierFilterOptions: { value: string; label: string }[]
  selectedSuppliers: string[]
  onSuppliersChange: (value: string[]) => void
  productSearch: string
  onProductSearchChange: (value: string) => void
  marketStatus: MarketStatus
  agThemeMode: "light" | "dark"
  marketGridRows: MarketGridRow[]
  marketGridColumnDefsCompact: ColDef<MarketGridRow>[]
  marketGridColumnDefsFull: ColDef<MarketGridRow>[]
  marketDefaultColDef: ColDef<MarketGridRow>
  marketGetRowId: (params: GetRowIdParams<MarketGridRow>) => string
  marketGetRowClass: (params: RowClassParams<MarketGridRow>) => string
  marketRowHeight: (params: RowHeightParams<MarketGridRow>) => number
  marketPostSortRows: (params: PostSortRowsParams<MarketGridRow>) => void
  hiddenColumnIds: Set<string>
  onToggleColumn: (columnId: string, visible: boolean) => void
  onResetColumns: () => void
  columnOptions: ColumnOption[]
}

export function MarketDatabaseCard({
  supplierFilterOptions,
  selectedSuppliers,
  onSuppliersChange,
  productSearch,
  onProductSearchChange,
  marketStatus,
  agThemeMode,
  marketGridRows,
  marketGridColumnDefsCompact,
  marketGridColumnDefsFull,
  marketDefaultColDef,
  marketGetRowId,
  marketGetRowClass,
  marketRowHeight,
  marketPostSortRows,
  hiddenColumnIds,
  onToggleColumn,
  onResetColumns,
  columnOptions,
}: MarketDatabaseCardProps) {
  const [isGridFullscreen, setIsGridFullscreen] = useState(false)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Base de données</CardTitle>
            <p className="text-sm text-muted-foreground">
              Consultez les prix du marché payé par vos concurrents.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <MultipleCombobox
              className="max-w-xs"
              placeholder="Sélectionner des fournisseurs"
              items={supplierFilterOptions}
              value={selectedSuppliers}
              onChange={onSuppliersChange}
            />
            <div className="relative w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={(event) => onProductSearchChange(event.target.value)}
                placeholder="Rechercher un produit"
                className="w-full pl-9"
              />
            </div>
            <Button
              variant="secondary"
              size="icon"
              type="button"
              onClick={() => setIsGridFullscreen(true)}
              className="self-start"
              aria-label="Agrandir le tableau"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {marketStatus ? (
            <p className={cn("text-sm", marketStatus.tone)}>{marketStatus.label}</p>
          ) : null}
          <div style={{ height: 620, width: "100%" }} data-ag-theme-mode={agThemeMode}>
            <AgGridReact<MarketGridRow>
              rowData={marketGridRows}
              columnDefs={marketGridColumnDefsCompact}
              defaultColDef={marketDefaultColDef}
              theme={themeQuartz}
              suppressDragLeaveHidesColumns
              getRowId={marketGetRowId}
              getRowClass={marketGetRowClass}
              getRowHeight={marketRowHeight}
              postSortRows={marketPostSortRows}
              domLayout="normal"
            />
          </div>
        </CardContent>
      </Card>
      <Dialog open={isGridFullscreen} onOpenChange={setIsGridFullscreen}>
        <DialogContent
          showCloseButton={false}
          className="inset-0 h-[100svh] w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-6 sm:max-w-none"
        >
          <div className="flex h-full flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Base de données</h2>
                <p className="text-sm text-muted-foreground">
                  Consultez les prix du marché payé par vos concurrents.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <MultipleCombobox
                  className="max-w-xs"
                  placeholder="Sélectionner des fournisseurs"
                  items={supplierFilterOptions}
                  value={selectedSuppliers}
                  onChange={onSuppliersChange}
                />
                <div className="relative w-[220px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(event) => onProductSearchChange(event.target.value)}
                    placeholder="Rechercher un produit"
                    className="w-full pl-9"
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" type="button">
                      Colonnes
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-56 space-y-2">
                    <div className="space-y-2">
                      {columnOptions.map((column) => {
                        const isVisible = !hiddenColumnIds.has(column.id)
                        return (
                          <label
                            key={column.id}
                            className="flex items-center gap-2 text-sm text-foreground"
                          >
                            <Checkbox
                              checked={isVisible}
                              onCheckedChange={(checked) => onToggleColumn(column.id, checked === true)}
                              aria-label={`Afficher la colonne ${column.label}`}
                            />
                            <span>{column.label}</span>
                          </label>
                        )
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="w-full justify-center"
                      onClick={onResetColumns}
                    >
                      Réinitialiser
                    </Button>
                  </PopoverContent>
                </Popover>
                <DialogClose asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    type="button"
                    aria-label="Réduire le tableau"
                  >
                    <Shrink className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </div>
            {marketStatus ? (
              <p className={cn("text-sm", marketStatus.tone)}>{marketStatus.label}</p>
            ) : null}
            <div className="flex-1" data-ag-theme-mode={agThemeMode}>
              <div style={{ height: "100%", width: "100%" }}>
                <AgGridReact<MarketGridRow>
                  rowData={marketGridRows}
                  columnDefs={marketGridColumnDefsFull}
                  defaultColDef={marketDefaultColDef}
                  theme={themeQuartz}
                  suppressDragLeaveHidesColumns
                  getRowId={marketGetRowId}
                  getRowClass={marketGetRowClass}
                  getRowHeight={marketRowHeight}
                  postSortRows={marketPostSortRows}
                  domLayout="normal"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
