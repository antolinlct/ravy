import { Link, Outlet, useLocation } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { OnboardingGate } from "@/features/onboarding/OnboardingGate"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function DashboardLayout() {
  const location = useLocation()

  const segments = location.pathname.split("/").filter(Boolean)
  const settingsIndex = segments.indexOf("settings")
  const currentSettingsPage =
    settingsIndex >= 0 ? segments[settingsIndex + 1] : null

  const labels: Record<string, string> = {
    account: "Compte",
    establishment: "Établissement",
    integrations: "Intégrations",
    preferences: "Préférences",
    subscription: "Abonnement",
    tickets: "Tickets & Support",
    access: "Utilisateurs & accès",
    help: "Support",
  }

  const settingsLabel = "Paramètres"
  const currentLabel =
    (currentSettingsPage && labels[currentSettingsPage]) || null

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {currentLabel ? (
                <>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link to="/dashboard/settings/account">{settingsLabel}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage>{settingsLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Outlet />
      </div>

      <OnboardingGate />
    </SidebarInset>
  )
}
