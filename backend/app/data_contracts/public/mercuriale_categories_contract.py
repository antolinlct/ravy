# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'mercuriale_categories',
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
        "required": false,
        "default": null,
        "relation": null
},
    }
}
