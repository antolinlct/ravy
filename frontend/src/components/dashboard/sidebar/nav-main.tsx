import { ChevronRight, LockKeyhole, type LucideIcon } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    locked?: boolean
    items?: {
      title: string
      url: string
      locked?: boolean
      disabled?: boolean
      redirectTo?: string
      items?: {
        title: string
        url: string
        locked?: boolean
      }[]
    }[]
  }[]
}) {
  const location = useLocation()
  const currentPath = location.pathname
  const navigate = useNavigate()

  const normalizePath = (path: string) => {
    if (!path.includes(":")) return path
    const base = path.split("/:")[0]
    return base
  }

  const resolvePath = (path: string) => {
    if (!path.includes(":")) return path
    const base = normalizePath(path)
    const storageKey =
      base === "/dashboard/analytics/products"
        ? "sidebar.analytics.products.detail"
        : base === "/dashboard/analytics/recipes"
          ? "sidebar.analytics.recipes.detail"
          : null
    const storedPath =
      typeof window !== "undefined" && storageKey
        ? window.sessionStorage.getItem(storageKey)
        : null
    if (storedPath && storedPath.startsWith(`${base}/`)) return storedPath
    if (currentPath.startsWith(`${base}/`)) return currentPath
    return base
  }

  const isPathActive = (path: string, allowNested = true) => {
    const base = normalizePath(path)
    if (currentPath === base || currentPath === `${base}/`) return true
    if (!allowNested) return false
    return currentPath.startsWith(`${base}/`)
  }

  const isGeneralActive = (path: string) => {
    const base = normalizePath(path)
    return currentPath === base || currentPath === `${base}/`
  }

  const isDetailActive = (path: string) => {
    const base = normalizePath(path)
    return currentPath.startsWith(`${base}/`) && !isGeneralActive(base)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Général</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = Boolean(item.items && item.items.length > 0)
          const subActive = hasSubItems
            ? item.items!.some((subItem) => {
                if (isPathActive(subItem.url, true)) return true
                return Boolean(
                  subItem.items?.some((subSub) => isPathActive(subSub.url, true))
                )
              })
            : false
          const active = !hasSubItems
            ? isPathActive(item.url, item.url !== "/dashboard")
            : false

          const firstSubUrl = hasSubItems ? item.items?.[0]?.url : undefined

          if (hasSubItems && item.locked) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  isActive={active}
                >
                  <Link to={item.url} className="flex items-center gap-2">
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <LockKeyhole className="ml-auto h-4 w-4 !text-muted-foreground" />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return hasSubItems ? (
            <Collapsible
              key={`${item.title}-${subActive ? "active" : "inactive"}`}
              asChild
              defaultOpen={subActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={false}
                    onClick={() => {
                      if (firstSubUrl) {
                        navigate(firstSubUrl)
                      }
                    }}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.locked ? (
                      <LockKeyhole className="ml-auto h-4 w-4 !text-muted-foreground" />
                    ) : null}
                    <ChevronRight className="ml-2 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        {subItem.disabled ? (
                          subItem.redirectTo ? (
                            <SidebarMenuSubButton asChild isActive={false}>
                              <Link to={subItem.redirectTo}>
                                <span>{subItem.title}</span>
                                {subItem.locked ? (
                                  <LockKeyhole className="ml-auto h-3.5 w-3.5 !text-muted-foreground" />
                                ) : null}
                              </Link>
                            </SidebarMenuSubButton>
                          ) : (
                            <SidebarMenuSubButton
                              aria-disabled="true"
                              isActive={false}
                              className="cursor-not-allowed"
                            >
                              <span>{subItem.title}</span>
                              {subItem.locked ? (
                                <LockKeyhole className="ml-auto h-3.5 w-3.5 !text-muted-foreground" />
                              ) : null}
                            </SidebarMenuSubButton>
                          )
                        ) : (
                          <SidebarMenuSubButton asChild isActive={false}>
                            <Link to={resolvePath(subItem.url)}>
                              <span>{subItem.title}</span>
                              {subItem.locked ? (
                                <LockKeyhole className="ml-auto h-3.5 w-3.5 !text-muted-foreground" />
                              ) : null}
                            </Link>
                          </SidebarMenuSubButton>
                        )}
                        {subItem.items?.length &&
                        !subItem.disabled &&
                        isPathActive(subItem.url, true) ? (
                          <SidebarMenuSub className="ml-4 border-l border-border/60 pl-2">
                            {subItem.items.map((subSub) => (
                              <SidebarMenuSubItem key={subSub.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={
                                    subSub.title === "Général"
                                      ? isGeneralActive(subSub.url)
                                      : isDetailActive(subSub.url)
                                  }
                                  className="gap-2 text-xs text-muted-foreground"
                                >
                                  <Link to={resolvePath(subSub.url)}>
                                    <span>{subSub.title}</span>
                                    {subSub.locked ? (
                                      <LockKeyhole className="ml-auto h-3.5 w-3.5 !text-muted-foreground" />
                                    ) : null}
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        ) : null}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            // ---- Cas 2 : menu simple (pas de sous-items, pas d’icône flèche) ----
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                isActive={active}
              >
                <Link to={item.url} className="flex items-center gap-2">
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {item.locked ? (
                    <LockKeyhole className="ml-auto h-4 w-4 !text-muted-foreground" />
                  ) : null}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
