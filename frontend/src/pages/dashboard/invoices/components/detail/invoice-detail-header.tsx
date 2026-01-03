import { ArrowLeft, Download, Trash2 } from "lucide-react"
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
  onDelete: () => void
}

export default function InvoiceDetailHeader({
  invoiceNumber,
  lastModified,
  onDownload,
  onDelete,
}: InvoiceDetailHeaderProps) {
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
        <AlertDialog>
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
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 dark:text-foreground"
                onClick={onDelete}
              >
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
