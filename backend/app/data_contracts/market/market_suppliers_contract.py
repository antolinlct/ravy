# Auto-generated data contract
# Schema: market

CONTRACT = {
    'schema': 'market',
    'table': 'market_suppliers',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'name': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'active': {
        "type": "boolean",
        "required": true,
        "default": "false",
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
        'created_by': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'updated_by': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'label': {
        "type": "USER-DEFINED",
        "required": false,
        "default": null,
        "relation": null,
        "enum_values": [
                "FOOD",
                "BEVERAGES",
                "FIXED COSTS",
                "VARIABLE COSTS",
                "OTHER"
        ]
},
    }
}
