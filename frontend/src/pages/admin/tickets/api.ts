import api from "@/lib/axiosClient"

export type ApiSupportTicket = {
  id: string
  ticket_id?: string | null
  establishment_id?: string | null
  user_profile_id?: string | null
  invoice_path?: string | null
  status?: "open" | "in progress" | "resolved" | "error" | "canceled" | null
  object?: string | null
  description?: string | null
  intern_notes?: string | null
  resolution_notes?: string | null
  created_at?: string | null
  updated_at?: string | null
  resolved_at?: string | null
}

export type ApiUserProfile = {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}

export type ApiEstablishment = {
  id: string
  name?: string | null
  full_adresse?: string | null
}

export const fetchSupportTickets = async () => {
  const res = await api.get<ApiSupportTicket[]>(
    "/support_ticket?order_by=created_at&direction=desc&limit=500"
  )
  return res.data
}

export const fetchUserProfiles = async () => {
  const res = await api.get<ApiUserProfile[]>(
    "/user_profiles?order_by=created_at&direction=desc&limit=2000"
  )
  return res.data
}

export const fetchEstablishments = async () => {
  const res = await api.get<ApiEstablishment[]>(
    "/establishments?order_by=created_at&direction=desc&limit=2000"
  )
  return res.data
}

export const updateSupportTicket = async (
  id: string,
  payload: Partial<ApiSupportTicket>
) => {
  const res = await api.patch<ApiSupportTicket>(`/support_ticket/${id}`, payload)
  return res.data
}
