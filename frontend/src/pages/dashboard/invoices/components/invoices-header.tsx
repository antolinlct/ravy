import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAccess } from "@/components/access/access-control"

export default function InvoicesHeader() {
  const { role } = useAccess()
  const isStaff = role === "staff"

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <p className="text-2xl font-semibold">Factures</p>
        <p className="text-muted-foreground">
          Retrouvez ici l&apos;ensemble de vos factures.
        </p>
      </div>
      {!isStaff && (
        <Button variant="outline" className="gap-2" asChild>
          <Link to="/dashboard/invoices/suppliers">
            Gérer mes fournisseurs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}
