import { useEffect, useRef, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Euro, Percent, X } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEstablishment } from "@/context/EstablishmentContext"

export default function PreferencesSettingsPage() {
  const { estId } = useEstablishment()
  const [aliasEmail, setAliasEmail] = useState<string>("")
  const [aliasActive, setAliasActive] = useState<boolean>(false)
  const [copyLabel, setCopyLabel] = useState("Copier l'email")
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const copyTimeoutRef = useRef<number | null>(null)
  const [activeSms, setActiveSms] = useState<boolean | null>(null)
  const [typeSms, setTypeSms] = useState<string | null>(null)
  const [smsTrigger, setSmsTrigger] = useState<string | null>(null)
  const [baselineSms, setBaselineSms] = useState({
    activeSms: null as boolean | null,
    typeSms: null as string | null,
    smsTrigger: null as string | null,
  })
  const [savingSms, setSavingSms] = useState(false)
  const [priceMethod, setPriceMethod] = useState<string | null>(null)
  const [priceValue, setPriceValue] = useState<string | null>(null)
  const [baselinePrice, setBaselinePrice] = useState({
    method: null as string | null,
    value: null as string | null,
  })
  const [savingPrice, setSavingPrice] = useState(false)

  useEffect(() => {
    if (!estId) return

    let active = true
    async function loadAlias() {
      try {
        const API_URL = import.meta.env.VITE_API_URL
        const res = await fetch(
          `${API_URL}/establishment_email_alias?establishment_id=${estId}`
        )
        if (!active || !res.ok) return
        const list = await res.json()
        const alias =
          Array.isArray(list) && list.length > 0 ? list[0] : null

        setAliasEmail(alias?.custom_email || "")
        setAliasActive(Boolean(alias?.enabled))
      } catch {
        /* ignore load errors */
      }
    }

    loadAlias()

    return () => {
      active = false
    }
  }, [estId])

  useEffect(() => {
    if (!estId) return

    let active = true
    async function loadSmsPrefs() {
      try {
        const API_URL = import.meta.env.VITE_API_URL
        const res = await fetch(`${API_URL}/establishments/${estId}`)
        if (!active || !res.ok) return
        const data = await res.json()
        const nextActive = Boolean(data?.active_sms)
        const nextType = data?.type_sms || "FOOD"
        const nextTrigger = data?.sms_variation_trigger || "ALL"
        const nextPriceMethod = data?.recommended_retail_price_method || "MULTIPLIER"
        const nextPriceValue =
          data?.recommended_retail_price_value !== undefined &&
          data?.recommended_retail_price_value !== null
            ? String(data.recommended_retail_price_value)
            : "3"
        setActiveSms(nextActive)
        setTypeSms(nextType)
        setSmsTrigger(nextTrigger)
        setPriceMethod(nextPriceMethod)
        setPriceValue(nextPriceValue)
        setBaselineSms({
          activeSms: nextActive,
          typeSms: nextType,
          smsTrigger: nextTrigger,
        })
        setBaselinePrice({
          method: nextPriceMethod,
          value: nextPriceValue,
        })
      } catch {
        /* ignore load errors */
      }
    }

    loadSmsPrefs()

    return () => {
      active = false
    }
  }, [estId])

  const smsHasChanges =
    (activeSms ?? baselineSms.activeSms) !== baselineSms.activeSms ||
    (typeSms ?? baselineSms.typeSms) !== baselineSms.typeSms ||
    (smsTrigger ?? baselineSms.smsTrigger) !== baselineSms.smsTrigger

  function smsSummary() {
    if (!(activeSms ?? baselineSms.activeSms)) return ""
    const typeLabel =
      (typeSms ?? baselineSms.typeSms) === "FOOD & BEVERAGES"
        ? "fournisseurs alimentaires (solides & liquides)"
        : "fournisseurs alimentaires (solides)"

    const triggerLabel = (() => {
      const val = smsTrigger ?? baselineSms.smsTrigger
      if (val === "±5%") return "dépassant ±5%"
      if (val === "±10%") return "dépassant ±10%"
      return "toutes les variations"
    })()

    if (triggerLabel === "toutes les variations") {
      return `Toutes les variations des ${typeLabel} seront envoyées par SMS.`
    }
    return `Les variations ${triggerLabel} des ${typeLabel} seront envoyées par SMS.`
  }

  async function handleSaveSms() {
    if (!estId || !smsHasChanges) return
    const payload = {
      active_sms: activeSms ?? baselineSms.activeSms ?? false,
      type_sms: typeSms ?? baselineSms.typeSms ?? "FOOD",
      sms_variation_trigger: smsTrigger ?? baselineSms.smsTrigger ?? "ALL",
    }

    setSavingSms(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL
      const res = await fetch(`${API_URL}/establishments/${estId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setBaselineSms({
          activeSms: payload.active_sms,
          typeSms: payload.type_sms,
          smsTrigger: payload.sms_variation_trigger,
        })
        toast.success("Préférences SMS mises à jour.")
      } else {
        toast.error("Impossible d'enregistrer les préférences SMS.")
      }
    } finally {
      setSavingSms(false)
    }
  }

  const priceHasChanges =
    (priceMethod ?? baselinePrice.method) !== baselinePrice.method ||
    (priceValue ?? baselinePrice.value) !== baselinePrice.value

  const currentPriceMethod =
    priceMethod ?? baselinePrice.method ?? "MULTIPLIER"
  const priceValueLabel =
    currentPriceMethod === "PERCENTAGE"
      ? "Pourcentage ciblé"
      : currentPriceMethod === "VALUE"
        ? "Valeur fixe"
        : "Multiplicateur"
  const PriceIcon =
    currentPriceMethod === "PERCENTAGE"
      ? Percent
      : currentPriceMethod === "VALUE"
        ? Euro
        : X
  const effectivePriceValue =
    priceValue && priceValue.trim() !== ""
      ? priceValue
      : baselinePrice.value ?? "3"

  function priceSummary() {
    const val = effectivePriceValue || "3"
    if (currentPriceMethod === "PERCENTAGE") {
      return `La marge ciblée sera de ${val}% sur chaque recette.`
    }
    if (currentPriceMethod === "VALUE") {
      return `La marge ciblée sera de ${val}€ par recette.`
    }
    return `Le prix de vente conseillé sera de ${val} fois le coût d'achat de la recette.`
  }

  async function handleSavePrice() {
    if (!estId || !priceHasChanges) return
    if (!effectivePriceValue || effectivePriceValue.trim() === "") return
    const payload = {
      recommended_retail_price_method:
        priceMethod ?? baselinePrice.method ?? "MULTIPLIER",
      recommended_retail_price_value:
        effectivePriceValue !== null && effectivePriceValue !== undefined
          ? Number(effectivePriceValue)
          : Number(baselinePrice.value ?? 3),
    }
    setSavingPrice(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL
      const res = await fetch(`${API_URL}/establishments/${estId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setBaselinePrice({
          method: payload.recommended_retail_price_method,
          value: String(payload.recommended_retail_price_value),
        })
        toast.success("Prix de vente conseillé mis à jour.")
      } else {
        toast.error("Impossible d'enregistrer le prix de vente conseillé.")
      }
    } finally {
      setSavingPrice(false)
    }
  }

  function handleCopy() {
    if (!aliasActive || !aliasEmail) return
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = null
    }
    navigator.clipboard
      .writeText(aliasEmail)
      .then(() => {
        setCopyLabel("Copié !")
        setTooltipOpen(true)
        copyTimeoutRef.current = window.setTimeout(() => {
          setCopyLabel("Copier l'email")
          setTooltipOpen(false)
          copyTimeoutRef.current = null
        }, 1500)
      })
      .catch(() => {
        setCopyLabel("Copier l'email")
      })
  }

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="flex items-start justify-start bg-sidebar rounded-xl gap-4 p-4">
      <div className="w-full max-w-4xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Réception automatique de vos factures</CardTitle>
            <CardDescription>
              Envoyez vos factures ou partagez cette adresse à vos fournisseurs pour les ajouter automatiquement dans Ravy.
            </CardDescription>
            </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <TooltipProvider>
              <div className="flex items-center gap-2 w-full max-w-xl">
                <Input
                  readOnly
                  value={
                    aliasActive && aliasEmail
                      ? aliasEmail
                      : "Adresse en cours de génération"
                  }
                  className="flex-1 max-w-sm"
                />
                <Tooltip
                  open={tooltipOpen}
                  onOpenChange={(open) => {
                    // Ne pas fermer pendant l'état "copié"
                    if (copyTimeoutRef.current) return
                    setTooltipOpen(open)
                  }}
                  delayDuration={0}
                >
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCopy}
                      disabled={!aliasActive || !aliasEmail}
                    >
                      Copier
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{copyLabel}</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            {!aliasActive && (
              <p className="text-sm text-muted-foreground">
                Cette adresse email n'est pas encore disponible pour vous, contactez-vous par mail support@ravy.fr pour l'activer.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification par SMS</CardTitle>
            <CardDescription>
              Paramétrez ici les notifications que vous recevez par SMS à chaque variation importante.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border border-sidebar-border/60 bg-sidebar p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Activer les SMS</p>
                <p className="text-xs text-muted-foreground">
                  Activez ou désactivez les alertes SMS pour cet établissement.
                </p>
              </div>
              <Switch
                checked={activeSms ?? baselineSms.activeSms ?? false}
                onCheckedChange={setActiveSms}
                disabled={activeSms === null}
              />
            </div>

            {(activeSms ?? baselineSms.activeSms) && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Type de SMS</p>
                  <Select
                    value={typeSms ?? undefined}
                    onValueChange={setTypeSms}
                    disabled={typeSms === null}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOOD">
                        Fournisseurs alimentaires (solides)
                      </SelectItem>
                      <SelectItem value="FOOD & BEVERAGES">
                        Fournisseurs alimentaires (solides & liquides)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Déclencheur</p>
                  <Select
                    value={smsTrigger ?? undefined}
                    onValueChange={setSmsTrigger}
                    disabled={smsTrigger === null}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un seuil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tous les mouvements</SelectItem>
                      <SelectItem value="±5%">±5%</SelectItem>
                      <SelectItem value="±10%">±10%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                {activeSms ?? baselineSms.activeSms
                  ? smsSummary()
                  : "SMS désactivés pour cet établissement."}
              </p>
              <Button
                type="button"
                variant="secondary"
                disabled={!smsHasChanges || savingSms || activeSms === null}
                onClick={handleSaveSms}
              >
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prix de vente et marge ciblée</CardTitle>
            <CardDescription>
              Définissez le prix de vente et la marge cible pour ce restaurant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Méthode</p>
                <Select
                  value={priceMethod ?? undefined}
                  onValueChange={setPriceMethod}
                  disabled={priceMethod === null}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MULTIPLIER">Multiplicateur</SelectItem>
                    <SelectItem value="PERCENTAGE">Pourcentage</SelectItem>
                    <SelectItem value="VALUE">Valeur fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">{priceValueLabel}</p>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={priceValue ?? ""}
                    onChange={(e) => setPriceValue(e.target.value)}
                    placeholder="3"
                    disabled={priceValue === null}
                    className="pr-10"
                  />
                  <PriceIcon className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">{priceSummary()}</p>
              <Button
                type="button"
                variant="secondary"
                disabled={
                  !priceHasChanges ||
                  savingPrice ||
                  priceMethod === null ||
                  priceValue === null ||
                  (priceValue !== null && priceValue.trim() === "")
                }
                onClick={handleSavePrice}
              >
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
