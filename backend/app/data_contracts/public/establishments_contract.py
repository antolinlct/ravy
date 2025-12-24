# Auto-generated data contract
# Schema: public

CONTRACT = {
    'schema': 'public',
    'table': 'establishments',
    'fields': {
        'id': {
        "type": "uuid",
        "required": true,
        "default": "gen_random_uuid()",
        "relation": null
},
        'name': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'slug': {
        "type": "text",
        "required": true,
        "default": null,
        "relation": null
},
        'country_id': {
        "type": "uuid",
        "required": true,
        "default": null,
        "relation": {
                "table": "countries",
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
        'recommended_retail_price_method': {
        "type": "USER-DEFINED",
        "required": true,
        "default": "'MULTIPLIER'::recommended_retail_price",
        "relation": null,
        "enum_values": [
                "MULTIPLIER",
                "PERCENTAGE",
                "VALUE"
        ],
        "enum_default": "MULTIPLIER"
},
        'recommended_retail_price_value': {
        "type": "numeric",
        "required": false,
        "default": "'3'::numeric",
        "relation": null
},
        'logo_path': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'plan_id': {
        "type": "uuid",
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
        'average_daily_covers': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'average_annual_revenue': {
        "type": "numeric",
        "required": false,
        "default": null,
        "relation": null
},
        'email': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'phone': {
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
        'active_sms': {
        "type": "boolean",
        "required": true,
        "default": "false",
        "relation": null
},
        'type_sms': {
        "type": "USER-DEFINED",
        "required": true,
        "default": "'FOOD'::sms_type",
        "relation": null,
        "enum_values": [
                "FOOD",
                "FOOD & BEVERAGES"
        ],
        "enum_default": "FOOD"
},
        'sms_variation_trigger': {
        "type": "USER-DEFINED",
        "required": false,
        "default": "'ALL'::sms_variation_trigger",
        "relation": null,
        "enum_values": [
                "ALL",
                "\u00b15%",
                "\u00b110%"
        ]
},
        'full_adresse': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
        'siren': {
        "type": "text",
        "required": false,
        "default": null,
        "relation": null
},
    }
}
