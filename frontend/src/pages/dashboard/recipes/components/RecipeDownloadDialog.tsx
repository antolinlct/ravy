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
import { Checkbox as CheckboxIcon } from "@/components/ui/checkbox"
import { Editor } from "@/components/blocks/editor-00/editor"
import { FileDown, X } from "lucide-react"
import type { SerializedEditorState } from "lexical"

const imageHint = "Glissez-déposez ou cliquez pour ajouter une image."

type RecipeDownloadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipeName: string
  technicalImageFile: File | null
  technicalImagePreview: string | null
  onTechnicalImageChange: (file: File | null) => void
  downloadEditorState: SerializedEditorState | null
  onDownloadEditorStateChange: (state: SerializedEditorState | null) => void
  downloadShowFinancial: boolean
  onDownloadShowFinancialChange: (next: boolean) => void
  onConfirm: () => void
}

export function RecipeDownloadDialog({
  open,
  onOpenChange,
  recipeName,
  technicalImageFile,
  technicalImagePreview,
  onTechnicalImageChange,
  downloadEditorState,
  onDownloadEditorStateChange,
  downloadShowFinancial,
  onDownloadShowFinancialChange,
  onConfirm,
}: RecipeDownloadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-primary">Téléchargez votre recette</DialogTitle>
          <DialogDescription>
            La recette <span className="font-semibold text-primary">{recipeName}</span> est prête à être téléchargée.
            Vous pouvez ajouter ou modifier les instructions qui apparaîtront sous la liste des ingrédients.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="technical-image" className="text-base">
            Image de fiche technique
          </Label>
          <div className="grid grid-cols-4 items-stretch gap-4">
            <div className="relative col-span-3 flex h-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/40 p-2 text-center">
              <p className="text-xs text-muted-foreground">
                {technicalImageFile?.name ? `Fichier sélectionné : ${technicalImageFile.name}` : imageHint}
              </p>
              <Input
                id="technical-image"
                name="technical-image"
                type="file"
                accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={(event) => onTechnicalImageChange(event.target.files?.[0] ?? null)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              {technicalImageFile && (
                <button
                  type="button"
                  aria-label="Supprimer le fichier sélectionné"
                  className="absolute right-2 top-2 rounded-md bg-background/80 p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => onTechnicalImageChange(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-sidebar-border/60 bg-sidebar p-0.5">
              {technicalImagePreview ? (
                <img src={technicalImagePreview} alt="Aperçu fiche technique" className="h-full w-full rounded-md object-contain" />
              ) : (
                <div className="text-center text-xs text-muted-foreground">Aucun visuel</div>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Optionnel – Formats png, jpg ou svg. L’image sera stockée dans la fiche technique.
          </p>
        </div>
        <div className="space-y-3">
          <Label className="text-base">Instructions de la recette</Label>
          <Editor
            placeholder="Exemple (formatable) : 1) Préparez tous les ingrédients. 2) Mélangez jusqu’à obtenir une pâte lisse. 3) Enfournez à 180°C pendant 20 min. Ajoutez vos étapes détaillées ici."
            editorSerializedState={downloadEditorState ?? undefined}
            onSerializedChange={(state) => onDownloadEditorStateChange(state)}
          />
        </div>
        <DialogFooter className="flex flex-col gap-4">
          <div className="flex w-full flex-wrap items-center gap-2 justify-start">
            <button
              type="button"
              onClick={() => onDownloadShowFinancialChange(!downloadShowFinancial)}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm transition hover:bg-muted"
              aria-pressed={downloadShowFinancial}
            >
              <CheckboxIcon
                checked={downloadShowFinancial}
                onCheckedChange={(state) => onDownloadShowFinancialChange(state === true)}
                className="h-4 w-4 text-[#108FFF] data-[state=checked]:border-[#108FFF] data-[state=checked]:bg-[#108FFF]"
              />
              <span>Afficher les données financières</span>
            </button>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={onConfirm} className="gap-2">
              <FileDown className="h-4 w-4" />
              Télécharger
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
