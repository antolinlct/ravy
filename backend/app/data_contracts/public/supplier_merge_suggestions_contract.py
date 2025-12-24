# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'supplier_merge_suggestions',
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
        'reviewed_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
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
        'target_market_supplier_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "suppliers",
                "field": "id"
        }
},
        'similarity_score': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'status': {
        "type": "USER-DEFINED",
        "required": true,
        "default": "'pending'::supplier_merge_suggestions_status",
        "relation": null,
        "enum_values": [
                "pending",
                "accepted",
                "ignored",
                "dismissed"
        ],
        "enum_default": "pending"
},
        'source_market_supplier_ids': {
        "type": "jsonb",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
