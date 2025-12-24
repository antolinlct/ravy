# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'invoices',
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
        'supplier_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "suppliers",
                "field": "id"
        }
},
        'invoice_number': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'date': {
        "type": "date",
        "required": true,
        "default": null,
        "relation": null
},
        'total_excl_tax': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'total_tax': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'total_incl_tax': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'file_storage_path': {
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
        'import_mode': {
        "type": "USER-DEFINED",
        "required": false,
        "default": null,
        "relation": null,
        "enum_values": [
                "EMAIL",
                "FILEUPLOADER",
                "MANUALLY"
        ]
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
    }
}
