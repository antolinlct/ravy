import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  createRegexPattern,
  fetchRegexPatterns,
  updateRegexPattern,
} from "./api"
import type { ApiRegexPattern, RegexType } from "./api"

export default function AdminRegexPage() {
  const types: RegexType[] = useMemo(
    () => [
      "supplier_name",
      "market_master_article_name",
      "master_article_alternative",
    ],
    []
  )

  const [isLoading, setIsLoading] = useState(true)
  const [patterns, setPatterns] = useState<Record<RegexType, ApiRegexPattern | null>>({
    supplier_name: null,
    market_master_article_name: null,
    master_article_alternative: null,
  })
  const [values, setValues] = useState<Record<RegexType, string>>({
    supplier_name: "",
    market_master_article_name: "",
    master_article_alternative: "",
  })
  const [editing, setEditing] = useState<Record<RegexType, boolean>>({
    supplier_name: false,
    market_master_article_name: false,
    master_article_alternative: false,
  })
  const [saving, setSaving] = useState<Record<RegexType, boolean>>({
    supplier_name: false,
    market_master_article_name: false,
    master_article_alternative: false,
  })

  useEffect(() => {
    let active = true

    const loadPatterns = async () => {
      setIsLoading(true)
      try {
        const data = await fetchRegexPatterns()
        if (!active) return

        const byType: Record<RegexType, ApiRegexPattern | null> = {
          supplier_name: null,
          market_master_article_name: null,
          master_article_alternative: null,
        }

        data.forEach((item) => {
          if (item.type) {
            byType[item.type] = item
          }
        })

        setPatterns(byType)
        setValues({
          supplier_name: byType.supplier_name?.regex ?? "",
          market_master_article_name: byType.market_master_article_name?.regex ?? "",
          master_article_alternative: byType.master_article_alternative?.regex ?? "",
        })
      } catch (error) {
        console.error(error)
        toast.error("Impossible de charger les regex.")
      } finally {
        if (!active) return
        setIsLoading(false)
      }
    }

    loadPatterns()

    return () => {
      active = false
    }
  }, [])

  const handleStartEdit = (type: RegexType) => {
    setEditing((prev) => ({ ...prev, [type]: true }))
  }

  const handleCancel = (type: RegexType) => {
    setValues((prev) => ({
      ...prev,
      [type]: patterns[type]?.regex ?? "",
    }))
    setEditing((prev) => ({ ...prev, [type]: false }))
  }

  const handleSave = async (type: RegexType) => {
    if (saving[type]) return
    setSaving((prev) => ({ ...prev, [type]: true }))
    const nextValue = values[type]

    try {
      const existing = patterns[type]
      const saved = existing
        ? await updateRegexPattern(existing.id, { regex: nextValue })
        : await createRegexPattern({ type, regex: nextValue })

      setPatterns((prev) => ({ ...prev, [type]: saved }))
      setValues((prev) => ({ ...prev, [type]: saved.regex ?? "" }))
      setEditing((prev) => ({ ...prev, [type]: false }))
      toast.success("Regex mise a jour.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible d enregistrer la regex.")
    } finally {
      setSaving((prev) => ({ ...prev, [type]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">regex</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {types.map((type) => {
          const isEditing = editing[type]
          const isSaving = saving[type]

          return (
            <Card key={type}>
              <CardHeader>
                <CardTitle>{type}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Ajoutez vos regex ici..."
                  className="min-h-40 border-outline"
                  value={values[type]}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, [type]: event.target.value }))
                  }
                  disabled={!isEditing || isLoading}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleStartEdit(type)}
                    disabled={isEditing || isLoading}
                  >
                    Modifier
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSave(type)}
                    disabled={!isEditing || isSaving}
                  >
                    Enregistrer
                  </Button>
                  {isEditing ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleCancel(type)}
                      disabled={isSaving}
                    >
                      Annuler
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
