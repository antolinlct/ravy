# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'mercurial_request',
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
        'user_profile_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "user_profiles",
                "field": "id"
        }
},
        'establishment_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "establishments",
                "field": "id"
        }
},
        'message': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'internal_notes': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
