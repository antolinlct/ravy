# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'user_establishment',
    'fields': {
        'user_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "user_profiles",
                "field": "id"
        }
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
        'role': {
        "type": "USER-DEFINED",
        "required": true,
        "default": "'staff'::user_role",
        "relation": null,
        "enum_values": [
                "padrino",
                "owner",
                "admin",
                "manager",
                "staff",
                "accountant"
        ],
        "enum_default": "staff"
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
    }
}
