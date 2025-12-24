# Auto-generated data contract
# Schema: internal

CONTRACT = {
    'schema': 'internal',
    'table': 'score_matrix',
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
        'purchase_result': {
        "type": "numeric",
        "required": true,
        "default": null,
        "relation": null
},
        'financial_result': {
        "type": "numeric",
        "required": true,
        "default": null,
        "relation": null
},
        'score': {
        "type": "numeric",
        "required": true,
        "default": null,
        "relation": null
},
    }
}
