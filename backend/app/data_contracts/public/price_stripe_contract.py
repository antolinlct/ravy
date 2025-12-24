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
