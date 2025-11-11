import os
import json
from re import search
from pathlib import Path
from supabase import create_client

# === CONFIGURATION ===
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

contracts_path = Path("app/data_contracts")
contracts_path.mkdir(parents=True, exist_ok=True)
SCHEMAS = ["public", "market", "internal", "ia"]

print(f"[i] Extraction de la structure des schémas : {', '.join(SCHEMAS)}")

# === 1️⃣ Requête principale : tables, colonnes, FKs ===
query = f"""
SELECT
  cols.table_schema,
  cols.table_name,
  cols.column_name,
  cols.data_type,
  cols.is_nullable,
  cols.column_default,
  cols.udt_schema,
  cols.udt_name,
  ccu.table_schema AS fk_table_schema,
  ccu.table_name   AS fk_table,
  ccu.column_name  AS fk_target
FROM information_schema.columns cols
LEFT JOIN information_schema.key_column_usage kcu
  ON kcu.table_schema = cols.table_schema
 AND kcu.table_name  = cols.table_name
 AND kcu.column_name = cols.column_name
LEFT JOIN information_schema.table_constraints tc
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema   = kcu.table_schema
 AND tc.constraint_type = 'FOREIGN KEY'
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema    = tc.table_schema
WHERE cols.table_schema IN ({', '.join(f"'{s}'" for s in SCHEMAS)})
ORDER BY cols.table_schema, cols.table_name, cols.ordinal_position
"""

resp = supabase.rpc("exec_sql", {"sql": query}).execute()
rows = resp.data or []
print(f"[✓] {len(rows)} lignes de métadonnées récupérées.\n")

# === 2️⃣ Récupération des ENUMs ===
enum_query = f"""
SELECT
  n.nspname AS schema_name,
  t.typname AS type_name,
  e.enumlabel AS value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname IN ({', '.join(f"'{s}'" for s in SCHEMAS)})
ORDER BY n.nspname, t.typname, e.enumsortorder
"""

enum_resp = supabase.rpc("exec_sql", {"sql": enum_query}).execute()
enum_rows = enum_resp.data or []

enums = {}
for r in enum_rows:
    key = f"{r['schema_name']}.{r['type_name']}"
    enums.setdefault(key, []).append(r["value"])

print(f"[✓] {len(enums)} ENUMs détectés : {list(enums.keys())}\n")

# === 3️⃣ Construction des contrats ===
tables = {}

for row in rows:
    schema = row["table_schema"]
    table = row["table_name"]
    key = f"{schema}.{table}"
    tables.setdefault(key, {})

    col = row["column_name"]
    col_type = row["data_type"]
    col_required = row["is_nullable"] == "NO"
    col_default = row["column_default"]
    col_udt_schema = row.get("udt_schema")
    col_udt_name = row.get("udt_name")

    tables[key].setdefault(col, {
        "type": col_type,
        "required": col_required,
        "default": col_default,
        "relation": None,
    })

    # --- Relation FK ---
    if row.get("fk_table") and row.get("fk_target"):
        tables[key][col]["relation"] = {
            "table": row["fk_table"],
            "field": row["fk_target"],
        }

    # --- ENUMs ---
    if col_type == "USER-DEFINED" and col_udt_schema and col_udt_name:
        enum_key = f"{col_udt_schema}.{col_udt_name}"
        enum_vals = enums.get(enum_key)
        if enum_vals:
            tables[key][col]["enum_values"] = enum_vals

            # Extraire une vraie valeur par défaut si elle existe dans la DB
            enum_default_val = None
            if col_default:
                m = search(r"'([^']+)'", str(col_default))
                if m:
                    candidate = m.group(1)
                    if candidate in enum_vals:
                        enum_default_val = candidate

            # Ajouter enum_default uniquement si trouvé
            if col_required and enum_default_val is not None:
                tables[key][col]["enum_default"] = enum_default_val

# === 4️⃣ Écriture des fichiers ===
for key, fields in tables.items():
    schema, table = key.split(".")
    folder = contracts_path / schema
    folder.mkdir(parents=True, exist_ok=True)
    file_path = folder / f"{table}_contract.py"

    with open(file_path, "w", encoding="utf-8") as f:
        f.write("# Auto-generated data contract\n")
        f.write(f"# Schema: {schema}\n\n")
        f.write("CONTRACT = {\n")
        f.write(f"    'schema': '{schema}',\n")
        f.write(f"    'table': '{table}',\n")
        f.write(f"    'fields': {{\n")
        for name, meta in fields.items():
            json_meta = json.dumps(meta, indent=8)
            f.write(f"        '{name}': {json_meta},\n")
        f.write("    }\n}\n")

    print(f"[✓] {schema}.{table}_contract.py généré")

print("\n[✓] Tous les contrats (public + market) ont été exportés.")
