// src/router/app-routes.tsx
import type { RouteObject } from "react-router-dom";

// --- Pages système ---
import LoginPage from "../pages/system/LoginPage.tsx";
import ResetPasswordPage from "../pages/system/ResetPasswordPage.tsx";
import MaintenancePage from "../pages/system/MaintenancePage.tsx";
import NotFoundPage from "../pages/system/NotFoundPage.tsx";
import SignupPage from "@/pages/system/SignupPage.tsx";

// --- Page Admin (backoffice) ---
import AdminEstablishmentsPage from "@/pages/admin/establishments/index.tsx";
import AdminLogsPage from "@/pages/admin/logs/index.tsx";
import AdminMarketPage from "@/pages/admin/market/index.tsx";
import AdminMercurialesPage from "@/pages/admin/mercuriales/index.tsx";
import AdminMergesPage from "@/pages/admin/merges/index.tsx";
import AdminRegexPage from "@/pages/admin/regex/index.tsx";
import AdminTicketsPage from "@/pages/admin/tickets/index.tsx";


// --- Landing (publique) ---
import LandingPage from "../pages/Landing.tsx";

// --- Dashboard ---
import DashboardHomePage from "../pages/dashboard/home/index.tsx";
import DashboardLayout from "../layouts/DashboardLayout.tsx";
import BackofficeLayout from "@/layouts/BackofficeLayout.tsx";

// Factures
import InvoicesPage from "../pages/dashboard/invoices/index.tsx";
import InvoiceDetailPage from "../pages/dashboard/invoices/detail.tsx";
import SuppliersPage from "../pages/dashboard/invoices/suppliers.tsx";

// Recettes
import RecipesPage from "../pages/dashboard/recipes/index.tsx";
import RecipeDetailPage from "../pages/dashboard/recipes/detail.tsx";

// Analyses - Produits
import ProductAnalyticsPage from "../pages/dashboard/analytics/products/index.tsx";
import ProductDetailPage from "../pages/dashboard/analytics/products/detail.tsx";

// Analyses - Recettes
import RecipeAnalyticsPage from "../pages/dashboard/analytics/recipes/index.tsx";
import RecipeAnalyticsDetailPage from "../pages/dashboard/analytics/recipes/detail.tsx";

// Performances
import PerformanceScoresPage from "../pages/dashboard/performance/scores.tsx";
import PerformancesReportsPage from "../pages/dashboard/performance/reports.tsx";
import PerformancesReportsDetailsPage from "../pages/dashboard/performance/details.tsx";

// Marché & Achats
import MarketPurchasesPage from "../pages/dashboard/market/purchases/index.tsx";
import MarketMercurialesPage from "../pages/dashboard/market/mercuriales/mercuriales.tsx";
import MarketMercurialesDetailsPage from "../pages/dashboard/market/mercuriales/details.tsx";

// Consultant
import ConsultantPage from "../pages/dashboard/consultant/consultant.tsx";

// Paramètres
import SettingsLayout from "../layouts/SettingsLayout.tsx"
import AccountSettingsPage from "../pages/dashboard/settings/account.tsx";
import EstablishmentSettingsPage from "../pages/dashboard/settings/establishment.tsx";
import SubscriptionPage from "../pages/dashboard/settings/subscription.tsx";
import UsersSupportPage from "@/pages/dashboard/settings/users.tsx";
import PreferencesSettingsPage from "../pages/dashboard/settings/preferences.tsx";
import TicketSupportPage from "../pages/dashboard/settings/tickets.tsx";
import IntegrationsSupportPage from "@/pages/dashboard/settings/integrations.tsx";
import HelpPage from "../pages/dashboard/help/index.tsx";

// Composants de sécurité et layout
import { RequireAuth } from "@/components/auth/RequireAuth.tsx";
import { RequirePadrino } from "@/components/auth/RequirePadrino.tsx";
import { AppShell } from "@/layouts/AppShell"
import { BackofficeShell } from "@/layouts/BackofficeShell"

// --- Déclaration de toutes les routes ---
export const appRoutes: RouteObject[] = [
  // Landing publique
  { path: "/", element: <LandingPage /> },

  // Pages système
  { path: "/login", element: <LoginPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/maintenance", element: <MaintenancePage /> },
  { path: "/signup", element: <SignupPage/>},

  // Dashboard principal
{
  path: "/dashboard",
  element: (
    <RequireAuth>
      <AppShell>
        <DashboardLayout />
      </AppShell>
    </RequireAuth>
  ),
  children: [
    // Accueil Dashboard
    { path: "", element: <DashboardHomePage /> },

    // Factures
    { path: "invoices", element: <InvoicesPage /> },
    { path: "invoices/:id", element: <InvoiceDetailPage /> },
    { path: "invoices/suppliers", element: <SuppliersPage /> },

    // Recettes
    { path: "recipes", element: <RecipesPage /> },
    { path: "recipes/:id", element: <RecipeDetailPage /> },

    // Analyses Produits
    { path: "analytics/products", element: <ProductAnalyticsPage /> },
    { path: "analytics/products/:id", element: <ProductDetailPage /> },

    // Analyses Recettes
    { path: "analytics/recipes", element: <RecipeAnalyticsPage /> },
    { path: "analytics/recipes/:id", element: <RecipeAnalyticsDetailPage /> },

    // Performances
    { path: "performance/scores", element: <PerformanceScoresPage /> },
    { path: "performance/reports", element: <PerformancesReportsPage /> },
    {path: "performance/reports/:id", element: <PerformancesReportsDetailsPage /> },

    // Marché & Achats
    { path: "market/purchases", element: <MarketPurchasesPage /> },
    { path: "market/mercuriales", element: <MarketMercurialesPage /> },
    { path: "market/mercuriales/:id", element: <MarketMercurialesDetailsPage /> },

    // Consultant IA
    { path: "consultant", element: <ConsultantPage /> },

    // Paramètres
    {
      path: "settings",
      element: <SettingsLayout/>,
      children: [
          { path: "", element: <AccountSettingsPage /> },
           { path: "account", element: <AccountSettingsPage /> },
           { path: "establishment", element: <EstablishmentSettingsPage /> },
           { path: "subscription", element: <SubscriptionPage /> },
           { path: "access", element: <UsersSupportPage/> },
           { path: "preferences", element: <PreferencesSettingsPage /> },
           { path: "tickets", element: <TicketSupportPage /> },
           { path: "integrations", element: <IntegrationsSupportPage /> },
           ],
      },
      
    // Aide
    { path: "help", element: <HelpPage /> },
  ],
},

// Backoffice Admin
{
  path: "/backoffice",
  element: (
    <RequirePadrino>
      <BackofficeShell>
        <BackofficeLayout />
      </BackofficeShell>
    </RequirePadrino>
  ),
  children: [
    // Backoffice - Accueil redirige vers établissements
    { path: "", element: <AdminEstablishmentsPage /> },

    // Backoffice - Établissements
    { path: "establishments", element: <AdminEstablishmentsPage /> },

    // Backoffice - Logs
    { path: "logs", element: <AdminLogsPage /> },

    // Backoffice - Marché
    { path: "market", element: <AdminMarketPage /> },

    // Backoffice - Mercuriales
    { path: "mercuriales", element: <AdminMercurialesPage /> },

    // Backoffice - Fusions fournisseurs
    {path: "merges", element: <AdminMergesPage /> },

    // Backoffice - Regex
    { path: "regex", element: <AdminRegexPage /> },

    // Backoffice - Tickets Support
    { path: "tickets", element: <AdminTicketsPage /> },
      
  ],
},
  // Fallback 404
  { path: "*", element: <NotFoundPage /> },
];
