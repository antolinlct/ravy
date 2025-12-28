import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function AdminRegexPage() {
  const [supplierNameEditing, setSupplierNameEditing] = useState(false)
  const [marketMasterArticleEditing, setMarketMasterArticleEditing] = useState(false)
  const [masterArticleAlternativeEditing, setMasterArticleAlternativeEditing] =
    useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">regex</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>supplier_name</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Ajoutez vos regex ici..."
              className="min-h-40 border-outline"
              disabled={!supplierNameEditing}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSupplierNameEditing(true)}
                disabled={supplierNameEditing}
              >
                Modifier
              </Button>
              <Button
                type="button"
                onClick={() => setSupplierNameEditing(false)}
                disabled={!supplierNameEditing}
              >
                Enregistrer
              </Button>
              {supplierNameEditing ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSupplierNameEditing(false)}
                >
                  Annuler
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>market_master_article_name</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Ajoutez vos regex ici..."
              className="min-h-40 border-outline"
              disabled={!marketMasterArticleEditing}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setMarketMasterArticleEditing(true)}
                disabled={marketMasterArticleEditing}
              >
                Modifier
              </Button>
              <Button
                type="button"
                onClick={() => setMarketMasterArticleEditing(false)}
                disabled={!marketMasterArticleEditing}
              >
                Enregistrer
              </Button>
              {marketMasterArticleEditing ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMarketMasterArticleEditing(false)}
                >
                  Annuler
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>master_article_alternative</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Ajoutez vos regex ici..."
              className="min-h-40 border-outline"
              disabled={!masterArticleAlternativeEditing}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setMasterArticleAlternativeEditing(true)}
                disabled={masterArticleAlternativeEditing}
              >
                Modifier
              </Button>
              <Button
                type="button"
                onClick={() => setMasterArticleAlternativeEditing(false)}
                disabled={!masterArticleAlternativeEditing}
              >
                Enregistrer
              </Button>
              {masterArticleAlternativeEditing ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMasterArticleAlternativeEditing(false)}
                >
                  Annuler
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
