"use client"

import * as React from "react"
import { Building, ChevronsUpDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useEstablishment } from "@/context/EstablishmentContext"
import { useEstablishmentData } from "@/context/EstablishmentDataContext"
import { useUserEstablishments } from "@/context/UserEstablishmentsContext"
import { OnboardingModal } from "@/features/onboarding/OnboardingModal"
import { getSignedLogoUrl } from "@/lib/logoStorage"

type EstablishmentData = {
  id?: string | null
  name?: string | null
  logo_path?: string | null
  logoUrl?: string | null
  logo_url?: string | null
  plan?: string | null
}

function getRawLogoValue(
  source: { logo_path?: unknown; logo_url?: unknown; logoUrl?: unknown } | null | undefined
) {
  if (!source) return null
  const raw = source.logo_path ?? source.logo_url ?? source.logoUrl
  return typeof raw === "string" ? raw : null
}

type Team = {
  id: string
  name: string
  logoUrl?: string | null
  plan?: string | null
}

export function TeamSwitcher({
  teams,
  onEstablishmentCreated,
}: {
  teams?: Team[]
  onEstablishmentCreated?: () => void
}) {
  const { isMobile, state } = useSidebar()
  const { estId, select } = useEstablishment()
  const establishment = useEstablishmentData() as EstablishmentData | null
  const userEstablishments = useUserEstablishments()
  const [userTeams, setUserTeams] = React.useState<Team[]>([])
  const [activeLogoUrl, setActiveLogoUrl] = React.useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = React.useState(false)
  const isCollapsed = !isMobile && state === "collapsed"

  const loadUserTeams = React.useCallback(async () => {
    const API_URL = import.meta.env.VITE_API_URL
    const links = userEstablishments?.list ?? []
    if (!API_URL || !links.length) {
      setUserTeams([])
      return
    }

    const fetched = await Promise.all(
      links.map(async ({ establishmentId }) => {
        try {
          const res = await fetch(`${API_URL}/establishments/${establishmentId}`)
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

    const mapped = await Promise.all(
      valid.map(async (est) => {
        const rawLogo = getRawLogoValue(est)
        const logoUrl = await getSignedLogoUrl(rawLogo)
        return {
          id: est.id,
          name: est.name?.trim() || "Établissement",
          logoUrl,
          plan: null,
        }
      })
    )

    setUserTeams(mapped)
  }, [userEstablishments?.list])

  React.useEffect(() => {
    loadUserTeams()
  }, [loadUserTeams])

  React.useEffect(() => {
    let isActive = true
    const rawLogo = getRawLogoValue(establishment)

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

  const derivedTeams = React.useMemo(() => {
    const activeId =
      estId ??
      (typeof establishment?.id === "string" ? establishment.id : null) ??
      userTeams[0]?.id ??
      null

    if (teams?.length) return teams
    if (userTeams.length) {
      return userTeams.map((team) => ({
        ...team,
        logoUrl: team.id === activeId ? activeLogoUrl ?? team.logoUrl : team.logoUrl,
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
  }, [teams, userTeams, estId, establishment, activeLogoUrl])

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey)) return
      const index = Number.parseInt(event.key, 10)
      if (!Number.isInteger(index) || index < 1 || index > derivedTeams.length || index > 9) {
        return
      }
      event.preventDefault()
      const target = derivedTeams[index - 1]
      if (target) {
        select(target.id)
        toast.success("Établissement changé", {
          description: (
            <span>
              Vous êtes maintenant sur <strong>{target.name}</strong>
            </span>
          ),
          duration: 5000,
          icon: <Building className="h-4 w-4" />,
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [derivedTeams, select])

  const activeTeam =
    derivedTeams.find((team) => team.id === (estId ?? derivedTeams[0]?.id)) ||
    derivedTeams[0]

  const displayTeam = React.useMemo(() => {
    if (!activeTeam) return null

    return {
      ...activeTeam,
      name:
        typeof establishment?.name === "string"
          ? establishment.name.trim() || activeTeam.name
          : activeTeam.name,
      logoUrl: activeLogoUrl ?? activeTeam.logoUrl,
      plan: establishment?.plan ?? activeTeam.plan ?? null,
    }
  }, [activeLogoUrl, activeTeam, establishment])

  if (!displayTeam) {
    return null
  }

  const renderLogo = (team: Team, className?: string) => {
    const initial =
      team.name?.trim()?.charAt(0)?.toUpperCase() || "E"

    if (team.logoUrl) {
      return (
        <img
          src={team.logoUrl}
          alt="Logo"
          className={cn("h-full w-full object-contain p-0.5", className)}
        />
      )
    }

    return (
      <span className={cn("text-xs font-semibold", className)}>
        {initial}
      </span>
    )
  }

  return (
    <>
    <SidebarMenu>
      <SidebarMenuItem>
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex h-8 w-8 min-h-8 min-w-8 items-center justify-center rounded-lg bg-transparent text-sidebar-foreground border border-sidebar-border/50 overflow-hidden">
                {renderLogo(displayTeam, "rounded-lg")}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {displayTeam.name}
                </span>
                {displayTeam.plan && (
                  <span className="truncate text-xs">{displayTeam.plan}</span>
                )}
              </div>
              <ChevronsUpDown className={cn("ml-auto", isCollapsed && "hidden")} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Restaurants
            </DropdownMenuLabel>
            {derivedTeams?.map((team, index) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => select(team.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border border-sidebar-border/60 bg-transparent overflow-hidden">
                  {renderLogo(team, "rounded-sm")}
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onSelect={(e) => {
                e.preventDefault()
                setShowOnboarding(true)
              }}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Ajouter un restaurant</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <OnboardingModal
        step={showOnboarding ? "establishment" : null}
        onDone={(createdId) => {
          setShowOnboarding(false)
          if (createdId) {
            select(createdId)
          }
          onEstablishmentCreated?.()
          userEstablishments?.reload()
        }}
        onClose={() => setShowOnboarding(false)}
        requireAtLeastOne={false}
      />
    </SidebarMenu>
    </>
  )
}
