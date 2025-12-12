/* eslint-disable @typescript-eslint/no-unused-vars */
// src/router/app-routes.tsx
import type { RouteObject } from "react-router-dom";

// --- Pages système ---
import LoginPage from "../pages/system/LoginPage.tsx";
import ResetPasswordPage from "../pages/system/ResetPasswordPage.tsx";
import MaintenancePage from "../pages/system/MaintenancePage.tsx";
import NotFoundPage from "../pages/system/NotFoundPage.tsx";
import SignupPage from "@/pages/system/SignupPage.tsx";

// --- Page Admin (backoffice) ---
import AdminPage from "../pages/admin/AdminPage.tsx";

// --- Landing (publique) ---
import LandingPage from "../pages/Landing.tsx";

// --- Dashboard ---
import DashboardHomePage from "../pages/dashboard/home/index.tsx";
import DashboardLayout from "../layouts/DashboardLayout.tsx";

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
import PerformancePage from "../pages/dashboard/performance/index.tsx";
import FinancialReportsPage from "../pages/dashboard/performance/reports.tsx";
import PerformancePurchasesPage from "../pages/dashboard/performance/purchases.tsx";

// Consultant
import ConsultantPage from "../pages/dashboard/consultant/index.tsx";

// Paramètres
import SettingsLayout from "../layouts/SettingsLayout.tsx"
import AccountSettingsPage from "../pages/dashboard/settings/account.tsx";
import OrganizationSettingsPage from "../pages/dashboard/settings/organization.tsx";
import SecuritySettingsPage from "../pages/dashboard/settings/security.tsx";
import PreferencesSettingsPage from "../pages/dashboard/settings/preferences.tsx";
import EmailSettingsPage from "../pages/dashboard/settings/emails.tsx";
import TicketSupportPage from "../pages/dashboard/settings/tickets.tsx";
import SubscriptionPage from "../pages/dashboard/settings/subscription.tsx";
import HelpPage from "../pages/dashboard/settings/help.tsx";
import { RequireAuth } from "@/components/auth/RequireAuth.tsx";
import { AppShell } from "@/layouts/AppShell"

// --- Déclaration de toutes les routes ---
export const appRoutes: RouteObject[] = [
  // Landing publique
  { path: "/", element: <LandingPage /> },

  // Pages système
  { path: "/login", element: <LoginPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/maintenance", element: <MaintenancePage /> },
  { path: "/signup", element: <SignupPage/>},

  // Backoffice admin
  { path: "/admin", element: <AdminPage /> },

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
    { path: "performance", element: <PerformancePage /> },
    { path: "performance/reports", element: <FinancialReportsPage /> },
    { path: "performance/purchases", element: <PerformancePurchasesPage /> },

    // Consultant IA
    { path: "consultant", element: <ConsultantPage /> },

    // Paramètres
    {
      path: "settings",
      element: <SettingsLayout/>,
      children: [
          { path: "", element: <AccountSettingsPage /> },
           { path: "account", element: <AccountSettingsPage /> },
           { path: "organization", element: <OrganizationSettingsPage /> },
           { path: "security", element: <SecuritySettingsPage /> },
           { path: "preferences", element: <PreferencesSettingsPage /> },
           { path: "emails", element: <EmailSettingsPage /> },
           { path: "tickets", element: <TicketSupportPage /> },
           { path: "subscription", element: <SubscriptionPage /> },
           { path: "help", element: <HelpPage /> },
           ],
      }           
  ],
},

  // Fallback 404
  { path: "*", element: <NotFoundPage /> },
];
