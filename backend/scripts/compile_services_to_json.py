import os
import json
import ast
from pathlib import Path


# --- Configuration ---
SERVICES_PATH = Path(__file__).resolve().parents[1] / "app" / "services"
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "services_summary.json"


def extract_service_info(py_file: Path):
    """Analyse un fichier service et retourne la table et les fonctions détectées."""
    with open(py_file, "r", encoding="utf-8") as f:
        content = f.read()

    try:
        tree = ast.parse(content)
    except SyntaxError as e:
        print(f"[!] Erreur de parsing dans {py_file.name}: {e}")
        return {}

    service_info = {
        "table_name": None,
        "functions": []
    }

    for node in ast.walk(tree):
        # Détection de la table Supabase utilisée
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            if node.func.attr == "table" and node.args:
                arg = node.args[0]
                if isinstance(arg, ast.Constant):
                    service_info["table_name"] = arg.value

        # Détection des fonctions CRUD
        if isinstance(node, ast.FunctionDef):
            service_info["functions"].append({
                "name": node.name,
                "args": [arg.arg for arg in node.args.args],
                "docstring": ast.get_docstring(node)
            })

    return service_info


def main():
    if not SERVICES_PATH.exists():
        raise RuntimeError(f"Le dossier {SERVICES_PATH} est introuvable.")

    print(f"[i] Scan du dossier: {SERVICES_PATH}")
    all_services = {}

    for py_file in SERVICES_PATH.glob("*.py"):
        print(f"[i] Lecture du fichier: {py_file.name}")
        info = extract_service_info(py_file)
        if info:
            all_services[py_file.stem] = info

    print(f"[i] Écriture du résumé dans: {OUTPUT_PATH}")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(all_services, f, ensure_ascii=False, indent=2)

    print("[✓] Export terminé.")
    print(f"[✓] Services extraits: {len(all_services)}")


if __name__ == "__main__":
    main()
