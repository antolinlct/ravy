import { useEffect, useState, type MouseEvent } from "react"
import { ArrowLeft, Download, Loader2, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type InvoiceDetailHeaderProps = {
  invoiceNumber: string
  lastModified: string
  onDownload: () => void
  onDelete: () => Promise<void> | void
}

export default function InvoiceDetailHeader({
  invoiceNumber,
  lastModified,
  onDownload,
  onDelete,
}: InvoiceDetailHeaderProps) {
  const [open, setOpen] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      setCountdown(null)
      setIsDeleting(true)
      Promise.resolve(onDelete())
        .finally(() => {
          setIsDeleting(false)
          setOpen(false)
        })
      return
    }
    const timer = window.setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : prev))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [countdown, onDelete])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setCountdown(null)
      setIsDeleting(false)
    }
  }

  const handleConfirmClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (isDeleting) return
    if (countdown === null) {
      setCountdown(6)
      return
    }
    if (countdown > 0) {
      setCountdown(0)
    }
  }

  const actionLabel = isDeleting
    ? "Suppression..."
    : countdown !== null
      ? "Supprimer maintenant"
      : "Supprimer"

  return (
    <div className="flex items-center gap-3">
      <Button asChild variant="outline" size="icon" className="h-10 w-10">
        <Link to="/dashboard/invoices">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Retour</span>
        </Link>
      </Button>
      <div className="flex-1">
        <h1 className="text-2xl font-semibold">Facture {invoiceNumber}</h1>
        <p className="text-sm text-muted-foreground">
          Dernière modification le : {lastModified}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="gap-2" onClick={onDownload}>
          <Download className="h-4 w-4" />
          Télécharger
        </Button>
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Confirmez la suppression de la facture et de son document associé.
              </AlertDialogDescription>
              {countdown !== null && (
                <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Suppression automatique dans {countdown}s. Vous pouvez encore annuler.</span>
                </div>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 dark:text-foreground"
                onClick={handleConfirmClick}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {actionLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
