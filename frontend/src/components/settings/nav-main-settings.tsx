import {
  User,
  Building2,
  CreditCard,
  Users,
  Plug,
  HelpCircle,
} from "lucide-react"

export const navMainSettings = [
  {
    title: "Compte",
    url: "/dashboard/settings/account",
    icon: User,
  },
  {
    title: "Établissements",
    url: "/dashboard/settings/organization",
    icon: Building2,
  },
  {
    title: "Abonnement",
    url: "/dashboard/settings/subscription",
    icon: CreditCard,
  },
  {
    title: "Utilisateurs",
    url: "/dashboard/settings/users",
    icon: Users,
  },
  {
    title: "Intégrations",
    url: "/dashboard/settings/integrations",
    icon: Plug,
  },
  {
    title: "Aide",
    url: "/dashboard/settings/help",
    icon: HelpCircle,
  },
]
