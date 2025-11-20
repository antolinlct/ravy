import json
from pathlib import Path
from datetime import datetime

BASE = Path(__file__).resolve().parents[1]

CONTRACTS_SUMMARY = BASE / "contracts_summary.json"
DB_TEMPLATES_PATH = BASE / "tests" / "fixtures" / "db_templates.md"

print("📦 Génération du fichier db_templates.md…")

# ---------------------------------------------------------------------------
# 1) CHARGEMENT DU SCHEMA
# ---------------------------------------------------------------------------

if not CONTRACTS_SUMMARY.exists():
    raise SystemExit("❌ contracts_summary.json introuvable.")

with open(CONTRACTS_SUMMARY, "r") as f:
    contracts = json.load(f)

# Flatten : rassembler toutes les tables, peu importe le schéma
tables_dict = {}   # table_name → fields

for _, schema_content in contracts.items():
    if not isinstance(schema_content, dict):
        continue

    for table_name, table_info in schema_content.items():
        if isinstance(table_info, dict) and "fields" in table_info:
            tables_dict[table_name] = table_info["fields"]

tables = sorted(tables_dict.keys())
print(f"🔍 Tables détectées ({len(tables)}): {tables}")


# ---------------------------------------------------------------------------
# 2) MAPPINGS TYPE → PLACEHOLDER
# ---------------------------------------------------------------------------

def fake_value(pg_type: str, col_name: str, relation: dict, enum_values):
    """
    Retourne la valeur placeholder selon :
    - type SQL
    - id → uuid4()
    - relation → <table>["id"]
    - enum → "v1, v2, v3"
    """

    # CAS 1 — ENUM
    if enum_values:
        return '"' + ", ".join(enum_values) + '"'

    # CAS 2 — FOREIGN KEY
    if relation and isinstance(relation, dict) and "table" in relation:
        table_name = relation["table"]
        return f'{table_name}["id"]'

    # CAS 3 — ID
    if col_name == "id":
        return "uuid4()"

    t = pg_type.lower()

    # CAS 4 — TYPES SIMPLES
    if "uuid" in t:
        return '"uuid"'
    if "text" in t or "char" in t:
        return '"string"'
    if "bool" in t:
        return "True"
    if "json" in t:
        return "{}"
    if "int" in t or "numeric" in t or "double" in t:
        return "0"
    if "timestamp" in t:
        return "datetime(2025, 1, 1, 12, 00)"
    if "date" in t:
        return "datetime(2025, 1, 1)"

    return '"value"'


def label_from_table(table: str):
    # D'UN si commence par voyelle, sinon D'UNE
    return f"CREATION D'UN {table.upper()}" if table[0].lower() in "aeiou" else f"CREATION D'UNE {table.upper()}"


# ---------------------------------------------------------------------------
# 3) GÉNÉRATION DU MARKDOWN
# ---------------------------------------------------------------------------

lines = []

for t in tables:
    fields = tables_dict[t]

    # Titre
    lines.append(f"# {label_from_table(t)}")
    lines.append(f"## Table: {t}\n")

    # Begin bloc Python
    lines.append(f"{t} = fake_db.create_{t}({{")

    for col, meta in fields.items():

        col_type = meta["type"]
        relation = meta.get("relation")
        enum_values = meta.get("enum_values") or meta.get("values")

        placeholder = fake_value(col_type, col, relation, enum_values)

        lines.append(f'    "{col}": {placeholder},')

    lines.append("})\n")

# Écriture du fichier Markdown
DB_TEMPLATES_PATH.write_text("\n".join(lines), encoding="utf-8")

print(f"✅ db_templates.md généré → {DB_TEMPLATES_PATH}")
print("🎉 Terminé.")
