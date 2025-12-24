# Auto-generated data contract
# Schema: market

CONTRACT = {
    'schema': 'market',
    'table': 'market_articles',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'market_master_article_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "market_master_articles",
                "field": "id"
        }
},
        'date': {
        "type": "timestamp with time zone",
        "required": true,
        "default": null,
        "relation": null
},
        'unit_price': {
        "type": "numeric",
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
        'market_supplier_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "market_suppliers",
                "field": "id"
        }
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
        'created_by': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'updated_by': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'discounts': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'duties_and_taxes': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'establishment_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'invoice_path': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'quantity': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'invoice_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'total': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'is_active': {
        "type": "boolean",
        "required": true,
        "default": "true",
        "relation": null
},
        'gross_unit_price': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
