import { useMemo } from "react"
import { useUser } from "@/context/UserContext"
import { ChefHat, ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DashboardHomePage() {
  const user = useUser()
  const displayName = useMemo(() => {
    const full = user?.fullName?.trim()
    if (full) {
      const [first] = full.split(" ")
      return first || full
    }
    return "l'équipe Ravy"
  }, [user?.fullName])
  const currentMonth = useMemo(() => {
    const formatted = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date())
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }, [])

  const invoiceStats = [
    { name: "Factures importées", value: "18" },
    { name: "TVA collectée", value: "6 120 €" },
    { name: "Dépenses HT", value: "24 300 €" },
  ]

  const latestVariations = [
    { article: "Eau gazeuse 33cl", supplier: "Sysco France", change: "+2,3%" },
    { article: "Filet de poulet", supplier: "Transgourmet", change: "-1,4%" },
    { article: "Beurre AOP 250g", supplier: "France Boissons", change: "+0,9%" },
    { article: "Frites surgelées", supplier: "Brake", change: "-2,1%" },
    { article: "Café moulu 1kg", supplier: "Metro", change: "+1,8%" },
    { article: "Huile d'olive 5L", supplier: "Transgourmet", change: "-0,7%" },
    { article: "Steak haché 15%", supplier: "Sysco France", change: "+3,2%" },
    { article: "Vin rouge AOP", supplier: "France Boissons", change: "-1,9%" },
    { article: "Sucre 5kg", supplier: "Metro", change: "+0,5%" },
    { article: "Lait UHT 1L", supplier: "Brake", change: "-1,2%" },
  ]

  return (
    <div className="flex w-full items-start justify-start">
      <div className="w-full space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">Bonjour, {displayName} !</h1>
            </div>
            <p className="text-muted-foreground">Clarté, contrôle et suivi des coûts en un coup d&apos;oeil.</p>
          </div>
        </header>

        <Card className="w-full shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <CardDescription className="text-sm tracking-wide text-muted-foreground">
                  {currentMonth}
                </CardDescription>
                <CardTitle className="text-xl">Résumé financier</CardTitle>
              </div>
              <dl className="grid w-full gap-4 sm:grid-cols-3 sm:max-w-2xl">
                {invoiceStats.map((item) => (
                  <Card key={item.name} className="p-0 rounded-md">
                    <CardContent className="p-3">
                      <dd className="flex flex-col gap-1">
                        <span className="truncate text-xs text-muted-foreground">{item.name}</span>
                        <span className="text-xl self-end text-primary">{item.value}</span>
                      </dd>
                    </CardContent>
                  </Card>
                ))}
              </dl>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-10">
          <Card className="md:col-span-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <CardTitle>Dernières variations</CardTitle>
                <Button variant="link" className="p-0 h-6">
                  Voir tout
                </Button>
              </div>
              <CardDescription className="mt-1">
                Suivi des articles dont les prix ont récemment varié.
              </CardDescription>
              <div className="relative mt-4">
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {latestVariations.map((item) => {
                    const isDown = item.change.startsWith("-")
                    return (
                      <div
                        key={item.article}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm ${
                              isDown ? "border-green-200/60" : "border-red-200/60"
                            }`}
                          >
                            {isDown ? (
                              <ArrowDown className="h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowUp className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="space-y-0">
                            <p className="text-sm text-foreground">{item.article}</p>
                            <p className="text-xs text-muted-foreground">{item.supplier}</p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-semibold ${isDown ? "text-green-500" : "text-red-500"}`}
                        >
                          {item.change}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/90 via-white/60 to-transparent dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-transparent" />
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-6">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Bloc 60%</p>
              <p className="text-lg font-semibold">Contenu à venir</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
