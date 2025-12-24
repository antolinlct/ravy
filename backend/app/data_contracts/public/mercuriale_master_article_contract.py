# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'mercuriale_master_article',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'created_at': {
        "type": "timestamp with time zone",
        "required": true,
        "default": "now()",
        "relation": null
},
        'mercurial_supplier_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'name': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'unit': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'vat_rate': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'active': {
        "type": "boolean",
        "required": false,
        "default": null,
        "relation": null
},
        'description': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'notes': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'market_master_article': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'category_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "mercuriale_categories",
                "field": "id"
        }
},
        'subcategory_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "mercuriale_subcategories",
                "field": "id"
        }
},
        'race_name': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
