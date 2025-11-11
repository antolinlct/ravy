import os
import json
import importlib.util
import inspect
from pathlib import Path
from typing import Any, Dict, Type
from pydantic import BaseModel


# --- Configuration ---
SCHEMAS_PATH = Path(__file__).resolve().parents[1] / "app" / "schemas"
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "schemas_summary.json"


def extract_model_schema(model: Type[BaseModel]) -> Dict[str, Any]:
    """Retourne un dictionnaire clair avec les champs et types d’un modèle Pydantic."""
    fields = {}
    for name, field in model.model_fields.items():
        field_info = {
            "type": str(field.annotation),
            "required": field.is_required(),
            "default": field.default if field.default is not None else None,
        }
        fields[name] = field_info
    return {
        "model_name": model.__name__,
        "fields": fields,
    }


def load_models_from_file(py_file: Path) -> Dict[str, Any]:
    """Charge dynamiquement un fichier .py et récupère les classes BaseModel."""
    models = {}
    spec = importlib.util.spec_from_file_location(py_file.stem, py_file)
    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
    except Exception as e:
        print(f"[!] Erreur en important {py_file.name}: {e}")
        return {}

    for name, obj in inspect.getmembers(module, inspect.isclass):
        if issubclass(obj, BaseModel) and obj is not BaseModel:
            models[name] = extract_model_schema(obj)
    return models


def main():
    if not SCHEMAS_PATH.exists():
        raise RuntimeError(f"Le dossier {SCHEMAS_PATH} est introuvable.")

    print(f"[i] Scan du dossier: {SCHEMAS_PATH}")
    all_models = {}

    for py_file in SCHEMAS_PATH.glob("*.py"):
        print(f"[i] Lecture du fichier: {py_file.name}")
        file_models = load_models_from_file(py_file)
        if file_models:
            all_models[py_file.stem] = file_models

    print(f"[i] Écriture du résumé dans: {OUTPUT_PATH}")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(all_models, f, ensure_ascii=False, indent=2)

    print("[✓] Export terminé.")
    print(f"[✓] Modèles extraits: {sum(len(v) for v in all_models.values())}")


if __name__ == "__main__":
    main()
