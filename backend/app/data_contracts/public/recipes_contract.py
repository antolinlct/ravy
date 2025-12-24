# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'recipes',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
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
        'name': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'vat_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "vat_rates",
                "field": "id"
        }
},
        'recommanded_retail_price': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'active': {
        "type": "boolean",
        "required": true,
        "default": "false",
        "relation": null
},
        'created_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": "now()",
        "relation": null
},
        'saleable': {
        "type": "boolean",
        "required": true,
        "default": "true",
        "relation": null
},
        'contains_sub_recipe': {
        "type": "boolean",
        "required": true,
        "default": "false",
        "relation": null
},
        'purchase_cost_total': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'portion': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'purchase_cost_per_portion': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'technical_data_sheet_instructions': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'current_margin': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'portion_weight': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'price_excl_tax': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'price_incl_tax': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'price_tax': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
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
        'subcategory_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "recipes_subcategories",
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
        'technical_data_sheet_image_path': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
