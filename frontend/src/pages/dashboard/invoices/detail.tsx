import { useEffect, useMemo, useRef, useState, type WheelEventHandler } from "react"
import { toast } from "sonner"
import { useLocation } from "react-router-dom"
import { useEstablishment } from "@/context/EstablishmentContext"
import InvoiceDetailHeader from "./components/detail/invoice-detail-header"
import InvoiceDocumentCard from "./components/detail/invoice-document-card"
import InvoiceSummaryCard from "./components/detail/invoice-summary-card"
import InvoiceArticlesCard from "./components/detail/invoice-articles-card"
import InvoiceItemSheet from "./components/detail/invoice-item-sheet"
import { clamp, PINCH_SENSITIVITY, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, useInvoiceDetailData } from "./api"

export default function InvoiceDetailPage() {
  const location = useLocation()
  const { estId } = useEstablishment()
  const invoiceId = useMemo(() => {
    const state = location.state as { invoiceId?: string } | null
    return state?.invoiceId
  }, [location.state])
  const { invoice, priceHistoryById, isLoading } = useInvoiceDetailData(invoiceId, estId)
  const [localInvoice, setLocalInvoice] = useState(invoice)
  const [articlesExpanded, setArticlesExpanded] = useState(false)
  const [itemSheetOpen, setItemSheetOpen] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const readerRef = useRef<HTMLDivElement | null>(null)
  const scrollTicking = useRef(false)

  useEffect(() => {
    if (invoice) {
      setLocalInvoice(invoice)
    }
  }, [invoice])

  const resolvedInvoice = localInvoice ?? invoice
  const isBeverageSupplier = resolvedInvoice?.supplierType === "beverage"
  const pageCount = resolvedInvoice?.pageCount ?? 1

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
  const handleResetZoom = () => setZoom(1)

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
        setZoom(1)
        scrollToPage(next)
      }
      return next
    })

  const handleNextPage = () =>
    setCurrentPage((prev) => {
      const next = clamp(prev + 1, 1, pageCount)
      if (next !== prev) {
        setZoom(1)
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
  }

  const handleShareDocument = () => {
    if (!resolvedInvoice?.documentUrl) {
      toast.error("Document non disponible.")
      return
    }
    const subject = encodeURIComponent(`Facture ${resolvedInvoice.number}`)
    const body = encodeURIComponent(`Voici le lien du document : ${resolvedInvoice.documentUrl}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index)
    setItemSheetOpen(true)
  }

  const handleItemSheetChange = (open: boolean) => {
    setItemSheetOpen(open)
    if (!open) {
      setEditingItemIndex(null)
    }
  }

  if (!invoiceId) {
    return <div className="text-sm text-muted-foreground">Aucune facture sélectionnée.</div>
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Chargement de la facture...</div>
  }
  if (!resolvedInvoice) {
    return <div className="text-sm text-muted-foreground">Facture introuvable.</div>
  }

  return (
    <div className="space-y-6">
      <InvoiceDetailHeader
        invoiceNumber={resolvedInvoice.number}
        lastModified={resolvedInvoice.lastModified}
        onDelete={() => toast.success("Facture supprimée.")}
      />

      <div className="grid gap-4 lg:grid-cols-12 items-start">
        <InvoiceDocumentCard
          importedAt={resolvedInvoice.importedAt}
          pageCount={pageCount}
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
          toolbarCollapsed={toolbarCollapsed}
          onToggleCollapse={() => setToolbarCollapsed((prev) => !prev)}
        />

        <div className="space-y-4 lg:col-span-7">
          <InvoiceSummaryCard
            invoice={resolvedInvoice}
            onUpdate={setLocalInvoice}
            invoiceId={invoiceId}
          />
          {!articlesExpanded && (
            <InvoiceArticlesCard
              invoice={resolvedInvoice}
              isExpanded={false}
              isBeverageSupplier={isBeverageSupplier}
              onToggleExpand={() => setArticlesExpanded(true)}
              onEditItem={handleEditItem}
              priceHistoryById={priceHistoryById}
              fallbackDate={new Date()}
            />
          )}
        </div>

        {articlesExpanded && (
          <InvoiceArticlesCard
            invoice={resolvedInvoice}
            isExpanded
            isBeverageSupplier={isBeverageSupplier}
            onToggleExpand={() => setArticlesExpanded(false)}
            onEditItem={handleEditItem}
            priceHistoryById={priceHistoryById}
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
      />
    </div>
  )
}
