# Auto-generated data contract
# Schema: ia

CONTRACT = {
    'schema': 'ia',
    'table': 'sessions_ia',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'user_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'establishment_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'context': {
        "type": "jsonb",
        "required": false,
        "default": "'{}'::jsonb",
        "relation": null
},
        'started_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
        'ended_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
