# Auto-generated data contract
# Schema: internal

CONTRACT = {
    'schema': 'internal',
    'table': 'regex_patterns',
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
        'type': {
        "type": "USER-DEFINED",
        "required": true,
        "default": null,
        "relation": null,
        "enum_values": [
                "supplier_name",
                "market_master_article_name",
                "master_article_alternative"
        ]
},
        'regex': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
