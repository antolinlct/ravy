import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ReportConsultantCard from "./ReportConsultantCard"

type SidebarItem<T extends string = string> = {
  id: T
  label: string
  icon: LucideIcon
}

type ReportSectionsCardProps<T extends string> = {
  title: string
  sidebarItems: SidebarItem<T>[]
  activeSection: T
  onSectionChange: (sectionId: T) => void
  activeContent: React.ReactNode
  consultant: { title: string; body: string }
  consultantAvatarSrc: string
}

export default function ReportSectionsCard<T extends string>({
  title,
  sidebarItems,
  activeSection,
  onSectionChange,
  activeContent,
  consultant,
  consultantAvatarSrc,
}: ReportSectionsCardProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="space-y-2 md:pr-2">
            {sidebarItems.map((item) => {
              const isActive = activeSection === item.id
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-2 ${isActive ? "" : "text-muted-foreground"}`}
                  onClick={() => onSectionChange(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {isActive ? <ChevronRight className="ml-auto h-4 w-4" /> : null}
                </Button>
              )
            })}
          </div>
          <div className="space-y-3">{activeContent}</div>
        </div>
        <ReportConsultantCard
          avatarSrc={consultantAvatarSrc}
          title={consultant.title}
          body={consultant.body}
        />
      </CardContent>
    </Card>
  )
}
