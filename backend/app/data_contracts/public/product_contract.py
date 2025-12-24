# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'product',
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
        "default": null,
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
