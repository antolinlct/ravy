# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'subcategory',
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
        'name': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'category_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "category",
                "field": "id"
        }
},
    }
}
