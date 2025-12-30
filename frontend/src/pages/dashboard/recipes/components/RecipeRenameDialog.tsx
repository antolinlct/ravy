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

type RecipeRenameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  renameValue: string
  onRenameValueChange: (value: string) => void
  onConfirm: () => void
}

export function RecipeRenameDialog({
  open,
  onOpenChange,
  renameValue,
  onRenameValueChange,
  onConfirm,
}: RecipeRenameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renommer la recette</DialogTitle>
          <DialogDescription>Modifiez le nom affiché dans votre carte.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="rename-name">Nom</Label>
          <Input id="rename-name" value={renameValue} onChange={(event) => onRenameValueChange(event.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={onConfirm} disabled={!renameValue.trim()}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
