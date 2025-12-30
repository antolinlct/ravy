# Dashboard market (market/*) - AGENTS

## Purpose
- Regroupe les outils “marché” côté utilisateur :
  - `purchases/index.tsx` : comparateur de prix + base de données marché (AG Grid + sheet détail).
  - `mercuriales/mercuriales.tsx` : liste des mercuriales fournisseurs + demande d’une nouvelle.
  - `mercuriales/details.tsx` : mercuriale d’un fournisseur (AG Grid + sélection de période).

## Current implementation (structure)
- `frontend/src/pages/dashboard/market/purchases/index.tsx`
  - UI principale (comparateur + base de données marché + sheet détail).
  - Données via `useMarketOverviewData`.
- `frontend/src/pages/dashboard/market/purchases/components/`
  - `MarketComparatorCard` : comparateur (sélections + série + commentaire).
  - `MarketDatabaseCard` : base de données (AG Grid + plein écran).
  - `MarketProductSheet` : panneau latéral de détail produit.
- `frontend/src/pages/dashboard/market/purchases/api.ts`
  - `fetchMarketOverview` → `GET /market/overview`.
  - `useMarketOverviewData` construit `supplierOptions`, `productOptions`, `marketProductRows`,
    `priceSeriesByProduct`, `statsByProductId`, `userByProductId`, `productUsageById`.
- `frontend/src/pages/dashboard/market/purchases/types.ts`
  - Types alignés avec la réponse `market_database_overview`.
- `frontend/src/pages/dashboard/market/mercuriales/mercuriales.tsx`
  - Liste des fournisseurs de mercuriales (cards) + dialog “Demander une mercuriale”.
- `frontend/src/pages/dashboard/market/mercuriales/details.tsx`
  - Détail d’une mercuriale (AG Grid), recherche produit, sélection de période, plein écran.
- `frontend/src/pages/dashboard/market/mercuriales/components/`
  - `MercurialeRequestDialog` : demande de mercuriale (dialog + validation locale).
  - `MercurialeSuppliersCard` : liste des fournisseurs (cards + états vides/erreur).
  - `MercurialeDetailsHeader` : header avec retour + niveau d’accès.
  - `MercurialeTableCard` : tableau mercuriale + recherche + sélection période + plein écran.
- `frontend/src/pages/dashboard/market/mercuriales/api.ts`
  - `fetchMercurialeSuppliers`, `fetchMercuriales`, `fetchMercurialeMasterArticles`, `fetchMercurialeArticles`.
  - `useMercurialeSuppliers` + `useMercurialeSupplierData`.
- `frontend/src/pages/dashboard/market/mercuriales/types.ts`
  - Types pour `mercuriale_supplier`, `mercuriales`, `mercuriale_master_article`, `mercuriale_articles`.

## Data flow (purchases)
- Source : `GET /market/overview` (`market_database_overview_read.py`).
- `useMarketOverviewData` mappe :
  - `suppliers` → `supplierOptions` (id, label, usedByUser)
  - `market_master_article` → `productOptions` / `marketProductRows`
  - `series_daily` → `priceSeriesByProduct`
  - `stats` → `statsByProductId`
  - `user` → `userByProductId`
  - `count_purchases` → `productUsageById` (proxy pour l’intérêt)

## Column logic (purchases)
- Fournisseur/Produit :
  - ligne “group” pour le fournisseur, ligne “product” indentée.
  - toggle `collapsedSuppliers`.
- Volatilité : min/max via stats ou séries.
- Prix moyen / Dernier prix : stats ou séries + `/unité`.
- Variation : % (stats ou séries) + couleurs (green/red).
- Mise à jour : date formatée `dd mmm, yyyy`.
- Intérêt : % basé sur `productUsageById` + icônes (Skull/Flame/Rocket).
- Recommandations : `user.recommendation_badge` sinon heuristiques (volatilité/délai/intérêt).
- Action : bouton “+” ouvre le sheet détail.

## Product sheet (purchases)
- Affiche : volatilité, prix moyen, variation, dernier prix, intérêt, recommandation.
- Note consultant : règle simple basée sur intérêt + variation.
- Avatar consultant : `avatar.png`.

## Comparateur (purchases)
- Double sélection fournisseur/produit + plage de dates + intervalle (jour/semaine/mois).
- Série agrégée par intervalle avec fallback (carry-forward).
- Calcul d’écart et message consultant.

## Mercuriales list (mercuriales/mercuriales.tsx)
- Source : `GET /mercuriale_supplier`.
- Card par fournisseur : logo (`mercurial_logo_path` si dispo) + nom.
- `active === false` → carte grisée + “Bientôt disponible”.
- Dialog “Demander une mercuriale” : local-only (pas de write backend pour l’instant).

## Mercuriales detail (mercuriales/details.tsx)
- Source data :
  - `useMercurialeSupplierData(id)` → fournisseurs + mercuriales + master articles + articles.
  - `useUserMercurialeAccess()` → niveau `STANDARD|PLUS|PREMIUM`.
  - `useMarketOverviewData()` → comparaison prix user vs mercuriale (statut).
- Sélection période :
  - tri des mercuriales par `effective_from` (desc), fallback dates.
  - label dropdown “Du … au …” (D majuscule), title “Mercuriale valable du … au …”.
  - `previousMercuriale` = index+1 → variation.
- Tableau :
  - `unitPrice` selon niveau (fallback premium → plus → standard).
  - `variation` = (prix courant - prix précédent) / prix précédent.
  - `statut` compare prix mercuriale vs prix d’achat user (`user_avg_unit_price`).
  - `unit` + `vat_rate` depuis `mercuriale_master_article`.

## AG Grid
- Thème : `themeQuartz` + `data-ag-theme-mode`.
- `suppressDragLeaveHidesColumns` pour éviter la suppression de colonnes.
- Mode plein écran via `Dialog`.

## Notes d’implémentation
- Normalisation recherche : lower + remove accents.
- Si pas de dates mercuriale → label `--`.
- `market_supplier_id` (mercuriale supplier) sert à charger la comparaison user (market overview).

## Files to edit when adding new data
- `purchases/api.ts` si la réponse `/market/overview` évolue.
- `mercuriales/api.ts` si nouveaux champs mercuriales.
- `mercuriales/details.tsx` pour toute logique d’agrégation (variation, statut).
