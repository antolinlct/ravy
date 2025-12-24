# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'history_recipes',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'recipe_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "recipes",
                "field": "id"
        }
},
        'establishment_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "establishments",
                "field": "id"
        }
},
        'version_number': {
        "type": "numeric",
        "required": true,
        "default": null,
        "relation": null
},
        'created_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": "now()",
        "relation": null
},
        'date': {
        "type": "timestamp with time zone",
        "required": true,
        "default": null,
        "relation": null
},
        'purchase_cost_total': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'purchase_cost_per_portion': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'portion': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'invoice_affected': {
        "type": "boolean",
        "required": true,
        "default": "false",
        "relation": null
},
        'vat_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "vat_rates",
                "field": "id"
        }
},
        'price_excl_tax': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'price_incl_tax': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'price_tax': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'margin': {
        "type": "numeric",
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
    }
}
