# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'recommendations',
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
        'context': {
        "type": "jsonb",
        "required": false,
        "default": null,
        "relation": null
},
        'suggestion': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'estimated_impact': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'accepted': {
        "type": "boolean",
        "required": false,
        "default": null,
        "relation": null
},
        'created_at': {
        "type": "timestamp with time zone",
        "required": true,
        "default": "CURRENT_TIMESTAMP",
        "relation": null
},
    }
}
