"use client"

import { Link, useLocation } from "react-router-dom"
import {
  BookOpen,
  Braces,
  FileText,
  GitMerge,
  LifeBuoy,
  ShoppingCart,
  Users,
  LayoutDashboard,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Utilisateurs",
    url: "/backoffice/establishments",
    icon: Users,
  },
  {
    title: "Logs",
    url: "/backoffice/logs",
    icon: FileText,
  },
  {
    title: "Tickets",
    url: "/backoffice/tickets",
    icon: LifeBuoy,
  },
  {
    title: "Marché",
    url: "/backoffice/market",
    icon: ShoppingCart,
  },
  {
    title: "Fusions",
    url: "/backoffice/merges",
    icon: GitMerge,
  },
  {
    title: "Mercuriales",
    url: "/backoffice/mercuriales",
    icon: BookOpen,
  },
  {
    title: "Regex",
    url: "/backoffice/regex",
    icon: Braces,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
]

export function BackofficeSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const currentPath = location.pathname

  const isActivePath = (path: string) => {
    if (currentPath === path || currentPath === `${path}/`) return true
    if (path === "/backoffice/establishments" && currentPath === "/backoffice") {
      return true
    }
    return currentPath.startsWith(`${path}/`)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="text-sm font-semibold">Backoffice - Padrino</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActivePath(item.url)}
                >
                  <Link to={item.url} className="flex items-center gap-2">
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
