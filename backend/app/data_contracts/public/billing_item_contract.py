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
