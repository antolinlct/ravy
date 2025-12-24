# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'user_profiles',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": null
},
        'first_name': {
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
        'last_name': {
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
        'phone_sms': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
