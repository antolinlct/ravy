# Auto-generated data contract
# Schema: ia

CONTRACT = {
    'schema': 'ia',
    'table': 'logs',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'session_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "sessions",
                "field": "id"
        }
},
        'action': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'input': {
        "type": "jsonb",
        "required": false,
        "default": "'{}'::jsonb",
        "relation": null
},
        'output': {
        "type": "jsonb",
        "required": false,
        "default": "'{}'::jsonb",
        "relation": null
},
        'success': {
        "type": "boolean",
        "required": false,
        "default": "true",
        "relation": null
},
        'error_message': {
        "type": "text",
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
    }
}
