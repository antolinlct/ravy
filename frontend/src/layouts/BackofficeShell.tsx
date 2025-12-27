import { BackofficeSidebar } from "@/components/backoffice/sidebar/backoffice-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export function BackofficeShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <BackofficeSidebar variant="inset" />
      {children}
    </SidebarProvider>
  )
}
