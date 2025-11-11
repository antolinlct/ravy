import json
from pathlib import Path

contracts_root = Path("/app/app/data_contracts")
compiled = {}

for schema_dir in contracts_root.iterdir():
    if not schema_dir.is_dir():
        continue
    compiled[schema_dir.name] = {}
    for file in schema_dir.glob("*_contract.py"):
        with open(file, "r", encoding="utf-8") as f:
            content = f.read()
            # Extraire le contenu du dict JSON entre { ... }
            start = content.find("{")
            end = content.rfind("}")
            if start == -1 or end == -1:
                continue
            json_text = content[start:end + 1]
            # Remplacer true/false/null → True/False/None
            json_text = (
                json_text.replace("true", "True")
                .replace("false", "False")
                .replace("null", "None")
            )
            try:
                data = eval(json_text)  # Utiliser eval car format Python, pas JSON pur
                compiled[schema_dir.name][file.stem.replace('_contract', '')] = data
            except Exception as e:
                print(f"[!] Erreur dans {file.name}: {e}")

# Écrire le fichier global
output = Path("/app/contracts_summary.json")
with open(output, "w", encoding="utf-8") as f:
    json.dump(compiled, f, ensure_ascii=False, indent=2)

print(f"[✓] Export JSON complet écrit dans {output}")
