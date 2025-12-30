import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type RecipeDuplicateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipeName: string
  duplicateName: string
  onDuplicateNameChange: (value: string) => void
  onConfirm: () => void
}

export function RecipeDuplicateDialog({
  open,
  onOpenChange,
  recipeName,
  duplicateName,
  onDuplicateNameChange,
  onConfirm,
}: RecipeDuplicateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dupliquer la recette</DialogTitle>
          <DialogDescription>
            Donnez un nom à la copie de <span className="font-semibold">{recipeName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="duplicate-name">Nom</Label>
          <Input
            id="duplicate-name"
            value={duplicateName}
            onChange={(event) => onDuplicateNameChange(event.target.value)}
            placeholder={`Copie de ${recipeName}`}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={onConfirm} disabled={!duplicateName.trim()}>
            Dupliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
