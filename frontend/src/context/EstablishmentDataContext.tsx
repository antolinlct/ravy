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

import { createContext, useContext, useEffect, useState } from "react"
import { useEstablishment } from "./EstablishmentContext"

const EstablishmentDataContext = createContext<any>(null)

export function EstablishmentDataProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { estId } = useEstablishment()
  const [est, setEst] = useState<any>(null)

  useEffect(() => {
    async function load() {
      if (!estId) return

      const API_URL = import.meta.env.VITE_API_URL
      const res = await fetch(`${API_URL}/establishments/${estId}`)

      if (!res.ok) return

      const data = await res.json()
      setEst(data)
    }

    load()
  }, [estId])

  return (
    <EstablishmentDataContext.Provider value={est}>
      {children}
    </EstablishmentDataContext.Provider>
  )
}

export function useEstablishmentData() {
  return useContext(EstablishmentDataContext)
}
