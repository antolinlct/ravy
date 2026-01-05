import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="mx-auto flex min-h-svh max-w-5xl flex-col gap-12 px-4 py-10">
        <section className="flex flex-col items-center gap-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold sm:text-5xl">
              RAVY : le cockpit d&apos;achat qui rend chaque établissement plus rentable.
            </h1>
            <p className="text-lg font-semibold sm:text-xl">
              3 minutes pour déclencher un audit gratuit, repérer les fuites de marge et agir dès cette semaine.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg">Lancer un audit gratuit</Button>
            <Button size="lg" variant="outline">
              Voir un audit type
            </Button>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <Badge variant="secondary">312 établissements actifs</Badge>
              <Badge variant="secondary">Pilotage achats en temps réel</Badge>
              <Badge variant="secondary">Sans engagement</Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Objectif : sécuriser vos marges, sans sur-design ni jargon.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <Card>
            <CardHeader className="items-center text-center">
              <CardTitle>Preuve sociale immédiate</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="flex -space-x-2">
                {["AL", "BM", "CP", "DR", "ES"].map((initials) => (
                  <Avatar key={initials} className="border">
                    <AvatarImage alt={`Avatar ${initials}`} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <p className="text-lg font-semibold">
                312 établissements actifs
              </p>
              <Badge variant="outline">Objectif presque atteint</Badge>
              <Button size="lg">Lancer un audit gratuit</Button>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Activité en temps réel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Il y a 3 min : un groupe parisien ajuste ses prix sur les légumes.",
                "Il y a 8 min : un bistrot évite une rupture sur les produits frais.",
                "Il y a 15 min : une chaîne sécurise un nouveau fournisseur local.",
              ].map((item) => (
                <div key={item} className="rounded-md border p-3 text-sm">
                  {item}
                </div>
              ))}
              <Button className="w-full" size="lg">
                Lancer un audit gratuit
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Le vrai coût de l’inaction</h2>
          <div className="space-y-3 text-base">
            <p>Marges qui s’érodent sans alerte. Décisions prises trop tard.</p>
            <p>
              Equipes qui subissent les prix au lieu de les piloter, chaque
              semaine.
            </p>
            <p>Recettes bloquées par des achats figés, impossible d’anticiper.</p>
            <p>Sans visibilité, la trésorerie se tend et la croissance s’arrête.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Comment ça marche</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Audit express", text: "3 minutes pour brancher vos achats et détecter les failles." },
              { title: "Lecture claire", text: "Des alertes compréhensibles, sans jargon, sur chaque dérive." },
              { title: "Action immédiate", text: "Un plan priorisé pour regagner de la marge dès ce mois-ci." },
            ].map((item, index) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle>{`${index + 1}. ${item.title}`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Ce que RAVY détecte</h2>
          <div className="space-y-3">
            <Alert>
              <AlertTitle>Alert SMS (exemple)</AlertTitle>
              <AlertDescription>
                “Surcoût de 7% sur les viandes cette semaine. Renégocier avant
                jeudi.”
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertTitle>Historique</AlertTitle>
              <AlertDescription>
                Chaque ligne d’achat tracée, avec l’évolution des prix et des
                volumes.
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertTitle>Comparaison marché</AlertTitle>
              <AlertDescription>
                Vos prix confrontés aux moyennes locales et nationales en temps
                réel.
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertTitle>Lien recettes</AlertTitle>
              <AlertDescription>
                Impact immédiat sur le food cost de chaque plat, sans attente.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exemple concret</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 text-sm">
                <p>Avant : marge brute à 63%, dérives non détectées.</p>
                <p>Après RAVY : marge brute à 70%, renégociation en 12 jours.</p>
                <p>Impact mensuel : +18 400 € sécurisés.</p>
              </div>
              <Button className="w-full" size="lg">
                Lancer un audit gratuit
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Témoignages</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { quote: "“On a enfin une alerte avant que les fournisseurs ne dictent le prix.”", name: "Luc, brasserie urbaine" },
              { quote: "“Lecture ultra simple, l’équipe cuisine sait quoi faire tout de suite.”", name: "Sofia, cantine premium" },
              { quote: "“RAVY a ramené 4 points de marge en trois semaines.”", name: "Yanis, groupe méditerranéen" },
            ].map((item) => (
              <Card key={item.name}>
                <CardContent className="space-y-3 p-4">
                  <p className="text-sm">{item.quote}</p>
                  <p className="text-sm font-semibold">{item.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Avant / Après</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ancien monde</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Achats subis, aucune alerte claire.</p>
                <p>Prix imposés, recettes figées.</p>
                <p>Stress sur la trésorerie chaque fin de mois.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Avec RAVY</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Signal en temps réel sur chaque hausse.</p>
                <p>Recettes adaptées automatiquement aux coûts.</p>
                <p>Marge sécurisée, vision claire pour scaler.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Offres / Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Essai", price: "0 €", note: "Sans engagement", cta: "Démarrer maintenant" },
              { title: "Pilotage", price: "390 € / mois", note: "Audit + alertes prioritaires", cta: "Choisir ce plan" },
              { title: "Scale", price: "690 € / mois", note: "Multi-sites + accompagnement", cta: "Parler à un expert" },
            ].map((plan, index) => (
              <Card key={plan.title} className={index === 1 ? "border-2" : undefined}>
                <CardHeader>
                  <CardTitle>{plan.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xl font-semibold">{plan.price}</p>
                  <p className="text-sm">{plan.note}</p>
                  <p className="text-sm font-medium">Sans engagement</p>
                  <Button className="w-full" size="lg">
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Dernière question</h2>
          <p className="text-lg font-semibold">
            Combien de mois supplémentaires pouvez-vous perdre sans alerte ?
          </p>
          <Button size="lg">Lancer un audit gratuit</Button>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <Accordion type="single" collapsible>
            {[
              { question: "Combien de temps dure l’audit ?", answer: "Moins de 10 minutes pour connecter vos données et recevoir les premières alertes." },
              { question: "Faut-il changer de fournisseur ?", answer: "Non, RAVY vous guide d’abord sur les renégociations et la priorisation des achats." },
              { question: "L’équipe cuisine doit-elle se former ?", answer: "Les alertes sont claires et actionnables, sans jargon ni tableau complexe." },
              { question: "Puis-je arrêter quand je veux ?", answer: "Oui, chaque plan est sans engagement. Vous gardez la main à tout moment." },
              { question: "Comment commencer ?", answer: "Cliquez sur “Lancer un audit gratuit” et vous êtes guidé pas à pas." },
            ].map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold">
            Prêt à sécuriser vos marges dès ce mois-ci ?
          </h2>
          <Button size="lg">Lancer un audit gratuit</Button>
        </section>
      </main>
    </div>
  )
}
