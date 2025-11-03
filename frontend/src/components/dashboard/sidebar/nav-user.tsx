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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/dark/mode-toggle"
import { Link } from "react-router-dom"
import logo from "@/assets/branding/logo_og.svg"
import { Separator } from "@/components/ui/separator"



export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()

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
                <AvatarImage src={user?.avatar ?? ""} alt={user?.name ?? ""} />
                <AvatarFallback className="rounded-lg">{user?.name ? user.name .split(" ") .map((n) => n[0]) .join("") .slice(0, 2) .toUpperCase(): "AL"} {/* 👈 Fallback de dev (2 lettres fixes) */}
      </AvatarFallback>
              </Avatar>
          
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
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
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
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
            <DropdownMenuItem>
              <LogOut />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Separator className="mt-3" />
        <div className="flex items-center justify-between">
        <img src={logo} alt="RAVY" className="h-12 w-auto" />
           <ModeToggle />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
