# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'user_mercuriale_access',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'user_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "user_profiles",
                "field": "id"
        }
},
        'mercuriale_level': {
        "type": "USER-DEFINED",
        "required": true,
        "default": "'STANDARD'::mercuriale_level",
        "relation": null,
        "enum_values": [
                "STANDARD",
                "PLUS",
                "PREMIUM"
        ],
        "enum_default": "STANDARD"
},
        'assigned_by': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "user_profiles",
                "field": "id"
        }
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
    }
}
