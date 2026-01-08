import { supabase } from "@/lib/supabaseClient"

const LOGO_BUCKET = import.meta.env.VITE_SUPABASE_LOGO_BUCKET || "logos"
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ""
const PUBLIC_PREFIX = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/${LOGO_BUCKET}/`
  : ""

const stripBucketPrefix = (value: string) =>
  value.startsWith(`${LOGO_BUCKET}/`) ? value.slice(LOGO_BUCKET.length + 1) : value

export const extractLogoPath = (raw?: string | null) => {
  if (!raw) return null
  if (PUBLIC_PREFIX && raw.startsWith(PUBLIC_PREFIX)) {
    return raw.slice(PUBLIC_PREFIX.length)
  }
  if (/^https?:\/\//i.test(raw)) return null
  return stripBucketPrefix(raw)
}

export const getSignedLogoUrl = async (
  raw?: string | null,
  expiresInSeconds = 60 * 60
) => {
  if (!raw) return null
  if (PUBLIC_PREFIX && raw.startsWith(PUBLIC_PREFIX)) {
    const path = raw.slice(PUBLIC_PREFIX.length)
    if (!path) return null
    const { data, error } = await supabase.storage
      .from(LOGO_BUCKET)
      .createSignedUrl(path, expiresInSeconds)
    if (error) return null
    return data?.signedUrl ?? null
  }
  if (/^https?:\/\//i.test(raw)) return raw
  const path = stripBucketPrefix(raw)
  if (!path) return null
  const { data, error } = await supabase.storage
    .from(LOGO_BUCKET)
    .createSignedUrl(path, expiresInSeconds)
  if (error) return null
  return data?.signedUrl ?? null
}
