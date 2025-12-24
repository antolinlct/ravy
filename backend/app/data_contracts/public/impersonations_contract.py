# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'impersonations',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'actor_user_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "users",
                "field": "id"
        }
},
        'target_user_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "users",
                "field": "id"
        }
},
        'reason': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'started_at': {
        "type": "timestamp with time zone",
        "required": true,
        "default": "CURRENT_TIMESTAMP",
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
