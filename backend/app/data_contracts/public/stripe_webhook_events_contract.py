# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'stripe_webhook_events',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'event_id': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'received_at': {
        "type": "timestamp with time zone",
        "required": true,
        "default": "now()",
        "relation": null
},
        'event_created': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
