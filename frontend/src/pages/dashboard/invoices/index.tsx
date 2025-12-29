import { useEstablishment } from "@/context/EstablishmentContext"
import InvoicesHeader from "./components/invoices-header"
import InvoiceUploadCard from "./components/invoice-upload-card"
import InvoicesTableCard from "./components/invoices-table-card"
import { useInvoicesListData } from "./api"

export default function InvoicesPage() {
  const { estId } = useEstablishment()
  const { invoices, supplierOptions, isLoading } = useInvoicesListData(estId)
  return (
    <div className="flex w-full items-start justify-start">
      <div className="w-full space-y-4">
        <InvoicesHeader />
        <InvoiceUploadCard />
        <InvoicesTableCard
          invoices={invoices}
          supplierOptions={supplierOptions}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
