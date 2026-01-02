import { Fragment, useEffect, useState } from "react"
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
import { OnboardingGate } from "@/features/onboarding/OnboardingGate"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import api from "@/lib/axiosClient"

type Crumb = {
  label: string
  to?: string
  hideOnMobile?: boolean
}

type ApiInvoice = {
  id: string
  invoice_number?: string | null
  supplier_id?: string | null
}

type ApiSupplier = {
  id: string
  name?: string | null
}

export default function DashboardLayout() {
  const location = useLocation()

  const segments = location.pathname.split("/").filter(Boolean)
  const invoiceSubPage = segments[2]
  const isInvoiceDetail = segments[1] === "invoices" && invoiceSubPage && invoiceSubPage !== "suppliers"
  const [invoiceBreadcrumbLabel, setInvoiceBreadcrumbLabel] = useState<string | null>(null)

  const labels: Record<string, string> = {
    account: "Compte",
    establishment: "Établissement",
    integrations: "Intégrations",
    preferences: "Préférences",
    subscription: "Abonnement",
    tickets: "Tickets & Support",
    access: "Utilisateurs & accès",
    help: "Support",
  }

  const settingsLabel = "Paramètres"

  const getInvoiceBreadcrumbs = (): Crumb[] => {
    const invoiceLabel = "Factures"

    if (invoiceSubPage === "suppliers") {
      return [
        {
          label: invoiceLabel,
          to: "/dashboard/invoices",
          hideOnMobile: true,
        },
        { label: "Gestion des fournisseurs" },
      ]
    }

    if (invoiceSubPage) {
      return [
        {
          label: invoiceLabel,
          to: "/dashboard/invoices",
          hideOnMobile: true,
        },
        { label: invoiceBreadcrumbLabel ?? "Facture" },
      ]
    }

    return [{ label: invoiceLabel }]
  }

  const getSettingsBreadcrumbs = (): Crumb[] => {
    const settingsIndex = segments.indexOf("settings")
    const currentSettingsPage =
      settingsIndex >= 0 ? segments[settingsIndex + 1] : null
    const currentLabel =
      (currentSettingsPage && labels[currentSettingsPage]) || null

    if (currentLabel) {
      return [
        {
          label: settingsLabel,
          to: "/dashboard/settings/account",
          hideOnMobile: true,
        },
        { label: currentLabel },
      ]
    }

    return [{ label: settingsLabel }]
  }

  const getDefaultBreadcrumbs = (): Crumb[] => {
    const topLevel = segments[1] || segments[0]
    const defaultLabels: Record<string, string> = {
      dashboard: "Dashboard",
      invoices: "Factures",
      recipes: "Recettes",
      analytics: "Analyses",
      performance: "Performances",
      consultant: "Consultant",
      help: "Support",
    }

    const fallbackLabel =
      (topLevel && defaultLabels[topLevel]) ||
      (topLevel
        ? topLevel.charAt(0).toUpperCase() + topLevel.slice(1)
        : "Dashboard")

    return [{ label: fallbackLabel }]
  }

  const breadcrumbItems: Crumb[] = segments[1] === "invoices"
    ? getInvoiceBreadcrumbs()
    : segments[1] === "settings"
      ? getSettingsBreadcrumbs()
      : getDefaultBreadcrumbs()

  useEffect(() => {
    if (!isInvoiceDetail || !invoiceSubPage) {
      setInvoiceBreadcrumbLabel(null)
      return
    }

    const state = location.state as { invoiceBreadcrumb?: string } | null
    if (state?.invoiceBreadcrumb) {
      setInvoiceBreadcrumbLabel(state.invoiceBreadcrumb)
      return
    }

    let active = true

    const loadInvoiceBreadcrumb = async () => {
      try {
        const invoiceRes = await api.get<ApiInvoice>(`/invoices/${invoiceSubPage}`)
        const invoice = invoiceRes.data
        if (!invoice?.id) return

        const baseReference = invoice.invoice_number
          ? invoice.invoice_number.startsWith("N°")
            ? invoice.invoice_number
            : `N° ${invoice.invoice_number}`
          : `Facture ${invoice.id.slice(0, 6)}`
        let label = baseReference.startsWith("Facture") ? baseReference : `Facture ${baseReference}`

        if (invoice.supplier_id) {
          const supplierRes = await api.get<ApiSupplier>(`/suppliers/${invoice.supplier_id}`)
          const supplierName = supplierRes.data?.name
          if (supplierName) {
            label = `${label} - ${supplierName}`
          }
        }

        if (active) {
          setInvoiceBreadcrumbLabel(label)
        }
      } catch {
        if (active) {
          setInvoiceBreadcrumbLabel("Facture")
        }
      }
    }

    loadInvoiceBreadcrumb()

    return () => {
      active = false
    }
  }, [invoiceSubPage, isInvoiceDetail, location.state])

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

      <OnboardingGate />
    </SidebarInset>
  )
}
