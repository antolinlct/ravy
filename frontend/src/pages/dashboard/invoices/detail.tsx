import { useEffect, useMemo, useRef, useState, type WheelEventHandler } from "react"
import { toast } from "sonner"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { usePostHog } from "posthog-js/react"
import { useEstablishment } from "@/context/EstablishmentContext"
import api from "@/lib/axiosClient"
import { Skeleton } from "@/components/ui/skeleton"
import { useAccess } from "@/components/access/access-control"
import InvoiceDetailHeader from "./components/detail/invoice-detail-header"
import InvoiceDocumentCard from "./components/detail/invoice-document-card"
import InvoiceSummaryCard from "./components/detail/invoice-summary-card"
import InvoiceArticlesCard from "./components/detail/invoice-articles-card"
import InvoiceItemSheet from "./components/detail/invoice-item-sheet"
import { clamp, PINCH_SENSITIVITY, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, useInvoiceDetailData } from "./api"

const toSafeFilename = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[^\w().-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")

const buildInvoiceFilenameBase = (invoice: { supplier: string; number: string; date: string }, fallbackId?: string | null) => {
  const dateValue = invoice.date ? new Date(invoice.date) : null
  const dateLabel =
    dateValue && !Number.isNaN(dateValue.getTime())
      ? [
          `${dateValue.getDate()}`.padStart(2, "0"),
          `${dateValue.getMonth() + 1}`.padStart(2, "0"),
          dateValue.getFullYear(),
        ].join("-")
      : null
  const rawNumber = invoice.number || fallbackId || "facture"
  const number = rawNumber.replace(/^\s*n[°ºo]?\s*/i, "")
  const base = `${invoice.supplier}-${number}${dateLabel ? `(${dateLabel})` : ""}`
  return toSafeFilename(base)
}

const InvoiceDetailSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
    <div className="grid gap-4 lg:grid-cols-12 items-start">
      <div className="lg:col-span-5 rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-[520px] w-full rounded-md" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="space-y-4 lg:col-span-7">
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="grid gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default function InvoiceDetailPage() {
  const defaultZoom = 1
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const posthog = usePostHog()
  const { id } = useParams()
  const { estId } = useEstablishment()
  const { role } = useAccess()
  const isStaff = role === "staff"
  const invoiceId = useMemo(() => {
    if (id) return id
    const state = location.state as { invoiceId?: string } | null
    return state?.invoiceId ?? null
  }, [id, location.state])
  const { invoice, invoiceMeta, isLoading, isArticlesLoading } = useInvoiceDetailData(
    invoiceId,
    estId
  )
  const [localInvoice, setLocalInvoice] = useState(invoice)
  const [articlesExpanded, setArticlesExpanded] = useState(false)
  const [itemSheetOpen, setItemSheetOpen] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [zoom, setZoom] = useState(defaultZoom)
  const [currentPage, setCurrentPage] = useState(1)
  const [documentPageCount, setDocumentPageCount] = useState(1)
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const readerRef = useRef<HTMLDivElement | null>(null)
  const scrollTicking = useRef(false)

  useEffect(() => {
    if (invoice) {
      setLocalInvoice(invoice)
    }
  }, [invoice])

  useEffect(() => {
    if (!invoiceId) return
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
  }, [invoiceId])

  const resolvedInvoice = localInvoice ?? invoice
  const isBeverageSupplier = resolvedInvoice?.supplierType === "beverage"
  useEffect(() => {
    setDocumentPageCount(resolvedInvoice?.pageCount ?? 1)
  }, [resolvedInvoice?.pageCount])

  const pageCount = documentPageCount

  useEffect(() => {
    setCurrentPage((prev) => clamp(prev, 1, pageCount))
  }, [pageCount])

  const handlePinchZoom: WheelEventHandler<HTMLDivElement> = (event) => {
    if (!event.ctrlKey) return
    event.preventDefault()
    const delta = -event.deltaY / PINCH_SENSITIVITY
    setZoom((prev) => clamp(prev + delta, ZOOM_MIN, ZOOM_MAX))
  }

  const handleZoomIn = () => setZoom((prev) => clamp(prev + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX))
  const handleZoomOut = () => setZoom((prev) => clamp(prev - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX))
  const handleResetZoom = () => setZoom(defaultZoom)

  const scrollToPage = (page: number) => {
    const target = pageRefs.current[page - 1]
    const container = readerRef.current
    if (target && container) {
      const targetRect = target.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const offset = targetRect.top - containerRect.top + container.scrollTop
      container.scrollTo({ top: offset, behavior: "smooth" })
    } else if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }

  const updateCurrentPageOnScroll = () => {
    const container = readerRef.current
    if (!container || pageRefs.current.length === 0) return

    const containerRect = container.getBoundingClientRect()
    let closestIndex = currentPage - 1
    let smallestDistance = Number.POSITIVE_INFINITY

    pageRefs.current.forEach((node, index) => {
      if (!node) return
      const rect = node.getBoundingClientRect()
      const distance = Math.abs(rect.top - containerRect.top)
      if (distance < smallestDistance) {
        smallestDistance = distance
        closestIndex = index
      }
    })

    const nextPage = clamp(closestIndex + 1, 1, pageCount)
    setCurrentPage((prev) => (prev === nextPage ? prev : nextPage))
  }

  const handleScroll = () => {
    if (scrollTicking.current) return
    scrollTicking.current = true
    requestAnimationFrame(() => {
      updateCurrentPageOnScroll()
      scrollTicking.current = false
    })
  }

  const handlePrevPage = () =>
    setCurrentPage((prev) => {
      const next = clamp(prev - 1, 1, pageCount)
      if (next !== prev) {
        setZoom(defaultZoom)
        scrollToPage(next)
      }
      return next
    })

  const handleNextPage = () =>
    setCurrentPage((prev) => {
      const next = clamp(prev + 1, 1, pageCount)
      if (next !== prev) {
        setZoom(defaultZoom)
        scrollToPage(next)
      }
      return next
    })

  const handleOpenDocument = () => {
    if (!resolvedInvoice?.documentUrl) {
      toast.error("Document non disponible.")
      return
    }
    window.open(resolvedInvoice.documentUrl, "_blank", "noreferrer")
    posthog?.capture("invoice_document_opened", {
      invoice_id: invoiceId,
      establishment_id: estId ?? null,
      supplier_id: invoiceMeta?.supplierId ?? null,
    })
  }

  const handleShareDocument = async () => {
    if (!resolvedInvoice?.documentUrl) {
      toast.error("Document non disponible.")
      return
    }
    try {
      const response = await fetch(resolvedInvoice.documentUrl)
      if (!response.ok) {
        throw new Error("fetch_failed")
      }
      const blob = await response.blob()
      const filenameBase = buildInvoiceFilenameBase(resolvedInvoice, invoiceId)
      const file = new File([blob], `${filenameBase}.pdf`, { type: "application/pdf" })
      const canShare = typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })
      if (canShare && navigator.share) {
        await navigator.share({
          title: `Facture ${resolvedInvoice.number}`,
          text: "Pièce jointe : facture.",
          files: [file],
        })
        posthog?.capture("invoice_document_shared", {
          invoice_id: invoiceId,
          establishment_id: estId ?? null,
          supplier_id: invoiceMeta?.supplierId ?? null,
        })
        return
      }
      posthog?.capture("invoice_document_share_failed", {
        invoice_id: invoiceId,
        establishment_id: estId ?? null,
        supplier_id: invoiceMeta?.supplierId ?? null,
        reason: "unsupported",
      })
      toast.error("Le partage de pièces jointes n'est pas supporté sur ce navigateur.")
    } catch {
      posthog?.capture("invoice_document_share_failed", {
        invoice_id: invoiceId,
        establishment_id: estId ?? null,
        supplier_id: invoiceMeta?.supplierId ?? null,
        reason: "exception",
      })
      toast.error("Impossible de préparer la pièce jointe.")
    }
  }

  const handleDownloadDocument = async () => {
    if (!resolvedInvoice?.documentUrl) {
      toast.error("Document non disponible.")
      return
    }
    try {
      const response = await fetch(resolvedInvoice.documentUrl)
      if (!response.ok) throw new Error("fetch_failed")
      const blob = await response.blob()
      const filenameBase = buildInvoiceFilenameBase(resolvedInvoice, invoiceId)
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = `${filenameBase}.pdf`
      link.rel = "noopener"
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
      posthog?.capture("invoice_document_downloaded", {
        invoice_id: invoiceId,
        establishment_id: estId ?? null,
        supplier_id: invoiceMeta?.supplierId ?? null,
      })
    } catch {
      posthog?.capture("invoice_document_download_failed", {
        invoice_id: invoiceId,
        establishment_id: estId ?? null,
        supplier_id: invoiceMeta?.supplierId ?? null,
      })
      toast.error("Impossible de télécharger le document.")
    }
  }

  const handleEditItem = (index: number) => {
    if (isStaff) return
    setEditingItemIndex(index)
    setItemSheetOpen(true)
  }

  const handleItemSheetChange = (open: boolean) => {
    setItemSheetOpen(open)
    if (!open) {
      setEditingItemIndex(null)
    }
  }

  const resolveDeleteMeta = async () => {
    if (invoiceMeta?.supplierId && invoiceMeta.date) {
      return { supplierId: invoiceMeta.supplierId, date: invoiceMeta.date }
    }
    if (!invoiceId) return null
    try {
      const response = await api.get<{ supplier_id?: string | null; date?: string | null }>(
        `/invoices/${invoiceId}`
      )
      const supplierId = response.data?.supplier_id
      const date = response.data?.date
      if (supplierId && date) {
        return { supplierId, date }
      }
    } catch {
      // ignore fetch errors; we'll show a fallback toast below
    }
    return null
  }

  const handleDeleteInvoice = async () => {
    if (isStaff) return
    if (!estId || !invoiceId) {
      toast.error("Impossible de supprimer la facture.")
      return
    }
    const meta = await resolveDeleteMeta()
    if (!meta) {
      toast.error("Les informations de la facture sont incomplètes.")
      return
    }
    try {
      await api.post("/logic/write/delete-invoice", {
        establishment_id: estId,
        invoice_to_delete_id: invoiceId,
        invoice_to_delete_date: meta.date,
        supplier_id: meta.supplierId,
      })
      await queryClient.invalidateQueries({ queryKey: ["invoices", "list", estId] })
      queryClient.removeQueries({ queryKey: ["invoice", invoiceId, estId] })
      toast.success("Facture supprimée.")
      posthog?.capture("invoice_deleted", {
        invoice_id: invoiceId,
        establishment_id: estId ?? null,
        supplier_id: meta.supplierId,
      })
      navigate("/dashboard/invoices")
    } catch {
      toast.error("Impossible de supprimer la facture.")
    }
  }

  if (!invoiceId) {
    return <div className="text-sm text-muted-foreground">Aucune facture sélectionnée.</div>
  }

  if (isLoading && !resolvedInvoice) {
    return <InvoiceDetailSkeleton />
  }
  if (!resolvedInvoice) {
    return <div className="text-sm text-muted-foreground">Facture introuvable.</div>
  }

  return (
    <div className="space-y-6">
      <InvoiceDetailHeader
        invoiceNumber={resolvedInvoice.number}
        lastModified={resolvedInvoice.lastModified}
        onDownload={handleDownloadDocument}
        onDelete={handleDeleteInvoice}
        canDownload={!isStaff}
        canDelete={!isStaff}
      />

      <div className="grid gap-4 lg:grid-cols-12 items-start">
        <InvoiceDocumentCard
          importedAt={resolvedInvoice.importedAt}
          pageCount={pageCount}
          documentUrl={resolvedInvoice.documentUrl}
          onPageCountChange={setDocumentPageCount}
          articlesExpanded={articlesExpanded}
          zoom={zoom}
          currentPage={currentPage}
          readerRef={readerRef}
          pageRefs={pageRefs}
          onWheelZoom={handlePinchZoom}
          onScroll={handleScroll}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onOpenDocument={handleOpenDocument}
          onShareDocument={handleShareDocument}
          canOpen={!isStaff}
          canShare={!isStaff}
          toolbarCollapsed={toolbarCollapsed}
          onToggleCollapse={() => setToolbarCollapsed((prev) => !prev)}
        />

        <div className="space-y-4 lg:col-span-7">
          <InvoiceSummaryCard
            invoice={resolvedInvoice}
            onUpdate={setLocalInvoice}
            invoiceId={invoiceId}
            canEdit={!isStaff}
          />
          {!articlesExpanded && (
            <InvoiceArticlesCard
              invoice={resolvedInvoice}
              isExpanded={false}
              isBeverageSupplier={isBeverageSupplier}
              isLoading={isArticlesLoading}
              onToggleExpand={() => setArticlesExpanded(true)}
              onEditItem={handleEditItem}
              canEdit={!isStaff}
              establishmentId={estId}
              fallbackDate={new Date()}
            />
          )}
        </div>

        {articlesExpanded && (
          <InvoiceArticlesCard
            invoice={resolvedInvoice}
            isExpanded
            isBeverageSupplier={isBeverageSupplier}
            isLoading={isArticlesLoading}
            onToggleExpand={() => setArticlesExpanded(false)}
            onEditItem={handleEditItem}
            canEdit={!isStaff}
            establishmentId={estId}
            fallbackDate={new Date()}
          />
        )}
      </div>

      <InvoiceItemSheet
        open={itemSheetOpen}
        editingIndex={editingItemIndex}
        invoice={resolvedInvoice}
        isBeverageSupplier={isBeverageSupplier}
        onOpenChange={handleItemSheetChange}
        onUpdate={setLocalInvoice}
        readOnly={isStaff}
      />
    </div>
  )
}
