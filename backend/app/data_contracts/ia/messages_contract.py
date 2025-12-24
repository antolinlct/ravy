# Auto-generated data contract
# Schema: ia

CONTRACT = {
    'schema': 'ia',
    'table': 'messages',
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
        'sender': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'content': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'metadata': {
        "type": "jsonb",
        "required": false,
        "default": "'{}'::jsonb",
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
