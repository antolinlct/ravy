import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProductDetailPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Analyses produits</h1>
          <p className="text-sm text-muted-foreground">
            Suivez la performance de vos produits en détail.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs defaultValue="detail" className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger
                value="general"
                className="flex-1 px-4"
                onClick={() => navigate("/dashboard/analytics/products")}
              >
                Général
              </TabsTrigger>
              <TabsTrigger value="detail" className="flex-1 px-4">
                Détails
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top produit</CardTitle>
            <CardDescription>Meilleure performance actuelle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Badge variant="secondary">+0%</Badge>
            </div>
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">CA total</CardTitle>
            <CardDescription>Sur la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Articles vendus</CardTitle>
            <CardDescription>Unités cumulées</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Produits</CardTitle>
              <CardDescription>Classement par volumes et marges</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input placeholder="Rechercher un produit" className="w-[220px]" />
              <Button variant="outline" className="gap-2">
                Exporter
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Separator />
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="pl-3">
                  <TableHead className="pl-3 text-left w-[40%]">Produit</TableHead>
                  <TableHead className="text-left w-24">Ventes</TableHead>
                  <TableHead className="text-left w-24">CA</TableHead>
                  <TableHead className="text-left w-24">Marge</TableHead>
                  <TableHead className="text-left w-24">Taux</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i} className="pl-3">
                    <TableCell className="pl-3">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-14" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
