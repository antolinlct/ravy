import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

type RecipeDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipeName: string
  onConfirm: () => void
  isDeleting?: boolean
}

export function RecipeDeleteDialog({
  open,
  onOpenChange,
  recipeName,
  onConfirm,
  isDeleting = false,
}: RecipeDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer la recette ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Voulez-vous supprimer{" "}
            <span className="font-semibold">{recipeName}</span> ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
