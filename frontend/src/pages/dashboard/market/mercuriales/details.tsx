import { useMemo, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community"
import type { ColDef, ICellRendererParams } from "ag-grid-community"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Expand,
  Minus,
  Search,
  Shrink,
  ThumbsUp,
  TriangleAlert,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useTheme } from "@/components/dark/theme-provider"

const mercurialeLabels: Record<string, string> = {
  metro: "Metro France",
  pomona: "Sysco",
  transgourmet: "France Boissons",
}

ModuleRegistry.registerModules([AllCommunityModule])

type MercurialeRow = {
  productId: string
  productName: string
  unitPrice: number | null
  status: "good" | "bad" | null
  vat: number | null
  unit: string
  variation: number | null
}

type MercurialeSnapshot = {
  id: string
  label: string
  periodLabel: string
  updatedAt: string
  prices: Record<string, number>
}

const mercurialeProducts = [
  { id: "tomates", name: "Tomates grappes", unit: "kg", vat: 0.055 },
  { id: "salade", name: "Salade iceberg", unit: "pièce", vat: 0.055 },
  { id: "oignons", name: "Oignons jaunes", unit: "kg", vat: 0.055 },
  { id: "courgettes", name: "Courgettes", unit: "kg", vat: 0.055 },
  { id: "carottes", name: "Carottes", unit: "kg", vat: 0.055 },
  { id: "pdt", name: "Pommes de terre", unit: "kg", vat: 0.055 },
  { id: "ail", name: "Ail pelé", unit: "kg", vat: 0.055 },
  { id: "champignons", name: "Champignons de Paris", unit: "kg", vat: 0.055 },
  { id: "citrons", name: "Citrons", unit: "pièce", vat: 0.055 },
  { id: "persil", name: "Persil plat", unit: "botte", vat: 0.055 },
] as const

const mercurialeSnapshots: MercurialeSnapshot[] = [
  {
    id: "2025-09",
    label: "Du 1 sept. 2025 au 30 sept. 2025",
    periodLabel: "1 sept. 2025 au 30 sept. 2025",
    updatedAt: "12 sept. 2025",
    prices: {
      tomates: 2.45,
      salade: 1.18,
      oignons: 1.62,
      courgettes: 2.12,
      carottes: 1.05,
      pdt: 0.98,
      ail: 4.35,
      champignons: 3.4,
      citrons: 0.42,
      persil: 0.85,
    },
  },
  {
    id: "2025-08",
    label: "Du 1 août 2025 au 31 août 2025",
    periodLabel: "1 août 2025 au 31 août 2025",
    updatedAt: "10 août 2025",
    prices: {
      tomates: 2.32,
      salade: 1.2,
      oignons: 1.54,
      courgettes: 2.18,
      carottes: 1.02,
      pdt: 1.02,
      ail: 4.12,
      champignons: 3.33,
      citrons: 0.46,
      persil: 0.84,
    },
  },
  {
    id: "2025-07",
    label: "Du 1 juil. 2025 au 31 juil. 2025",
    periodLabel: "1 juil. 2025 au 31 juil. 2025",
    updatedAt: "9 juil. 2025",
    prices: {
      tomates: 2.26,
      salade: 1.12,
      oignons: 1.49,
      courgettes: 2.05,
      carottes: 0.98,
      pdt: 1.05,
      ail: 3.98,
      champignons: 3.2,
      citrons: 0.44,
      persil: 0.8,
    },
  },
]

const userPurchasePrices: Record<string, number> = {
  tomates: 2.58,
  salade: 1.14,
  oignons: 1.7,
  courgettes: 2.05,
  carottes: 1.08,
  pdt: 1.04,
  ail: 4.5,
  champignons: 3.4,
  citrons: 0.49,
  persil: 0.86,
}

export default function MarketMercurialesDetailsPage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { id } = useParams()
  const [isGridFullscreen, setIsGridFullscreen] = useState(false)
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(mercurialeSnapshots[0].id)
  const [productSearch, setProductSearch] = useState("")
  const mercurialeLevels = ["STANDARD", "PLUS", "PREMIUM"] as const
  type MercurialeLevel = (typeof mercurialeLevels)[number]
  const mercurialeLevelLabels: Record<MercurialeLevel, string> = {
    STANDARD: "Standard",
    PLUS: "Plus",
    PREMIUM: "Premium",
  }
  const activeLevel = "STANDARD"
  const agThemeMode = theme === "dark" ? "dark" : "light"
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
      }),
    []
  )
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    []
  )
  const normalizedSearchTokens = useMemo(() => {
    const trimmed = productSearch.trim()
    if (!trimmed) return []
    return trimmed
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/\s+/)
      .filter(Boolean)
  }, [productSearch])
  const mercurialeLabel = useMemo(() => {
    if (!id) return "Mercuriale"
    return mercurialeLabels[id] ?? "Mercuriale"
  }, [id])
  const selectedSnapshot = useMemo(() => {
    return (
      mercurialeSnapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ??
      mercurialeSnapshots[0]
    )
  }, [selectedSnapshotId])
  const selectedSnapshotIndex = useMemo(
    () => mercurialeSnapshots.findIndex((snapshot) => snapshot.id === selectedSnapshot.id),
    [selectedSnapshot.id]
  )
  const previousSnapshot = useMemo(() => {
    if (selectedSnapshotIndex < 0) return null
    return mercurialeSnapshots[selectedSnapshotIndex + 1] ?? null
  }, [selectedSnapshotIndex])
  const isOutdatedSnapshot = selectedSnapshotIndex > 0
  const columnDefs = useMemo<ColDef<MercurialeRow>[]>(
    () => [
      {
        headerName: "Produit",
        field: "productName",
        minWidth: 260,
        flex: 2,
      },
      {
        headerName: "Prix unitaire (Standard)",
        field: "unitPrice",
        minWidth: 140,
        valueFormatter: (params) =>
          typeof params.value === "number" ? currencyFormatter.format(params.value) : "--",
      },
      {
        headerName: "Unité",
        field: "unit",
        minWidth: 110,
        cellClass: "text-muted-foreground",
      },
      {
        headerName: "Variation",
        field: "variation",
        minWidth: 130,
        cellRenderer: (params: ICellRendererParams<MercurialeRow, number>) => {
          if (typeof params.value !== "number") return "--"
          const isPositive = params.value > 0
          const isNegative = params.value < 0
          const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : null
          const toneClass = isPositive
            ? "text-green-500"
            : isNegative
              ? "text-red-500"
              : "text-muted-foreground"

          return (
            <span className={`inline-flex items-center gap-1 font-medium ${toneClass}`}>
              {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
              {percentFormatter.format(params.value)}
            </span>
          )
        },
      },
      {
        headerName: "TVA",
        field: "vat",
        minWidth: 110,
        valueFormatter: (params) =>
          typeof params.value === "number" ? percentFormatter.format(params.value) : "--",
      },
      {
        headerName: "Statut",
        field: "status",
        minWidth: 90,
        cellClass: "flex items-center justify-center",
        cellRenderer: (params: ICellRendererParams<MercurialeRow, MercurialeRow["status"]>) => {
          if (params.value === "good") {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="h-6 w-6 justify-center p-0 bg-green-500/15 text-green-500 border-green-500/20 hover:bg-green-500/15 hover:border-green-500/20 cursor-help"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                  Bien joué, vous payez moins cher ce produit que sur la mercuriale.
                </TooltipContent>
              </Tooltip>
            )
          }
          if (params.value === "bad") {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="h-6 w-6 justify-center p-0 bg-red-500/15 text-red-500 border-red-500/20 hover:bg-red-500/15 hover:border-red-500/20 cursor-help"
                  >
                    <TriangleAlert className="h-3.5 w-3.5" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                  Vous surpayez votre produit par rapport à la mercuriale, contactez votre commercial.
                </TooltipContent>
              </Tooltip>
            )
          }
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="h-6 w-6 justify-center p-0 bg-transparent border-transparent text-muted-foreground hover:bg-transparent hover:border-transparent cursor-help"
                >
                  <Minus className="h-3.5 w-3.5" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                Prix aligné à la mercuriale.
              </TooltipContent>
            </Tooltip>
          )
        },
      },
    ],
    [currencyFormatter, percentFormatter]
  )
  const rowData = useMemo<MercurialeRow[]>(() => {
    const normalizedProducts = mercurialeProducts.filter((product) => {
      if (normalizedSearchTokens.length === 0) return true
      const normalizedName = product.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
      return normalizedSearchTokens.every((token) => normalizedName.includes(token))
    })

    return normalizedProducts.map((product) => {
      const unitPrice = selectedSnapshot.prices[product.id] ?? null
      const userPrice = userPurchasePrices[product.id]
      const previousPrice = previousSnapshot?.prices[product.id]
      const variation =
        typeof unitPrice === "number" && typeof previousPrice === "number" && previousPrice > 0
          ? (unitPrice - previousPrice) / previousPrice
          : null
      const status =
        typeof unitPrice === "number" && typeof userPrice === "number"
          ? userPrice < unitPrice
            ? "good"
            : userPrice > unitPrice
              ? "bad"
              : null
          : null

      return {
        productId: product.id,
        productName: product.name,
        unitPrice,
        status,
        vat: product.vat,
        unit: product.unit,
        variation,
      }
    })
  }, [normalizedSearchTokens, previousSnapshot, selectedSnapshot])
  const defaultColDef = useMemo<ColDef<MercurialeRow>>(
    () => ({
      flex: 1,
      minWidth: 160,
      sortable: true,
      resizable: true,
    }),
    []
  )
  return (
    <div className="space-y-4">
      <div className="flex items-stretch gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 self-center"
          onClick={() => navigate("/dashboard/market/mercuriales")}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Retour</span>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{mercurialeLabel}</h1>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour le {selectedSnapshot.updatedAt}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="min-w-[220px] border bg-background shadow-none self-stretch">
              <CardContent className="h-full px-3 py-2 flex items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Votre niveau :</span>
                  <div className="flex items-center gap-2">
                    {mercurialeLevels.map((level) => (
                      <Badge
                        key={level}
                        variant={level === activeLevel ? "default" : "secondary"}
                        className={
                          level === activeLevel
                            ? "px-2 py-0.5 text-xs shadow-sm pointer-events-none"
                            : "px-2 py-0.5 text-xs text-muted-foreground pointer-events-none"
                        }
                      >
                        {mercurialeLevelLabels[level]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={6}
            className="max-w-[260px] text-wrap text-center"
          >
            Le niveau d&apos;accès donne droit à des prix plus ou moins faibles. Il est fixé en
            fonction de votre capacité d&apos;achat.
          </TooltipContent>
        </Tooltip>
      </div>
      <Card className="w-full">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>
              Mercuriale valable du {selectedSnapshot.periodLabel}
            </CardTitle>
            <CardDescription className={isOutdatedSnapshot ? "text-red-500" : undefined}>
              {isOutdatedSnapshot
                ? "Attention : cette mercuriale n’est plus valide."
                : "Consultez les articles négociés pour ce fournisseur."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Rechercher un produit"
                className="w-full pl-9"
              />
            </div>
            <Select value={selectedSnapshotId} onValueChange={setSelectedSnapshotId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mercurialeSnapshots.map((snapshot) => (
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
        <CardContent>
          <div style={{ height: 510, width: "100%" }} data-ag-theme-mode={agThemeMode}>
            <AgGridReact<MercurialeRow>
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
                <h2 className="text-lg font-semibold">
                  Mercuriale valable du {selectedSnapshot.periodLabel}
                </h2>
                <p className={`text-sm ${isOutdatedSnapshot ? "text-red-500" : "text-muted-foreground"}`}>
                  {isOutdatedSnapshot
                    ? "Attention : cette mercuriale n’est plus valide."
                    : "Consultez les articles négociés pour ce fournisseur."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-[220px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Rechercher un produit"
                    className="w-full pl-9"
                  />
                </div>
                <Select value={selectedSnapshotId} onValueChange={setSelectedSnapshotId}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mercurialeSnapshots.map((snapshot) => (
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
                <AgGridReact<MercurialeRow>
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
    </div>
  )
}
