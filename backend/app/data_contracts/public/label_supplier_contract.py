# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'label_supplier',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'name': {
        "type": "text",
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
        'created_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
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
