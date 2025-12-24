# Auto-generated data contract
# Schema: internal

CONTRACT = {
    'schema': 'internal',
    'table': 'logs',
    'fields': {
        'created_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": "now()",
        "relation": null
},
        'user_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'establishment_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'type': {
        "type": "USER-DEFINED",
        "required": false,
        "default": "'job'::internal.logs_type",
        "relation": null,
        "enum_values": [
                "context",
                "job"
        ]
},
        'action': {
        "type": "USER-DEFINED",
        "required": false,
        "default": null,
        "relation": null,
        "enum_values": [
                "login",
                "logout",
                "create",
                "update",
                "delete",
                "view",
                "import"
        ]
},
        'text': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'json': {
        "type": "jsonb",
        "required": false,
        "default": null,
        "relation": null
},
        'element_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": null
},
        'element_type': {
        "type": "USER-DEFINED",
        "required": false,
        "default": null,
        "relation": null,
        "enum_values": [
                "invoice",
                "recipe",
                "supplier",
                "financial_reports",
                "user",
                "establishment",
                "variation"
        ]
},
        'id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": null
},
    }
}
