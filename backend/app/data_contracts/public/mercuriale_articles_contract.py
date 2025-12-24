# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'mercuriale_articles',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'mercuriale_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "mercuriales",
                "field": "id"
        }
},
        'mercurial_master_article_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "mercuriale_master_article",
                "field": "id"
        }
},
        'price_standard': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'price_plus': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'price_premium': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'active': {
        "type": "boolean",
        "required": false,
        "default": "true",
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
