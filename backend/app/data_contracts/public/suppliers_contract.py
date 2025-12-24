# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'suppliers',
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
        'name': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'market_supplier_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'contact_email': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'contact_phone': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'active': {
        "type": "boolean",
        "required": true,
        "default": "true",
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
        "relation": {
                "table": "user_profiles",
                "field": "id"
        }
},
        'updated_by': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "user_profiles",
                "field": "id"
        }
},
        'active_analyses': {
        "type": "boolean",
        "required": true,
        "default": "true",
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
