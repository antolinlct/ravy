# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'category',
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
    }
}
