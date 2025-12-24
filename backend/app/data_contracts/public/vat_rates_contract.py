# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'vat_rates',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'country_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "countries",
                "field": "id"
        }
},
        'name': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'percentage_rate': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'absolute_rate': {
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
