# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'plan_features',
    'fields': {
        'plan_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "plans",
                "field": "id"
        }
},
        'feature_key': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'feature_value': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'enabled': {
        "type": "boolean",
        "required": true,
        "default": "true",
        "relation": null
},
    }
}
