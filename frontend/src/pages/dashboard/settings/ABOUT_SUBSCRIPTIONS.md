# EXPLICATIONS GLOBALE DU FONCTIONNEMENT DES ABONNEMENTS ET DE RÈGLES DE FACTURATION

Description globale du fonctionneement de la facturation sur le logiciel. A savoir qu'en base de donnée, il y a souvent des champs similaire qui finisse par "prod" ou "live". Cela nous permet de gérer facilemetn le mode sandbox sur stripe et de ne pas avoir a changer le liens quand on va deploy le logiciel.
Tous les prixs sont actuellement facturé en EUR.

## ITEMS FACTURABLES
1. INVOICES : Nombre de facture que l'utilisateur peut ajouter sur son espace pendant sa période de faturation
2. RECIPES : Nombre total de recette que l'utilisateur peut avoir sur son compte. Ce quota est fixe dans le temps et n'est pas remis a jour (il peut bouger dans le cas ou l'utilisateur prend des ADDONS de type recipes).
3. SEATS : Nmbre de siège autorisé pour un établissement. Limite le nombre d'utilisateur qu'un owner peut inviter pour un seul établissement. Chaque user_profile lié a un establishment par une table user_establishment = 1 SEAT.

## PÉRIODES & RÈGLES DE FACTURATIONS
1. monthly :  Abonnements mensuels
2. yearly : Abonnements annuels

-> Tous les abonnements PAYANT sont géré par stripe, seul l'abonnement PLAN_FREE est géré uniquement en interne car il est gratuit. Les quotas d'un abonnement gratuit sont fixes dans le temps et jamais remis a jour (même pour les factures).
-> Si un abonnement n'a pas pu être renouvelé, peut importe la raison (annulation, Carte bancaire perimé, Solde insufisant, etc.) l'utilisateur perd instantanément ses droit et repasse par défaut sur le PLAN_FREE. On ne supprime pas ces données même si elles dépasse le quota du PLAN_FREE (exemple, un utilisateur avait un abonnement lui autorisant de créer 50 recette, il en a créer 34 mais son abonnement a été annulé. Le PLAN_FREE limite a 5 recettes mais on ne va pas lui supprimer 34-5=29 recette... Il agrde ses 35 recettes mais ne peut plus en créer tant qu'il n'a pas repris d'abonnement. Idem si il a invité plusieurs users ou pour les invoices.)
-> Par défaut, a la création du compte un etablissement est sur le PLAN_FREE.
-> Si une erreur quelconque se passe sur un abonnement, on repasse sur le PLAN_FREE par sécurité.

## TABLES CONCERNÉS & DATA CONTRACTS

> establishment_id : utilisé pour identifier l'établissement sur qui appliquer l'abonnement

# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'establishments',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'name': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'slug': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'country_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "countries",
                "field": "id"
        }
},
        'created_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": "now()",
        "relation": null
},
        'updated_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
        'recommended_retail_price_method': {
        "type": "USER-DEFINED",
        "required": true,
        "default": "'MULTIPLIER'::recommended_retail_price",
        "relation": null,
        "enum_values": [
                "MULTIPLIER",
                "PERCENTAGE",
                "VALUE"
        ],
        "enum_default": "MULTIPLIER"
},
        'recommended_retail_price_value': {
        "type": "numeric",
        "required": false,
        "default": "'3'::numeric",
        "relation": null
},
        'logo_path': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'plan_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'created_by': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "user_profiles",
                "field": "id"
        }
},
        'updated_by': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "user_profiles",
                "field": "id"
        }
},
        'average_daily_covers': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'average_annual_revenue': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'email': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'phone': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'intern_notes': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'active_sms': {
        "type": "boolean",
        "required": true,
        "default": "false",
        "relation": null
},
        'type_sms': {
        "type": "USER-DEFINED",
        "required": true,
        "default": "'FOOD'::sms_type",
        "relation": null,
        "enum_values": [
                "FOOD",
                "FOOD & BEVERAGES"
        ],
        "enum_default": "FOOD"
},
        'sms_variation_trigger': {
        "type": "USER-DEFINED",
        "required": false,
        "default": "'ALL'::sms_variation_trigger",
        "relation": null,
        "enum_values": [
                "ALL",
                "\u00b15%",
                "\u00b110%"
        ]
},
        'full_adresse': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'siren': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
    }
}

> usage_counters : utilisé pour traquer la consommation par période d'abonnement (yearly/monthly) d'un établissement en fonction de ses abonnements. Il est remis à jour à chaque nouvelle période (tous les mois ou tous les ans). Et les champs used_value sont remis à 0. Un établissement a minimum et maximum 3 usage_counter, 1 par value_categorie (invoice, recipe, seat), même sur les PLAN_FREE. C'est cette table qui nous permet d'afficher les tracker de consommation sur le frontend du logiciel (dans les paramètres, sur la page qui liste ses factures et sur la page qui liste ses recettes).

# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'usage_counters',
    'fields': {
        'establishment_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "establishments",
                "field": "id"
        }
},
        'period_start': {
        "type": "timestamp with time zone",
        "required": true,
        "default": null,
        "relation": null
},
        'period_end': {
        "type": "timestamp with time zone",
        "required": true,
        "default": null,
        "relation": null
},
        'used_value': {
        "type": "numeric",
        "required": true,
        "default": "0",
        "relation": null
},
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'limit_value': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'value_category': {
        "type": "USER-DEFINED",
        "required": false,
        "default": null,
        "relation": null,
        "enum_values": [
                "seat",
                "invoices",
                "recipe"
        ]
},
        'updated_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
        'created_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": "now()",
        "relation": null
},
    }
}


> billing_acount : 1 billing_acount par établissement. Cette table stocke notamment le "stripe_customer_id" qui permet d'identifier l'établissement sur stripe. Si l'utilisateur est sur un PLAN_FREE, c'est aussi cette table qui l'affiche. Cette table affiche aussi le billing_cycle global sur lequelle est l'établissement (yearly/monthly). Un etablissement sur un PLAN_FREE n'a donc rien dans le champs stripe_customer_id (live ou prod).

# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'billing_account',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'establishment_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "establishments",
                "field": "id"
        }
},
        'stripe_customer_id_prod': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'stripe_customer_id_live': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'billing_cycle': {
        "type": "USER-DEFINED",
        "required": true,
        "default": "'monthly'::billing_cycle",
        "relation": null,
        "enum_values": [
                "monthly",
                "yearly"
        ],
        "enum_default": "monthly"
},
        'created_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": "now()",
        "relation": null
},
        'updated_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
        'free_mode': {
        "type": "boolean",
        "required": true,
        "default": "false",
        "relation": null
},
        'stripe_subscription_id_prod': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'stripe_subscription_id_live': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
    }
}

> billing_item : Cette table fais le lien entre la table billing_account et les tables price_stripe et product_stripe. Il y a autant de billing_item qu'il y a de produits stripe pris par un etablissement. Si un etablissement a un "plan" et 2 "addons", alors il aura un total de 3 billing_item. A savoir qu'il est impossible pour un établissement d'avoir 2 billing items qui contiennet des product_stripe de type "plan" (champs plan_or_addon des tables product_stripe). Un etablissement sur un PLAN_FREE n'a aucun billing_item vu qu'il n'est pas facturé.

# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'billing_item',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'billling_acount_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "billing_account",
                "field": "id"
        }
},
        'product_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "product_stripe",
                "field": "id"
        }
},
        'price_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "price_stripe",
                "field": "id"
        }
},
        'current_period_start': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
        'current_period_end': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
        'created_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": "now()",
        "relation": null
},
        'updated_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
    }
}


> price_stripe : Cette table stocke l'ensemble des prix disponible pour une table product_stripe. Il sert a définir les différent prix en fonction du bylling_cycle. Actuellement il n'y a que 2 options a savoir monthly et yearly. Donc chaque product_stripe a 2 champs dans la table price_stripe. Le champs "unit_amoun" donne le prix par période hors taxe que coute ce produit en fonction de sa période de facturation(ce sont les mêmes que sur stripe). Les prices qui sont en is_active:false ne sont pas a prendre en compte, ce sont des prix qui ne sont pas encore dispo (soit sur stripe soit a l'achat). A savoir que dans stripe, chaque produit a un champs "metadata.billing_cycle" en metadonnées qui contient le même texte que le billing_cycle pour pouvoir bien les utiliser.

# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'price_stripe',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'product_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "product_stripe",
                "field": "id"
        }
},
        'billing_cycle': {
        "type": "USER-DEFINED",
        "required": true,
        "default": "'monthly'::billing_cycle",
        "relation": null,
        "enum_values": [
                "monthly",
                "yearly"
        ],
        "enum_default": "monthly"
},
        'stripe_price_id_prod': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'stripe_price_id_live': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'unit_amount': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'is_active': {
        "type": "boolean",
        "required": true,
        "default": "false",
        "relation": null
},
        'created_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": "now()",
        "relation": null
},
    }
}


> product_stripe : Cette table stocke l'ensemble des produits disponible sur stripe. Pour le fonctionnement en interne, il faut obligatoirement se réferer au champs internal_code, ce sont des champs fixe (les champs marketing_name et description sont la juste pour le frontend et pourrons bouger dans le temps). Un product stripe peut être de 2 type (via le champs plan_or_addon), soit "plan" soit "addon". Les plan sont les abonnement de base et les addons sont des packs qui booste sont abonnement pour augmenter les quotas sans passer a l'offre supérieur. Si l'abonnement est un "plan" alors il faut regarder les champs inclued_seats, inclued_invoices et inclued_recipes. Si l'abonnemnt est un "addon" alors il faut regarde le champ addon_catégory et le champs addon_value pour le quota en question. A savoir que dans stripe, chaque produit a un champs "product.metadata.code" en metadonnées qui contient le même texte que le internal_code pour pouvoir bien les utiliser.

# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'product_stripe',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'internal_code': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'marketing_name': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'plan_or_addon': {
        "type": "USER-DEFINED",
        "required": true,
        "default": "'plan'::product_type",
        "relation": null,
        "enum_values": [
                "plan",
                "addon"
        ],
        "enum_default": "plan"
},
        'description': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'stripe_product_id_prod': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'stripe_product_id_live': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'included_seats': {
        "type": "numeric",
        "required": false,
        "default": "'0'::numeric",
        "relation": null
},
        'included_invoices': {
        "type": "numeric",
        "required": false,
        "default": "'0'::numeric",
        "relation": null
},
        'included_recipes': {
        "type": "numeric",
        "required": false,
        "default": "'0'::numeric",
        "relation": null
},
        'addon_category': {
        "type": "USER-DEFINED",
        "required": false,
        "default": null,
        "relation": null,
        "enum_values": [
                "seat",
                "invoices",
                "recipe"
        ]
},
        'addon_value': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'created_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": "now()",
        "relation": null
},
        'updated_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
    }
}

## JSON CONTENANT LES VERSION ACTUELS DES TABLES SUR SUPABASE (AVEC LES VRAIS ID STRIPE) POUR LES TABLES PRICE_STRIPE ET PRODUCT_STRIPE :
>product_stripe :
[{"id":"34712048-0cd5-4ba3-9354-00768a5f87cd","internal_code":"PLAN_PLAT","marketing_name":"Plan Plat","plan_or_addon":"plan","description":"Description du plan plat","stripe_product_id_prod":"prod_Tfe5knFUsLvtIW","stripe_product_id_live":null,"included_seats":"2","included_invoices":"50","included_recipes":"25","addon_category":null,"addon_value":null,"created_at":"2026-01-10 07:21:12.391466+00","updated_at":null},{"id":"541b8452-c15d-4403-a2ef-ef305f2a8dac","internal_code":"ADDON_RECIPE_25","marketing_name":"Pack 25 recettes","plan_or_addon":"addon","description":"Description du pack de 25 recettes","stripe_product_id_prod":"prod_TfeaEIag2C4EZE","stripe_product_id_live":null,"included_seats":"0","included_invoices":"0","included_recipes":"0","addon_category":"recipe","addon_value":"25","created_at":"2026-01-10 07:25:53.726777+00","updated_at":null},{"id":"6edb87ea-0c40-4933-be22-062c2df0afa2","internal_code":"PLAN_FREE","marketing_name":"Plan Gratuit","plan_or_addon":"plan","description":"Description du plan gratuit","stripe_product_id_prod":null,"stripe_product_id_live":null,"included_seats":"1","included_invoices":"15","included_recipes":"5","addon_category":null,"addon_value":null,"created_at":"2026-01-10 07:27:45.585174+00","updated_at":null},{"id":"9b1a6eed-6a34-46c8-8483-cd1baea2611e","internal_code":"PLAN_APERO","marketing_name":"Plan Apéro","plan_or_addon":"plan","description":"Description du plan apéro","stripe_product_id_prod":"prod_Tfdw9lZWqAs3QE","stripe_product_id_live":null,"included_seats":"1","included_invoices":"25","included_recipes":"0","addon_category":null,"addon_value":null,"created_at":"2026-01-10 07:20:00.11564+00","updated_at":null},{"id":"da20daa7-a0c8-44e1-b1cf-5af234288c43","internal_code":"PLAN_MENU","marketing_name":"Plan Menu","plan_or_addon":"plan","description":"Description du plan menu","stripe_product_id_prod":"prod_Tfe7tu5Aez8Ip5","stripe_product_id_live":null,"included_seats":"2","included_invoices":"100","included_recipes":"50","addon_category":null,"addon_value":null,"created_at":"2026-01-10 07:22:55.99222+00","updated_at":null},{"id":"ec3be4f9-eddd-45d3-ab08-7ddf496855a2","internal_code":"ADDON_INVOICE_25","marketing_name":"Pack 25 factures","plan_or_addon":"addon","description":"Description du pack de 25 facture","stripe_product_id_prod":"prod_TfeaJ5341f1VvH","stripe_product_id_live":null,"included_seats":"0","included_invoices":"0","included_recipes":"0","addon_category":"invoices","addon_value":"25","created_at":"2026-01-10 07:24:57.332775+00","updated_at":null},{"id":"f6fadf4a-3b62-40c5-9f82-48f91a531c1a","internal_code":"ADDON_SEAT","marketing_name":"Siège supplémentaire\n","plan_or_addon":"addon","description":"Description du siège supplémentaire","stripe_product_id_prod":"prod_TfeYA9r7WYnnYF","stripe_product_id_live":null,"included_seats":"0","included_invoices":"0","included_recipes":"0","addon_category":"seat","addon_value":"1","created_at":"2026-01-10 07:24:20.009065+00","updated_at":null}]

> price_stripe:
[{"id":"fe9b1777-35bc-4448-ac96-6786b0eba8f8","product_id":"da20daa7-a0c8-44e1-b1cf-5af234288c43","billing_cycle":"yearly","stripe_price_id_prod":"price_1SiIpdClXuK3s5fVcy5RsLtg","stripe_price_id_live":null,"unit_amount":"1490","is_active":true,"created_at":"2026-01-10 07:33:14.286649+00"},{"id":"d48255fc-65b5-428d-a22d-d942e98c68ec","product_id":"34712048-0cd5-4ba3-9354-00768a5f87cd","billing_cycle":"yearly","stripe_price_id_prod":"price_1SiIo3ClXuK3s5fV3IofBzD5","stripe_price_id_live":null,"unit_amount":"890","is_active":true,"created_at":"2026-01-10 07:32:17.175866+00"},{"id":"f0a25358-5b3f-4d31-9114-38f3b81947e1","product_id":"9b1a6eed-6a34-46c8-8483-cd1baea2611e","billing_cycle":"yearly","stripe_price_id_prod":"price_1SiIjnClXuK3s5fVfxsMYMfD","stripe_price_id_live":null,"unit_amount":"490","is_active":true,"created_at":"2026-01-10 07:31:01.774741+00"},{"id":"f0115fc9-7c3a-4f15-8343-7fd2531bf526","product_id":"541b8452-c15d-4403-a2ef-ef305f2a8dac","billing_cycle":"yearly","stripe_price_id_prod":"price_1SiJRKClXuK3s5fVAGQtYDji","stripe_price_id_live":null,"unit_amount":"250","is_active":true,"created_at":"2026-01-10 07:36:06.197464+00"},{"id":"fd84132c-1070-4a05-a61b-2042e86c68a7","product_id":"ec3be4f9-eddd-45d3-ab08-7ddf496855a2","billing_cycle":"yearly","stripe_price_id_prod":"price_1SiJQSClXuK3s5fV7lFu0cDd","stripe_price_id_live":null,"unit_amount":"250","is_active":true,"created_at":"2026-01-10 07:35:01.922609+00"},{"id":"08529072-782f-487c-911f-17c7ade32668","product_id":"da20daa7-a0c8-44e1-b1cf-5af234288c43","billing_cycle":"monthly","stripe_price_id_prod":"price_1SiIp1ClXuK3s5fVTDj93MKw","stripe_price_id_live":null,"unit_amount":"149","is_active":true,"created_at":"2026-01-10 07:32:52.013317+00"},{"id":"90bd6944-e7cd-432b-9bfe-69a4548c7e13","product_id":"f6fadf4a-3b62-40c5-9f82-48f91a531c1a","billing_cycle":"yearly","stripe_price_id_prod":"price_1SiJP3ClXuK3s5fVh6KbOrsp","stripe_price_id_live":null,"unit_amount":"90","is_active":true,"created_at":"2026-01-10 07:34:11.26694+00"},{"id":"adf4adc8-779a-4143-b94c-2def44ffa663","product_id":"34712048-0cd5-4ba3-9354-00768a5f87cd","billing_cycle":"monthly","stripe_price_id_prod":"price_1SiInXClXuK3s5fVSKSrnvBJ","stripe_price_id_live":null,"unit_amount":"89","is_active":true,"created_at":"2026-01-10 07:31:53.333602+00"},{"id":"12e93a10-11d7-4537-8a75-2d2ff2701128","product_id":"9b1a6eed-6a34-46c8-8483-cd1baea2611e","billing_cycle":"monthly","stripe_price_id_prod":"price_1SiIehClXuK3s5fVReJKyWnf","stripe_price_id_live":null,"unit_amount":"49","is_active":true,"created_at":"2026-01-10 07:30:18.772057+00"},{"id":"9845f46d-df6c-4137-af17-99abaa208644","product_id":"ec3be4f9-eddd-45d3-ab08-7ddf496855a2","billing_cycle":"monthly","stripe_price_id_prod":"price_1SiJHIClXuK3s5fVGkuuCEtR","stripe_price_id_live":null,"unit_amount":"25","is_active":true,"created_at":"2026-01-10 07:34:37.732892+00"},{"id":"294e2d0c-c6ba-4a87-8c03-30007697eef3","product_id":"541b8452-c15d-4403-a2ef-ef305f2a8dac","billing_cycle":"monthly","stripe_price_id_prod":"price_1SiJHYClXuK3s5fVoI6zMcHr","stripe_price_id_live":null,"unit_amount":"25","is_active":true,"created_at":"2026-01-10 07:35:46.365621+00"},{"id":"4899df07-8489-4cfc-aef1-ab8fbeb95547","product_id":"f6fadf4a-3b62-40c5-9f82-48f91a531c1a","billing_cycle":"monthly","stripe_price_id_prod":"price_1SiJFBClXuK3s5fVUZpwGMto","stripe_price_id_live":null,"unit_amount":"9","is_active":true,"created_at":"2026-01-10 07:33:49.627602+00"}]