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

type RecipeDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipeName: string
  onConfirm: () => void
}

export function RecipeDeleteDialog({ open, onOpenChange, recipeName, onConfirm }: RecipeDeleteDialogProps) {
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
          <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={onConfirm}>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
