# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'supplier_merge_request',
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
        'status': {
        "type": "USER-DEFINED",
        "required": true,
        "default": "'pending'::supplier_merge_request_status",
        "relation": null,
        "enum_values": [
                "pending",
                "to_confirm",
                "accepted",
                "resolved",
                "refused"
        ],
        "enum_default": "pending"
},
        'source_market_supplier_ids': {
        "type": "jsonb",
        "required": false,
        "default": null,
        "relation": null
},
        'target_market_supplier_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": null
},
        'requesting_establishment_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "establishments",
                "field": "id"
        }
},
    }
}
