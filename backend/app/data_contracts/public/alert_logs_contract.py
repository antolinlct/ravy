# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'alert_logs',
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
        'content': {
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
        'sent_to_number': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'sent_to_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "user_profiles",
                "field": "id"
        }
},
    }
}
