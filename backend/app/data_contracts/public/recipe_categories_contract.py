# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'recipe_categories',
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
        'name': {
        "type": "text",
        "required": true,
        "default": null,
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
        'establishment_id': {
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
