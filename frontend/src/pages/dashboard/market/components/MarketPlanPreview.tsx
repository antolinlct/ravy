import { 
  Wallet, 
  Lock, 
  Scale, 
  History, 
  Handshake, 
  TrendingDown,
  ArrowRight,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"

const benefits = [
  {
    icon: Scale,
    title: "Comparateur de Prix",
    description: "Comparez instantanément vos prix d'achat avec la moyenne du marché en temps réel."
  },
  {
    icon: History,
    title: "Mercuriales & Historique",
    description: "Suivez l'évolution des cours pour acheter au bon moment et anticiper les hausses."
  },
  {
    icon: Handshake,
    title: "Pouvoir de Négociation",
    description: "Utilisez des données fiables pour challenger vos fournisseurs et réduire vos factures."
  },
  {
    icon: TrendingDown,
    title: "Optimisation des Coûts",
    description: "Identifiez les produits 'sensibles' qui plombent votre marge et trouvez des alternatives."
  }
]

export function MarketPlanPreview() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-background/50">
      
      {/* --- ARRIÈRE-PLAN VISUEL --- */}
      {/* Pattern de points (Data points) pour évoquer les données de marché */}
      <div className="absolute inset-0 z-0 opacity-[0.02]" 
           style={{ 
             backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)", 
             backgroundSize: "10px 10px" 
           }} 
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-transparent to-primary/5" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-6 py-12 text-center">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col items-center gap-4">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Wallet className="h-3.5 w-3.5" />
            Intelligence Achat
          </Badge>
          
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Achetez mieux, négociez plus fort.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Ne laissez plus le marché dicter vos coûts. Le module <span className="font-semibold text-foreground">Marché & Achats</span> vous donne les repères nécessaires pour payer le prix juste.
          </p>
        </div>

        {/* --- GRID DES BÉNÉFICES --- */}
        <div className="grid w-full gap-4 md:grid-cols-2 lg:gap-6 mt-4">
          {benefits.map((item, index) => (
            <Card key={index} className="group relative flex items-start gap-4 rounded-xl bg-muted/30 p-5 text-left transition-all hover:bg-muted/60">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* --- CTA SECTION --- */}
        <Card className="relative w-full overflow-hidden border-none bg-muted/20 shadow-none mt-4">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
          <CardContent className="relative flex flex-col items-center justify-between gap-6 p-6 sm:flex-row">
            
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:text-left text-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-medium text-foreground">Débloquez l'accès complet</h3>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center">
                  <span className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Essai gratuit
                  </span>
                  <span className="hidden sm:inline text-muted-foreground/50">•</span>
                  <span className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Annulation facile
                  </span>
                </div>
              </div>
            </div>

            <Button asChild size="lg" className="shadow-lg shadow-primary/10 transition-all hover:scale-105">
              <Link to="/dashboard/settings/subscription">
                Voir les offres
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}