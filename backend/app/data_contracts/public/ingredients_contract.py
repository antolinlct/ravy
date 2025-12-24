# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'ingredients',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'recipe_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "recipes",
                "field": "id"
        }
},
        'type': {
        "type": "USER-DEFINED",
        "required": true,
        "default": "'ARTICLE'::ingredient_type",
        "relation": null,
        "enum_values": [
                "ARTICLE",
                "FIXED",
                "SUBRECIPE"
        ],
        "enum_default": "ARTICLE"
},
        'master_article_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "master_articles",
                "field": "id"
        }
},
        'subrecipe_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "recipes",
                "field": "id"
        }
},
        'unit_cost': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'quantity': {
        "type": "numeric",
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
        'percentage_loss': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'gross_unit_price': {
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
        'loss_value': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'unit_cost_per_portion_recipe': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
