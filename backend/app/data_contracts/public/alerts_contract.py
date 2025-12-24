# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'alerts',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'establishment_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "establishments",
                "field": "id"
        }
},
        'type': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'payload': {
        "type": "jsonb",
        "required": false,
        "default": null,
        "relation": null
},
        'sent_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
