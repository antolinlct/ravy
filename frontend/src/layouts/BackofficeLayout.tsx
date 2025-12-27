import { Fragment } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

type Crumb = {
  label: string
  to?: string
  hideOnMobile?: boolean
}

const backofficeLabels: Record<string, string> = {
  establishments: "Utilisateurs",
  logs: "Logs",
  tickets: "Tickets",
  market: "Marche",
  merges: "Fusions",
  mercuriales: "Mercuriales",
  regex: "Regex",
}

export default function BackofficeLayout() {
  const location = useLocation()
  const segments = location.pathname.split("/").filter(Boolean)
  const section = segments[1]
  const sectionLabel = (section && backofficeLabels[section]) || null

  const breadcrumbItems: Crumb[] = sectionLabel
    ? [
        { label: "Backoffice", to: "/backoffice", hideOnMobile: true },
        { label: sectionLabel },
      ]
    : [{ label: "Backoffice" }]

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbItems.map((crumb, index) => {
                const isLast = index === breadcrumbItems.length - 1

                return (
                  <Fragment key={`${crumb.label}-${index}`}>
                    <BreadcrumbItem
                      className={crumb.hideOnMobile ? "hidden md:block" : undefined}
                    >
                      {crumb.to && !isLast ? (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.to}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {!isLast && (
                      <BreadcrumbSeparator
                        className={crumb.hideOnMobile ? "hidden md:block" : undefined}
                      />
                    )}
                  </Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Outlet />
      </div>
    </SidebarInset>
  )
}
