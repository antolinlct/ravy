import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type AccessLockedCardProps = {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

const defaultTitle = "Accès restreint"
const defaultDescription =
  "Vous n’avez pas les droits nécessaires pour accéder à cette section. Contactez un administrateur si besoin."

export function AccessLockedCard({
  title = defaultTitle,
  description = defaultDescription,
  actionLabel,
  onAction,
}: AccessLockedCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      {actionLabel && onAction ? (
        <CardContent>
          <Button variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        </CardContent>
      ) : null}
    </Card>
  )
}
