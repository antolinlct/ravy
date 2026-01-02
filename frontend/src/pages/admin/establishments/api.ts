import api from "@/lib/axiosClient"
import type { MercurialeLevel, UserRole } from "./types"

export type ApiUserProfile = {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  phone_sms?: string | null
  intern_notes?: string | null
  super_admin?: boolean | null
  last_login?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type ApiUserEstablishment = {
  user_id: string
  establishment_id: string
  role: UserRole
  created_at?: string | null
}

export type ApiUserMercurialeAccess = {
  id: string
  user_id: string
  mercuriale_level: MercurialeLevel
  assigned_by?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type ApiEstablishment = {
  id: string
  name?: string | null
  slug?: string | null
  email?: string | null
  phone?: string | null
  siren?: string | null
  full_adresse?: string | null
  active_sms?: boolean | null
  type_sms?: string | null
  sms_variation_trigger?: string | null
  recommended_retail_price_method?: "MULTIPLIER" | "PERCENTAGE" | "VALUE" | null
  recommended_retail_price_value?: number | string | null
  created_at?: string | null
}

export const fetchUserProfiles = async () => {
  const res = await api.get<ApiUserProfile[]>(
    "/user_profiles?order_by=created_at&direction=desc&limit=2000"
  )
  return res.data
}

export const fetchUserEstablishments = async () => {
  const res = await api.get<ApiUserEstablishment[]>(
    "/user_establishment?order_by=created_at&direction=desc&limit=5000"
  )
  return res.data
}

export const fetchUserMercurialeAccess = async () => {
  const res = await api.get<ApiUserMercurialeAccess[]>(
    "/user_mercuriale_access?order_by=created_at&direction=desc&limit=2000"
  )
  return res.data
}

export const fetchEstablishments = async () => {
  const res = await api.get<ApiEstablishment[]>(
    "/establishments?order_by=created_at&direction=desc&limit=2000"
  )
  return res.data
}

export const createUserMercurialeAccess = async (payload: {
  user_id: string
  mercuriale_level: MercurialeLevel
  assigned_by?: string | null
}) => {
  const res = await api.post<ApiUserMercurialeAccess>("/user_mercuriale_access", payload)
  return res.data
}

export const updateUserMercurialeAccess = async (
  id: string,
  payload: Partial<ApiUserMercurialeAccess>
) => {
  const res = await api.patch<ApiUserMercurialeAccess>(`/user_mercuriale_access/${id}`, payload)
  return res.data
}
