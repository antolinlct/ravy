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
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { NavAnnex } from "@/components/dashboard/sidebar/nav-annex"
import { NavMain } from "@/components/dashboard/sidebar/nav-main"
// import { NavProjects } from "@/components/dashboard/sidebar/nav-projects" <- UTILE QUE SI PROJETS DE PRESENTS
import { NavUser } from "@/components/dashboard/sidebar/nav-user"
import { TeamSwitcher } from "@/components/dashboard/sidebar/team-switcher"
import { extractLogoPath, getSignedLogoUrl } from "@/lib/logoStorage"
import { supabase } from "@/lib/supabaseClient"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useEstablishment } from "@/context/EstablishmentContext"
import {
  useEstablishmentData,
  useEstablishmentPlanCode,
  useEstablishmentUsageCounters,
} from "@/context/EstablishmentDataContext"
import { canAccess, useAccess } from "@/components/access/access-control"

type EstablishmentData = {
  id?: string | null
  name?: string | null
  logo_path?: string | null
  logoUrl?: string | null
  logo_url?: string | null
  plan?: string | null
}

type NavSubSubItem = {
  title: string
  url: string
  locked?: boolean
}

type NavSubItem = {
  title: string
  url: string
  locked?: boolean
  disabled?: boolean
  redirectTo?: string
  items?: NavSubSubItem[]
}

type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  locked?: boolean
  items?: NavSubItem[]
}

// This is sample data.
const data: { navMain: NavItem[]; navAnnex: NavItem[] } = {
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
          items: [
            {
              title: "Général",
              url: "/dashboard/analytics/products",
            },
            {
              title: "Détail",
              url: "/dashboard/analytics/products/:id",
            },
          ],
        },
        {
          title: "Recettes",
          url: "/dashboard/analytics/recipes",
          items: [
            {
              title: "Général",
              url: "/dashboard/analytics/recipes",
            },
            {
              title: "Détail",
              url: "/dashboard/analytics/recipes/:id",
            },
          ],
        },
      ],
    },
    {
      title: "Performances",
      url: "/dashboard/performance/scores",
      icon: HandCoins,
      items: [
        {
          title: "Scores",
          url: "/dashboard/performance/scores",
        },
        {
          title: "Rapports financiers",
          url: "/dashboard/performance/reports",
        },
      ],
    },
    {
      title: "Marché & Achats",
      url: "/dashboard/market/purchases",
      icon: Wallet,
      items: [
        {
          title: "Prix du marché",
          url: "/dashboard/market/purchases",
        },
        {
          title: "Mercuriales Ravy",
          url: "/dashboard/market/mercuriales",
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
      title: "Aide & Tutoriels",
      url: "/dashboard/help",
      icon: HeartHandshake,
      isActive: false,
    },
 ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { estId } = useEstablishment()
  const establishment = useEstablishmentData() as EstablishmentData | null
  const planCode = useEstablishmentPlanCode()
  const usageCounters = useEstablishmentUsageCounters()
  const { role } = useAccess()
  const [userId, setUserId] = React.useState<string | null>(null)
  const [establishments, setEstablishments] = React.useState<
    { id: string; name?: string; logo_path?: string | null; logoUrl?: string | null }[]
  >([])
  const [activeLogoUrl, setActiveLogoUrl] = React.useState<string | null>(null)

  const loadEstablishments = React.useCallback(async (uid: string | null) => {
    if (!uid) return
    const API_URL = import.meta.env.VITE_API_URL
    if (!API_URL) return

    const linkRes = await fetch(`${API_URL}/user_establishment/?user_id=${uid}`)
    if (!linkRes.ok) return

    const links = await linkRes.json()
    const establishmentIds = Array.isArray(links)
      ? links
          .filter((link) => link?.user_id === uid)
          .map((link) => link?.establishment_id)
          .filter(Boolean)
      : []

    if (!establishmentIds.length) return
    const uniqueEstablishmentIds = Array.from(new Set(establishmentIds))

    const fetched = await Promise.all(
      uniqueEstablishmentIds.map(async (id: string) => {
        try {
          const res = await fetch(`${API_URL}/establishments/${id}`)
          if (!res.ok) return null
          return await res.json()
        } catch {
          return null
        }
      })
    )

    const valid = fetched.filter(
      (est): est is { id: string; name?: string; logo_path?: string | null; logoUrl?: string | null; logo_url?: string | null } =>
        Boolean(est?.id)
    )

    const enriched = await Promise.all(
      valid.map(async (est) => {
        const rawLogo =
          est.logo_path ?? est.logoUrl ?? est.logo_url ?? null
        const logoPath =
          extractLogoPath(rawLogo) ?? (typeof rawLogo === "string" ? rawLogo : null)
        const logoUrl = await getSignedLogoUrl(rawLogo ?? logoPath)

        return {
          id: est.id,
          name: est.name,
          logo_path: logoPath,
          logoUrl,
        }
      })
    )

    setEstablishments(enriched)
  }, [])

  React.useEffect(() => {
    let isMounted = true

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!isMounted || error || !data?.user) return
        setUserId(data.user.id)
        loadEstablishments(data.user.id)
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [loadEstablishments])

  React.useEffect(() => {
    let isActive = true
    const rawLogo =
      establishment?.logo_path ?? establishment?.logoUrl ?? establishment?.logo_url ?? null

    if (!rawLogo) {
      setActiveLogoUrl(null)
      return () => {
        isActive = false
      }
    }

    getSignedLogoUrl(rawLogo).then((url) => {
      if (isActive) {
        setActiveLogoUrl(url)
      }
    })

    return () => {
      isActive = false
    }
  }, [establishment])

  const teams = React.useMemo(() => {
    const activeId =
      estId ?? (typeof establishment?.id === "string" ? establishment.id : null)

    if (establishments.length > 0) {
      return establishments.map((est) => ({
        id: est.id,
        name: est.name?.trim() || "Établissement",
        logoUrl:
          est.id === activeId ? activeLogoUrl ?? est.logoUrl ?? null : est.logoUrl ?? null,
        plan: null,
      }))
    }

    if (estId || establishment) {
      return [
        {
          id: activeId ?? "establishment",
          name:
            typeof establishment?.name === "string"
              ? establishment.name.trim() || "Établissement"
              : "Établissement",
          logoUrl: activeLogoUrl,
          plan: establishment?.plan ?? null,
        },
      ]
    }

    return []
  }, [activeLogoUrl, estId, establishment, establishments])

  const recipeLimit =
    usageCounters.find((counter) => counter.value_category === "recipe")?.limit_value ?? null
  const recipeLimitValue = typeof recipeLimit === "string" ? Number(recipeLimit) : recipeLimit
  const recipeLocked = recipeLimitValue === 0
  const planValue = typeof planCode === "string" ? planCode.toUpperCase() : null
  const performanceLocked = planValue === "PLAN_APERO" || planValue === "PLAN_PLAT"

  const navMainItems = data.navMain.map((item) => {
    if (item.url.startsWith("/dashboard/recipes")) {
      return { ...item, locked: recipeLocked }
    }
    if (item.url.startsWith("/dashboard/analytics")) {
      return {
        ...item,
        items: item.items?.map((subItem) => {
          if (subItem.url.startsWith("/dashboard/analytics/recipes")) {
            return {
              ...subItem,
              locked: recipeLocked,
              disabled: recipeLocked,
              redirectTo: recipeLocked ? "/dashboard/recipes" : undefined,
              items: subItem.items?.map((subSub) => ({
                ...subSub,
                locked: recipeLocked,
              })),
            }
          }
          return subItem
        }),
      }
    }
    if (item.url.startsWith("/dashboard/performance")) {
      return {
        ...item,
        locked: performanceLocked,
        items: item.items?.map((subItem) => ({
          ...subItem,
          locked: performanceLocked,
        })),
      }
    }
    if (item.url.startsWith("/dashboard/market")) {
      return {
        ...item,
        locked: performanceLocked,
        items: item.items?.map((subItem) => ({
          ...subItem,
          locked: performanceLocked,
        })),
      }
    }
    return item
  })

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={teams}
          onEstablishmentCreated={() => {
            loadEstablishments(userId)
          }}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navMainItems.filter((item) => {
            if (!role) return true
            if (item.url.startsWith("/dashboard/market")) {
              return canAccess(role, "consultant")
            }
            if (item.url.startsWith("/dashboard/performance")) {
              return canAccess(role, "performance")
            }
            if (item.url.startsWith("/dashboard/analytics")) {
              return canAccess(role, "analytics")
            }
            if (item.url.startsWith("/dashboard/recipes")) {
              return canAccess(role, "recipes")
            }
            if (item.url.startsWith("/dashboard/invoices")) {
              return canAccess(role, "invoices")
            }
            return true
          })}
        />
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
