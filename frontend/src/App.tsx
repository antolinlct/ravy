// src/App.tsx
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { appRoutes } from "./router/app-routes";

const router = createBrowserRouter(appRoutes);

export default function App() {
  return <RouterProvider router={router} />;
}
