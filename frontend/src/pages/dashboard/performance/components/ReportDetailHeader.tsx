import { Link } from "react-router-dom"
import { ArrowLeft, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

type ReportDetailHeaderProps = {
  title: string
  subtitle: string
  backHref: string
  editDialog: React.ReactNode
  onDelete?: () => void
}

export default function ReportDetailHeader({
  title,
  subtitle,
  backHref,
  editDialog,
  onDelete,
}: ReportDetailHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Button asChild variant="outline" size="icon" className="h-10 w-10">
        <Link to={backHref}>
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Retour</span>
        </Link>
      </Button>
      <div className="flex-1 space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        {editDialog}
        <Button variant="destructive" className="gap-2" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </div>
    </div>
  )
}
