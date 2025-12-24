# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'subscriptions',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'billing_account_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "billing_accounts",
                "field": "id"
        }
},
        'plan_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "plans",
                "field": "id"
        }
},
        'stripe_subscription_id': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'status': {
        "type": "text",
        "required": true,
        "default": "'active'::text",
        "relation": null
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
        'cancel_at_period_end': {
        "type": "boolean",
        "required": true,
        "default": "false",
        "relation": null
},
    }
}
