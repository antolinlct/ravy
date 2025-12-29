import { useEffect, useMemo, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community"
import type { ColDef, ICellRendererParams } from "ag-grid-community"
import { ArrowLeft } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { MarketMasterArticle, MarketSupplier, MarketSupplierLabel } from "./types"
import { marketGridTheme } from "./gridTheme"

ModuleRegistry.registerModules([AllCommunityModule])

type SupplierDetailViewProps = {
  supplier: MarketSupplier
  masterArticles: MarketMasterArticle[]
  onBack: () => void
  onUpdateSupplier: (input: { active: boolean; label: MarketSupplierLabel | null }) => void
  onOpenArticle: (articleId: string) => void
}

const labelOptions: MarketSupplierLabel[] = [
  "FOOD",
  "BEVERAGES",
  "FIXED COSTS",
  "VARIABLE COSTS",
  "OTHER",
]

const labelDisplay: Record<MarketSupplierLabel, string> = {
  FOOD: "Food",
  BEVERAGES: "Beverages",
  "FIXED COSTS": "Fixed costs",
  "VARIABLE COSTS": "Variable costs",
  OTHER: "Other",
}

const formatDate = (value?: string | null) => {
  if (!value) return "--"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function MarketSupplierDetailView({
  supplier,
  masterArticles,
  onBack,
  onUpdateSupplier,
  onOpenArticle,
}: SupplierDetailViewProps) {
  const [draftActive, setDraftActive] = useState(supplier.active)
  const [draftLabel, setDraftLabel] = useState<MarketSupplierLabel | "">(supplier.label ?? "")

  useEffect(() => {
    setDraftActive(supplier.active)
    setDraftLabel(supplier.label ?? "")
  }, [supplier.active, supplier.label])

  const hasChanges =
    draftActive !== supplier.active || (draftLabel || null) !== supplier.label

  const sortedArticles = useMemo(() => {
    return [...masterArticles].sort((a, b) =>
      a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
    )
  }, [masterArticles])

  const articleStats = useMemo(() => {
    const total = masterArticles.length
    const active = masterArticles.filter((article) => article.isActive).length
    return {
      total,
      active,
      inactive: total - active,
    }
  }, [masterArticles])

  const columnDefs = useMemo<ColDef<MarketMasterArticle>[]>(() => {
    return [
      {
        headerName: "Article",
        field: "name",
        minWidth: 220,
        flex: 1,
      },
      {
        headerName: "Unite",
        field: "unit",
        minWidth: 110,
        cellClass: "text-muted-foreground",
        valueFormatter: ({ value }) => value ?? "--",
      },
      {
        headerName: "Prix actuel",
        field: "currentUnitPrice",
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams<MarketMasterArticle>) => (
          <span className="font-medium">
            {params.value !== null && params.value !== undefined
              ? params.value.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 2,
                })
              : "--"}
          </span>
        ),
      },
      {
        headerName: "Visibilite",
        field: "isActive",
        minWidth: 130,
        cellRenderer: (params: ICellRendererParams<MarketMasterArticle>) => (
          <Badge variant={params.value ? "default" : "secondary"}>
            {params.value ? "Visible" : "Masque"}
          </Badge>
        ),
      },
      {
        headerName: "MAJ",
        field: "updatedAt",
        minWidth: 130,
        valueGetter: ({ data }) => data?.updatedAt ?? data?.createdAt ?? null,
        valueFormatter: ({ value }) => formatDate(value as string | null),
        cellClass: "text-muted-foreground",
      },
    ]
  }, [])

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      sortable: true,
      resizable: true,
      filter: true,
      minWidth: 120,
    }
  }, [])

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-semibold">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground">
            Mise a jour le {formatDate(supplier.updatedAt ?? supplier.createdAt)}
          </p>
        </div>
        <Badge variant={supplier.active ? "default" : "secondary"}>
          {supplier.active ? "Disponible" : "Masque"}
        </Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Parametres fournisseur</CardTitle>
          <CardDescription>
            Controlez la visibilite du fournisseur cote utilisateur.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label>Label</Label>
            <Select
              value={draftLabel}
              onValueChange={(value) => setDraftLabel(value as MarketSupplierLabel)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un label" />
              </SelectTrigger>
              <SelectContent>
                {labelOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {labelDisplay[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Disponibilite</Label>
            <div className="flex items-center gap-2">
              <Switch checked={draftActive} onCheckedChange={setDraftActive} />
              <span className="text-sm text-muted-foreground">
                {draftActive ? "Visible" : "Masque"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDraftActive(supplier.active)
                setDraftLabel(supplier.label ?? "")
              }}
              disabled={!hasChanges}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() =>
                onUpdateSupplier({
                  active: draftActive,
                  label: draftLabel ? draftLabel : null,
                })
              }
              disabled={!hasChanges}
            >
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Market articles</CardTitle>
              <CardDescription>
                Articles de reference appartenant a ce fournisseur.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-4 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Articles</span>
                <span className="font-medium text-foreground">{articleStats.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Actifs</span>
                <span className="font-medium text-foreground">{articleStats.active}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Inactifs</span>
                <span className="font-medium text-foreground">{articleStats.inactive}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ height: 520, width: "100%" }} data-ag-theme-mode="dark">
            <AgGridReact<MarketMasterArticle>
              rowData={sortedArticles}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              theme={marketGridTheme}
              suppressDragLeaveHidesColumns
              domLayout="normal"
              onRowClicked={(event) => {
                if (event.data?.id) onOpenArticle(event.data.id)
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
