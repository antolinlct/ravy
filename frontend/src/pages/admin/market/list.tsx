import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { MarketMasterArticle, MarketSupplier } from "./types"

type MarketSuppliersListViewProps = {
  suppliers: MarketSupplier[]
  masterArticles: MarketMasterArticle[]
  onOpenSupplier: (supplierId: string) => void
}

const labelDisplay: Record<string, string> = {
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

export function MarketSuppliersListView({
  suppliers,
  masterArticles,
  onOpenSupplier,
}: MarketSuppliersListViewProps) {
  const articleCount = new Map<string, number>()
  masterArticles.forEach((article) => {
    articleCount.set(article.supplierId, (articleCount.get(article.supplierId) ?? 0) + 1)
  })

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-primary">Marche</h1>
        <p className="text-sm text-muted-foreground">
          Vue admin complete des fournisseurs et articles de marche.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Market suppliers</CardTitle>
          <CardDescription>
            Selectionnez un fournisseur pour gerer sa visibilite et ses articles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fournisseur</TableHead>
                <TableHead className="w-32">Label</TableHead>
                <TableHead className="w-28">Statut</TableHead>
                <TableHead className="w-32 text-center">Articles</TableHead>
                <TableHead className="w-36">MAJ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="cursor-pointer"
                  onClick={() => onOpenSupplier(supplier.id)}
                >
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {supplier.label ? labelDisplay[supplier.label] ?? supplier.label : "--"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={supplier.active ? "default" : "secondary"}>
                      {supplier.active ? "Disponible" : "Masque"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {articleCount.get(supplier.id) ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(supplier.updatedAt ?? supplier.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Aucun fournisseur disponible.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
