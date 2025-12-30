import { useState } from "react"
import { AgGridReact } from "ag-grid-react"
import { themeQuartz } from "ag-grid-community"
import type { ColDef } from "ag-grid-community"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog"
import { Expand, Search, Shrink } from "lucide-react"
import { cn } from "@/lib/utils"

type SnapshotOption = {
  id: string
  label: string
}

type TableStatus = {
  tone: string
  label: string
} | null

type MercurialeTableCardProps<TData> = {
  selectedRangeLabel: string
  selectedRangeLabelUpper: string
  isOutdatedSnapshot: boolean
  productSearch: string
  onProductSearchChange: (value: string) => void
  selectedSnapshotId: string
  onSnapshotChange: (value: string) => void
  snapshotOptions: SnapshotOption[]
  tableStatus: TableStatus
  agThemeMode: "light" | "dark"
  rowData: TData[]
  columnDefs: ColDef<TData>[]
  defaultColDef: ColDef<TData>
  gridHeight?: number
}

export default function MercurialeTableCard<TData>({
  selectedRangeLabel,
  selectedRangeLabelUpper,
  isOutdatedSnapshot,
  productSearch,
  onProductSearchChange,
  selectedSnapshotId,
  onSnapshotChange,
  snapshotOptions,
  tableStatus,
  agThemeMode,
  rowData,
  columnDefs,
  defaultColDef,
  gridHeight = 510,
}: MercurialeTableCardProps<TData>) {
  const [isGridFullscreen, setIsGridFullscreen] = useState(false)
  const description = isOutdatedSnapshot
    ? "Attention : cette mercuriale n’est plus valide."
    : "Consultez les articles négociés pour ce fournisseur."

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Mercuriale valable {selectedRangeLabel}</CardTitle>
            <CardDescription className={isOutdatedSnapshot ? "text-red-500" : undefined}>
              {description}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={(event) => onProductSearchChange(event.target.value)}
                placeholder="Rechercher un produit"
                className="w-full pl-9"
              />
            </div>
            <Select value={selectedSnapshotId} onValueChange={onSnapshotChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder={selectedRangeLabelUpper} />
              </SelectTrigger>
              <SelectContent>
                {snapshotOptions.map((snapshot) => (
                  <SelectItem key={snapshot.id} value={snapshot.id}>
                    {snapshot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              size="icon"
              type="button"
              onClick={() => setIsGridFullscreen(true)}
              aria-label="Agrandir le tableau"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {tableStatus ? <p className={cn("text-sm", tableStatus.tone)}>{tableStatus.label}</p> : null}
          <div style={{ height: gridHeight, width: "100%" }} data-ag-theme-mode={agThemeMode}>
            <AgGridReact<TData>
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              theme={themeQuartz}
              suppressDragLeaveHidesColumns
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
                <h2 className="text-lg font-semibold">Mercuriale valable {selectedRangeLabel}</h2>
                <p className={`text-sm ${isOutdatedSnapshot ? "text-red-500" : "text-muted-foreground"}`}>
                  {description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-[220px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(event) => onProductSearchChange(event.target.value)}
                    placeholder="Rechercher un produit"
                    className="w-full pl-9"
                  />
                </div>
                <Select value={selectedSnapshotId} onValueChange={onSnapshotChange}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder={selectedRangeLabelUpper} />
                  </SelectTrigger>
                  <SelectContent>
                    {snapshotOptions.map((snapshot) => (
                      <SelectItem key={snapshot.id} value={snapshot.id}>
                        {snapshot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <div className="flex-1" data-ag-theme-mode={agThemeMode}>
              <div style={{ height: "100%", width: "100%" }}>
                <AgGridReact<TData>
                  rowData={rowData}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  theme={themeQuartz}
                  suppressDragLeaveHidesColumns
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
