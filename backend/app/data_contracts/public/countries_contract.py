# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'countries',
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
        'currency_iso_code': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'currency_symbol': {
        "type": "text",
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
        'stripe_tax_id_prod': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'stripe_tax_id_live': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
