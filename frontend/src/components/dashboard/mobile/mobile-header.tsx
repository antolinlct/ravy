"use client"

import * as React from "react"
import { Link } from "react-router-dom"
import { Check, ChevronDown, LifeBuoy, LogOut, Settings } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"
import { useEstablishment } from "@/context/EstablishmentContext"
import { useEstablishmentData } from "@/context/EstablishmentDataContext"
import { useUserEstablishments } from "@/context/UserEstablishmentsContext"
import { getSignedLogoUrl } from "@/lib/logoStorage"
import { supabase } from "@/lib/supabaseClient"
import api from "@/lib/axiosClient"
import { cn } from "@/lib/utils"
import FaviconOg from "@/assets/branding/favicon_og.svg"

type EstablishmentOption = {
  id: string
  name: string
  logoUrl: string | null
}

type EstablishmentData = {
  id?: string | null
  name?: string | null
  logo_path?: string | null
  logoUrl?: string | null
  logo_url?: string | null
}

function MobileEstablishmentSwitcher() {
  const isMobile = useIsMobile()
  const { estId, select } = useEstablishment()
  const establishment = useEstablishmentData() as EstablishmentData | null
  const userEstablishments = useUserEstablishments()
  const [options, setOptions] = React.useState<EstablishmentOption[]>([])
  const [activeLogoUrl, setActiveLogoUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!isMobile) return
    const links = userEstablishments?.list ?? []
    if (!links.length) {
      setOptions([])
      return
    }

    let active = true
    setLoading(true)

    Promise.all(
      links.map(async ({ establishmentId }) => {
        try {
          const res = await api.get<EstablishmentData>(`/establishments/${establishmentId}`)
          const name = res.data?.name?.trim() || "Établissement"
          const rawLogo =
            res.data?.logo_path ?? res.data?.logoUrl ?? res.data?.logo_url ?? null
          const logoUrl = rawLogo ? await getSignedLogoUrl(rawLogo) : null
          return { id: establishmentId, name, logoUrl }
        } catch {
          return null
        }
      })
    )
      .then((data) => {
        if (!active) return
        const nextOptions: EstablishmentOption[] = data.flatMap((item) =>
          item ? [item] : []
        )
        setOptions(nextOptions)
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isMobile, userEstablishments?.list])

  React.useEffect(() => {
    if (!isMobile) return
    const rawLogo =
      establishment?.logo_path ?? establishment?.logoUrl ?? establishment?.logo_url ?? null

    let active = true
    if (!rawLogo) {
      setActiveLogoUrl(null)
      return () => {
        active = false
      }
    }

    getSignedLogoUrl(rawLogo).then((url) => {
      if (active) {
        setActiveLogoUrl(url)
      }
    })

    return () => {
      active = false
    }
  }, [establishment, isMobile])

  const currentOption = React.useMemo(
    () => options.find((option) => option.id === estId) ?? null,
    [options, estId]
  )

  const currentName = React.useMemo(() => {
    const directName = establishment?.name?.trim()
    if (directName) return directName
    return currentOption?.name ?? "Établissement"
  }, [establishment?.name, currentOption?.name])

  const currentLogoUrl = activeLogoUrl ?? currentOption?.logoUrl ?? null
  const currentInitial =
    currentName.trim().charAt(0).toUpperCase() || "E"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 max-w-[180px] gap-2 px-2 text-xs"
        >
          <span className="flex items-center gap-2 truncate">
            <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md border border-sidebar-border/60 bg-sidebar/60">
              {currentLogoUrl ? (
                <img
                  src={currentLogoUrl}
                  alt={`Logo ${currentName}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-[10px] font-semibold">{currentInitial}</span>
              )}
            </span>
            <span className="truncate">{currentName}</span>
          </span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuLabel>Établissement</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading && (
          <DropdownMenuItem disabled>Chargement...</DropdownMenuItem>
        )}
        {!loading && options.length === 0 && (
          <DropdownMenuItem disabled>Aucun établissement</DropdownMenuItem>
        )}
        {!loading &&
          options.map((option) => {
            const isActive = option.id === estId
            const initial =
              option.name.trim().charAt(0).toUpperCase() || "E"
            return (
              <DropdownMenuItem
                key={option.id}
                onClick={() => select(option.id)}
                className={cn("gap-2", isActive && "font-semibold")}
              >
                <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md border border-sidebar-border/60 bg-sidebar/60">
                  {option.logoUrl ? (
                    <img
                      src={option.logoUrl}
                      alt={`Logo ${option.name}`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] font-semibold">{initial}</span>
                  )}
                </span>
                <span className="truncate">{option.name}</span>
                {isActive && <Check className="ml-auto h-4 w-4 opacity-70" />}
              </DropdownMenuItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function MobileDashboardHeader() {
  const isMobile = useIsMobile()
  const { clear } = useEstablishment()
  const [loggingOut, setLoggingOut] = React.useState(false)

  if (!isMobile) return null

  async function handleLogout() {
    try {
      setLoggingOut(true)
      await supabase.auth.signOut()
    } catch (err) {
      console.error("Supabase signOut error:", err)
    } finally {
      setLoggingOut(false)
      clear()
      localStorage.removeItem("user_id")
      localStorage.removeItem("current_establishment_id")
      window.location.href = "/login"
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border/60 bg-[#F6F8FF] px-4 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <img src={FaviconOg} alt="Ravy" className="h-8 w-8" />
        <MobileEstablishmentSwitcher />
      </div>
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" aria-label="Paramètres">
          <Link to="/dashboard/settings/account">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon" aria-label="Centre d'aide">
          <Link to="/dashboard/help">
            <LifeBuoy className="h-4 w-4" />
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Se déconnecter">
              <LogOut className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Se déconnecter ?</AlertDialogTitle>
              <AlertDialogDescription>
                Votre session sera fermée sur cet appareil.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                disabled={loggingOut}
                className={cn(buttonVariants({ variant: "destructive" }))}
              >
                {loggingOut ? "Déconnexion..." : "Confirmer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  )
}
