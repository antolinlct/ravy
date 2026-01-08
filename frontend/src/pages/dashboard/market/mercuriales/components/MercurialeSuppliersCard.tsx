import { useMemo } from "react"

import { Card, CardContent } from "@/components/ui/card"
import FolderIllustration from "@/assets/folder.svg"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { MercurialeSupplier } from "../types"

const MERCURIALE_BUCKET =
  import.meta.env.VITE_SUPABASE_MERCURIALE_BUCKET || "mercurial_logo_path"
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ""
const PUBLIC_PREFIX = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/${MERCURIALE_BUCKET}/`
  : ""

function resolveMercurialeLogoUrl(raw?: string | null) {
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  if (!PUBLIC_PREFIX) return null
  if (raw.startsWith(PUBLIC_PREFIX)) return raw
  const clean = raw.startsWith(`${MERCURIALE_BUCKET}/`)
    ? raw.slice(MERCURIALE_BUCKET.length + 1)
    : raw
  return `${PUBLIC_PREFIX}${clean}`
}

type MercurialeSuppliersCardProps = {
  suppliers: MercurialeSupplier[]
  isLoading: boolean
  error?: string | null
}

export default function MercurialeSuppliersCard({
  suppliers,
  isLoading,
  error,
}: MercurialeSuppliersCardProps) {
  const listStatus = useMemo(() => {
    if (isLoading) {
      return { tone: "text-muted-foreground", label: "Chargement des mercuriales..." }
    }
    if (error) {
      return { tone: "text-destructive", label: error }
    }
    if (!suppliers.length) {
      return { tone: "text-muted-foreground", label: "Aucune mercuriale disponible." }
    }
    return null
  }, [error, isLoading, suppliers.length])

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {listStatus ? (
          <p className={cn("text-sm", listStatus.tone)}>{listStatus.label}</p>
        ) : (
          <div className="flex flex-wrap gap-6 items-start justify-start">
            {suppliers.map((supplier) => {
              const isDisabled = supplier.active === false
              const label = supplier.name ?? "Fournisseur"
              const logoSrc =
                resolveMercurialeLogoUrl(supplier.mercurial_logo_path) || FolderIllustration
              const card = (
                <Card
                  className={cn(
                    "w-full max-w-[140px] border-transparent shadow-none transition",
                    isDisabled ? "opacity-60" : "hover:bg-muted"
                  )}
                >
                  <CardContent className="relative p-3 text-center">
                    <img
                      src={logoSrc}
                      alt={`Logo mercuriale ${label}`}
                      className="h-[120px] w-full object-contain opacity-70"
                    />
                    <p className="-mt-1 text-sm font-semibold text-foreground">{label}</p>
                    {isDisabled && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 text-xs font-semibold text-foreground">
                        Bientôt disponible
                      </div>
                    )}
                  </CardContent>
                </Card>
              )

              if (isDisabled) {
                return (
                  <div key={supplier.id} aria-disabled="true">
                    {card}
                  </div>
                )
              }

              return (
                <Link key={supplier.id} to={supplier.id} className="block">
                  {card}
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
