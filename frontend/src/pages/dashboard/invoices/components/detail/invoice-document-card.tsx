import type { RefObject, WheelEventHandler } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import PdfToolbar from "@/components/blocks/pdf-toolbar"
import { ZOOM_MAX, ZOOM_MIN } from "../../api"

type InvoiceDocumentCardProps = {
  importedAt: string
  pageCount: number
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
            className={`max-h-[80vh] overflow-auto border-t bg-muted/40 [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted/60 [&::-webkit-scrollbar-track]:bg-transparent ${
              articlesExpanded ? "h-[280px]" : ""
            }`}
            ref={readerRef}
            onWheel={onWheelZoom}
            onScroll={onScroll}
          >
            <div className="px-3 pb-24">
              <div className="mx-auto w-full space-y-4">
                {Array.from({ length: pageCount }).map((_, index) => (
                  <div
                    key={`page-${index + 1}`}
                    ref={(node) => {
                      pageRefs.current[index] = node
                    }}
                    className="transition-transform duration-150 ease-out"
                    style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
                  >
                    <AspectRatio ratio={210 / 297} className="w-full border bg-background shadow-sm">
                      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                        Aperçu du document {pageCount > 1 ? `(page ${index + 1})` : ""}
                      </div>
                    </AspectRatio>
                  </div>
                ))}
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
              pageCount={pageCount}
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
