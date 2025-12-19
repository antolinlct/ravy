import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Mail,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronsLeftRight,
  ChevronsRightLeft,
} from "lucide-react"

type PdfToolbarProps = {
  zoom: number
  minZoom?: number
  maxZoom?: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom?: () => void
  page?: number
  pageCount?: number
  onPrevPage?: () => void
  onNextPage?: () => void
  onOpen?: () => void
  onShare?: () => void
  className?: string
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function PdfToolbar({
  zoom,
  minZoom = 0.5,
  maxZoom = 2,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  page = 1,
  pageCount = 1,
  onPrevPage,
  onNextPage,
  onOpen,
  onShare,
  className,
  collapsed = false,
  onToggleCollapse,
}: PdfToolbarProps) {
  const isZoomOutDisabled = zoom <= minZoom
  const isZoomInDisabled = zoom >= maxZoom
  const hasMultiplePages = pageCount > 1

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "sticky bottom-3 z-20 mx-auto inline-flex max-w-full flex-wrap items-center gap-2 rounded-lg border bg-background/90 px-2.5 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80",
          className
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Déplier la barre"
                onClick={onToggleCollapse}
              >
                <ChevronsLeftRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Afficher la barre</TooltipContent>
          </Tooltip>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                onClick={onPrevPage}
                disabled={!hasMultiplePages || page <= 1}
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="text-xs font-medium px-1.5">
                {page} / {pageCount}
              </Badge>
              <Button
                variant="secondary"
                size="icon"
                onClick={onNextPage}
                disabled={!hasMultiplePages || page >= pageCount}
                aria-label="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

            <div className="flex items-center justify-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={onZoomOut}
                    disabled={isZoomOutDisabled}
                    aria-label="Réduire le zoom"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom out</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={onZoomIn}
                    disabled={isZoomInDisabled}
                    aria-label="Augmenter le zoom"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom in</TooltipContent>
              </Tooltip>

              {onResetZoom && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="icon" onClick={onResetZoom} aria-label="Réinitialiser le zoom">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Réinitialiser</TooltipContent>
                </Tooltip>
              )}
            </div>

            <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="icon" onClick={onOpen} aria-label="Ouvrir dans un onglet">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ouvrir dans un nouvel onglet</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="icon" onClick={onShare} aria-label="Partager par mail">
                    <Mail className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Partager par mail</TooltipContent>
              </Tooltip>
            </div>

            {onToggleCollapse && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Réduire la barre" onClick={onToggleCollapse}>
                    <ChevronsRightLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Réduire la barre</TooltipContent>
              </Tooltip>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

export default PdfToolbar
