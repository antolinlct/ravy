# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'financial_reports',
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
        'month': {
        "type": "date",
        "required": true,
        "default": null,
        "relation": null
},
        'ca_solid_ht': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'ca_liquid_ht': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'ca_total_ht': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'ca_tracked_recipes_total': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'ca_tracked_recipes_ratio': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'ca_untracked_recipes_total': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'ca_untracked_recipes_ratio': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'material_cost_solid': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'material_cost_liquid': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'material_cost_total': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'material_cost_ratio': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'material_cost_ratio_solid': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'material_cost_ratio_liquid': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'labor_cost_total': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'labor_cost_ratio': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'fte_count': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'fixed_charges_total': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'fixed_charges_ratio': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'variable_charges_total': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'variable_charges_ratio': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'commercial_margin_solid': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'commercial_margin_liquid': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'commercial_margin_total': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'commercial_margin_solid_ratio': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'commercial_margin_liquid_ratio': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'commercial_margin_total_ratio': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'production_cost_total': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'production_cost_ratio': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'ebitda': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'ebitda_ratio': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'break_even_point': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'safety_margin': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'safety_margin_ratio': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'revenue_per_employee': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'result_per_employee': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'salary_per_employee': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'avg_revenue_per_dish': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'avg_cost_per_dish': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'avg_margin_per_dish': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'theoretical_sales_solid': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'theoretical_material_cost_solid': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'multiplier_global': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'multiplier_solid': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'multiplier_liquid': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'notes': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'mscv': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'mscv_ratio': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'score_global': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'score_financial': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'score_recipe': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'score_purchase': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'other_charges_total': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'other_charges_ratio': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
