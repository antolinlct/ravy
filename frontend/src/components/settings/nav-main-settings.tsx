import {
  User,
  CreditCard,
  Users,
  Plug,
  LogOut,
  LifeBuoy,
  HandHelping,
  Building
} from "lucide-react"

export const navMainSettings = [
  {
    title: "Compte",
    url: "/dashboard/settings/account",
    icon: User,
  },
  {
    title: "Établissement",
    url: "/dashboard/settings/establishment",
    icon: Building,
  },
  {
    title: "Abonnement",
    url: "/dashboard/settings/subscription",
    icon: CreditCard,
  },
  {
    title: "Utilisateurs & Accès",
    url: "/dashboard/settings/access",
    icon: Users,
  },
  {
    title: "Préférences",
    url: "/dashboard/settings/preferences",
    icon: LifeBuoy,
  },
  {
    title: "Tickets & Support",
    url: "/dashboard/settings/tickets",
    icon: HandHelping,
  },
  {
    title: "Intégrations",
    url: "/dashboard/settings/integrations",
    icon: Plug,
  },
  {
    title: "Déconnexion",
    url: "/logout",
    icon: LogOut,
    isLogout: true,
  },
]
