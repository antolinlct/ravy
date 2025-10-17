import axios from "axios";
import { supabase } from "./supabaseClient";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000", // URL du backend FastAPI
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Intercepteur : ajoute le token Supabase à chaque requête
api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

// ❌ Intercepteur d'erreurs globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        `[API ERROR] ${error.response.status}:`,
        error.response.data
      );
    } else {
      console.error("[API ERROR] Aucun retour du serveur :", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
