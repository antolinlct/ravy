# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'plans',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'code': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'name': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'stripe_price_id': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'active': {
        "type": "boolean",
        "required": true,
        "default": "true",
        "relation": null
},
        'sort_order': {
        "type": "integer",
        "required": false,
        "default": "0",
        "relation": null
},
    }
}
