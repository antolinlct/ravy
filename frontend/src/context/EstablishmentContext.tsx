/**
 * EstablishmentContext.tsx
 * ------------------------
 * Contexte global permettant de conserver l'établissement actif sélectionné
 * par l'utilisateur.
 *
 * Objectifs :
 *  - éviter de re-fetch l'établissement à chaque navigation
 *  - conserver le choix de l'utilisateur même en changeant de page
 *  - exposer une API simple : { estId, select() }
 *
 * Règles :
 *  - Ce contexte ne gère pas l'authentification
 *  - Il ne valide pas que l'utilisateur appartient à l'établissement (backend)
 *  - Il stocke simplement l'ID de l'établissement choisi dans localStorage
 *
 * Fonctionnement :
 *  1) Lecture de current_establishment_id depuis localStorage au chargement
 *  2) La fonction select(id) met à jour localStorage + le state React
 *  3) Tous les composants qui consomment ce contexte sont automatiquement mis à jour
 *
 * À modifier uniquement si :
 *  - tu veux stocker plus d'informations liées à l'établissement actif
 *  - tu veux créer un mécanisme de validation avancée (backend)
 */

"use client"

import { createContext, useContext, useEffect, useState } from "react"

interface EstablishmentContextType {
  estId: string | null
  select: (id: string) => void
  clear: () => void
}

const EstContext = createContext<EstablishmentContextType>({
  estId: null,
  select: () => {},
  clear: () => {},
})

export function EstablishmentProvider({ children }: { children: React.ReactNode }) {
  const [estId, setEstId] = useState<string | null>(null)

  useEffect(() => {
    setEstId(localStorage.getItem("current_establishment_id"))
  }, [])

  function select(id: string) {
    localStorage.setItem("current_establishment_id", id)
    setEstId(id)
  }

  function clear() {
    localStorage.removeItem("current_establishment_id")
    setEstId(null)
  }

  return (
    <EstContext.Provider value={{ estId, select, clear }}>
      {children}
    </EstContext.Provider>
  )
}

export function useEstablishment() {
  return useContext(EstContext)
}

