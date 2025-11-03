import os
import json
import psycopg
from pathlib import Path
from pydantic import BaseModel

# --- Connexion directe à Supabase via DSN complet ---
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("❌ Variable DATABASE_URL manquante dans le .env")

# --- Dossier de sortie ---
output_dir = Path("/app/schemas")
output_dir.mkdir(parents=True, exist_ok=True)

# --- Fichier de référence pour comparaison ---
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
        cur.execute("""
            SELECT table_name, column_name, data_type, udt_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        """)
        rows = cur.fetchall()

        # Récupérer les ENUM définis
        cur.execute("""
            SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder)
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public'
            GROUP BY t.typname;
        """)
        enums = {r[0]: r[1] for r in cur.fetchall()}

except Exception as e:
    print("❌ Erreur de connexion à la base PostgreSQL :")
    print(str(e))
    exit(1)

# --- Regrouper les colonnes par table ---
tables = {}
for table_name, column_name, data_type, udt_name in rows:
    tables.setdefault(table_name, []).append(
        {"column": column_name, "data_type": data_type, "udt_name": udt_name}
    )

# --- Mapping PostgreSQL → Python (complet) ---
type_mapping = {
    "integer": "int",
    "int4": "int",
    "bigint": "int",
    "int8": "int",
    "smallint": "int",
    "int2": "int",
    "serial": "int",
    "bigserial": "int",
    "numeric": "float",
    "decimal": "float",
    "money": "float",
    "double precision": "float",
    "float8": "float",
    "real": "float",
    "float4": "float",
    "boolean": "bool",
    "bool": "bool",
    "text": "str",
    "varchar": "str",
    "character varying": "str",
    "character": "str",
    "uuid": "str",
    "bytea": "bytes",
    "json": "dict",
    "jsonb": "dict",
    "timestamp without time zone": "datetime",
    "timestamp with time zone": "datetime",
    "timestamptz": "datetime",
    "time without time zone": "datetime",
    "date": "date",
}

# --- Chargement du dernier schéma connu ---
previous_schema = {}
if schema_snapshot.exists():
    with open(schema_snapshot, "r") as f:
        previous_schema = json.load(f)

# --- Génération des modèles ---
for table, columns in tables.items():
    if table == "alembic_version":
        continue  # ignorer la table système Alembic

    class_name = "".join(word.capitalize() for word in table.split("_"))
    file_path = output_dir / f"{table}.py"

    with open(file_path, "w") as f:
        f.write("from pydantic import BaseModel\n")
        f.write("from datetime import datetime, date\n")
        f.write("from typing import List, Optional, Any, Literal\n\n\n")

        # Créer les enums spécifiques si nécessaires
        for col in columns:
            udt = col["udt_name"]
            if udt in enums:
                enum_name = udt.capitalize()
                values = ", ".join([f'"{v}"' for v in enums[udt]])
                f.write(f"{enum_name} = Literal[{values}]\n")
        f.write("\n")

        # Définition du modèle
        f.write(f"class {class_name}(BaseModel):\n")

        for col_info in columns:
            col = col_info["column"]
            dtype = col_info["data_type"]
            udt = col_info["udt_name"]

            # ENUM
            if udt in enums:
                py_type = udt.capitalize()

            # ARRAY (ex: _int4, _text, etc.)
            elif udt.startswith("_"):
                base = udt[1:]
                base_type = type_mapping.get(base, "Any")
                py_type = f"List[{base_type}]"

            # Domain custom → fallback sur son type de base
            elif dtype == "USER-DEFINED" and udt not in enums:
                py_type = "Any"

            # Standard
            else:
                py_type = type_mapping.get(dtype, type_mapping.get(udt, "Any"))

            f.write(f"    {col}: Optional[{py_type}] = None\n")

    print(f"✅ Modèle généré : {file_path.name}")

# --- Sauvegarde du nouveau schéma pour comparaison future ---
with open(schema_snapshot, "w") as f:
    json.dump(tables, f, indent=2)

# --- Comparaison avec le précédent ---
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
