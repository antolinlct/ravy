"use client"

import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { ChartCandlestick, ChefHat, House, ReceiptEuro, Wallet } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  match: (path: string) => boolean
}

const navItems: NavItem[] = [
  {
    label: "Accueil",
    to: "/dashboard",
    icon: House,
    match: (path) => path === "/dashboard" || path === "/dashboard/",
  },
  {
    label: "Factures",
    to: "/dashboard/invoices",
    icon: ReceiptEuro,
    match: (path) => path.startsWith("/dashboard/invoices"),
  },
  {
    label: "Recettes",
    to: "/dashboard/recipes",
    icon: ChefHat,
    match: (path) => path.startsWith("/dashboard/recipes"),
  },
  {
    label: "Analyses",
    to: "/dashboard/analytics/products",
    icon: ChartCandlestick,
    match: (path) => path.startsWith("/dashboard/analytics"),
  },
  {
    label: "Mercuriales",
    to: "/dashboard/market/mercuriales",
    icon: Wallet,
    match: (path) => path.startsWith("/dashboard/market/mercuriales"),
  },
]

export function MobileBottomNav() {
  const isMobile = useIsMobile()
  const location = useLocation()

  if (!isMobile) return null

  return (
    <nav className="shrink-0 border-t border-sidebar-border/60 bg-[#F6F8FF] pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 px-2">
        {navItems.map((item) => {
          const isActive = item.match(location.pathname)
          const Icon = item.icon

          return (
            <Link
              key={item.label}
              to={item.to}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-muted-foreground transition-colors",
                isActive && "text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
