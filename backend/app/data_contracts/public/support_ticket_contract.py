# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'support_ticket',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
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
        'user_profile_id': {
        "type": "uuid",
        "required": false,
        "default": null,
        "relation": {
                "table": "user_profiles",
                "field": "id"
        }
},
        'invoice_path': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'status': {
        "type": "USER-DEFINED",
        "required": true,
        "default": "'open'::ticket_status",
        "relation": null,
        "enum_values": [
                "open",
                "in progress",
                "resolved",
                "error",
                "canceled"
        ],
        "enum_default": "open"
},
        'object': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'description': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'intern_notes': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'resolution_notes': {
        "type": "text",
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
        'resolved_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
        'ticket_id': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
