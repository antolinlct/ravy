import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Banknote, Brain, Store } from "lucide-react"

const integrations = [
  {
    title: "Connectez votre caisse",
    description:
      "Synchronisez vos ventes et stocks en temps réel.",
    icon: Store,
  },
  {
    title: "Connectez votre banque",
    description:
      "Suivez vos flux et automatisez le rapprochement bancaire.",
    icon: Banknote,
  },
  {
    title: "Activez notre IA",
    description:
      "La puissance de l'intelligence artificielle à votre service.",
    icon: Brain,
  },
]

export default function IntegrationsSupportPage() {
  return (
    <div className="flex items-start justify-start bg-sidebar rounded-xl gap-4 p-4">
      <div className="w-full max-w-5xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Intégrations</CardTitle>
            <CardDescription>Activez les connecteurs essentiels à votre activité.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {integrations.map((item) => (
                <Card key={item.title} className="h-full opacity-70">
                  <CardHeader className="space-y-2 flex flex-col items-center text-center">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription className="text-sm">{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <Badge className="bg-blue-500/15 text-blue-700 border-transparent hover:bg-blue-500/15 hover:text-blue-700">
                      Bientôt disponible
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
