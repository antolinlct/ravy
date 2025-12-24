# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'recipe_margin_category',
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
        'date': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
        'average_margin': {
        "type": "numeric",
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
        'responsible_recipe': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "recipes",
                "field": "id"
        }
},
        'category_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "recipe_categories",
                "field": "id"
        }
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
