import { cn } from "@/lib/utils"

type EmptyStateProps = {
  message: string
  className?: string
}

export function EmptyState({ message, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground",
        className
      )}
    >
      {message}
    </div>
  )
}
