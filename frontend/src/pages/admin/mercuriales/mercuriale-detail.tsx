"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Check, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type {
  Mercuriale,
  MercurialeArticle,
  MercurialeMasterArticle,
  MercurialeSupplier,
} from "./types"

type MercurialeUpdateInput = {
  name: string
  description?: string
  active: boolean
  effectiveFrom?: string
  effectiveTo?: string
}

type MasterArticleCreateInput = {
  name: string
  unit: string
  vatRate: number
  category: string
  subcategory: string
  raceName?: string
  description?: string
  active: boolean
}

type MercurialeArticleCreateInput = {
  masterArticleId: string
  priceStandard?: number
  pricePlus?: number
  pricePremium?: number
  variation?: number
  active: boolean
}

type MasterArticleUpdateInput = MasterArticleCreateInput
type MercurialeArticleUpdateInput = MercurialeArticleCreateInput

type MercurialeDetailViewProps = {
  supplier: MercurialeSupplier
  mercuriale: Mercuriale
  supplierMercuriales: Mercuriale[]
  allArticles: MercurialeArticle[]
  masterArticles: MercurialeMasterArticle[]
  articles: MercurialeArticle[]
  categoryOptions: string[]
  subcategoryOptions: string[]
  onBack: () => void
  onUpdateMercuriale: (input: MercurialeUpdateInput) => void
  onCreateMasterArticle: (input: MasterArticleCreateInput) => void
  onUpdateMasterArticle: (id: string, input: MasterArticleUpdateInput) => void
  onDeleteMasterArticle: (id: string) => void
  onCreateArticle: (input: MercurialeArticleCreateInput) => void
  onUpdateArticle: (id: string, input: MercurialeArticleUpdateInput) => void
  onRemoveArticle: (articleId: string) => void
}

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
})

const formatPrice = (value?: number | null) =>
  value == null ? "-" : currencyFormatter.format(value)

const formatPercent = (value?: number | null) =>
  value == null ? "-" : percentFormatter.format(value)

const parseOptionalNumber = (value: string) => {
  const normalized = value.replace(",", ".").trim()
  if (!normalized) return undefined
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

const vatOptions = [
  { value: "5.5", label: "5,5%" },
  { value: "10", label: "10%" },
  { value: "20", label: "20%" },
]

export function MercurialeDetailView({
  supplier,
  mercuriale,
  supplierMercuriales,
  allArticles,
  masterArticles,
  articles,
  categoryOptions,
  subcategoryOptions,
  onBack,
  onUpdateMercuriale,
  onCreateMasterArticle,
  onUpdateMasterArticle,
  onDeleteMasterArticle,
  onCreateArticle,
  onUpdateArticle,
  onRemoveArticle,
}: MercurialeDetailViewProps) {
  const safeCategoryOptions = useMemo(() => {
    const options = categoryOptions.length ? categoryOptions : ["Divers"]
    return options.includes("Divers") ? options : ["Divers", ...options]
  }, [categoryOptions])

  const safeSubcategoryOptions = useMemo(() => {
    const options = subcategoryOptions.length ? subcategoryOptions : ["Divers"]
    return options.includes("Divers") ? options : ["Divers", ...options]
  }, [subcategoryOptions])

  const [draftName, setDraftName] = useState(mercuriale.name)
  const [draftDescription, setDraftDescription] = useState(
    mercuriale.description ?? ""
  )
  const [draftActive, setDraftActive] = useState(mercuriale.active)
  const [draftFrom, setDraftFrom] = useState(mercuriale.effectiveFrom ?? "")
  const [draftTo, setDraftTo] = useState(mercuriale.effectiveTo ?? "")

  const [masterDialogOpen, setMasterDialogOpen] = useState(false)
  const [masterName, setMasterName] = useState("")
  const [masterUnit, setMasterUnit] = useState("")
  const [masterVat, setMasterVat] = useState("")
  const [masterCategory, setMasterCategory] = useState<string | undefined>(
    undefined
  )
  const [masterSubcategory, setMasterSubcategory] = useState<
    string | undefined
  >(undefined)
  const [masterRaceName, setMasterRaceName] = useState("")
  const [masterDescription, setMasterDescription] = useState("")
  const [masterActive, setMasterActive] = useState(true)
  const [masterEditOpen, setMasterEditOpen] = useState(false)
  const [masterEditId, setMasterEditId] = useState<string | null>(null)
  const [masterEditName, setMasterEditName] = useState("")
  const [masterEditUnit, setMasterEditUnit] = useState("")
  const [masterEditVat, setMasterEditVat] = useState("")
  const [masterEditCategory, setMasterEditCategory] = useState<
    string | undefined
  >(undefined)
  const [masterEditSubcategory, setMasterEditSubcategory] = useState<
    string | undefined
  >(undefined)
  const [masterEditRaceName, setMasterEditRaceName] = useState("")
  const [masterEditDescription, setMasterEditDescription] = useState("")
  const [masterEditActive, setMasterEditActive] = useState(true)
  const [masterDeleteOpen, setMasterDeleteOpen] = useState(false)
  const [masterDeleteId, setMasterDeleteId] = useState<string | null>(null)

  const [articleDialogOpen, setArticleDialogOpen] = useState(false)
  const [articleMasterId, setArticleMasterId] = useState("")
  const [articleStandard, setArticleStandard] = useState("")
  const [articlePlus, setArticlePlus] = useState("")
  const [articlePremium, setArticlePremium] = useState("")
  const [articleActive, setArticleActive] = useState(true)
  const [articleMasterOpen, setArticleMasterOpen] = useState(false)
  const [articleEditOpen, setArticleEditOpen] = useState(false)
  const [articleEditId, setArticleEditId] = useState<string | null>(null)
  const [articleEditMasterId, setArticleEditMasterId] = useState("")
  const [articleEditStandard, setArticleEditStandard] = useState("")
  const [articleEditPlus, setArticleEditPlus] = useState("")
  const [articleEditPremium, setArticleEditPremium] = useState("")
  const [articleEditActive, setArticleEditActive] = useState(true)
  const [articleEditMasterOpen, setArticleEditMasterOpen] = useState(false)

  useEffect(() => {
    setDraftName(mercuriale.name)
    setDraftDescription(mercuriale.description ?? "")
    setDraftActive(mercuriale.active)
    setDraftFrom(mercuriale.effectiveFrom ?? "")
    setDraftTo(mercuriale.effectiveTo ?? "")
  }, [mercuriale])

  const hasMercurialeChanges = useMemo(() => {
    return (
      draftName !== mercuriale.name ||
      draftDescription !== (mercuriale.description ?? "") ||
      draftActive !== mercuriale.active ||
      draftFrom !== (mercuriale.effectiveFrom ?? "") ||
      draftTo !== (mercuriale.effectiveTo ?? "")
    )
  }, [draftName, draftDescription, draftActive, draftFrom, draftTo, mercuriale])

  const masterById = useMemo(() => {
    return new Map(masterArticles.map((article) => [article.id, article]))
  }, [masterArticles])

  const sortedSupplierMercuriales = useMemo(() => {
    const toKey = (value?: string | null) => {
      if (!value) return Number.POSITIVE_INFINITY
      const parsed = Date.parse(value)
      return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed
    }

    return [...supplierMercuriales].sort(
      (a, b) =>
        toKey(a.effectiveFrom ?? a.updatedAt) -
        toKey(b.effectiveFrom ?? b.updatedAt)
    )
  }, [supplierMercuriales])

  const previousMercuriale = useMemo(() => {
    const index = sortedSupplierMercuriales.findIndex(
      (row) => row.id === mercuriale.id
    )
    return index > 0 ? sortedSupplierMercuriales[index - 1] : null
  }, [sortedSupplierMercuriales, mercuriale.id])

  const previousPricesByMasterId = useMemo(() => {
    const map = new Map<string, number | null>()
    if (!previousMercuriale) return map
    for (const row of allArticles) {
      if (row.mercurialeId !== previousMercuriale.id) continue
      map.set(row.masterArticleId, row.priceStandard ?? null)
    }
    return map
  }, [previousMercuriale, allArticles])

  const computeVariation = (masterId: string, priceValue: string) => {
    const currentPrice = parseOptionalNumber(priceValue)
    if (currentPrice == null) return null
    if (!previousMercuriale) return null
    const previousPrice = previousPricesByMasterId.get(masterId) ?? null
    if (previousPrice == null || previousPrice === 0) return null
    return (currentPrice - previousPrice) / previousPrice
  }

  const computeVariationValue = (masterId: string, price?: number | null) => {
    if (price == null) return null
    if (!previousMercuriale) return null
    const previousPrice = previousPricesByMasterId.get(masterId) ?? null
    if (previousPrice == null || previousPrice === 0) return null
    return (price - previousPrice) / previousPrice
  }

  const computedVariation = useMemo(
    () => computeVariation(articleMasterId, articleStandard),
    [articleMasterId, articleStandard, previousMercuriale, previousPricesByMasterId]
  )

  const variationLabel =
    computedVariation == null ? "-%" : percentFormatter.format(computedVariation)

  const variationTone =
    computedVariation == null ? "text-muted-foreground" : "text-foreground"

  const editComputedVariation = useMemo(
    () => computeVariation(articleEditMasterId, articleEditStandard),
    [
      articleEditMasterId,
      articleEditStandard,
      previousMercuriale,
      previousPricesByMasterId,
    ]
  )

  const editVariationLabel =
    editComputedVariation == null
      ? "-%"
      : percentFormatter.format(editComputedVariation)

  const editVariationTone =
    editComputedVariation == null ? "text-muted-foreground" : "text-foreground"

  const sortedMasterArticles = useMemo(() => {
    return [...masterArticles].sort((a, b) =>
      a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
    )
  }, [masterArticles])

  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      const nameA = masterById.get(a.masterArticleId)?.name ?? ""
      const nameB = masterById.get(b.masterArticleId)?.name ?? ""
      if (!nameA && !nameB) return a.id.localeCompare(b.id)
      if (!nameA) return 1
      if (!nameB) return -1
      return nameA.localeCompare(nameB, "fr", { sensitivity: "base" })
    })
  }, [articles, masterById])

  const handleSaveMercuriale = () => {
    onUpdateMercuriale({
      name: draftName.trim() || mercuriale.name,
      description: draftDescription.trim() || undefined,
      active: draftActive,
      effectiveFrom: draftFrom || undefined,
      effectiveTo: draftTo || undefined,
    })
  }

  const resetMercuriale = () => {
    setDraftName(mercuriale.name)
    setDraftDescription(mercuriale.description ?? "")
    setDraftActive(mercuriale.active)
    setDraftFrom(mercuriale.effectiveFrom ?? "")
    setDraftTo(mercuriale.effectiveTo ?? "")
  }

  const handleCreateMasterArticle = () => {
    if (!masterName.trim() || !masterUnit.trim()) return
    const vatRate = parseOptionalNumber(masterVat) ?? 0
    onCreateMasterArticle({
      name: masterName.trim(),
      unit: masterUnit.trim(),
      vatRate,
      category: masterCategory?.trim() || "Divers",
      subcategory: masterSubcategory?.trim() || "Divers",
      raceName: masterRaceName.trim() || undefined,
      description: masterDescription.trim() || undefined,
      active: masterActive,
    })
    setMasterName("")
    setMasterUnit("")
    setMasterVat("")
    setMasterCategory(undefined)
    setMasterSubcategory(undefined)
    setMasterRaceName("")
    setMasterDescription("")
    setMasterActive(true)
    setMasterDialogOpen(false)
  }

  const handleOpenMasterEdit = (master: MercurialeMasterArticle) => {
    setMasterEditId(master.id)
    setMasterEditName(master.name)
    setMasterEditUnit(master.unit)
    setMasterEditVat(String(master.vatRate))
    setMasterEditCategory(master.category)
    setMasterEditSubcategory(master.subcategory)
    setMasterEditRaceName(master.raceName ?? "")
    setMasterEditDescription(master.description ?? "")
    setMasterEditActive(master.active)
    setMasterEditOpen(true)
  }

  const handleSaveMasterEdit = () => {
    if (!masterEditId) return
    const vatRate = parseOptionalNumber(masterEditVat) ?? 0
    onUpdateMasterArticle(masterEditId, {
      name: masterEditName.trim() || "Master article",
      unit: masterEditUnit.trim() || "u",
      vatRate,
      category: masterEditCategory?.trim() || "Divers",
      subcategory: masterEditSubcategory?.trim() || "Divers",
      raceName: masterEditRaceName.trim() || undefined,
      description: masterEditDescription.trim() || undefined,
      active: masterEditActive,
    })
    setMasterEditOpen(false)
  }

  const handleConfirmDeleteMaster = () => {
    if (!masterDeleteId) return
    onDeleteMasterArticle(masterDeleteId)
    setMasterDeleteId(null)
    setMasterDeleteOpen(false)
  }

  const handleCreateArticle = () => {
    if (!articleMasterId) return
    onCreateArticle({
      masterArticleId: articleMasterId,
      priceStandard: parseOptionalNumber(articleStandard),
      pricePlus: parseOptionalNumber(articlePlus),
      pricePremium: parseOptionalNumber(articlePremium),
      variation: computedVariation ?? undefined,
      active: articleActive,
    })
    setArticleMasterId("")
    setArticleStandard("")
    setArticlePlus("")
    setArticlePremium("")
    setArticleActive(true)
    setArticleDialogOpen(false)
  }

  const handleOpenArticleEdit = (article: MercurialeArticle) => {
    setArticleEditId(article.id)
    setArticleEditMasterId(article.masterArticleId)
    setArticleEditStandard(article.priceStandard?.toString() ?? "")
    setArticleEditPlus(article.pricePlus?.toString() ?? "")
    setArticleEditPremium(article.pricePremium?.toString() ?? "")
    setArticleEditActive(article.active)
    setArticleEditMasterOpen(false)
    setArticleEditOpen(true)
  }

  const handleSaveArticleEdit = () => {
    if (!articleEditId || !articleEditMasterId) return
    onUpdateArticle(articleEditId, {
      masterArticleId: articleEditMasterId,
      priceStandard: parseOptionalNumber(articleEditStandard),
      pricePlus: parseOptionalNumber(articleEditPlus),
      pricePremium: parseOptionalNumber(articleEditPremium),
      variation: editComputedVariation ?? undefined,
      active: articleEditActive,
    })
    setArticleEditOpen(false)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-semibold">{mercuriale.name}</h1>
          <p className="text-sm text-muted-foreground">
            {supplier.name} - {mercuriale.effectiveFrom ?? "--"} {"->"}{" "}
            {mercuriale.effectiveTo ?? "--"}
          </p>
        </div>
        <Badge variant={mercuriale.active ? "default" : "secondary"}>
          {mercuriale.active ? "Active" : "Inactive"}
        </Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Parametres mercuriale</CardTitle>
          <CardDescription>
            Mettre a jour le libelle et la periode.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="merc-name">Nom</Label>
              <Input
                id="merc-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="merc-from">Debut</Label>
              <Input
                id="merc-from"
                type="date"
                value={draftFrom}
                onChange={(event) => setDraftFrom(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="merc-to">Fin</Label>
              <Input
                id="merc-to"
                type="date"
                value={draftTo}
                onChange={(event) => setDraftTo(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="merc-active">Statut</Label>
              <div className="flex h-9 items-center justify-between rounded-md border px-3">
                <span className="text-sm text-muted-foreground">
                  {draftActive ? "Active" : "Inactive"}
                </span>
                <Switch
                  id="merc-active"
                  checked={draftActive}
                  onCheckedChange={setDraftActive}
                />
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="merc-desc">Description</Label>
            <Textarea
              id="merc-desc"
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleSaveMercuriale}
              disabled={!hasMercurialeChanges}
            >
              Enregistrer
            </Button>
            {hasMercurialeChanges ? (
              <Button type="button" variant="ghost" onClick={resetMercuriale}>
                Annuler
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start gap-3">
            <div className="space-y-1">
              <CardTitle>Master articles du fournisseur</CardTitle>
              <CardDescription>
                Catalogue partage entre toutes les mercuriales.
              </CardDescription>
            </div>
            <div className="ml-auto">
              <Dialog open={masterDialogOpen} onOpenChange={setMasterDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary">
                    Nouveau master article
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nouveau master article</DialogTitle>
                <DialogDescription>
                  Completez les informations principales.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="master-name">Nom</Label>
                  <Input
                    id="master-name"
                    value={masterName}
                    onChange={(event) => setMasterName(event.target.value)}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="master-unit">Unite</Label>
                    <Input
                      id="master-unit"
                      value={masterUnit}
                      onChange={(event) => setMasterUnit(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="master-vat">TVA</Label>
                    <Select value={masterVat} onValueChange={setMasterVat}>
                      <SelectTrigger id="master-vat">
                        <SelectValue placeholder="Choisir un taux" />
                      </SelectTrigger>
                      <SelectContent>
                        {vatOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="master-category">Categorie</Label>
                    <Select
                      value={masterCategory}
                      onValueChange={setMasterCategory}
                    >
                      <SelectTrigger id="master-category">
                        <SelectValue placeholder="Categorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {safeCategoryOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="master-subcategory">Sous-categorie</Label>
                    <Select
                      value={masterSubcategory}
                      onValueChange={setMasterSubcategory}
                    >
                      <SelectTrigger id="master-subcategory">
                        <SelectValue placeholder="Sous-categorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {safeSubcategoryOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="master-race">race_name</Label>
                  <Input
                    id="master-race"
                    value={masterRaceName}
                    onChange={(event) => setMasterRaceName(event.target.value)}
                    placeholder="Optionnel"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="master-description">description</Label>
                  <Textarea
                    id="master-description"
                    value={masterDescription}
                    onChange={(event) => setMasterDescription(event.target.value)}
                    rows={2}
                    className="min-h-[64px] resize-none"
                    placeholder="Optionnel"
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Actif</p>
                    <p className="text-xs text-muted-foreground">
                      Utilisable dans les mercuriales.
                    </p>
                  </div>
                  <Switch checked={masterActive} onCheckedChange={setMasterActive} />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setMasterDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="button" onClick={handleCreateMasterArticle}>
                  Creer
                </Button>
              </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <Dialog open={masterEditOpen} onOpenChange={setMasterEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier le master article</DialogTitle>
              <DialogDescription>
                Mettez a jour les informations du master article.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="master-edit-name">Nom</Label>
                <Input
                  id="master-edit-name"
                  value={masterEditName}
                  onChange={(event) => setMasterEditName(event.target.value)}
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="master-edit-unit">Unite</Label>
                  <Input
                    id="master-edit-unit"
                    value={masterEditUnit}
                    onChange={(event) => setMasterEditUnit(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="master-edit-vat">TVA</Label>
                  <Select value={masterEditVat} onValueChange={setMasterEditVat}>
                    <SelectTrigger id="master-edit-vat">
                      <SelectValue placeholder="Choisir un taux" />
                    </SelectTrigger>
                    <SelectContent>
                      {vatOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="master-edit-category">Categorie</Label>
                  <Select
                    value={masterEditCategory}
                    onValueChange={setMasterEditCategory}
                  >
                    <SelectTrigger id="master-edit-category">
                      <SelectValue placeholder="Choisir une categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {safeCategoryOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="master-edit-subcategory">Sous-categorie</Label>
                  <Select
                    value={masterEditSubcategory}
                    onValueChange={setMasterEditSubcategory}
                  >
                    <SelectTrigger id="master-edit-subcategory">
                      <SelectValue placeholder="Choisir une sous-categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {safeSubcategoryOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="master-edit-race">race_name</Label>
                <Input
                  id="master-edit-race"
                  value={masterEditRaceName}
                  onChange={(event) => setMasterEditRaceName(event.target.value)}
                  placeholder="Optionnel"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="master-edit-description">description</Label>
                <Textarea
                  id="master-edit-description"
                  value={masterEditDescription}
                  onChange={(event) =>
                    setMasterEditDescription(event.target.value)
                  }
                  rows={2}
                  className="min-h-[64px] resize-none"
                  placeholder="Optionnel"
                />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Actif</p>
                  <p className="text-xs text-muted-foreground">
                    Utilisable dans les mercuriales.
                  </p>
                </div>
                <Switch
                  checked={masterEditActive}
                  onCheckedChange={setMasterEditActive}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setMasterEditOpen(false)}
              >
                Annuler
              </Button>
              <Button type="button" onClick={handleSaveMasterEdit}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog
          open={masterDeleteOpen}
          onOpenChange={(open) => {
            setMasterDeleteOpen(open)
            if (!open) {
              setMasterDeleteId(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le master article</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est definitive. Les articles lies a ce master
                seront supprimes de la mercuriale.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteMaster}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <CardContent>
          <div className="max-h-[460px] overflow-y-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead className="w-20">Unite</TableHead>
                <TableHead className="w-16">TVA</TableHead>
                <TableHead className="w-32">Categorie</TableHead>
                <TableHead className="w-32">Sous-cat.</TableHead>
                <TableHead className="w-20">Statut</TableHead>
                <TableHead className="w-32 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMasterArticles.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.unit}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.vatRate}%
                  </TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.subcategory}</TableCell>
                  <TableCell>
                    <Badge variant={row.active ? "default" : "secondary"}>
                      {row.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenMasterEdit(row)}
                      >
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMasterDeleteId(row.id)
                          setMasterDeleteOpen(true)
                        }}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {masterArticles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Aucun master article disponible.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start gap-3">
            <div className="space-y-1">
              <CardTitle>Articles de la mercuriale</CardTitle>
              <CardDescription>
                Ajouter ou retirer des articles de la periode.
              </CardDescription>
            </div>
            <div className="ml-auto">
              <Dialog open={articleDialogOpen} onOpenChange={setArticleDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">Ajouter un article</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un article</DialogTitle>
                <DialogDescription>
                  Selectionnez un master article et renseignez les prix.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Master article</Label>
                  <Popover
                    open={articleMasterOpen}
                    onOpenChange={setArticleMasterOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={articleMasterOpen}
                        className="w-full justify-between"
                      >
                        {articleMasterId
                          ? sortedMasterArticles.find(
                              (master) => master.id === articleMasterId
                            )?.name
                          : "Choisir un master article"}
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Rechercher un master article..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>Aucun master article.</CommandEmpty>
                          <CommandGroup>
                            {sortedMasterArticles.map((master) => (
                              <CommandItem
                                key={master.id}
                                value={master.name}
                                onSelect={(value) => {
                                  const selected = sortedMasterArticles.find(
                                    (item) =>
                                      item.name.toLowerCase() ===
                                      value.toLowerCase()
                                  )
                                  const next =
                                    selected?.id === articleMasterId
                                      ? ""
                                      : selected?.id ?? ""
                                  setArticleMasterId(next)
                                  setArticleMasterOpen(false)
                                }}
                              >
                                {master.name}
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    articleMasterId === master.id
                                      ? "opacity-100"
                                      : "opacity-0"
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
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="price-standard">Prix standard</Label>
                    <Input
                      id="price-standard"
                      type="number"
                      step="0.01"
                      value={articleStandard}
                      onChange={(event) => setArticleStandard(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price-plus">Prix plus</Label>
                    <Input
                      id="price-plus"
                      type="number"
                      step="0.01"
                      value={articlePlus}
                      onChange={(event) => setArticlePlus(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price-premium">Prix premium</Label>
                    <Input
                      id="price-premium"
                      type="number"
                      step="0.01"
                      value={articlePremium}
                      onChange={(event) => setArticlePremium(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price-variation">Variation</Label>
                    <div className="flex h-9 items-center rounded-md border px-3 text-sm">
                      <span className={variationTone}>{variationLabel}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Actif</p>
                    <p className="text-xs text-muted-foreground">
                      Rendre l'article disponible.
                    </p>
                  </div>
                  <Switch checked={articleActive} onCheckedChange={setArticleActive} />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setArticleDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="button" onClick={handleCreateArticle}>
                  Ajouter
                </Button>
              </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <Dialog open={articleEditOpen} onOpenChange={setArticleEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier un article</DialogTitle>
              <DialogDescription>
                Mettez a jour les informations de l'article.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Master article</Label>
                <Popover
                  open={articleEditMasterOpen}
                  onOpenChange={setArticleEditMasterOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={articleEditMasterOpen}
                      className="w-full justify-between"
                    >
                      {articleEditMasterId
                        ? sortedMasterArticles.find(
                            (master) => master.id === articleEditMasterId
                          )?.name
                        : "Choisir un master article"}
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Rechercher un master article..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>Aucun master article.</CommandEmpty>
                        <CommandGroup>
                          {sortedMasterArticles.map((master) => (
                            <CommandItem
                              key={master.id}
                              value={master.name}
                              onSelect={(value) => {
                                const selected = sortedMasterArticles.find(
                                  (item) =>
                                    item.name.toLowerCase() ===
                                    value.toLowerCase()
                                )
                                const next =
                                  selected?.id === articleEditMasterId
                                    ? ""
                                    : selected?.id ?? ""
                                setArticleEditMasterId(next)
                                setArticleEditMasterOpen(false)
                              }}
                            >
                              {master.name}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  articleEditMasterId === master.id
                                    ? "opacity-100"
                                    : "opacity-0"
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
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price-standard">Prix standard</Label>
                  <Input
                    id="edit-price-standard"
                    type="number"
                    step="0.01"
                    value={articleEditStandard}
                    onChange={(event) =>
                      setArticleEditStandard(event.target.value)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-price-plus">Prix plus</Label>
                  <Input
                    id="edit-price-plus"
                    type="number"
                    step="0.01"
                    value={articleEditPlus}
                    onChange={(event) => setArticleEditPlus(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-price-premium">Prix premium</Label>
                  <Input
                    id="edit-price-premium"
                    type="number"
                    step="0.01"
                    value={articleEditPremium}
                    onChange={(event) =>
                      setArticleEditPremium(event.target.value)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-variation">Variation</Label>
                  <div className="flex h-9 items-center rounded-md border px-3 text-sm">
                    <span className={editVariationTone}>
                      {editVariationLabel}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Actif</p>
                  <p className="text-xs text-muted-foreground">
                    Rendre l'article disponible.
                  </p>
                </div>
                <Switch
                  checked={articleEditActive}
                  onCheckedChange={setArticleEditActive}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setArticleEditOpen(false)}
              >
                Annuler
              </Button>
              <Button type="button" onClick={handleSaveArticleEdit}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <CardContent>
          <div className="max-h-[460px] overflow-y-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead className="w-20">Unite</TableHead>
                <TableHead className="w-16">TVA</TableHead>
                <TableHead className="w-32">Standard</TableHead>
                <TableHead className="w-32">Plus</TableHead>
                <TableHead className="w-32">Premium</TableHead>
                <TableHead className="w-24">Variation</TableHead>
                <TableHead className="w-20">Statut</TableHead>
                <TableHead className="w-32 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedArticles.map((row) => {
                const master = masterById.get(row.masterArticleId)
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {master?.name ?? "Master article supprime"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {master?.unit ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {master ? `${master.vatRate}%` : "-"}
                    </TableCell>
                    <TableCell>{formatPrice(row.priceStandard)}</TableCell>
                    <TableCell>{formatPrice(row.pricePlus)}</TableCell>
                    <TableCell>{formatPrice(row.pricePremium)}</TableCell>
                  <TableCell>
                    {formatPercent(
                      computeVariationValue(row.masterArticleId, row.priceStandard)
                    )}
                  </TableCell>
                    <TableCell>
                      <Badge variant={row.active ? "default" : "secondary"}>
                        {row.active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenArticleEdit(row)}
                        >
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveArticle(row.id)}
                        >
                          Retirer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {articles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Aucun article associe a cette mercuriale.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
