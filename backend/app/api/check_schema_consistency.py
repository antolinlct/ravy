import os
import re
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import Dict, List

# --- Chargement des variables d'environnement ---
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Erreur : variables d'environnement Supabase manquantes.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Étape 1 : récupération des tables et colonnes réelles ---
print("[i] Chargement du schéma de la base depuis Supabase...")

query = """
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
"""
tables_resp = supabase.rpc("exec_sql", {"sql": query}).execute()

if not hasattr(tables_resp, "data") or not tables_resp.data:
    print("⚠️ Impossible d’interroger information_schema (clé service_role requise).")
    exit(1)

tables: Dict[str, List[str]] = {}
for row in tables_resp.data:
    t = row["table_name"]
    c = row["column_name"]
    tables.setdefault(t, []).append(c)

print(f"[✓] {len(tables)} tables détectées.\n")

# --- Étape 2 : scan des fichiers code pour trouver les .table()/.select() ---
base_path = os.path.join(os.path.dirname(__file__), "..", "app")
targets = [os.path.join(base_path, "logic"), os.path.join(base_path, "api")]

pattern_table = re.compile(r'\.table\(["\']([a-zA-Z0-9_]+)["\']\)')
pattern_select = re.compile(r'\.select\(["\']([^"\']+)["\']\)')

found_calls = []

for target in targets:
    for root, _, files in os.walk(target):
        for f in files:
            if not f.endswith(".py"):
                continue
            path = os.path.join(root, f)
            content = open(path, "r", encoding="utf-8").read()
            for m in pattern_table.finditer(content):
                table = m.group(1)
                # Cherche la première select() après la table
                after = content[m.end():m.end() + 200]
                s = pattern_select.search(after)
                cols = []
                if s:
                    cols = [x.strip() for x in s.group(1).split(",") if x.strip() != "*"]
                found_calls.append((path, table, cols))

# --- Étape 3 : comparaison ---
print("[i] Vérification des correspondances table / colonnes...\n")
errors = 0

for file, table, cols in found_calls:
    if table not in tables:
        print(f"❌ Table inconnue '{table}' trouvée dans {file}")
        errors += 1
        continue

    known_cols = set(tables[table])
    for col in cols:
        # ignore nested selects like master_articles(name_raw)
        col_name = col.split("(")[0].split(":")[-1].strip()
        if col_name and col_name != "*" and col_name not in known_cols:
            print(f"  ⚠️ Colonne '{col_name}' inexistante dans la table '{table}' ({file})")
            errors += 1

if errors == 0:
    print("\n✅ Tout est cohérent entre le code et la base.")
else:
    print(f"\n❌ {errors} incohérence(s) détectée(s).")

print("\n[vérification terminée]")
