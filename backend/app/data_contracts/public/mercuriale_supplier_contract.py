# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'mercuriale_supplier',
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
        'market_supplier_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'name': {
        "type": "uuid",
        "required": false,
        "default": "gen_random_uuid()",
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
