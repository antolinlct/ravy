# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'establishment_email_alias',
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
        'custom_email': {
        "type": "text",
        "required": false,
        "default": "''::text",
        "relation": null
},
        'enabled': {
        "type": "boolean",
        "required": true,
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
        'custom_email_prefix': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
