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
  onDeleteAndLeave: () => void
}

export function RecipeNavGuardDialog({
  open,
  onOpenChange,
  ingredientsCount,
  onConfirmLeave,
  onSaveAndLeave,
  onDeleteAndLeave,
}: RecipeNavGuardDialogProps) {
  const hasIngredients = ingredientsCount > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Modifications non enregistrées</AlertDialogTitle>
          <AlertDialogDescription>
            {hasIngredients
              ? "Vous avez des paramètres non enregistrés. Voulez-vous quitter cette page sans enregistrer, ou enregistrer vos paramètres avant de partir ?"
              : "Cette recette ne contient aucun ingrédient. Quitter supprimera la recette."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-end">
          <AlertDialogCancel>Rester</AlertDialogCancel>
          {hasIngredients ? (
            <>
              <AlertDialogAction
                onClick={onConfirmLeave}
                className={buttonVariants({ variant: "destructive" })}
              >
                Quitter sans enregistrer
              </AlertDialogAction>
              <AlertDialogAction className={buttonVariants({ variant: "default" })} onClick={onSaveAndLeave}>
                Enregistrer
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction
              onClick={onDeleteAndLeave}
              className={buttonVariants({ variant: "destructive" })}
            >
              Quitter et supprimer
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
