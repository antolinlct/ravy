import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type AnalyticsPageHeaderProps = {
  title: string
  subtitle: string
  activeTab: "general" | "detail"
  onNavigate: (tab: "general" | "detail") => void
}

export const AnalyticsPageHeader = ({
  title,
  subtitle,
  activeTab,
  onNavigate,
}: AnalyticsPageHeaderProps) => {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={activeTab} onValueChange={(value) => onNavigate(value as "general" | "detail")}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="general" className="flex-1 px-4">
              Général
            </TabsTrigger>
            <TabsTrigger value="detail" className="flex-1 px-4">
              Détails
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </header>
  )
}
