# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'usage_counters',
    'fields': {
        'establishment_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "establishments",
                "field": "id"
        }
},
        'period_start': {
        "type": "timestamp with time zone",
        "required": true,
        "default": null,
        "relation": null
},
        'period_end': {
        "type": "timestamp with time zone",
        "required": true,
        "default": null,
        "relation": null
},
        'used_value': {
        "type": "numeric",
        "required": true,
        "default": "0",
        "relation": null
},
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'limit_value': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'value_category': {
        "type": "USER-DEFINED",
        "required": false,
        "default": null,
        "relation": null,
        "enum_values": [
                "seat",
                "invoices",
                "recipe"
        ]
},
        'updated_at': {
        "type": "timestamp with time zone",
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
    }
}
