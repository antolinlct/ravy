# Auto-generated data contract
# Schema: internal

CONTRACT = {
    'schema': 'internal',
    'table': 'maintenance',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'coutdown_hour': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'is_active': {
        "type": "boolean",
        "required": true,
        "default": "false",
        "relation": null
},
        'message': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'start_date': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
