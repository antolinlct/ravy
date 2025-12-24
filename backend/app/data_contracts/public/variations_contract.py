# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'variations',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
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
        'master_article_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "master_articles",
                "field": "id"
        }
},
        'date': {
        "type": "date",
        "required": true,
        "default": null,
        "relation": null
},
        'old_unit_price': {
        "type": "numeric",
        "required": true,
        "default": null,
        "relation": null
},
        'new_unit_price': {
        "type": "numeric",
        "required": true,
        "default": null,
        "relation": null
},
        'percentage': {
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
        'updated_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
        'alert_logs_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "alert_logs",
                "field": "id"
        }
},
        'is_viewed': {
        "type": "boolean",
        "required": false,
        "default": "false",
        "relation": null
},
        'invoice_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "invoices",
                "field": "id"
        }
},
        'is_deleted': {
        "type": "boolean",
        "required": false,
        "default": "false",
        "relation": null
},
    }
}
