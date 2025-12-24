# Auto-generated data contract
# Schema: market

CONTRACT = {
    'schema': 'market',
    'table': 'market_master_articles',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'market_supplier_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "market_suppliers",
                "field": "id"
        }
},
        'name': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'unit': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'unformatted_name': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'current_unit_price': {
        "type": "numeric",
        "required": true,
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
        'is_active': {
        "type": "boolean",
        "required": true,
        "default": "false",
        "relation": null
},
    }
}
