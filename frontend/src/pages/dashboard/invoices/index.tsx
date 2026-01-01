import { useState } from "react"
import type { DoubleDatePickerValue } from "@/components/blocks/double-datepicker"
import { useEstablishment } from "@/context/EstablishmentContext"
import InvoicesHeader from "./components/invoices-header"
import InvoiceUploadCard from "./components/invoice-upload-card"
import InvoicesTableCard from "./components/invoices-table-card"
import { useInvoicesListData } from "./api"

export default function InvoicesPage() {
  const { estId } = useEstablishment()
  const [dateRange, setDateRange] = useState<DoubleDatePickerValue>(() => {
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setMonth(endDate.getMonth() - 3)
    return { startDate, endDate }
  })

  const { invoices, supplierOptions, isLoading } = useInvoicesListData(
    estId,
    dateRange.startDate,
    dateRange.endDate
  )
  return (
    <div className="flex w-full items-start justify-start">
      <div className="w-full space-y-4">
        <InvoicesHeader />
        <InvoiceUploadCard />
        <InvoicesTableCard
          invoices={invoices}
          supplierOptions={supplierOptions}
          isLoading={isLoading}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onDateRangeChange={setDateRange}
        />
      </div>
    </div>
  )
}
