// src/layouts/AppShell.tsx
// POur eviter un reload de la sidebar

import { AppSidebar } from "@/components/dashboard/sidebar/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      {children}
    </SidebarProvider>
  )
}
