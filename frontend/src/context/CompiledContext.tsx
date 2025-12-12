/**
 * CompiledContext.tsx
 * -------------------
 * Regroupe tous les providers globaux de l'application.
 *
 * Objectif :
 *  - Centraliser l'ordre et la hiérarchie des différents contextes
 *  - Simplifier la lecture de App.tsx
 *  - Ajouter / retirer un provider sans toucher à toute l'application
 *
 * Ordre d'imbrication :
 *  1. UserProvider               → charge user_id
 *  2. UserDataProvider           → charge les infos du user
 *  3. EstablishmentProvider      → stocke l'établissement actif
 *  4. EstablishmentDataProvider  → charge les infos de cet établissement
 *
 * Aucun de ces providers ne bloque l'accès aux pages publiques.
 */

"use client"

import { UserProvider } from "./UserContext"
import { UserDataProvider } from "./UserDataContext"
import { EstablishmentProvider } from "./EstablishmentContext"
import { EstablishmentDataProvider } from "./EstablishmentDataContext"

export function CompiledContext({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <UserDataProvider>
        <EstablishmentProvider>
          <EstablishmentDataProvider>
            {children}
          </EstablishmentDataProvider>
        </EstablishmentProvider>
      </UserDataProvider>
    </UserProvider>
  )
}
