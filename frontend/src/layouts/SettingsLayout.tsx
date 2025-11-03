"use client"

import { Outlet } from "react-router-dom"
import { SettingsSidebar } from "@/components/settings/SettingsSidebar"

export default function SettingsLayout() {
  return (
    <div className="flex gap-4">
      {/* Sidebar */}
      <aside className= "sticky top-4 self-start h-fit">
      <SettingsSidebar />
      </aside>

      {/* Contenu principal */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
