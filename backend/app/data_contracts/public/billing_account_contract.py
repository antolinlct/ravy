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
