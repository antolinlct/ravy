import { BackofficeSidebar } from "@/components/backoffice/sidebar/backoffice-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import "@/styles/backoffice-theme.css"

export function BackofficeShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="backoffice-theme">
      <BackofficeSidebar variant="inset" />
      {children}
    </SidebarProvider>
  )
}
