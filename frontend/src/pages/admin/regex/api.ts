import api from "@/lib/axiosClient"

export type RegexType =
  | "supplier_name"
  | "market_master_article_name"
  | "master_article_alternative"

export type ApiRegexPattern = {
  id: string
  type?: RegexType | null
  regex?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export const fetchRegexPatterns = async () => {
  const res = await api.get<ApiRegexPattern[]>(
    "/regex_patterns?order_by=created_at&direction=desc&limit=50"
  )
  return res.data ?? []
}

export const createRegexPattern = async (payload: {
  type: RegexType
  regex: string
}) => {
  const res = await api.post<ApiRegexPattern>("/regex_patterns", payload)
  return res.data
}

export const updateRegexPattern = async (
  id: string,
  payload: Partial<ApiRegexPattern>
) => {
  const res = await api.patch<ApiRegexPattern>(`/regex_patterns/${id}`, payload)
  return res.data
}
