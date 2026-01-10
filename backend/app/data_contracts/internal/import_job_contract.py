# Auto-generated data contract
# Schema: internal

CONTRACT = {
    'schema': 'internal',
    'table': 'import_job',
    'fields': {
        'created_at': {
        "type": "timestamp with time zone",
        "required": true,
        "default": null,
        "relation": null
},
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'status': {
        "type": "USER-DEFINED",
        "required": true,
        "default": null,
        "relation": null,
        "enum_values": [
                "pending",
                "running",
                "completed",
                "error",
                "ocr_failed"
        ]
},
        'establishment_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": null
},
        'file_path': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'ocr_result_json': {
        "type": "jsonb",
        "required": true,
        "default": null,
        "relation": null
},
        'updated_at': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
        'is_beverage': {
        "type": "boolean",
        "required": false,
        "default": "false",
        "relation": null
},
        'invoice_date': {
        "type": "timestamp with time zone",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
