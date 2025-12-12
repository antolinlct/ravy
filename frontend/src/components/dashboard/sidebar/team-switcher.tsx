"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"

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
import { cn } from "@/lib/utils"
import { useEstablishment } from "@/context/EstablishmentContext"
import { useEstablishmentData } from "@/context/EstablishmentDataContext"

const LOGO_BUCKET = import.meta.env.VITE_SUPABASE_LOGO_BUCKET || "logos"
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ""

function normalizeLogoPath(raw: string | null | undefined) {
  if (!raw) return null
  return raw.replace(/^logos\//, "")
}

function resolveLogoUrl(logoPath: string | null | undefined) {
  if (!logoPath) return null
  if (/^https?:\/\//i.test(logoPath)) return logoPath
  if (!SUPABASE_URL) return null
  return `${SUPABASE_URL}/storage/v1/object/public/${LOGO_BUCKET}/${logoPath}`
}

type Team = {
  id: string
  name: string
  logoUrl?: string | null
  plan?: string | null
}

export function TeamSwitcher({
  teams,
}: {
  teams?: Team[]
}) {
  const { isMobile } = useSidebar()
  const { estId, select } = useEstablishment()
  const establishment = useEstablishmentData()

  const derivedTeams = React.useMemo(() => {
    if (teams?.length) return teams

    if (estId || establishment) {
      const logoPath = normalizeLogoPath(
        (establishment?.logo_path as string | null | undefined) ??
          (establishment?.logoUrl as string | null | undefined) ??
          (establishment?.logo_url as string | null | undefined)
      )

      return [
        {
          id: estId ?? establishment?.id ?? "establishment",
          name: establishment?.name?.trim() || "Établissement",
          logoUrl: resolveLogoUrl(logoPath),
          plan:
            (establishment?.plan as string | null | undefined) ??
            null,
        },
      ]
    }

    return []
  }, [teams, estId, establishment])

  const activeTeam =
    derivedTeams.find((team) => team.id === (estId ?? derivedTeams[0]?.id)) ||
    derivedTeams[0]

  const displayTeam = React.useMemo(() => {
    if (!activeTeam) return null

    const logoPath = normalizeLogoPath(
      (establishment?.logo_path as string | null | undefined) ??
        (establishment?.logoUrl as string | null | undefined) ??
        (establishment?.logo_url as string | null | undefined)
    )

    return {
      ...activeTeam,
      name: establishment?.name?.trim() || activeTeam.name,
      logoUrl: resolveLogoUrl(logoPath) ?? activeTeam.logoUrl,
      plan:
        (establishment?.plan as string | null | undefined) ??
        activeTeam.plan ??
        null,
    }
  }, [activeTeam, establishment])

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
          className={cn("h-full w-full object-contain p-1", className)}
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
    <SidebarMenu>
      <SidebarMenuItem>
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent text-sidebar-foreground border border-sidebar-border/50 overflow-hidden">
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
              <ChevronsUpDown className="ml-auto" />
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
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Ajouter un restaurant</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
