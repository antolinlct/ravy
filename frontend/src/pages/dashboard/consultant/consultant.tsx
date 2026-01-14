"use client";

import { 
  Bot, 
  Sparkles, 
  Rocket, 
  Stars, 
  Wand2, 
  Send, 
  Paperclip,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const quickPrompts = [
  "Quels produits acheter moins cher ?",
  "Analyse ma marge depuis 7 jours",
  "Optimise mes recettes critiques",
];

const features = [
  {
    icon: Wand2,
    text: "Création automatique de fiches techniques"
  },
  {
    icon: Bot,
    text: "Négociation fournisseurs assistée par IA"
  },
  {
    icon: Stars,
    text: "Détection des anomalies de coûts"
  }
]

export default function ConsultantTeaser() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-background/50">
      
      {/* --- BACKGROUND TECH --- */}
      {/* Effet de grille digitale + lueur centrale pour l'aspect "Intelligence" */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" 
           style={{ 
             backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)", 
             backgroundSize: "10px 10px" 
           }} 
      />
      {/* Halo lumineux central */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-transparent to-primary/5" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-6 py-16 text-center">
        
        {/* --- HEADER TEASING --- */}
        <div className="flex flex-col items-center gap-5">
          <Badge variant="outline" className="gap-2 border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary shadow-[0_0_15px_-3px_rgba(0,0,0,0.1)] shadow-primary/20">
            <Rocket className="h-3.5 w-3.5 fill-primary/20" />
            Bientôt disponible
          </Badge>
          
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            L'IA entre en cuisine.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Nous construisons le premier <span className="font-semibold text-foreground">Consultant IA</span> dédié à la restauration. Il analysera vos marges et vos achats pour vous donner des réponses sourcées, instantanément.
          </p>
        </div>

        {/* --- DEMO VISUELLE (INTERFACE FIGÉE) --- */}
        {/* C'est ici qu'on met tes inputs, mais stylisés pour montrer le futur produit */}
        <div className="relative w-full max-w-2xl">
          {/* Badge "Preview" flottant */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
            <span className="bg-background border px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest rounded-full shadow-sm">
              Interface en développement
            </span>
          </div>

          <Card className="relative overflow-hidden border bg-background/60 shadow-2xl backdrop-blur-sm">
             {/* Gradient subtil sur la card */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            
            <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
              
              {/* Zone des Prompts (Visuel) */}
              <div className="flex flex-wrap justify-center gap-2 opacity-80">
                {quickPrompts.map((prompt) => (
                  <div key={prompt} className="flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted cursor-default">
                    <Sparkles className="h-3 w-3 text-primary/70" />
                    {prompt}
                  </div>
                ))}
              </div>

              {/* Zone Input (Simulation) */}
              <div className="relative flex items-center gap-2 rounded-xl border bg-background px-4 py-3 shadow-inner ring-1 ring-primary/10">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-transparent" disabled>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-left text-sm text-muted-foreground/60 select-none">
                  Je peux analyser vos factures, demandez-moi...
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-5 w-[1px] bg-border mx-1" />
                   <Button size="icon" className="h-8 w-8 rounded-lg shadow-lg shadow-primary/20 cursor-default">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Liste des features prévues en bas de la card */}
              <div className="grid gap-2 sm:grid-cols-3 pt-2">
                {features.map((f, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-medium leading-tight text-muted-foreground">
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}