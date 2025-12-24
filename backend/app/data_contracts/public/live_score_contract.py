# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'live_score',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
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
        'establishment_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "establishments",
                "field": "id"
        }
},
        'type': {
        "type": "USER-DEFINED",
        "required": true,
        "default": null,
        "relation": null,
        "enum_values": [
                "global",
                "purchase",
                "recipe",
                "financial"
        ]
},
        'value': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
