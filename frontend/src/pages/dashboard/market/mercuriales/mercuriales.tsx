import { useMercurialeSuppliers } from "./api"
import MercurialeRequestDialog from "./components/MercurialeRequestDialog"
import MercurialeSuppliersCard from "./components/MercurialeSuppliersCard"
import { AccessLockedCard } from "@/components/access/AccessLockedCard"
import { useAccess } from "@/components/access/access-control"
import { useEstablishmentPlanCode } from "@/context/EstablishmentDataContext"
import { MarketPlanPreview } from "../components/MarketPlanPreview"

export default function MarketMercurialesPage() {
  const { can } = useAccess()
  const planCode = useEstablishmentPlanCode()
  const { suppliers, isLoading, error } = useMercurialeSuppliers()

  const planValue = typeof planCode === "string" ? planCode.toUpperCase() : null
  const planLocked = planValue === "PLAN_APERO" || planValue === "PLAN_PLAT"
  if (!can("consultant")) {
    return <AccessLockedCard />
  }
  if (planLocked) {
    return <MarketPlanPreview />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Mercuriales</h1>
          <p className="text-sm text-muted-foreground">
            Consultez les mercuriales négociées par Ravy auprès de grands fournisseurs partenaires.
          </p>
        </div>
        <MercurialeRequestDialog />
      </div>
      <MercurialeSuppliersCard suppliers={suppliers} isLoading={isLoading} error={error} />
    </div>
  )
}
