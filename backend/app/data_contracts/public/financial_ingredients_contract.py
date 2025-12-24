# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'financial_ingredients',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'financial_report_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "financial_reports",
                "field": "id"
        }
},
        'master_article_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "master_articles",
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
        'establishment_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "establishments",
                "field": "id"
        }
},
        'financial_recipe_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "financial_recipes",
                "field": "id"
        }
},
        'ingredient_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "ingredients",
                "field": "id"
        }
},
        'quantity': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'consumed_value': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'accumulated_loss': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'market_gap_value': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'market_gap_percentage': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'market_total_savings': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'market_balanced': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
