// src/App.tsx
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { appRoutes } from "./router/app-routes";
import { ThemeProvider } from "@/components/dark/theme-provider"


const router = createBrowserRouter(appRoutes);

export default function App() {
  return <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">

    <RouterProvider router={router} />

    </ThemeProvider> // END OF THE DARK MODE
}
