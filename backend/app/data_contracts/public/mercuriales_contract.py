# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'mercuriales',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "uuid_generate_v4()",
        "relation": null
},
        'name': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'description': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'active': {
        "type": "boolean",
        "required": true,
        "default": "false",
        "relation": null
},
        'effective_from': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
        'effective_to': {
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
        'updated_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
        'mercuriale_supplier_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "mercuriale_supplier",
                "field": "id"
        }
},
        'market_supplier_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
