"use client"

import * as React from "react"
import {
  BotMessageSquare,
  ChartCandlestick,
  ChefHat,
  HandCoins,
  HeartHandshake,
  House,
  ReceiptEuro,
  Wrench,
} from "lucide-react"

import { NavAnnex } from "@/components/dashboard/sidebar/nav-annex"
import { NavMain } from "@/components/dashboard/sidebar/nav-main"
// import { NavProjects } from "@/components/dashboard/sidebar/nav-projects" <- UTILE QUE SI PROJETS DE PRESENTS
import { NavUser } from "@/components/dashboard/sidebar/nav-user"
import { TeamSwitcher } from "@/components/dashboard/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useEstablishment } from "@/context/EstablishmentContext"
import { useEstablishmentData } from "@/context/EstablishmentDataContext"
import { Link } from "react-router-dom"

const LOGO_BUCKET = import.meta.env.VITE_SUPABASE_LOGO_BUCKET || "logos"
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ""

function normalizeLogoPath(raw: string | null | undefined) {
  if (!raw) return null
  return raw.replace(/^logos\//, "")
}

function getLogoUrl(logoPath: string | null | undefined) {
  if (!logoPath) return null
  if (/^https?:\/\//i.test(logoPath)) return logoPath
  if (!SUPABASE_URL) return null
  return `${SUPABASE_URL}/storage/v1/object/public/${LOGO_BUCKET}/${logoPath}`
}

// This is sample data.
const data = {
  navMain: [
    {
      title: "Accueil",
      url: "/dashboard",
      icon: House,
      isActive: false,
    },
    {
      title: "Factures",
      url: "/dashboard/invoices",
      icon: ReceiptEuro,
      isActive: false,
    },
    {
      title: "Recettes",
      url: "/dashboard/recipes",
      icon: ChefHat,
      isActive: false,
    },
    {
      title: "Analyses",
      url: "/dashboard/analytics/products",
      icon: ChartCandlestick,
      isActive: false,
      items: [
        {
          title: "Produits",
          url: "/dashboard/analytics/products",
        },
        {
          title: "Recettes",
          url: "/dashboard/analytics/recipes",
        },
      ],
    },
    {
      title: "Performances",
      url: "/dashboard/performance",
      icon: HandCoins,
      items: [
        {
          title: "Scores",
          url: "/dashboard/performance",
        },
        {
          title: "Rapports financiers",
          url: "/dashboard/performance/reports",
        },
        {
        title: "Achats",
          url: "/dashboard/performance/purchases",
        },
      ],
    },
    {
      title: "Consultant",
      url: "/dashboard/consultant",
      icon: BotMessageSquare,
      isActive: false,
    },
  ],
 /* projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map, 
    },
  ],<- UTILE POUR RAJOUTER DES PROJET? */ 
  navAnnex: [
    {
      title: "Paramètres",
      url: "/dashboard/settings/account",
      icon: Wrench,
      isActive: false,
    },
    {
      title: "Aide & Tutoriel",
      url: "/dashboard/settings/help",
      icon: HeartHandshake,
      isActive: false,
    },
 ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { estId } = useEstablishment()
  const establishment = useEstablishmentData()

  const teams = React.useMemo(
    () =>
      estId || establishment
        ? [
            {
              id: estId ?? establishment?.id ?? "establishment",
              name: establishment?.name?.trim() || "Établissement",
              logoUrl: getLogoUrl(
                normalizeLogoPath(
                  (establishment?.logo_path as string | null | undefined) ??
                    (establishment?.logoUrl as string | null | undefined) ??
                    (establishment?.logo_url as string | null | undefined)
                )
              ),
              plan:
                (establishment?.plan as string | null | undefined) ??
                null,
            },
          ]
        : [],
    [estId, establishment]
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavAnnex items={data.navAnnex} />
       {/* <NavProjects projects={data.projects} /> <- UTILE POUR RAJOUTER DES PROJETS */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
