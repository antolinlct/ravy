# Auto-generated data contract
# Schema: market

CONTRACT = {
    'schema': 'market',
    'table': 'market_supplier_alias',
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
        'supplier_market_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "market_suppliers",
                "field": "id"
        }
},
        'alias': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
