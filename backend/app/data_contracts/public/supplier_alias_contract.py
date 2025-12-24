# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'supplier_alias',
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
        'updated_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
        'alias': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'establishment_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "establishments",
                "field": "id"
        }
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
        'supplier_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "suppliers",
                "field": "id"
        }
},
    }
}
