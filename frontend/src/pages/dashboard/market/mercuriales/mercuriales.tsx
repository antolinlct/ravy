import { useMercurialeSuppliers } from "./api"
import MercurialeRequestDialog from "./components/MercurialeRequestDialog"
import MercurialeSuppliersCard from "./components/MercurialeSuppliersCard"

export default function MarketMercurialesPage() {
  const { suppliers, isLoading, error } = useMercurialeSuppliers()

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
