
# TABLES POUR GÉRER LES ABONNEMENTS
{
  "enums": {
    "billing_owner_type": ["USER", "ESTABLISHMENT"],
    "subscription_status": ["trialing", "active", "past_due", "canceled", "incomplete", "unpaid"],
    "subscription_item_type": ["BASE", "ADDON", "SEAT"],
    "subscription_period": ["month", "year"],
    "feature_key": [
      "INVOICES_IMPORTED",
      "RECIPES_CREATED",
      "SEATS_ACTIVE",
      "MAX_INVOICES",
      "MAX_RECIPES",
      "INCLUDED_SEATS_PER_ESTABLISHMENT"
    ]
  },

  "tables": {
    "billing_accounts": {
      "description": "Profil de facturation, lie Stripe Customer à un user ou un établissement.",
      "columns": {
        "id": "uuid PRIMARY KEY",
        "owner_type": "billing_owner_type NOT NULL",
        "owner_user_id": "uuid REFERENCES users(id)",
        "owner_establishment_id": "uuid REFERENCES establishments(id)",
        "stripe_customer_id": "text UNIQUE",
        "company_name": "text",
        "billing_email": "text",
        "tax_id": "text",
        "country": "text",
        "address": "jsonb",
        "active": "boolean DEFAULT true",
        "created_at": "timestamptz DEFAULT now()",
        "updated_at": "timestamptz DEFAULT now()"
      },
      "relations": {
        "has_many": ["subscriptions"],
        "used_by": ["establishments"]
      }
    },

    "subscriptions": {
      "description": "Contrat Stripe unique (plan principal + add-ons + sièges).",
      "columns": {
        "id": "uuid PRIMARY KEY",
        "billing_account_id": "uuid REFERENCES billing_accounts(id)",
        "stripe_subscription_id": "text UNIQUE",
        "plan_code": "text NOT NULL",
        "period": "subscription_period DEFAULT 'month'",
        "status": "subscription_status DEFAULT 'trialing'",
        "quantity": "integer DEFAULT 1",
        "seat_billing_enabled": "boolean DEFAULT false",
        "current_period_start": "timestamptz",
        "current_period_end": "timestamptz",
        "cancel_at_period_end": "boolean DEFAULT false",
        "trial_start": "timestamptz",
        "trial_end": "timestamptz",
        "promo_code": "text",
        "coupon_id": "text",
        "created_at": "timestamptz DEFAULT now()",
        "updated_at": "timestamptz DEFAULT now()"
      },
      "relations": {
        "belongs_to": ["billing_accounts"],
        "has_many": ["subscription_items", "subscription_coverage", "usage_counters"]
      }
    },

    "subscription_items": {
      "description": "Composants facturés dans la subscription (plan principal, add-ons, per-seat).",
      "columns": {
        "id": "uuid PRIMARY KEY",
        "subscription_id": "uuid REFERENCES subscriptions(id)",
        "stripe_subscription_item_id": "text UNIQUE",
        "type": "subscription_item_type DEFAULT 'BASE'",
        "code": "text NOT NULL",
        "stripe_price_id": "text",
        "quantity": "integer DEFAULT 1",
        "unit_label": "text",
        "feature_key": "feature_key",
        "active": "boolean DEFAULT true",
        "created_at": "timestamptz DEFAULT now()",
        "updated_at": "timestamptz DEFAULT now()"
      },
      "relations": {
        "belongs_to": ["subscriptions"]
      }
    },

    "subscription_coverage": {
      "description": "Liste des établissements couverts par une subscription donnée.",
      "columns": {
        "id": "uuid PRIMARY KEY",
        "subscription_id": "uuid REFERENCES subscriptions(id)",
        "establishment_id": "uuid REFERENCES establishments(id)",
        "active": "boolean DEFAULT true",
        "created_at": "timestamptz DEFAULT now()"
      },
      "relations": {
        "belongs_to": ["subscriptions", "establishments"]
      }
    },

    "usage_counters": {
      "description": "Suivi des quotas et de l’utilisation réelle (factures, recettes, sièges…).",
      "columns": {
        "id": "uuid PRIMARY KEY",
        "subscription_id": "uuid REFERENCES subscriptions(id)",
        "establishment_id": "uuid REFERENCES establishments(id)",
        "feature_key": "feature_key NOT NULL",
        "used_value": "integer DEFAULT 0",
        "quota_value": "integer",
        "period_start": "date",
        "period_end": "date",
        "updated_at": "timestamptz DEFAULT now()"
      },
      "relations": {
        "belongs_to": ["subscriptions", "establishments"]
      }
    },

    "catalog_plans": {
      "description": "(Optionnel) Catalogue Stripe mis en cache pour affichage UI.",
      "columns": {
        "id": "uuid PRIMARY KEY",
        "code": "text UNIQUE",
        "name": "text",
        "description": "text",
        "active": "boolean DEFAULT true",
        "order_index": "integer",
        "stripe_product_id": "text",
        "created_at": "timestamptz DEFAULT now()"
      },
      "relations": {
        "has_many": ["catalog_prices"]
      }
    },

    "catalog_prices": {
      "description": "(Optionnel) Tarifs Stripe associés aux plans (mensuel, annuel, per-seat).",
      "columns": {
        "id": "uuid PRIMARY KEY",
        "plan_id": "uuid REFERENCES catalog_plans(id)",
        "stripe_price_id": "text UNIQUE",
        "interval": "subscription_period",
        "currency": "text DEFAULT 'eur'",
        "unit_amount": "integer",
        "billing_mode": "text DEFAULT 'flat'",
        "is_public": "boolean DEFAULT true",
        "created_at": "timestamptz DEFAULT now()"
      },
      "relations": {
        "belongs_to": ["catalog_plans"]
      }
    }
  },

  "logic_notes": {
    "billing_model": [
      "Un billing_account peut payer pour un ou plusieurs établissements.",
      "Chaque subscription est liée à un billing_account.",
      "Une subscription = une facture Stripe (plan + add-ons + seats)."
    ],
    "addon_model": [
      "Les add-ons sont simplement des subscription_items avec type='ADDON'.",
      "Le per-seat est un type 'SEAT' facturé comme un add-on activable.",
      "Packs (factures, recettes) sont gérés comme ADDON et ajoutent des quotas dans usage_counters."
    ],
    "seat_logic": [
      "Si seat_billing_enabled=false, les invitations membres sont illimitées et non facturées.",
      "Si true, le système calcule les sièges inclus (par plan/établissement) et crée ou met à jour un item type='SEAT'."
    ],
    "periodicity": [
      "Mensuel et annuel gérés par des price_id Stripe différents.",
      "Stripe gère automatiquement les renewals, trials, et proration."
    ],
    "trial_billing": [
      "Les essais sont activés via Stripe et reflétés par status='trialing' + dates trial_start/trial_end.",
      "Stripe demande la CB si 'require_payment_method' est activé dans le Customer Portal."
    ]
  }
}

# N8N SUPABASE : 
{
  "module": "stripe_sync",
  "description": "Gestion complète de la synchronisation Stripe (abonnements, paiements, essais, erreurs) via n8n et Supabase.",

  "workflow": {
    "name": "Stripe Webhook → n8n → Supabase Sync",
    "entrypoint": "https://n8n.ravy.fr/webhook/stripe-events",
    "verification": {
      "method": "Stripe Signature (header 'Stripe-Signature')",
      "secret_env_var": "STRIPE_WEBHOOK_SECRET"
    },
    "core_steps": [
      {
        "step": 1,
        "node": "Webhook Stripe (trigger)",
        "description": "Reçoit tous les événements Stripe : abonnement, paiement, essai, etc. Le payload complet est transmis en JSON."
      },
      {
        "step": 2,
        "node": "Filter Event Type (Switch)",
        "description": "Trie les événements selon leur type ('customer.subscription.created', 'updated', 'deleted', 'invoice.payment_succeeded', etc.)"
      },
      {
        "step": 3,
        "node": "Check Event Idempotence",
        "description": "Recherche dans la table 'stripe_webhook_log' si l'event.id a déjà été traité. Si oui → fin du flux ; sinon → continuer.",
        "action": "SELECT event_id FROM stripe_webhook_log WHERE event_id = $json['id']"
      },
      {
        "step": 4,
        "node": "Create Shadow Log (START)",
        "description": "Insère l’event brut dans la table stripe_webhook_log avec status='processing'."
      },
      {
        "step": 5,
        "node": "Process Event (Switch branches)",
        "branches": {
          "customer.subscription.created": "Créer un nouvel abonnement et ses items dans Supabase",
          "customer.subscription.updated": "Mettre à jour le statut, la période, la quantité, les seats et les add-ons",
          "customer.subscription.deleted": "Marquer l’abonnement comme annulé",
          "invoice.payment_succeeded": "Mettre à jour le statut en 'active', éventuellement créer une ligne de facture dans invoices_billing",
          "invoice.payment_failed": "Mettre à jour le statut en 'past_due' et notifier via Telegram",
          "checkout.session.completed": "Créer le client et la souscription initiale (cas onboarding)"
        }
      },
      {
        "step": 6,
        "node": "Sync to Supabase (HTTP Request)",
        "description": "Appelle Supabase REST API (ou Supabase Node) pour insérer/mettre à jour les tables : subscriptions, subscription_items, usage_counters.",
        "tables_updated": [
          "subscriptions.status",
          "subscriptions.current_period_start",
          "subscriptions.current_period_end",
          "subscriptions.quantity",
          "subscriptions.trial_start",
          "subscriptions.trial_end",
          "subscription_items (upsert via stripe_subscription_item_id)"
        ]
      },
      {
        "step": 7,
        "node": "Optional: Update Usage Counters",
        "description": "Recalcule les quotas (MAX_INVOICES, SEATS_ACTIVE, etc.) en fonction du plan et des add-ons actifs."
      },
      {
        "step": 8,
        "node": "Mark Log as Completed",
        "description": "Met à jour stripe_webhook_log.status='processed', ajoute processed_at=now() et response_status='success'."
      },
      {
        "step": 9,
        "node": "Error Handling (Global Catch)",
        "description": "Si erreur lors du traitement, met stripe_webhook_log.status='error', stocke le message d’erreur, et envoie une alerte Telegram."
      }
    ]
  },

  "tables_updated": {
    "subscriptions": {
      "action": "UPSERT",
      "keys": ["stripe_subscription_id"],
      "fields": [
        "billing_account_id",
        "status",
        "plan_code",
        "period",
        "quantity",
        "seat_billing_enabled",
        "current_period_start",
        "current_period_end",
        "cancel_at_period_end",
        "trial_start",
        "trial_end",
        "promo_code",
        "coupon_id"
      ]
    },
    "subscription_items": {
      "action": "UPSERT",
      "keys": ["stripe_subscription_item_id"],
      "fields": [
        "subscription_id",
        "type",
        "code",
        "stripe_price_id",
        "quantity",
        "feature_key",
        "active"
      ]
    },
    "usage_counters": {
      "action": "UPDATE",
      "trigger": "optionnel — sur changement de plan ou addon",
      "fields": [
        "quota_value"
      ]
    }
  },

  "notifications": {
    "medium": "Telegram",
    "events": {
      "invoice.payment_failed": "Message automatique à l’équipe support Ravy : paiement échoué",
      "customer.subscription.deleted": "Notification de résiliation pour vérification manuelle",
      "unhandled_event_type": "Alerte en cas d’événement Stripe non mappé"
    }
  },

  "security": {
    "webhook_signature_check": "obligatoire",
    "stripe_event_replay_prevention": "via table stripe_webhook_log (idempotence)",
    "auth_supabase_api": "clé service Supabase",
    "timeout": "60 secondes maximum par event"
  }
}

# TABLE SHADOW LOG STRIPE SUR N8N

{
  "table": "stripe_webhook_log",
  "description": "Historique complet des événements Stripe reçus par n8n.",
  "columns": {
    "id": "uuid PRIMARY KEY",
    "event_id": "text UNIQUE NOT NULL",
    "type": "text",
    "status": "text DEFAULT 'pending'",
    "payload": "jsonb",
    "response_status": "text",
    "error_message": "text",
    "processed_at": "timestamptz",
    "created_at": "timestamptz DEFAULT now()"
  },
  "indexes": ["event_id"],
  "relations": {},
  "usage_notes": [
    "Chaque webhook Stripe génère une ligne avec event_id unique.",
    "Avant tout traitement, n8n vérifie si event_id existe déjà pour éviter un double traitement.",
    "Une fois traité avec succès, status passe à 'processed' et response_status='success'.",
    "En cas d'erreur, status='error' et error_message contient le message n8n."
  ]
}
