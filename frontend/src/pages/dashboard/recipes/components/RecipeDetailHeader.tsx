import { ArrowLeft, Copy, Download, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type RecipeDetailHeaderProps = {
  recipeName: string
  formattedUpdatedAt: string
  onBack: () => void
  onRename: () => void
  onDuplicate: () => void
  onDownload: () => void
  onDelete: () => void
}

export function RecipeDetailHeader({
  recipeName,
  formattedUpdatedAt,
  onBack,
  onRename,
  onDuplicate,
  onDownload,
  onDelete,
}: RecipeDetailHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" className="h-10 w-10" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Retour</span>
      </Button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{recipeName}</h1>
          <Button variant="ghost" size="icon" onClick={onRename} aria-label="Renommer">
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Dernière modification : {formattedUpdatedAt}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" className="gap-2" onClick={onDuplicate}>
          <Copy className="h-4 w-4" />
          Dupliquer
        </Button>
        <Button variant="outline" className="gap-2" onClick={onDownload}>
          <Download className="h-4 w-4" />
          Télécharger
        </Button>
        <Button variant="destructive" className="gap-2" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </div>
    </div>
  )
}
