# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'billing_accounts',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'owner_type': {
        "type": "USER-DEFINED",
        "required": true,
        "default": null,
        "relation": null,
        "enum_values": [
                "USER",
                "ESTABLISHMENT"
        ]
},
        'owner_user_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "users",
                "field": "id"
        }
},
        'owner_establishment_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "establishments",
                "field": "id"
        }
},
        'stripe_customer_id': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'created_at': {
        "type": "timestamp with time zone",
        "required": true,
        "default": "CURRENT_TIMESTAMP",
        "relation": null
},
    }
}
