import type { CSSProperties } from "react"
import { ChefHat, FileText, Users, type LucideIcon } from "lucide-react"

import type {
  ApiBillingItem,
  ApiPriceStripe,
  ApiProductStripe,
  ApiUsageCounter,
  SubscriptionData,
} from "./api"

export type UsageItem = {
  key: string
  label: string
  icon: LucideIcon
  iconClassName: string
  value: number
  detail: string
  quota: string
}

type AddonPricing = {
  productId: string
  addonCategory?: "seat" | "invoices" | "recipe" | null
  addonValue: number | null
  monthlyAmount: number | null
  yearlyAmount: number | null
  monthlyPriceId: string | null
  yearlyPriceId: string | null
}

export type ActiveAddonItem = AddonPricing & {
  id: string
  name: string
  detail: string
  price: string
  priceStripeId: string | null
  quantity: number
  amount: number | null
  billingCycle: "monthly" | "yearly" | null
}

export type AvailableAddonItem = AddonPricing & {
  id: string
  name: string
  detail: string
  price: string
  priceStripeId: string | null
}

export type AddonCategory = "seat" | "invoices" | "recipe"

export type AddonSlot = {
  category: AddonCategory
  title: string
  activeAddon: ActiveAddonItem | null
  availableAddon: AvailableAddonItem | null
}

export type PlanSummary = {
  name: string
  price: string
  status: string
  renewal: string
  billingCycle: "monthly" | "yearly" | null
  amount: number | null
  periodStart: string | null
  periodEnd: string | null
}

export type PlanTier = "apero" | "plat" | "menu" | "other"

export type PlanDialogItem = {
  id: string
  name: string
  description: string
  monthlyAmount: number | null
  yearlyAmount: number | null
  monthlyPriceId: string | null
  yearlyPriceId: string | null
  includes: string[]
  isPopular: boolean
  tier: PlanTier
}

export type SubscriptionViewModel = {
  plan: PlanSummary
  usage: UsageItem[]
  activeAddons: ActiveAddonItem[]
  availableAddons: AvailableAddonItem[]
  isFree: boolean
  hasStripeCustomer: boolean
  planDialogItems: PlanDialogItem[]
}

const usageConfig = [
  {
    key: "invoices",
    label: "Factures importées (par mois)",
    icon: FileText,
    iconClassName: "h-4 w-4 text-sky-500",
    unit: "factures",
    detailSuffix: "mensuel",
  },
  {
    key: "recipe",
    label: "Recettes actives suivies",
    icon: ChefHat,
    iconClassName: "h-4 w-4 text-amber-500",
    unit: "recettes",
    detailSuffix: "",
  },
  {
    key: "seat",
    label: "Utilisateurs actifs",
    icon: Users,
    iconClassName: "h-4 w-4 text-emerald-500",
    unit: "utilisateurs",
    detailSuffix: "",
  },
]

export const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const countFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeStripeAmount = (value: number | string | null | undefined) => {
  const parsed = toNumber(value)
  if (parsed === null) return null
  return parsed
}

const formatDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return dateFormatter.format(date)
}

const formatCycle = (cycle?: "monthly" | "yearly" | null) =>
  cycle === "yearly" ? " / an" : " / mois"

const formatAddonPrice = (
  amount: number | null,
  cycle?: "monthly" | "yearly" | null
) => (amount !== null ? `+${currencyFormatter.format(amount)}${formatCycle(cycle)}` : "--")

const formatAddonDetail = (addon: ApiProductStripe) => {
  if (addon.description) return addon.description
  const rawValue = toNumber(addon.addon_value)
  const valueLabel = rawValue !== null ? countFormatter.format(rawValue) : "0"
  switch (addon.addon_category) {
    case "invoices":
      return `+${valueLabel} factures / mois`
    case "recipe":
      return `+${valueLabel} recettes`
    case "seat":
      return `+${valueLabel} utilisateurs`
    default:
      return "Pack option"
  }
}

const formatAddonSlotTitle = (category: AddonCategory, addonValue: number | null) => {
  const valueLabel = addonValue !== null ? countFormatter.format(addonValue) : null
  switch (category) {
    case "invoices":
      return valueLabel
        ? `Ajouter ${valueLabel} factures supplémentaires / mois`
        : "Ajouter des factures supplémentaires"
    case "recipe":
      return valueLabel
        ? `Ajouter ${valueLabel} recettes supplémentaires`
        : "Ajouter des recettes supplémentaires"
    case "seat":
      return valueLabel
        ? `Ajouter ${valueLabel} utilisateur${
            addonValue && addonValue > 1 ? "s" : ""
          } supplémentaire${addonValue && addonValue > 1 ? "s" : ""}`
        : "Ajouter des utilisateurs supplémentaires"
    default:
      return "Ajouter un pack"
  }
}

const buildPricesByProduct = (prices: ApiPriceStripe[]) => {
  const map = new Map<string, ApiPriceStripe[]>()
  prices.forEach((price) => {
    if (!price.product_id) return
    const list = map.get(price.product_id) ?? []
    list.push(price)
    map.set(price.product_id, list)
  })
  return map
}

const findPriceForCycle = (
  pricesByProduct: Map<string, ApiPriceStripe[]>,
  productId: string,
  cycle: "monthly" | "yearly"
) => {
  const list = pricesByProduct.get(productId) ?? []
  return list.find((price) => price.billing_cycle === cycle && price.is_active) ?? null
}

const buildAddonPricing = (
  product: ApiProductStripe,
  pricesByProduct: Map<string, ApiPriceStripe[]>
) => {
  const monthlyPrice = findPriceForCycle(pricesByProduct, product.id, "monthly")
  const yearlyPrice = findPriceForCycle(pricesByProduct, product.id, "yearly")
  const monthlyRaw = toNumber(monthlyPrice?.unit_amount)
  const yearlyRaw = toNumber(yearlyPrice?.unit_amount)
  return {
    productId: product.id,
    addonCategory: product.addon_category ?? null,
    addonValue: toNumber(product.addon_value),
    monthlyAmount: normalizeStripeAmount(monthlyRaw),
    yearlyAmount: normalizeStripeAmount(yearlyRaw),
    monthlyPriceId: monthlyPrice?.id ?? null,
    yearlyPriceId: yearlyPrice?.id ?? null,
  }
}

const getPlanTier = (product: ApiProductStripe): PlanTier => {
  const label = `${product.internal_code ?? ""} ${product.marketing_name ?? ""}`.toLowerCase()
  if (label.includes("apero") || label.includes("apéro")) return "apero"
  if (label.includes("plat")) return "plat"
  if (label.includes("menu")) return "menu"
  return "other"
}

export const getPlanPatternStyle = (tier: PlanTier): CSSProperties | undefined => {
  if (tier === "menu") {
    return {
      backgroundImage:
        "radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.12) 1px, transparent 0)",
      backgroundSize: "18px 18px",
    }
  }
  if (tier === "plat") {
    return {
      backgroundImage:
        "linear-gradient(to right, rgba(59, 130, 246, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.12) 1px, transparent 1px)",
      backgroundSize: "32px 32px",
      WebkitMaskImage:
        "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
      maskImage:
        "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
    }
  }
  return undefined
}

const buildUsageItems = (
  usageCounters: ApiUsageCounter[],
  planQuotaByCategory: Record<string, number | null>
): UsageItem[] => {
  const countersByCategory = usageCounters.reduce<Record<string, ApiUsageCounter>>(
    (acc, counter) => {
      if (counter.value_category) {
        acc[counter.value_category] = counter
      }
      return acc
    },
    {}
  )

  return usageConfig.map((config) => {
    const counter = countersByCategory[config.key]
    const used = toNumber(counter?.used_value) ?? 0
    const limit = toNumber(counter?.limit_value) ?? planQuotaByCategory[config.key] ?? null
    const percent = limit && limit > 0 ? Math.min((used / limit) * 100, 100) : 0
    const detail =
      limit !== null
        ? `${Math.round(percent)}% du quota${config.detailSuffix ? ` ${config.detailSuffix}` : ""}`
        : "Quota illimité"
    const quota =
      limit !== null
        ? `${countFormatter.format(used)} / ${countFormatter.format(limit)} ${config.unit}`
        : `${countFormatter.format(used)} ${config.unit}`

    return {
      key: config.key,
      label: config.label,
      icon: config.icon,
      iconClassName: config.iconClassName,
      value: percent,
      detail,
      quota,
    }
  })
}

const buildActiveAddons = (
  billingItems: ApiBillingItem[],
  productById: Map<string, ApiProductStripe>,
  priceById: Map<string, ApiPriceStripe>,
  pricesByProduct: Map<string, ApiPriceStripe[]>,
  billingCycle: "monthly" | "yearly" | null | undefined,
  addonExtrasByCategory: Record<string, number | null>,
  addonCountsByCategory: Record<string, number>
): ActiveAddonItem[] =>
  billingItems
    .map((item) => {
      const product = item.product_id ? productById.get(item.product_id) : null
      const price = item.price_id ? priceById.get(item.price_id) : null
      if (!product || product.plan_or_addon !== "addon") return null
      const priceRaw = toNumber(price?.unit_amount)
      const priceValue = normalizeStripeAmount(priceRaw)
      const addonPricing = buildAddonPricing(product, pricesByProduct)
      const effectiveCycle = (price?.billing_cycle ??
        billingCycle ??
        "monthly") as "monthly" | "yearly"
      const fallbackAmount =
        effectiveCycle === "yearly" ? addonPricing.yearlyAmount : addonPricing.monthlyAmount
      const amount = priceValue ?? fallbackAmount ?? null
      const addonCategory = product.addon_category ?? null
      const addonValue = addonPricing.addonValue
      let quantity = 1
      const storedQuantity = toNumber(item.quantity)
      const hasStoredQuantity = Boolean(storedQuantity && storedQuantity > 0)
      if (hasStoredQuantity) {
        quantity = storedQuantity as number
      }
      if (!hasStoredQuantity && addonCategory && addonValue) {
        const activeCount = addonCountsByCategory[addonCategory] ?? 0
        const extra = addonExtrasByCategory[addonCategory]
        if (activeCount === 1 && extra !== null && extra !== undefined) {
          const computed = Math.round(extra / addonValue)
          if (computed > 0) {
            quantity = computed
          }
        }
      }
      return {
        id: item.id,
        name: product.marketing_name || product.internal_code || "Addon",
        detail: formatAddonDetail(product),
        price: formatAddonPrice(priceValue, effectiveCycle),
        productId: product.id,
        addonCategory,
        addonValue,
        monthlyAmount: addonPricing.monthlyAmount,
        yearlyAmount: addonPricing.yearlyAmount,
        monthlyPriceId: addonPricing.monthlyPriceId,
        yearlyPriceId: addonPricing.yearlyPriceId,
        priceStripeId: item.price_id ?? price?.id ?? null,
        quantity,
        amount,
        billingCycle: effectiveCycle,
      }
    })
    .filter((item): item is ActiveAddonItem => Boolean(item))

const buildAvailableAddons = (
  products: ApiProductStripe[],
  pricesByProduct: Map<string, ApiPriceStripe[]>,
  activeAddonIds: Set<string>,
  billingCycle?: "monthly" | "yearly" | null
): AvailableAddonItem[] =>
  products
    .filter(
      (product) => product.plan_or_addon === "addon" && !activeAddonIds.has(product.id)
    )
    .map((product) => {
      const addonPricing = buildAddonPricing(product, pricesByProduct)
      const targetCycle = billingCycle ?? "monthly"
      const priceId =
        targetCycle === "yearly" ? addonPricing.yearlyPriceId : addonPricing.monthlyPriceId
      const displayAmount =
        targetCycle === "yearly" ? addonPricing.yearlyAmount : addonPricing.monthlyAmount
      return {
        id: product.id,
        name: product.marketing_name || product.internal_code || "Addon",
        detail: formatAddonDetail(product),
        price: formatAddonPrice(displayAmount, targetCycle),
        productId: product.id,
        addonCategory: addonPricing.addonCategory,
        addonValue: addonPricing.addonValue,
        monthlyAmount: addonPricing.monthlyAmount,
        yearlyAmount: addonPricing.yearlyAmount,
        monthlyPriceId: addonPricing.monthlyPriceId,
        yearlyPriceId: addonPricing.yearlyPriceId,
        priceStripeId: priceId,
      }
    })

const buildPlanDialogItems = (
  products: ApiProductStripe[],
  prices: ApiPriceStripe[]
): PlanDialogItem[] =>
  products
    .filter(
      (product) => product.plan_or_addon === "plan" && product.internal_code !== "PLAN_FREE"
    )
    .map((product) => {
      const monthlyPrice = prices.find(
        (item) => item.product_id === product.id && item.is_active && item.billing_cycle === "monthly"
      )
      const yearlyPrice = prices.find(
        (item) => item.product_id === product.id && item.is_active && item.billing_cycle === "yearly"
      )
      const includes: string[] = []
      const invoicesValue = toNumber(product.included_invoices)
      const recipesValue = toNumber(product.included_recipes)
      const seatsValue = toNumber(product.included_seats)
      if (invoicesValue !== null) {
        includes.push(`Jusqu’à ${countFormatter.format(invoicesValue)} factures / mois`)
      }
      if (recipesValue !== null) {
        includes.push(`Jusqu’à ${countFormatter.format(recipesValue)} recettes actives`)
      }
      if (seatsValue !== null) {
        includes.push(`Jusqu’à ${countFormatter.format(seatsValue)} utilisateurs`)
      }
      if (!includes.length) {
        includes.push("Accès complet aux fonctionnalités")
      }
      const monthlyRaw = toNumber(monthlyPrice?.unit_amount)
      const yearlyRaw = toNumber(yearlyPrice?.unit_amount)
      const tier = getPlanTier(product)
      return {
        id: product.id,
        name: product.marketing_name || product.internal_code || "Plan",
        description: product.description || "Accès complet aux fonctionnalités Ravy.",
        monthlyAmount: normalizeStripeAmount(monthlyRaw),
        yearlyAmount: normalizeStripeAmount(yearlyRaw),
        monthlyPriceId: monthlyPrice?.id ?? null,
        yearlyPriceId: yearlyPrice?.id ?? null,
        includes,
        isPopular:
          Boolean(product.marketing_name?.toLowerCase().includes("plat")) ||
          Boolean(product.internal_code?.toLowerCase().includes("plat")),
        tier,
      }
    })

export const buildSubscriptionViewModel = (
  subscriptionData?: SubscriptionData | null,
  usageCounters?: ApiUsageCounter[] | null
): SubscriptionViewModel => {
  const usageCountersList = usageCounters ?? []
  const billingAccount = subscriptionData?.billingAccount ?? null
  const billingItems = subscriptionData?.billingItems ?? []
  const products = subscriptionData?.products ?? []
  const prices = subscriptionData?.prices ?? []

  const productById = new Map(products.map((item) => [item.id, item]))
  const priceById = new Map(prices.map((item) => [item.id, item]))
  const pricesByProduct = buildPricesByProduct(prices)
  const freePlanProduct = products.find((item) => item.internal_code === "PLAN_FREE") ?? null

  const planItem = billingItems.find((item) => {
    const product = item.product_id ? productById.get(item.product_id) : null
    return product?.plan_or_addon === "plan"
  })
  const planProduct = planItem?.product_id ? productById.get(planItem.product_id) : null
  const planPrice = planItem?.price_id ? priceById.get(planItem.price_id) : null

  const planPriceRaw = toNumber(planPrice?.unit_amount)
  const planPriceAmount = normalizeStripeAmount(planPriceRaw)
  const planCycle = (planPrice?.billing_cycle ??
    billingAccount?.billing_cycle ??
    "monthly") as "monthly" | "yearly"
  const priceLabel =
    planPriceAmount !== null
      ? `${currencyFormatter.format(planPriceAmount)}${formatCycle(planCycle)}`
      : `0 €${formatCycle(planCycle)}`

  const periodEndValue =
    billingAccount?.current_period_end ?? planItem?.current_period_end ?? null
  const periodStartValue =
    billingAccount?.current_period_start ?? planItem?.current_period_start ?? null
  const renewalDate = formatDate(periodEndValue)
  const isFree = Boolean(billingAccount?.free_mode) || !planItem
  const effectivePlanProduct = isFree ? freePlanProduct ?? planProduct : planProduct

  const planData: PlanSummary = {
    name:
      effectivePlanProduct?.marketing_name ||
      effectivePlanProduct?.internal_code ||
      "Plan gratuit",
    price: priceLabel,
    status: isFree ? "Gratuit" : "Actif",
    renewal: renewalDate
      ? `Renouvellement automatique le ${renewalDate}`
      : isFree
        ? "Aucun renouvellement"
        : "Renouvellement à venir",
    billingCycle: planCycle ?? null,
    amount: planPriceAmount ?? (isFree ? 0 : null),
    periodStart: periodStartValue,
    periodEnd: periodEndValue,
  }

  const stripeCustomerId =
    billingAccount?.stripe_customer_id_live ?? billingAccount?.stripe_customer_id_prod ?? null

  const planQuotaByCategory: Record<string, number | null> = {
    invoices: toNumber(effectivePlanProduct?.included_invoices),
    recipe: toNumber(effectivePlanProduct?.included_recipes),
    seat: toNumber(effectivePlanProduct?.included_seats),
  }

  const usageItems = buildUsageItems(usageCountersList, planQuotaByCategory)
  const usageLimitByCategory = usageCountersList.reduce<Record<string, number | null>>(
    (acc, counter) => {
      if (counter.value_category) {
        acc[counter.value_category] = toNumber(counter.limit_value)
      }
      return acc
    },
    {}
  )
  const addonExtrasByCategory = Object.keys(planQuotaByCategory).reduce<
    Record<string, number | null>
  >((acc, key) => {
    const base = planQuotaByCategory[key]
    const limit = usageLimitByCategory[key]
    if (base !== null && limit !== null && limit !== undefined) {
      acc[key] = Math.max(limit - base, 0)
    } else {
      acc[key] = null
    }
    return acc
  }, {})
  const addonCountsByCategory = billingItems.reduce<Record<string, number>>((acc, item) => {
    const product = item.product_id ? productById.get(item.product_id) : null
    const category = product?.addon_category
    if (product?.plan_or_addon === "addon" && category) {
      acc[category] = (acc[category] ?? 0) + 1
    }
    return acc
  }, {})
  const activeAddonItems = buildActiveAddons(
    billingItems,
    productById,
    priceById,
    pricesByProduct,
    planCycle,
    addonExtrasByCategory,
    addonCountsByCategory
  )

  const activeAddonIds = new Set(activeAddonItems.map((item) => item.productId))
  const availableAddonItems = buildAvailableAddons(
    products,
    pricesByProduct,
    activeAddonIds,
    planCycle
  )

  const planDialogItems = buildPlanDialogItems(products, prices)

  return {
    plan: planData,
    usage: usageItems,
    activeAddons: activeAddonItems,
    availableAddons: availableAddonItems,
    isFree,
    hasStripeCustomer: Boolean(stripeCustomerId),
    planDialogItems,
  }
}

export const sortPlanDialogItems = (items: PlanDialogItem[]) => {
  const next = [...items]
  next.sort((a, b) => {
    const priceA = a.monthlyAmount ?? Number.POSITIVE_INFINITY
    const priceB = b.monthlyAmount ?? Number.POSITIVE_INFINITY
    return priceA - priceB
  })
  return next
}

const pickAddonForSlot = (addons: AvailableAddonItem[]) => {
  if (!addons.length) return null
  const pool = addons.some((addon) => addon.priceStripeId)
    ? addons.filter((addon) => addon.priceStripeId)
    : addons
  const sorted = [...pool].sort((a, b) => {
    const valueA = a.addonValue ?? Number.POSITIVE_INFINITY
    const valueB = b.addonValue ?? Number.POSITIVE_INFINITY
    return valueA - valueB
  })
  return sorted[0]
}

export const buildAddonSlots = (
  activeAddons: ActiveAddonItem[],
  availableAddons: AvailableAddonItem[]
): AddonSlot[] => {
  const categories: AddonCategory[] = ["invoices", "recipe", "seat"]
  const activeByCategory = activeAddons.reduce<Record<string, ActiveAddonItem[]>>(
    (acc, addon) => {
      if (addon.addonCategory) {
        acc[addon.addonCategory] = acc[addon.addonCategory] ?? []
        acc[addon.addonCategory].push(addon)
      }
      return acc
    },
    {}
  )
  const availableByCategory = availableAddons.reduce<Record<string, AvailableAddonItem[]>>(
    (acc, addon) => {
      if (addon.addonCategory) {
        acc[addon.addonCategory] = acc[addon.addonCategory] ?? []
        acc[addon.addonCategory].push(addon)
      }
      return acc
    },
    {}
  )

  return categories.map((category) => {
    const activeList = activeByCategory[category] ?? []
    const activeAddon =
      activeList.length > 1
        ? activeList.sort((a, b) => (a.addonValue ?? 0) - (b.addonValue ?? 0))[0]
        : activeList[0] ?? null
    const availableAddon = activeAddon
      ? null
      : pickAddonForSlot(availableByCategory[category] ?? [])
    const title = formatAddonSlotTitle(
      category,
      availableAddon?.addonValue ?? activeAddon?.addonValue ?? null
    )
    return {
      category,
      title,
      activeAddon,
      availableAddon,
    }
  })
}
