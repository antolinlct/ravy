import { useEffect, useMemo, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community"
import type { ColDef, ICellRendererParams } from "ag-grid-community"
import { ArrowDown, ArrowLeft, ArrowUp, Expand, Shrink } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type {
  Establishment,
  MarketArticle,
  MarketMasterArticle,
  MarketSupplier,
  UserProfile,
} from "./types"
import { marketGridTheme } from "./gridTheme"

ModuleRegistry.registerModules([AllCommunityModule])

type MarketArticleDetailViewProps = {
  supplier: MarketSupplier
  masterArticle: MarketMasterArticle
  articles: MarketArticle[]
  establishments: Establishment[]
  users: UserProfile[]
  onBack: () => void
  onUpdateArticle: (input: { isActive: boolean }) => void
}

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const formatDate = (value?: string | null) => {
  if (!value) return "--"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function MarketArticleDetailView({
  supplier,
  masterArticle,
  articles,
  establishments,
  users,
  onBack,
  onUpdateArticle,
}: MarketArticleDetailViewProps) {
  const [draftActive, setDraftActive] = useState(masterArticle.isActive)
  const [startFilter, setStartFilter] = useState("")
  const [endFilter, setEndFilter] = useState("")
  const [isGridFullscreen, setIsGridFullscreen] = useState(false)

  useEffect(() => {
    setDraftActive(masterArticle.isActive)
  }, [masterArticle.isActive])

  const hasChanges = draftActive !== masterArticle.isActive

  const establishmentById = useMemo(() => {
    return new Map(establishments.map((item) => [item.id, item]))
  }, [establishments])

  const userById = useMemo(() => {
    return new Map(users.map((item) => [item.id, item]))
  }, [users])

  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      const left = new Date(a.date).getTime()
      const right = new Date(b.date).getTime()
      return right - left
    })
  }, [articles])

  const filteredArticles = useMemo(() => {
    const startMs = startFilter ? new Date(startFilter).getTime() : null
    const endMs = endFilter ? new Date(endFilter).getTime() : null
    return sortedArticles.filter((article) => {
      const time = new Date(article.date).getTime()
      if (Number.isNaN(time)) return false
      if (startMs !== null && time < startMs) return false
      if (endMs !== null && time > endMs) return false
      return true
    })
  }, [endFilter, sortedArticles, startFilter])

  const variationById = useMemo(() => {
    const map = new Map<string, number | null>()
    filteredArticles.forEach((article, index) => {
      const previous = filteredArticles[index + 1]
      if (!article.unitPrice || !previous?.unitPrice) {
        map.set(article.id, null)
        return
      }
      map.set(article.id, (article.unitPrice - previous.unitPrice) / previous.unitPrice)
    })
    return map
  }, [filteredArticles])

  const periodStats = useMemo(() => {
    const values = filteredArticles
      .map((article) => article.unitPrice)
      .filter((value): value is number => typeof value === "number")
    if (values.length === 0) {
      return {
        average: null,
        min: null,
        max: null,
        deltaValue: null,
        deltaPercent: null,
      }
    }
    const sum = values.reduce((acc, value) => acc + value, 0)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const oldest = [...filteredArticles]
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .find((article) => typeof article.unitPrice === "number")
    const newest = [...filteredArticles]
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .find((article) => typeof article.unitPrice === "number")
    if (!oldest?.unitPrice || !newest?.unitPrice || oldest.unitPrice === 0) {
      return {
        average: sum / values.length,
        min,
        max,
        deltaValue: null,
        deltaPercent: null,
      }
    }
    const deltaValue = newest.unitPrice - oldest.unitPrice
    const deltaPercent = deltaValue / oldest.unitPrice
    return {
      average: sum / values.length,
      min,
      max,
      deltaValue,
      deltaPercent,
    }
  }, [filteredArticles])

  const rowData = useMemo(() => {
    return filteredArticles.map((article) => {
      const establishment = article.establishmentId
        ? establishmentById.get(article.establishmentId)
        : null
      const user = article.createdBy ? userById.get(article.createdBy) : null
      return {
        ...article,
        variation: variationById.get(article.id) ?? null,
        establishmentName: establishment?.name ?? null,
        establishmentCity: establishment?.city ?? null,
        userName: user?.name ?? null,
        userEmail: user?.email ?? null,
      }
    })
  }, [establishmentById, filteredArticles, userById, variationById])

  const columnDefs = useMemo<
    ColDef<
      MarketArticle & {
        variation: number | null
        establishmentName: string | null
        establishmentCity: string | null
        userName: string | null
        userEmail: string | null
      }
    >[]
  >(() => {
    return [
      {
        headerName: "Date",
        field: "date",
        minWidth: 160,
        valueFormatter: ({ value }) => formatDate(value as string | null),
        cellClass: "text-muted-foreground",
      },
      {
        headerName: "Prix unitaire",
        field: "unitPrice",
        minWidth: 140,
        valueFormatter: ({ value }) =>
          value !== null && value !== undefined
            ? currencyFormatter.format(value)
            : "--",
      },
      {
        headerName: "Variation",
        field: "variation",
        minWidth: 120,
        cellRenderer: (
          params: ICellRendererParams<{ variation: number | null }>
        ) => {
          const value = params.value
          const isPositive = typeof value === "number" && value > 0
          const isNegative = typeof value === "number" && value < 0
          const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : null
          const variationTone = isPositive
            ? "text-emerald-500"
            : isNegative
              ? "text-red-500"
              : "text-muted-foreground"
          return (
            <span className={`inline-flex items-center gap-1 text-sm ${variationTone}`}>
              {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
              {typeof value === "number" ? percentFormatter.format(value) : "--"}
            </span>
          )
        },
      },
      {
        headerName: "Quantite",
        field: "quantity",
        minWidth: 110,
        cellClass: "text-right",
        valueFormatter: ({ value }) =>
          value !== null && value !== undefined
            ? numberFormatter.format(value)
            : "--",
      },
      {
        headerName: "Total",
        field: "total",
        minWidth: 120,
        cellClass: "text-right",
        valueFormatter: ({ value }) =>
          value !== null && value !== undefined
            ? currencyFormatter.format(value)
            : "--",
      },
      {
        headerName: "Etablissement",
        field: "establishmentName",
        minWidth: 180,
        cellRenderer: (
          params: ICellRendererParams<{
            establishmentName: string | null
            establishmentCity: string | null
          }>
        ) => (
          <div className="flex flex-col">
            <span className="font-medium">{params.data?.establishmentName ?? "--"}</span>
            <span className="text-xs text-muted-foreground">
              {params.data?.establishmentCity ?? ""}
            </span>
          </div>
        ),
      },
      {
        headerName: "Utilisateur",
        field: "userName",
        minWidth: 180,
        cellRenderer: (
          params: ICellRendererParams<{ userName: string | null; userEmail: string | null }>
        ) => (
          <div className="flex flex-col">
            <span className="font-medium">{params.data?.userName ?? "--"}</span>
            <span className="text-xs text-muted-foreground">
              {params.data?.userEmail ?? ""}
            </span>
          </div>
        ),
      },
      {
        headerName: "Facture",
        field: "invoicePath",
        minWidth: 140,
        cellRenderer: (
          params: ICellRendererParams<{ invoicePath: string | null }>
        ) => {
          const invoicePath = params.data?.invoicePath
          if (!invoicePath) {
            return <span className="text-sm text-muted-foreground">--</span>
          }
          return (
            <Button asChild variant="secondary" size="sm">
              <a href={invoicePath} download>
                Telecharger
              </a>
            </Button>
          )
        },
      },
      {
        headerName: "Statut",
        field: "isActive",
        minWidth: 110,
        cellRenderer: (params: ICellRendererParams<{ isActive: boolean }>) => (
          <Badge variant={params.value ? "default" : "secondary"}>
            {params.value ? "Actif" : "Masque"}
          </Badge>
        ),
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
          <h1 className="text-2xl font-semibold">{masterArticle.name}</h1>
          <p className="text-sm text-muted-foreground">
            {supplier.name} - Unite {masterArticle.unit ?? "--"}
          </p>
        </div>
        <Badge variant={masterArticle.isActive ? "default" : "secondary"}>
          {masterArticle.isActive ? "Visible" : "Masque"}
        </Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Visibilite market article</CardTitle>
          <CardDescription>
            Controlez si cet article est affiche cote utilisateurs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label>Statut</Label>
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
              onClick={() => setDraftActive(masterArticle.isActive)}
              disabled={!hasChanges}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => onUpdateArticle({ isActive: draftActive })}
              disabled={!hasChanges}
            >
              Enregistrer
            </Button>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Nom brut fournisseur</Label>
            <p className="text-sm text-muted-foreground">
              {masterArticle.unformattedName ?? "--"}
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Prix unitaire actuel</Label>
            <p className="text-sm text-muted-foreground">
              {masterArticle.currentUnitPrice !== null &&
              masterArticle.currentUnitPrice !== undefined
                ? currencyFormatter.format(masterArticle.currentUnitPrice)
                : "--"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des prix</CardTitle>
          <CardDescription>
            Variations observees et factures associees pour cet article.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-2">
                  <Label>Debut</Label>
                  <Input
                    type="datetime-local"
                    value={startFilter}
                    onChange={(event) => setStartFilter(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fin</Label>
                  <Input
                    type="datetime-local"
                    value={endFilter}
                    onChange={(event) => setEndFilter(event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setStartFilter("")
                    setEndFilter("")
                  }}
                >
                  Reinitialiser
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => setIsGridFullscreen(true)}
                aria-label="Agrandir le tableau"
              >
                <Expand className="h-4 w-4" />
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>KPI sur periode</CardTitle>
                <CardDescription>
                  Synthese des prix observes sur la periode filtree.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <Label>Prix moyen</Label>
                  <p className="text-sm text-muted-foreground">
                    {periodStats.average !== null
                      ? currencyFormatter.format(periodStats.average)
                      : "--"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Volatilite (min - max)</Label>
                  <p className="text-sm text-muted-foreground">
                    {periodStats.min !== null && periodStats.max !== null
                      ? `${currencyFormatter.format(periodStats.min)} -> ${currencyFormatter.format(
                          periodStats.max
                        )}`
                      : "--"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Variation %</Label>
                  <p className="text-sm text-muted-foreground">
                    {periodStats.deltaPercent !== null
                      ? percentFormatter.format(periodStats.deltaPercent)
                      : "--"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Variation EUR</Label>
                  <p className="text-sm text-muted-foreground">
                    {periodStats.deltaValue !== null
                      ? currencyFormatter.format(periodStats.deltaValue)
                      : "--"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <div style={{ height: 560, width: "100%" }} data-ag-theme-mode="dark">
              <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={marketGridTheme}
                suppressDragLeaveHidesColumns
                domLayout="normal"
              />
            </div>
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
                <h2 className="text-lg font-semibold">Historique des prix</h2>
                <p className="text-sm text-muted-foreground">
                  Variations observees et factures associees pour cet article.
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-2">
                  <Label>Debut</Label>
                  <Input
                    type="datetime-local"
                    value={startFilter}
                    onChange={(event) => setStartFilter(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fin</Label>
                  <Input
                    type="datetime-local"
                    value={endFilter}
                    onChange={(event) => setEndFilter(event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setStartFilter("")
                    setEndFilter("")
                  }}
                >
                  Reinitialiser
                </Button>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    aria-label="Reduire le tableau"
                  >
                    <Shrink className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>KPI sur periode</CardTitle>
                <CardDescription>
                  Synthese des prix observes sur la periode filtree.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <Label>Prix moyen</Label>
                  <p className="text-sm text-muted-foreground">
                    {periodStats.average !== null
                      ? currencyFormatter.format(periodStats.average)
                      : "--"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Volatilite (min - max)</Label>
                  <p className="text-sm text-muted-foreground">
                    {periodStats.min !== null && periodStats.max !== null
                      ? `${currencyFormatter.format(periodStats.min)} -> ${currencyFormatter.format(
                          periodStats.max
                        )}`
                      : "--"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Variation %</Label>
                  <p className="text-sm text-muted-foreground">
                    {periodStats.deltaPercent !== null
                      ? percentFormatter.format(periodStats.deltaPercent)
                      : "--"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Variation EUR</Label>
                  <p className="text-sm text-muted-foreground">
                    {periodStats.deltaValue !== null
                      ? currencyFormatter.format(periodStats.deltaValue)
                      : "--"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="flex-1" data-ag-theme-mode="dark">
              <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={marketGridTheme}
                suppressDragLeaveHidesColumns
                domLayout="normal"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
