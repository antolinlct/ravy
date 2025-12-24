# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'impersonations_padrino',
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
                "table": "user_profiles",
                "field": "id"
        }
},
        'target_establishment_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "establishments",
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
