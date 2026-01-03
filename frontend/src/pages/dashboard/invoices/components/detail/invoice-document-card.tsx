import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
  type WheelEventHandler,
} from "react"
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from "pdfjs-dist/build/pdf.mjs"
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PdfToolbar from "@/components/blocks/pdf-toolbar"
import { ZOOM_MAX, ZOOM_MIN } from "../../api"

GlobalWorkerOptions.workerSrc = pdfWorker

type InvoiceDocumentCardProps = {
  importedAt: string
  pageCount: number
  documentUrl?: string
  onPageCountChange?: (count: number) => void
  articlesExpanded: boolean
  zoom: number
  currentPage: number
  readerRef: RefObject<HTMLDivElement | null>
  pageRefs: RefObject<(HTMLDivElement | null)[]>
  onWheelZoom: WheelEventHandler<HTMLDivElement>
  onScroll: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onPrevPage: () => void
  onNextPage: () => void
  onOpenDocument: () => void
  onShareDocument: () => void
  toolbarCollapsed: boolean
  onToggleCollapse: () => void
}

export default function InvoiceDocumentCard({
  importedAt,
  pageCount,
  documentUrl,
  onPageCountChange,
  articlesExpanded,
  zoom,
  currentPage,
  readerRef,
  pageRefs,
  onWheelZoom,
  onScroll,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPrevPage,
  onNextPage,
  onOpenDocument,
  onShareDocument,
  toolbarCollapsed,
  onToggleCollapse,
}: InvoiceDocumentCardProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const [renderWidth, setRenderWidth] = useState<number | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const panState = useRef({ active: false, x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const containerPadding = 24
  const enablePan = zoom > 1.01

  useEffect(() => {
    if (!documentUrl) {
      setPdfDoc(null)
      setStatus("idle")
      return
    }
    setStatus("loading")
    const loadingTask = getDocument({ url: documentUrl })
    loadingTask.promise
      .then((doc) => {
        setPdfDoc(doc)
        setStatus("ready")
        onPageCountChange?.(doc.numPages)
      })
      .catch(() => {
        setPdfDoc(null)
        setStatus("error")
      })
    return () => {
      loadingTask.destroy()
    }
  }, [documentUrl, onPageCountChange])

  useEffect(() => {
    let cancelled = false

    const renderPages = async () => {
      if (!pdfDoc) return
      const maxWidth = renderWidth ?? null
      const total = pdfDoc.numPages
      for (let index = 0; index < total; index += 1) {
        if (cancelled) return
        const canvas = canvasRefs.current[index]
        if (!canvas) continue
        const page = await pdfDoc.getPage(index + 1)
        const baseViewport = page.getViewport({ scale: 1 })
        const fitScale = maxWidth ? Math.min(maxWidth / baseViewport.width, 1) : 1
        const viewport = page.getViewport({ scale: fitScale * zoom })
        const context = canvas.getContext("2d")
        if (!context) continue
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`
        await page.render({ canvasContext: context, viewport, canvas }).promise
      }
    }

    renderPages()

    return () => {
      cancelled = true
    }
  }, [renderWidth, pdfDoc, zoom])

  useEffect(() => {
    const container = readerRef.current
    if (!container) return

    const updateWidth = () => {
      const width = container.offsetWidth
      const effectiveWidth = width ? Math.max(width - containerPadding * 2, 0) : null
      if (!effectiveWidth) {
        setRenderWidth(null)
        return
      }
      setRenderWidth(effectiveWidth)
    }

    updateWidth()

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth)
      return () => {
        window.removeEventListener("resize", updateWidth)
      }
    }

    const observer = new ResizeObserver(updateWidth)
    observer.observe(container)
    return () => {
      observer.disconnect()
    }
  }, [readerRef])

  const displayPages = useMemo(() => {
    const total = pdfDoc?.numPages ?? pageCount
    return Array.from({ length: total }, (_, index) => index + 1)
  }, [pageCount, pdfDoc])

  const handlePanStart = (event: PointerEvent<HTMLDivElement>) => {
    if (!enablePan || event.button !== 0) return
    event.preventDefault()
    const target = event.currentTarget
    panState.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: target.scrollLeft,
      scrollTop: target.scrollTop,
    }
    target.setPointerCapture(event.pointerId)
    setIsPanning(true)
  }

  const handlePanMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!panState.current.active) return
    const target = event.currentTarget
    const dx = event.clientX - panState.current.x
    const dy = event.clientY - panState.current.y
    target.scrollLeft = panState.current.scrollLeft - dx
    target.scrollTop = panState.current.scrollTop - dy
  }

  const handlePanEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!panState.current.active) return
    panState.current.active = false
    event.currentTarget.releasePointerCapture(event.pointerId)
    setIsPanning(false)
  }

  return (
    <Card className={`lg:col-span-5 overflow-hidden ${articlesExpanded ? "lg:max-h-[244px]" : ""}`}>
      {!articlesExpanded && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2.5 px-4">
          <CardTitle className="text-lg">Document</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Importée le {importedAt}</CardDescription>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="relative">
          <div
            className={`overflow-auto border-t bg-muted/40 [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted/60 [&::-webkit-scrollbar-track]:bg-transparent ${
              articlesExpanded ? "h-[280px]" : "h-[80vh]"
            } ${enablePan ? (isPanning ? "cursor-grabbing" : "cursor-grab") : ""}`}
            ref={readerRef}
            onWheel={onWheelZoom}
            onScroll={onScroll}
            onPointerDown={handlePanStart}
            onPointerMove={handlePanMove}
            onPointerUp={handlePanEnd}
            onPointerLeave={handlePanEnd}
            style={{
              touchAction: enablePan ? "none" : "auto",
              scrollbarGutter: "stable both-edges",
            }}
          >
            <div className="p-3">
              <div className="mx-auto w-full space-y-4">
                {status === "loading" && (
                  <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
                    Chargement du document...
                  </div>
                )}
                {status === "error" && (
                  <div className="flex h-[60vh] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span>Impossible d’afficher le document.</span>
                    <span>Utilisez le bouton “Ouvrir”.</span>
                  </div>
                )}
                {status === "ready" &&
                  displayPages.map((pageNumber, index) => (
                    <div
                      key={`page-${pageNumber}`}
                      ref={(node) => {
                        pageRefs.current[index] = node
                      }}
                      className="mx-auto w-fit pointer-events-none"
                    >
                      <canvas
                        ref={(node) => {
                          canvasRefs.current[index] = node
                        }}
                        className="block bg-white select-none"
                      />
                    </div>
                  ))}
                {status === "idle" && (
                  <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
                    Aperçu du document
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex w-full justify-center">
            <PdfToolbar
              className="pointer-events-auto"
              zoom={zoom}
              minZoom={ZOOM_MIN}
              maxZoom={ZOOM_MAX}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
              onResetZoom={onResetZoom}
              page={currentPage}
              pageCount={displayPages.length}
              onPrevPage={onPrevPage}
              onNextPage={onNextPage}
              onOpen={onOpenDocument}
              onShare={onShareDocument}
              collapsed={toolbarCollapsed}
              onToggleCollapse={onToggleCollapse}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
