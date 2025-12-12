// src/App.tsx
import { RouterProvider, createBrowserRouter } from "react-router-dom"
import { appRoutes } from "./router/app-routes"
import { ThemeProvider } from "@/components/dark/theme-provider"

// CONTEXTS
import { CompiledContext } from "./context/CompiledContext"
import { AppInitializer } from "./context/AppInitializer"

const router = createBrowserRouter(appRoutes)

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <CompiledContext>
        <AppInitializer>
          <RouterProvider router={router} />
        </AppInitializer>
      </CompiledContext>
    </ThemeProvider> //END O THE DARK MODE
  )
}
