import { useMemo } from "react"
import { useUser } from "@/context/UserContext"
import { ChefHat } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

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

        <div className="grid gap-4 md:grid-cols-12 md:grid-rows-6">
          <Card className="h-full md:col-span-3 md:row-span-2">
            <CardContent className="flex h-full flex-col justify-between p-5">
              <p className="text-sm font-medium text-muted-foreground">Bloc 1</p>
            </CardContent>
          </Card>
          <Card className="h-full md:col-span-2 md:col-start-4 md:row-start-1">
            <CardContent className="flex h-full flex-col justify-between p-4">
              <p className="text-sm font-medium text-muted-foreground">Bloc 2</p>
              <p className="text-2xl font-semibold text-primary">Valeur</p>
            </CardContent>
          </Card>
          <Card className="h-full md:col-span-2 md:col-start-4 md:row-start-2">
            <CardContent className="flex h-full flex-col justify-between p-4">
              <p className="text-sm font-medium text-muted-foreground">Bloc 3</p>
              <p className="text-2xl font-semibold text-primary">Valeur</p>
            </CardContent>
          </Card>
          <Card className="h-full md:col-span-2 md:col-start-6 md:row-start-1">
            <CardContent className="flex h-full flex-col justify-between p-4">
              <p className="text-sm font-medium text-muted-foreground">Bloc 4</p>
              <p className="text-2xl font-semibold text-primary">Valeur</p>
            </CardContent>
          </Card>
          <Card className="h-full md:col-span-2 md:col-start-6 md:row-start-2">
            <CardContent className="flex h-full flex-col justify-between p-4">
              <p className="text-sm font-medium text-muted-foreground">Bloc 5</p>
              <p className="text-2xl font-semibold text-primary">Valeur</p>
            </CardContent>
          </Card>
          <Card className="h-full md:col-span-7 md:row-span-4 md:col-start-1 md:row-start-3">
            <CardContent className="flex h-full flex-col justify-between p-5">
              <p className="text-sm font-medium text-muted-foreground">Bloc 6</p>
            </CardContent>
          </Card>
          <div className="h-full md:col-span-5 md:row-span-6 md:col-start-8 md:row-start-1 p-0">
            <Card className="md:col-span-7 md:row-span-4 md:col-start-1 md:row-start-3">
              <CardContent className="flex h-full flex-col justify-between p-5">
                <p className="text-sm font-medium text-muted-foreground">Bloc 7</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
