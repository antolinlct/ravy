# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'financial_recipes',
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
        'recipe_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "recipes",
                "field": "id"
        }
},
        'sales_number': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'total_revenue': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'total_cost': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'total_margin': {
        "type": "numeric",
        "required": false,
        "default": null,
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
        "required": true,
        "default": null,
        "relation": {
                "table": "establishments",
                "field": "id"
        }
},
        'balanced_margin': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
