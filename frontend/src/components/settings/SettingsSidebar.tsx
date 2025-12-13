"use client"

import { cn } from "@/lib/utils"
import { Link, useLocation } from "react-router-dom"
import { navMainSettings } from "./nav-main-settings"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"

export function SettingsSidebar() {
  const location = useLocation()

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error("Supabase signOut error:", err)
    } finally {
      localStorage.removeItem("user_id")
      localStorage.removeItem("current_establishment_id")
      window.location.href = "/login"
    }
  }

  return (
    <div className="w-60">
      <Card className="bg-transparent shadow-none border">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Paramètres
          </h2>

          <nav className="flex flex-col space-y-1">
            {navMainSettings.map((item) => {
              const isActive = location.pathname === item.url
              if (item.isLogout) {
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={handleLogout}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </button>
                )
              }

              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-muted text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </Card>
    </div>
  )
}
