# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'master_articles',
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
        'supplier_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "suppliers",
                "field": "id"
        }
},
        'unformatted_name': {
        "type": "text",
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
        'market_master_article_id': {
        "type": "uuid",
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
        'current_unit_price': {
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
        'name': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
