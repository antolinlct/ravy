import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChefHat, FileText, Users } from "lucide-react"
import type { ReactNode } from "react"

type UsageItem = {
  key: string
  label: string
  icon: ReactNode
  value: number
  detail: string
  quota: string
}

const plan = {
  name: "Plan Pro",
  price: "59€ / mois",
  status: "Actif",
  renewal: "Renouvellement le 15/08/2024",
}

const usage: UsageItem[] = [
  {
    key: "invoices",
    label: "Factures émises (mois)",
    icon: <FileText className="h-4 w-4 text-blue-600" />,
    value: 62,
    detail: "62% du quota mensuel",
    quota: "62 / 100 factures",
  },
  {
    key: "recipes",
    label: "Recettes actives",
    icon: <ChefHat className="h-4 w-4 text-amber-600" />,
    value: 45,
    detail: "45% du quota",
    quota: "450 / 1000 recettes",
  },
  {
    key: "seats",
    label: "Utilisateurs (seats)",
    icon: <Users className="h-4 w-4 text-slate-600" />,
    value: 50,
    detail: "50% du quota",
    quota: "5 / 10 utilisateurs",
  },
]

const availableAddons = [
  { name: "Pack factures", detail: "+100 factures / mois", price: "9 € / mois" },
  { name: "Pack recettes", detail: "+500 recettes", price: "12 € / mois" },
  { name: "Pack accès", detail: "+2 utilisateurs", price: "6 € / mois" },
]

const activeAddons = [
  { name: "Pack factures", detail: "+50 factures / mois", price: "5 € / mois" },
  { name: "Pack accès", detail: "+1 utilisateur", price: "3 € / mois" },
]

export default function SubscriptionPage() {
  return (
    <div className="flex items-start justify-start bg-sidebar rounded-xl gap-4 p-4">
      <div className="w-full max-w-6xl space-y-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="mb-1">Abonnement</CardTitle>
              <CardDescription>
                Abonnement en cours, suivi des quotas et add-ons actifs.
              </CardDescription>
            </div>
            <Badge className="border-none bg-green-500/15 text-green-700">
              {plan.status}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-[1.15fr,1fr]">
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Offre actuelle
                  </span>
                </div>
                <span className="text-lg font-semibold text-foreground">{plan.price}</span>
              </div>
              <p className="text-xl font-semibold">{plan.name}</p>
              <p className="text-sm text-muted-foreground">{plan.renewal}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button">Consulter mes factures</Button>
                <Button type="button" variant="outline">
                  Gérer mon abonnement
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Suivi de la consommation</p>
              {usage.map((item) => (
                <div key={item.key} className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </span>
                    <span className="text-muted-foreground">{item.detail}</span>
                  </div>
                  <Progress value={item.value} />
                  <p className="text-sm text-muted-foreground">{item.quota}</p>
                </div>
              ))}
              <div className="space-y-2 pt-1">
                <p className="text-sm font-semibold">Pack d'options activés</p>
                {activeAddons.length ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    {activeAddons.map((addon) => (
                      <div
                        key={addon.name}
                        className="rounded-md border border-green-200 bg-green-50 p-3 space-y-2 shadow-sm dark:border-green-500/30 dark:bg-green-500/10"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-semibold text-green-900 dark:text-green-100">{addon.name}</span>
                          <Badge className="border-none bg-green-500/20 text-green-800 text-xs dark:bg-green-500/15 dark:text-green-100">
                            Actif
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{addon.detail}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-green-800 dark:text-green-100">{addon.price}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-800 hover:text-green-900 hover:bg-green-100 dark:text-green-100 dark:hover:text-green-50 dark:hover:bg-green-500/20"
                          >
                            Retirer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun add-on actif.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add-ons disponibles</CardTitle>
            <CardDescription>
              Ajoutez des packs pour augmenter vos capacités si besoin.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {availableAddons.map((addon) => (
              <div key={addon.name} className="rounded-lg border p-3 space-y-2 bg-card">
                <p className="font-semibold">{addon.name}</p>
                <p className="text-sm text-muted-foreground">{addon.detail}</p>
                <p className="text-sm font-medium">{addon.price}</p>
                <Button size="sm" variant="outline">
                  Ajouter
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
