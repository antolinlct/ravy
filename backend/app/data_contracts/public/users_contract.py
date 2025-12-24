# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'users',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'email': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'first_name': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'phone': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'super_admin': {
        "type": "boolean",
        "required": true,
        "default": "false",
        "relation": null
},
        'created_at': {
        "type": "timestamp with time zone",
        "required": true,
        "default": "CURRENT_TIMESTAMP",
        "relation": null
},
        'updated_at': {
        "type": "timestamp with time zone",
        "required": true,
        "default": "CURRENT_TIMESTAMP",
        "relation": null
},
        'last_login': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
        'last_name': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
