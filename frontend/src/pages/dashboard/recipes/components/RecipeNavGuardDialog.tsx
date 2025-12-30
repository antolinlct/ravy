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

type RecipeNavGuardDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredientsCount: number
  onConfirmLeave: () => void
  onSaveAndLeave: () => void
}

export function RecipeNavGuardDialog({
  open,
  onOpenChange,
  ingredientsCount,
  onConfirmLeave,
  onSaveAndLeave,
}: RecipeNavGuardDialogProps) {
  const hasIngredients = ingredientsCount > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Modifications non enregistrées</AlertDialogTitle>
          <AlertDialogDescription>
            Vous avez des paramètres non enregistrés. Voulez-vous quitter cette page sans enregistrer,
            ou enregistrer vos paramètres avant de partir ?
            {hasIngredients ? "" : " Ajoutez au moins un ingrédient pour pouvoir quitter ou enregistrer."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-end">
          <AlertDialogCancel>Rester</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmLeave}
            className={buttonVariants({ variant: "destructive" })}
            disabled={!hasIngredients}
          >
            Quitter sans enregistrer
          </AlertDialogAction>
          <AlertDialogAction className={buttonVariants({ variant: "default" })} onClick={onSaveAndLeave}>
            Enregistrer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
