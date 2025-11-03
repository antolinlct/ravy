"use client"

import * as React from "react"
import {
  AudioWaveform,
  BotMessageSquare,
  ChartCandlestick,
  ChefHat,
  Command,
  GalleryVerticalEnd,
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

// This is sample data.
const data = {
  user: {
    name: "Gordon Gekko",
    email: "antolin.lacaton@ravy.fr",
    avatar: "/avatars/shadcn.jpg", // <- UTILE QUE SI AVATAR ACTIF DANS 'nav-user.tsx'
  },
  teams: [
    {
      name: "Ravy",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "WeareU",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Greed",
      logo: Command,
      plan: "Free",
    },
],
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavAnnex items={data.navAnnex} />
       {/* <NavProjects projects={data.projects} /> <- UTILE POUR RAJOUTER DES PROJETS */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
