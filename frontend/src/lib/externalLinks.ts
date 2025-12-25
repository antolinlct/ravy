 /**
 * External links configuration
 *
 * Single source of truth for all external URLs used in the frontend.
 *
 * Purpose:
 * - Centralize external dependencies (website, docs, booking, support)
 * - Avoid hardcoded URLs scattered across components
 * - Enable fast updates without touching UI code
 * - Improve maintainability and AI-assisted refactoring
 *
 * Usage:
 * import { EXTERNAL_LINKS } from "@/lib/externalLinks"
 * EXTERNAL_LINKS.docs
 *
 * Rules:
 * - No logic here
 * - No environment-specific computation
 * - Only explicit, named URLs
 */

export const EXTERNAL_LINKS = {
  website: "https://ravy.app",

  documentation: {
    base: "https://ravy.gitbook.io",
    helpCenter: "https://ravy.gitbook.io/centre-daide",
  },

  booking: {
    calendly: "https://calendly.com/xxxxx",
  },

  support: {
    email: "mailto:support@ravy.app",
    helpdesk: "https://support.ravy.app",
  },

  legal: {
    terms: "https://ravy.app/conditions",
    privacy: "https://ravy.app/confidentialite",
  },
} as const

/**
 * Notes for future contributors (human or LLM):
 * - Keep naming explicit and business-oriented
 * - Prefer nested objects over string concatenation
 * - Any new external URL must be added here first
 * - Components should never define raw external URLs
 */
