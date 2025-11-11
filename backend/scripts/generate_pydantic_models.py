import os
import json
import psycopg
from pathlib import Path
from pydantic import BaseModel

# --- Connexion directe à Supabase ---
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("❌ Variable DATABASE_URL manquante dans le .env")

# --- Dossier de sortie ---
output_dir = Path("/app/app/schemas")
output_dir.mkdir(parents=True, exist_ok=True)

# --- Fichier de référence ---
schema_snapshot = output_dir / "_last_schema.json"

# --- Nettoyage du dossier avant régénération ---
for file in output_dir.glob("*.py"):
    if file.name not in {"__init__.py", "_last_schema.json"}:
        file.unlink()

print("🧹 Dossier /schemas nettoyé.")
print("Connexion à la base PostgreSQL…")

try:
    with psycopg.connect(DATABASE_URL) as conn:
        cur = conn.cursor()

        # --- Récupération des colonnes ---
        cur.execute("""
            SELECT table_schema, table_name, column_name, data_type, udt_name
            FROM information_schema.columns
            WHERE table_schema IN ('public', 'market', 'internal', 'ia')
            ORDER BY table_schema, table_name, ordinal_position;
        """)
        rows = cur.fetchall()

        # --- Récupération des ENUM ---
        cur.execute("""
            SELECT n.nspname AS schema_name, t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder)
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname IN ('public', 'market', 'internal', 'ia')
            GROUP BY n.nspname, t.typname;
        """)
        enums = {r[1]: r[2] for r in cur.fetchall()}  # <<--- plus de préfixe de schéma

except Exception as e:
    print("❌ Erreur de connexion à la base PostgreSQL :")
    print(str(e))
    exit(1)

# --- Regrouper les colonnes par table ---
tables = {}
for schema_name, table_name, column_name, data_type, udt_name in rows:
    # on ne garde que le nom de table (sans le schema)
    tables.setdefault(table_name, []).append(
        {"column": column_name, "data_type": data_type, "udt_name": udt_name}
    )

# --- Mapping PostgreSQL → Python ---
type_mapping = {
    "integer": "int", "int4": "int", "bigint": "int", "int8": "int",
    "smallint": "int", "int2": "int", "serial": "int", "bigserial": "int",
    "numeric": "float", "decimal": "float", "money": "float",
    "double precision": "float", "float8": "float", "real": "float", "float4": "float",
    "boolean": "bool", "bool": "bool",
    "text": "str", "varchar": "str", "character varying": "str", "character": "str",
    "uuid": "UUID",
    "bytea": "bytes",
    "json": "dict", "jsonb": "dict",
    "timestamp without time zone": "datetime", "timestamp with time zone": "datetime",
    "timestamptz": "datetime", "time without time zone": "datetime",
    "date": "date",
}

# --- Charger le dernier snapshot ---
previous_schema = {}
if schema_snapshot.exists():
    with open(schema_snapshot, "r") as f:
        previous_schema = json.load(f)

# --- Génération des modèles ---
for table, columns in tables.items():
    if table == "alembic_version":
        continue

    class_name = "".join(word.capitalize() for word in table.split("_"))
    file_path = output_dir / f"{table}.py"

    with open(file_path, "w") as f:
        f.write("from pydantic import BaseModel\n")
        f.write("from datetime import datetime, date\n")
        f.write("from typing import List, Optional, Any, Literal\n")
        f.write("from uuid import UUID\n\n\n")

        # --- Énumérations ---
        for col in columns:
            udt = col["udt_name"]
            if udt in enums:
                enum_name = udt.capitalize()
                values = ", ".join([f'\"{v}\"' for v in enums[udt]])
                f.write(f"{enum_name} = Literal[{values}]\n")
        f.write("\n")

        # --- Modèle principal ---
        f.write(f"class {class_name}(BaseModel):\n")

        for col_info in columns:
            col = col_info["column"]
            dtype = col_info["data_type"]
            udt = col_info["udt_name"]

            if udt in enums:
                py_type = udt.capitalize()
            elif udt.startswith("_"):
                base = udt[1:]
                base_type = type_mapping.get(base, type_mapping.get(dtype, "Any"))
                py_type = f"List[{base_type}]"
            elif dtype == "USER-DEFINED" and udt not in enums:
                py_type = "Any"
            else:
                py_type = type_mapping.get(dtype, type_mapping.get(udt, "Any"))

            f.write(f"    {col}: Optional[{py_type}] = None\n")

    print(f"✅ Modèle généré : {file_path.name}")

# --- Snapshot et comparaison ---
with open(schema_snapshot, "w") as f:
    json.dump(tables, f, indent=2)

if previous_schema:
    added = [t for t in tables if t not in previous_schema]
    removed = [t for t in previous_schema if t not in tables]
    changed = [
        t for t in tables
        if t in previous_schema and tables[t] != previous_schema[t]
    ]
    print("\n🔍 Résumé des changements :")
    if added:
        print(f"🟢 Nouvelles tables : {', '.join(added)}")
    if removed:
        print(f"🔴 Tables supprimées : {', '.join(removed)}")
    if changed:
        print(f"🟡 Tables modifiées : {', '.join(changed)}")
    if not (added or removed or changed):
        print("✅ Aucun changement détecté dans la structure.")
else:
    print("\n📘 Première génération : schéma de référence créé.")

print("\n🎉 Tous les modèles Pydantic ont été générés dans /app/schemas")
