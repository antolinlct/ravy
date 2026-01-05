import * as React from "react"
import {
  BadgeCheck,
  CreditCard,
  LogOut,
  Sparkles,
  Plus,
  Settings,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Button } from "@/components/ui/button"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/dark/mode-toggle"
import { Link } from "react-router-dom"
import { Logo } from "@/assets/branding/Logo"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import FaviconOg from "@/assets/branding/favicon_og.svg"
import { useUserData } from "@/context/UserDataContext"
import { useUser } from "@/context/UserContext"
import { supabase } from "@/lib/supabaseClient"

type UserProfile = {
  full_name?: string | null
  fullName?: string | null
  name?: string | null
  email?: string | null
  avatar_url?: string | null
  avatar?: string | null
}

export function NavUser() {
  const profile = useUserData() as UserProfile | null
  const user = useUser()
  const { isMobile, state } = useSidebar()
  const isCollapsed = !isMobile && state === "collapsed"
  const displayName =
    profile?.full_name ||
    profile?.fullName ||
    profile?.name ||
    user?.fullName ||
    user?.email ||
    "Utilisateur"
  const displayEmail =
    profile?.email || user?.email || "Email non disponible"
  const avatarUrl =
    profile?.avatar_url || profile?.avatar || ""

  const fallbackInitials = React.useMemo(() => {
    const source =
      (typeof displayName === "string" && displayName.trim()) ||
      (typeof displayEmail === "string" && displayEmail.trim()) ||
      "AL"

    const initials = source
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase()

    return initials || "AL"
  }, [displayName, displayEmail])

  const [loading, setLoading] = React.useState(false)

  async function handleLogout() {
    try {
      setLoading(true)
      await supabase.auth.signOut()
    } catch (err) {
      console.error("Supabase signOut error:", err)
    } finally {
      setLoading(false)
      localStorage.removeItem("user_id")
      localStorage.removeItem("current_establishment_id")
      window.location.href = "/login"
    }
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
             <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="rounded-lg">
                  {fallbackInitials}
                </AvatarFallback>
              </Avatar>
          
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{displayEmail}</span>
              </div>
              <Plus className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-1 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">

                {/*<Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                "UTILE POUR AFFICHER UN AVATAR DANS LE GROUPFOCUS USER SI BESOIN"
                */}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings/subscription">
                <Sparkles />
                Passer à l'abonnement pro
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings/account">
                <BadgeCheck />
                Compte
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings/subscription">
                <CreditCard />
                Facturation
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings/account">
                <Settings />
                Paramètres
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="hover:text-destructive hover:bg-destructive/10 focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut />
                    Se déconnecter
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Voulez-vous vraiment vous déconnecter ? Vous devrez vous reconnecter pour revenir.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      variant="destructive"
                      disabled={loading}
                      onClick={handleLogout}
                    >
                      Se déconnecter
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
        <Separator className="mt-3" />
        <div
          className={cn(
            "flex w-full items-center justify-between",
            isCollapsed && "flex-col justify-center gap-2"
          )}
        >
          {isCollapsed ? (
            <img src={FaviconOg} alt="RAVY" className="mt-2 h-8 w-auto" />
          ) : (
            <Logo className="h-14 w-auto mb-2" />
          )}
          <ModeToggle />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
