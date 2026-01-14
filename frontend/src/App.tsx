// src/App.tsx
import { useEffect } from "react"
import { RouterProvider, createBrowserRouter } from "react-router-dom"
import { appRoutes } from "./router/app-routes"
import { ThemeProvider } from "@/components/dark/theme-provider"
import { Toaster } from "@/components/ui/sonner"

// CONTEXTS
import { CompiledContext } from "./context/CompiledContext"
import { AppInitializer } from "./context/AppInitializer"

const router = createBrowserRouter(appRoutes)

export default function App() {
  useEffect(() => {
    const { pathname, hash, search } = window.location
    if (pathname !== "/" || !hash) return

    const params = new URLSearchParams(hash.replace(/^#/, ""))
    if (params.get("type") === "invite" && params.get("access_token")) {
      window.location.replace(`/invite/accept${search}${hash}`)
    }
  }, [])

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <CompiledContext>
        <AppInitializer>
          <RouterProvider router={router} />
        </AppInitializer>
      </CompiledContext>
      <Toaster />
    </ThemeProvider> //END O THE DARK MODE
  )
}
