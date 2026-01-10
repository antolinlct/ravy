import api from "@/lib/axiosClient"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export type ApiUsageCounter = {
  id: string
  value_category?: "seat" | "invoices" | "recipe" | null
  used_value?: number | string | null
  limit_value?: number | string | null
  period_start?: string | null
  period_end?: string | null
}

export type ApiBillingAccount = {
  id: string
  establishment_id?: string | null
  billing_cycle?: "monthly" | "yearly" | null
  free_mode?: boolean | null
  stripe_customer_id_prod?: string | null
  stripe_customer_id_live?: string | null
  stripe_subscription_id_prod?: string | null
  stripe_subscription_id_live?: string | null
  current_period_start?: string | null
  current_period_end?: string | null
}

export type ApiBillingItem = {
  id: string
  billling_acount_id?: string | null
  product_id?: string | null
  price_id?: string | null
  current_period_start?: string | null
  current_period_end?: string | null
  quantity?: number | string | null
  stripe_subscription_item_id_prod?: string | null
  stripe_subscription_item_id_live?: string | null
}

export type ApiProductStripe = {
  id: string
  internal_code?: string | null
  marketing_name?: string | null
  description?: string | null
  plan_or_addon?: "plan" | "addon" | null
  addon_category?: "seat" | "invoices" | "recipe" | null
  addon_value?: number | string | null
  included_seats?: number | string | null
  included_invoices?: number | string | null
  included_recipes?: number | string | null
}

export type ApiPriceStripe = {
  id: string
  product_id?: string | null
  billing_cycle?: "monthly" | "yearly" | null
  unit_amount?: number | string | null
  is_active?: boolean | null
}

export type SubscriptionData = {
  billingAccount: ApiBillingAccount | null
  billingItems: ApiBillingItem[]
  products: ApiProductStripe[]
  prices: ApiPriceStripe[]
}

export const fetchSubscriptionData = async (estId: string): Promise<SubscriptionData> => {
  const [billingAccountRes, productRes, priceRes] = await Promise.all([
    api.get<ApiBillingAccount[]>("/billing_account", {
      params: { establishment_id: estId, limit: 1 },
    }),
    api.get<ApiProductStripe[]>("/product_stripe", { params: { limit: 200 } }),
    api.get<ApiPriceStripe[]>("/price_stripe", {
      params: { is_active: true, limit: 500 },
    }),
  ])

  const billingAccount = billingAccountRes.data?.[0] ?? null
  const billingItemsRes = billingAccount?.id
    ? await api.get<ApiBillingItem[]>("/billing_item", {
        params: { billling_acount_id: billingAccount.id, limit: 200 },
      })
    : { data: [] as ApiBillingItem[] }
  const billingItems = billingAccount?.id
    ? (billingItemsRes.data ?? []).filter(
        (item) => item.billling_acount_id === billingAccount.id
      )
    : []

  return {
    billingAccount,
    billingItems,
    products: productRes.data ?? [],
    prices: priceRes.data ?? [],
  }
}

type StripePortalParams = {
  stripeCustomerId: string
  returnUrl: string
  establishmentId?: string | null
  accessToken?: string
}

export const createStripePortalSession = async ({
  stripeCustomerId,
  returnUrl,
  establishmentId,
  accessToken,
}: StripePortalParams) => {
  if (!accessToken) {
    throw new Error("missing_access_token")
  }
  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/functions/v1/stripe-customer-portal-test`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stripe_customer_id: stripeCustomerId,
        return_url: returnUrl,
        establishment_id: establishmentId,
      }),
    }
  )

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const errorMessage =
      typeof data?.error === "string"
        ? data.error
        : typeof data?.message === "string"
          ? data.message
          : `Stripe portal error (${response.status})`
    throw new Error(errorMessage)
  }

  return data?.url ?? null
}

type StripeAddonAction = "add" | "remove" | "set_quantity"

type StripeAddonParams = {
  action: StripeAddonAction
  priceStripeId: string
  establishmentId: string
  accessToken: string
  prorationBehavior?: "create_prorations" | "none"
  quantity?: number
}

export const updateStripeAddon = async ({
  action,
  priceStripeId,
  establishmentId,
  accessToken,
  prorationBehavior = "create_prorations",
  quantity,
}: StripeAddonParams) => {
  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/functions/v1/stripe-addons-test`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        price_stripe_id: priceStripeId,
        establishment_id: establishmentId,
        proration_behavior: prorationBehavior,
        quantity,
      }),
    }
  )

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const errorMessage =
      typeof data?.error === "string"
        ? data.error
        : typeof data?.message === "string"
          ? data.message
          : `Stripe addon error (${response.status})`
    throw new Error(errorMessage)
  }

  return data
}

type StripeCheckoutParams = {
  priceStripeId: string
  successUrl: string
  cancelUrl: string
  stripeCustomerId: string | null
  establishmentId: string | null
  userId: string | null
  customerEmail: string | null
}

export const createStripeCheckoutSession = async ({
  priceStripeId,
  successUrl,
  cancelUrl,
  stripeCustomerId,
  establishmentId,
  userId,
  customerEmail,
}: StripeCheckoutParams) => {
  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/functions/v1/stripe-checkout-session-test`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_stripe_id: priceStripeId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        stripe_customer_id: stripeCustomerId,
        establishment_id: establishmentId,
        user_id: userId,
        customer_email: customerEmail,
      }),
    }
  )

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const errorMessage =
      typeof data?.error === "string"
        ? data.error
        : typeof data?.message === "string"
          ? data.message
          : `Stripe checkout error (${response.status})`
    throw new Error(errorMessage)
  }

  return data?.url ?? null
}
