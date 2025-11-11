import os
import re
import json
from pathlib import Path

# --- 1️⃣ Charger le schéma local ---
schema_path = Path("backend/schemas_summary.json")
if not schema_path.exists():
    print("❌ Fichier backend/schemas_summary.json introuvable.")
    exit(1)

with open(schema_path, "r", encoding="utf-8") as f:
    schema = json.load(f)

# Adaptation : détection automatique du format
tables = {}
for table_name, table_data in schema.items():
    if not isinstance(table_data, dict):
        continue
    # structure du type { "Articles": { "fields": { ... } } }
    if "fields" in table_data.get(list(table_data.keys())[0], {}):
        inner = list(table_data.values())[0]   # ex: {"fields": {...}}
        tables[table_name] = list(inner["fields"].keys())
    # structure plus simple { "columns": [...] }
    elif "columns" in table_data:
        tables[table_name] = [c["name"] for c in table_data["columns"]]
    # ou { "fields": { ... } } directement
    elif "fields" in table_data:
        tables[table_name] = list(table_data["fields"].keys())
    else:
        # fallback : toutes les clés du dict
        tables[table_name] = list(table_data.keys())

print(f"[✓] {len(tables)} tables trouvées dans le schéma local.\n")

# --- 2️⃣ Rechercher les .table() et .select() dans le code ---
base_path = Path("backend/app")
targets = [base_path / "logic" / "read", base_path / "logic" / "write"]

pattern_table = re.compile(r'\.table\(["\']([a-zA-Z0-9_]+)["\']\)')
pattern_select = re.compile(r'\.select\(["\']([^"\']+)["\']\)')

found_calls = []

for target in targets:
    if not target.exists():
        continue
    for path in target.rglob("*.py"):
        if path.name == "__init__.py":
            continue
        content = path.read_text(encoding="utf-8")

        for m in pattern_table.finditer(content):
            table_name = m.group(1)
            after = content[m.end(): m.end() + 200]
            s = pattern_select.search(after)
            columns = []
            if s:
                columns = [x.strip() for x in s.group(1).split(",") if x.strip() != "*"]
            found_calls.append((str(path), table_name, columns))

# --- 3️⃣ Comparaison code vs schéma ---
print("[i] Vérification des correspondances table / colonnes...\n")

errors = 0

for file, table, cols in found_calls:
    if table not in tables:
        print(f"❌ Table inconnue '{table}' trouvée dans {file}")
        errors += 1
        continue

    known_cols = set(tables[table])
    for col in cols:
        col_name = col.split("(")[0].split(":")[-1].strip()
        if not col_name or col_name == "*":
            continue
        if col_name not in known_cols:
            print(f"  ⚠️ Colonne '{col_name}' inexistante dans le schéma de '{table}' ({file})")
            errors += 1

if errors == 0:
    print("\n✅ Tout est cohérent entre le code et ton schéma local.")
else:
    print(f"\n❌ {errors} incohérence(s) détectée(s) entre ton code et ton schéma local.")

print("\n[vérification terminée]")
