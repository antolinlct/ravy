import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function AdminRegexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">regex</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Regex produits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Ajoutez vos regex ici..."
              className="min-h-40 border-outline"
            />
            <div className="flex items-center gap-2">
              <Button>Mettre a jour</Button>
              <Button variant="secondary">Annuler</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regex fournisseurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Ajoutez vos regex ici..."
              className="min-h-40 border-outline"
            />
            <div className="flex items-center gap-2">
              <Button>Mettre a jour</Button>
              <Button variant="secondary">Annuler</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
