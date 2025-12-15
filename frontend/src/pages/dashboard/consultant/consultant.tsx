"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paperclip, Sparkles, Send } from "lucide-react";

const quickPrompts = [
  "Quels sont les produits que je peux acheter moins chère ?",
  "Donne moi l'évolution de ma marge depuis 7 jours",
  "Quels sont mes achats critiques ?",
  "Optimise mes recettes les moins rentables",
];

export default function ConsultantPage() {
  return (
    <div className="relative w-full rounded-xl">
      <div className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-gradient-to-br from-muted/50 via-white/70 to-primary/10" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 py-10">
        <header className="relative z-20 text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            <span className="h-2 w-2 rounded-full bg-primary-foreground" />
            Bientôt disponible
          </div>
          <h1 className="text-3xl font-semibold">L'intelligence artificielle au service de votre rentabilité</h1>
          <p className="text-sm text-muted-foreground">
            Activez vos données achats, recettes et marges pour obtenir des réponses sourcées et des actions prêtes à lancer.
          </p>
        </header>

        <Card className="relative z-20 w-full border">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Ce que l’IA fera pour vous
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <FeatureChip>
                Fiches techniques rentables avec grammages, allergènes et coûts matière.
              </FeatureChip>
              <FeatureChip>
                Détection des achats critiques, alternatives et messages fournisseurs prêts.
              </FeatureChip>
              <FeatureChip>
                Optimisation de marge : ajustements de prix, portions, substitutions.
              </FeatureChip>
              <FeatureChip>
                Résumés prêts à partager : PDF, tableurs, notifications internes.
              </FeatureChip>
            </div>
          </CardContent>
        </Card>

        <div className="relative z-0 flex w-full flex-wrap justify-center gap-2">
          {quickPrompts.map((prompt) => (
            <Button key={prompt} variant="outline" className="rounded-full">
              {prompt}
            </Button>
          ))}
        </div>

        <Card className="relative z-0 w-full max-w-4xl border">
          <CardContent className="space-y-3 p-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Prompts enregistrés
              </span>
              <Button variant="ghost" size="sm">
                Attacher du contenu
              </Button>
            </div>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
              <Label className="sr-only" htmlFor="message">
                Message
              </Label>
              <Input
                id="message"
                placeholder="Posez votre question..."
                className="border-none shadow-none focus-visible:ring-0"
              />
              <Button variant="ghost" size="icon">
                <Paperclip className="h-3 w-3" />
              </Button>
              <Button size="icon">
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeatureChip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
