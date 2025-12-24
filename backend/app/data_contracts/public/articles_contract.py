# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'articles',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'invoice_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "invoices",
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
        'supplier_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "suppliers",
                "field": "id"
        }
},
        'date': {
        "type": "date",
        "required": true,
        "default": null,
        "relation": null
},
        'unit': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'quantity': {
        "type": "numeric",
        "required": false,
        "default": "1",
        "relation": null
},
        'unit_price': {
        "type": "numeric",
        "required": true,
        "default": null,
        "relation": null
},
        'total': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'master_article_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "master_articles",
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
        'gross_unit_price': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
