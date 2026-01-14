/**
 * EstablishmentDataContext.tsx
 * -----------------------------
 * Stocke les données complètes de l'établissement actif :
 *   - nom
 *   - logo_path
 *   - adresse
 *   - etc.
 *
 * Objectifs :
 *  - Charger ces données UNE SEULE FOIS lorsque estId change
 *  - Éviter de refetch l'établissement à chaque navigation dans le dashboard
 *  - Stabiliser l'affichage (logo, nom, header…)
 *
 * Fonctionnement :
 *  - Le context "EstablishmentContext" fournit estId (l'établissement actif)
 *  - Ce fichier fetch les données de l'établissement correspondant
 *  - Tous les composants peuvent consommer ces données via useEstablishmentData()
 *
 * Ce contexte ne bloque rien — aucune dépendance à l'authentification.
 */

"use client"
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import api from "@/lib/axiosClient"
import { usePostHog } from "posthog-js/react"
import { useEstablishment } from "./EstablishmentContext"

type EstablishmentValue = Record<string, unknown> | null

type UsageCounter = {
  id: string
  value_category?: "seat" | "invoices" | "recipe" | null
  used_value?: number | null
  limit_value?: number | null
  period_start?: string | null
  period_end?: string | null
  created_at?: string | null
  updated_at?: string | null
}

type ContextValue = {
  data: EstablishmentValue
  usageCounters: UsageCounter[]
  usageLoading: boolean
  planCode: string | null
  reload: () => Promise<void>
  reloadUsage: () => Promise<void>
}

const EstablishmentDataContext = createContext<ContextValue | null>(null)

export function EstablishmentDataProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { estId } = useEstablishment()
  const [est, setEst] = useState<EstablishmentValue>(null)
  const [usageCounters, setUsageCounters] = useState<UsageCounter[]>([])
  const [usageLoading, setUsageLoading] = useState(false)
  const [planCode, setPlanCode] = useState<string | null>(null)
  const posthog = usePostHog()

  const reload = useCallback(async () => {
    if (!estId) {
      setEst(null)
      return
    }

    const API_URL = import.meta.env.VITE_API_URL
    const res = await fetch(`${API_URL}/establishments/${estId}`)

    if (!res.ok) return

    const data = await res.json()
    setEst(data)
  }, [estId])

  const reloadUsage = useCallback(async () => {
    if (!estId) {
      setUsageCounters([])
      setUsageLoading(false)
      return
    }

    setUsageLoading(true)
    try {
      const res = await api.get<UsageCounter[]>("/usage_counters", {
        params: { establishment_id: estId, limit: 10 },
      })
      setUsageCounters(res.data ?? [])
    } finally {
      setUsageLoading(false)
    }
  }, [estId])

  useEffect(() => {
    reload().catch(() => {
      /* ignore load errors */
    })
  }, [reload])

  useEffect(() => {
    reloadUsage().catch(() => {
      /* ignore usage load errors */
    })
  }, [reloadUsage])

  useEffect(() => {
    const planId =
      est && typeof est["plan_id"] === "string" ? (est["plan_id"] as string) : null
    const planFallback =
      est && typeof est["plan"] === "string" ? (est["plan"] as string) : null
    if (!estId) {
      setPlanCode(null)
      return
    }
    let cancelled = false
    const loadPlan = async () => {
      try {
        const [productsRes, billingAccountRes] = await Promise.all([
          api.get<{ id: string; internal_code?: string | null; plan_or_addon?: string | null }[]>(
            "/product_stripe",
            { params: { limit: 200 } }
          ),
          api.get<{ id: string; free_mode?: boolean | null }[]>("/billing_account", {
            params: { establishment_id: estId, limit: 1 },
          }),
        ])

        if (cancelled) return
        const products = productsRes.data ?? []
        const billingAccount = billingAccountRes.data?.[0] ?? null
        const billingAccountId = billingAccount?.id ?? null
        const isFreeMode = Boolean(billingAccount?.free_mode)

        if (planId) {
          const match = products.find((item) => item?.id === planId)
          setPlanCode(match?.internal_code ?? planFallback ?? null)
          return
        }

        if (billingAccountId) {
          const billingItemsRes = await api.get<
            { product_id?: string | null }[]
          >("/billing_item", { params: { billling_acount_id: billingAccountId, limit: 200 } })
          if (cancelled) return
          const planItem = (billingItemsRes.data ?? []).find((item) => {
            const product = products.find((p) => p.id === item?.product_id)
            return product?.plan_or_addon === "plan"
          })
          const planProduct = products.find((p) => p.id === planItem?.product_id)
          setPlanCode(planProduct?.internal_code ?? (isFreeMode ? "PLAN_FREE" : planFallback) ?? null)
          return
        }

        setPlanCode(isFreeMode ? "PLAN_FREE" : planFallback ?? null)
      } catch {
        if (!cancelled) setPlanCode(planFallback ?? null)
      }
    }
    loadPlan()
    return () => {
      cancelled = true
    }
  }, [est, estId])

  useEffect(() => {
    if (!posthog || !estId) return
    const estName = est && typeof est["name"] === "string" ? (est["name"] as string) : undefined
    posthog.group("establishment", estId, {
      name: estName,
    })
  }, [posthog, estId, est])

  return (
    <EstablishmentDataContext.Provider
      value={{ data: est, usageCounters, usageLoading, planCode, reload, reloadUsage }}
    >
      {children}
    </EstablishmentDataContext.Provider>
  )
}

export function useEstablishmentData() {
  return useContext(EstablishmentDataContext)?.data
}

export function useEstablishmentDataReload() {
  return useContext(EstablishmentDataContext)?.reload
}

export function useEstablishmentUsageCounters() {
  return useContext(EstablishmentDataContext)?.usageCounters ?? []
}

export function useEstablishmentUsageCountersLoading() {
  return Boolean(useContext(EstablishmentDataContext)?.usageLoading)
}

export function useEstablishmentUsageCountersReload() {
  return useContext(EstablishmentDataContext)?.reloadUsage
}

export function useEstablishmentPlanCode() {
  return useContext(EstablishmentDataContext)?.planCode ?? null
}
