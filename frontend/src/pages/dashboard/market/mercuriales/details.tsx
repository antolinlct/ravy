import { useEffect, useMemo, useState } from "react"
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community"
import type { ColDef, ICellRendererParams } from "ag-grid-community"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ArrowDown,
  ArrowUp,
  Minus,
  ThumbsUp,
  TriangleAlert,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useTheme } from "@/components/dark/theme-provider"
import { useEstablishment } from "@/context/EstablishmentContext"
import { useUserMercurialeAccess } from "@/context/UserMercurialeAccessContext"
import { useMarketOverviewData } from "../purchases/api"
import { useMercurialeSupplierData } from "./api"
import MercurialeDetailsHeader from "./components/MercurialeDetailsHeader"
import MercurialeTableCard from "./components/MercurialeTableCard"
import type { Mercuriale, MercurialeArticle } from "./types"

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

type MercurialeLevel = "STANDARD" | "PLUS" | "PREMIUM"

const mercurialeLevels: MercurialeLevel[] = ["STANDARD", "PLUS", "PREMIUM"]
const mercurialeLevelLabels: Record<MercurialeLevel, string> = {
  STANDARD: "Standard",
  PLUS: "Plus",
  PREMIUM: "Premium",
}

const parseDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const dateLabelFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const formatDateLabel = (date: Date) => {
  const label = dateLabelFormatter.format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const formatRangeLabel = (start: Date | null, end: Date | null, capitalizeDu: boolean) => {
  const startLabel = start ? formatDateLabel(start) : "--"
  const endLabel = end ? formatDateLabel(end) : "--"
  return `${capitalizeDu ? "Du" : "du"} ${startLabel} au ${endLabel}`
}

const getArticlePrice = (article: MercurialeArticle, level: MercurialeLevel) => {
  if (level === "PREMIUM") {
    return article.price_premium ?? article.price_plus ?? article.price_standard ?? null
  }
  if (level === "PLUS") {
    return article.price_plus ?? article.price_standard ?? null
  }
  return article.price_standard ?? null
}

const getMercurialeSortKey = (item: Mercuriale) => {
  return (
    parseDate(item.effective_from) ??
    parseDate(item.created_at) ??
    parseDate(item.updated_at) ??
    parseDate(item.effective_to) ??
    new Date(0)
  )
}

export default function MarketMercurialesDetailsPage() {
  const navigate = useNavigate()
  const { theme = "system" } = useTheme()
  const { estId } = useEstablishment()
  const access = useUserMercurialeAccess()
  const activeLevel = (access?.level ?? "STANDARD") as MercurialeLevel
  const { id } = useParams()

  const [selectedSnapshotId, setSelectedSnapshotId] = useState("")
  const [productSearch, setProductSearch] = useState("")

  const { supplier, mercuriales, masterArticles, articles, isLoading, error } =
    useMercurialeSupplierData(id)

  const sortedMercuriales = useMemo(() => {
    return mercuriales
      .slice()
      .sort((a, b) => getMercurialeSortKey(b).getTime() - getMercurialeSortKey(a).getTime())
  }, [mercuriales])

  useEffect(() => {
    if (!sortedMercuriales.length) return
    if (sortedMercuriales.some((item) => item.id === selectedSnapshotId)) return
    setSelectedSnapshotId(sortedMercuriales[0].id)
  }, [selectedSnapshotId, sortedMercuriales])

  const selectedMercuriale = useMemo(() => {
    return sortedMercuriales.find((item) => item.id === selectedSnapshotId) ?? null
  }, [selectedSnapshotId, sortedMercuriales])

  const selectedSnapshotIndex = useMemo(() => {
    if (!selectedMercuriale) return -1
    return sortedMercuriales.findIndex((item) => item.id === selectedMercuriale.id)
  }, [selectedMercuriale, sortedMercuriales])

  const previousMercuriale = useMemo(() => {
    if (selectedSnapshotIndex < 0) return null
    return sortedMercuriales[selectedSnapshotIndex + 1] ?? null
  }, [selectedSnapshotIndex, sortedMercuriales])

  const selectedStart = parseDate(selectedMercuriale?.effective_from)
  const selectedEnd = parseDate(selectedMercuriale?.effective_to)
  const selectedRangeLabel = formatRangeLabel(selectedStart, selectedEnd, false)
  const selectedRangeLabelUpper = formatRangeLabel(selectedStart, selectedEnd, true)

  const snapshotOptions = useMemo(
    () =>
      sortedMercuriales.map((snapshot) => {
        const start = parseDate(snapshot.effective_from)
        const end = parseDate(snapshot.effective_to)
        return {
          id: snapshot.id,
          label: formatRangeLabel(start, end, true),
        }
      }),
    [sortedMercuriales]
  )

  const updatedAtLabel = useMemo(() => {
    const updatedAt =
      parseDate(selectedMercuriale?.updated_at) ??
      parseDate(selectedMercuriale?.created_at) ??
      parseDate(selectedMercuriale?.effective_from) ??
      parseDate(selectedMercuriale?.effective_to)
    return updatedAt ? formatDateLabel(updatedAt) : "--"
  }, [selectedMercuriale])

  const isOutdatedSnapshot = selectedSnapshotIndex > 0

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

  const masterArticlesById = useMemo(() => {
    return new Map(masterArticles.map((item) => [item.id, item]))
  }, [masterArticles])

  const selectedArticles = useMemo(() => {
    if (!selectedMercuriale) return []
    return articles.filter((item) => item.mercuriale_id === selectedMercuriale.id)
  }, [articles, selectedMercuriale])

  const previousArticlesByMasterId = useMemo(() => {
    if (!previousMercuriale) return new Map<string, MercurialeArticle>()
    return new Map(
      articles
        .filter((item) => item.mercuriale_id === previousMercuriale.id)
        .map((item) => [item.mercurial_master_article_id, item])
    )
  }, [articles, previousMercuriale])

  const marketSupplierId = supplier?.market_supplier_id ?? null
  const shouldLoadMarketOverview = Boolean(estId && marketSupplierId)
  const { userByProductId, isLoading: isMarketLoading } = useMarketOverviewData({
    establishmentId: shouldLoadMarketOverview ? estId ?? "" : "",
    supplierId: shouldLoadMarketOverview ? marketSupplierId ?? undefined : undefined,
    startDate: shouldLoadMarketOverview ? selectedStart ?? undefined : undefined,
    endDate: shouldLoadMarketOverview ? selectedEnd ?? undefined : undefined,
  })

  const tableStatus = useMemo(() => {
    if (isLoading) return { tone: "text-muted-foreground", label: "Chargement de la mercuriale..." }
    if (error) return { tone: "text-destructive", label: error }
    if (!supplier) {
      return { tone: "text-destructive", label: "Fournisseur introuvable." }
    }
    if (!selectedMercuriale) {
      return { tone: "text-muted-foreground", label: "Aucune mercuriale disponible." }
    }
    if (isMarketLoading && shouldLoadMarketOverview) {
      return { tone: "text-muted-foreground", label: "Chargement des prix utilisateur..." }
    }
    return null
  }, [error, isLoading, isMarketLoading, selectedMercuriale, shouldLoadMarketOverview, supplier])

  const rowData = useMemo<MercurialeRow[]>(() => {
    const rows = selectedArticles
      .map((article) => {
        const master = masterArticlesById.get(article.mercurial_master_article_id)
        if (!master) return null
        const productName = master.name ?? "Produit"
        if (normalizedSearchTokens.length > 0) {
          const normalizedName = productName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
          if (!normalizedSearchTokens.every((token) => normalizedName.includes(token))) {
            return null
          }
        }

        const unitPrice = getArticlePrice(article, activeLevel)
        const previousArticle = previousArticlesByMasterId.get(article.mercurial_master_article_id)
        const previousPrice = previousArticle ? getArticlePrice(previousArticle, activeLevel) : null
        const variation =
          typeof unitPrice === "number" &&
          typeof previousPrice === "number" &&
          previousPrice > 0
            ? (unitPrice - previousPrice) / previousPrice
            : null

        const marketMasterId = master.market_master_article
        const userPrice = marketMasterId ? userByProductId[marketMasterId]?.user_avg_unit_price : null
        const status =
          typeof unitPrice === "number" && typeof userPrice === "number"
            ? userPrice < unitPrice
              ? "good"
              : userPrice > unitPrice
                ? "bad"
                : null
            : null

        return {
          productId: master.id,
          productName,
          unitPrice,
          status,
          vat: master.vat_rate ?? null,
          unit: master.unit ?? "—",
          variation,
        }
      })
      .filter((item): item is MercurialeRow => Boolean(item))

    return rows.sort((a, b) => a.productName.localeCompare(b.productName, "fr"))
  }, [
    activeLevel,
    masterArticlesById,
    normalizedSearchTokens,
    previousArticlesByMasterId,
    selectedArticles,
    userByProductId,
  ])

  const agThemeMode = useMemo<"light" | "dark">(() => {
    if (theme === "system") {
      if (typeof window === "undefined") return "light"
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return theme === "dark" ? "dark" : "light"
  }, [theme])

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

  const priceColumnLabel = useMemo(
    () => `Prix unitaire (${mercurialeLevelLabels[activeLevel]})`,
    [activeLevel]
  )

  const columnDefs = useMemo<ColDef<MercurialeRow>[]>(
    () => [
      {
        headerName: "Produit",
        field: "productName",
        minWidth: 260,
        flex: 2,
      },
      {
        headerName: priceColumnLabel,
        field: "unitPrice",
        minWidth: 160,
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
                    className="h-6 w-6 justify-center p-0 bg-green-500/15 text-green-500 border-green-500/20 cursor-help"
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
                    className="h-6 w-6 justify-center p-0 bg-red-500/15 text-red-500 border-red-500/20 cursor-help"
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
                  className="h-6 w-6 justify-center p-0 bg-transparent border-transparent text-muted-foreground cursor-help"
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
    [currencyFormatter, percentFormatter, priceColumnLabel]
  )

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
      <MercurialeDetailsHeader
        supplierName={supplier?.name ?? "Mercuriale"}
        updatedAtLabel={updatedAtLabel}
        activeLevel={activeLevel}
        levels={mercurialeLevels}
        levelLabels={mercurialeLevelLabels}
        onBack={() => navigate("/dashboard/market/mercuriales")}
      />
      <MercurialeTableCard<MercurialeRow>
        selectedRangeLabel={selectedRangeLabel}
        selectedRangeLabelUpper={selectedRangeLabelUpper}
        isOutdatedSnapshot={isOutdatedSnapshot}
        productSearch={productSearch}
        onProductSearchChange={setProductSearch}
        selectedSnapshotId={selectedSnapshotId}
        onSnapshotChange={setSelectedSnapshotId}
        snapshotOptions={snapshotOptions}
        tableStatus={tableStatus}
        agThemeMode={agThemeMode}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
      />
    </div>
  )
}
