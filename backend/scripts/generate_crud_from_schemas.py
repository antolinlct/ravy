from pathlib import Path
import json
import shutil

# === Chemins corrects ===
base_dir = Path("/app")
app_dir = base_dir / "app"
schemas_dir = app_dir / "schemas"
services_dir = app_dir / "services"
routes_dir = app_dir / "api" / "routes"
main_file = app_dir / "main.py"

print("🔎 DEBUG paths")
print(f"  base_dir   = {base_dir}")
print(f"  app_dir    = {app_dir}")
print(f"  schemas_dir= {schemas_dir}")
print(f"  services_dir= {services_dir}")
print(f"  routes_dir  = {routes_dir}")
print(f"  main_file   = {main_file}")

services_dir.mkdir(parents=True, exist_ok=True)
routes_dir.mkdir(parents=True, exist_ok=True)

# === Charger schemas_summary.json ===
schemas_summary_path = Path("/app/schemas_summary.json")
if not schemas_summary_path.exists():
    raise SystemExit("❌ schemas_summary.json introuvable. Exécute d'abord export_schemas_to_json.py")

with open(schemas_summary_path, "r") as f:
    schema_summary = json.load(f)

# === Charger contracts_summary.json pour les schémas (public/internal/etc.) ===
contracts_summary_path = Path("/app/contracts_summary.json")
if not contracts_summary_path.exists():
    raise SystemExit("❌ contracts_summary.json introuvable. Exécute d'abord export_schemas_to_json.py")

with open(contracts_summary_path, "r") as f:
    contracts_summary = json.load(f)

# === Nettoyage des anciennes routes (hors /read et /write) ===
print("\n🧹 Nettoyage du dossier routes...")
for route_file in routes_dir.glob("*.py"):
    if route_file.name not in {"__init__.py"}:
        route_file.unlink()
        print(f"  ❌ Supprimé : {route_file.name}")
print("  ✅ Dossiers 'read/' et 'write/' conservés.\n")

# === TEMPLATE SERVICE ===
service_template = """from uuid import UUID

from fastapi.encoders import jsonable_encoder
from postgrest.exceptions import APIError

from app.core.supabase_client import supabase
from app.schemas.{name} import {class_name}

def _is_no_row_error(exc: APIError) -> bool:
    payload = exc.args[0] if exc.args else None
    if isinstance(payload, dict):
        if payload.get("code") == "PGRST116":
            return True
    return "PGRST116" in str(exc)

def get_all_{name}(filters: dict | None = None, limit: int = 200, page: int = 1):
    query = {table_ref}.select("*")
    if not filters:
        filters = {{}}

    # --- Filtres dynamiques (structurels ou contextuels) ---
{filter_block}

    # --- Filtres additionnels (_gte, _lte, etc.) ---
    for key, value in filters.items():
        if key in ("order_by", "direction", "limit", "page", {ignored_fields}):
            continue
        if key.endswith("_gte"):
            query = query.gte(key[:-4], value)
        elif key.endswith("_lte"):
            query = query.lte(key[:-4], value)
        elif key.endswith("_like"):
            query = query.like(key[:-5], f"%{{value}}%")
        elif key.endswith("_neq"):
            query = query.neq(key[:-4], value)
        else:
            query = query.eq(key, value)

    # --- Tri & Pagination ---
    if "order_by" in filters:
        query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")

    start = (page - 1) * limit
    end = start + limit - 1
    query = query.range(start, end)

    response = query.execute()
    return [{class_name}(**r) for r in (response.data or [])]


def get_{name}_by_id(id: UUID):
    try:
        response = {table_ref}.select("*").eq("id", str(id)).single().execute()
    except APIError as exc:
        if _is_no_row_error(exc):
            return None
        raise
    return {class_name}(**response.data) if response.data else None


def create_{name}(payload: dict):
    prepared = jsonable_encoder({{k: v for k, v in payload.items() if v is not None and k != "id"}})
    response = {table_ref}.insert(prepared).execute()
    return response.data[0] if response.data else None


def update_{name}(id: UUID, payload: dict):
    prepared = jsonable_encoder(payload)
    response = {table_ref}.update(prepared).eq("id", str(id)).execute()
    return response.data[0] if response.data else None


def delete_{name}(id: UUID):
    {table_ref}.delete().eq("id", str(id)).execute()
    return {{"deleted": True}}
"""

# === TEMPLATE ROUTE ===
route_template = """from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.{name} import {class_name}
from app.services import {name}_service

router = APIRouter(prefix="/{name}", tags=["{class_name}"])

@router.get("/", response_model=list[{class_name}])
def list_{name}(
    order_by: Optional[str] = None,
    direction: Optional[str] = None,
    limit: Optional[int] = 200,
    page: Optional[int] = 1{dynamic_filters}
):
    filters = {{
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page{filters_mapping}
    }}
    filters = {{k: v for k, v in filters.items() if v is not None}}
    return {name}_service.get_all_{name}(filters, limit=limit, page=page)

@router.get("/{{id}}", response_model={class_name})
def get_{name}(id: UUID):
    item = {name}_service.get_{name}_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="{class_name} not found")
    return item

@router.post("/", response_model={class_name})
def create_{name}(data: {class_name}):
    payload = jsonable_encoder(data.dict(exclude={{"id"}}))
    created = {name}_service.create_{name}(payload)
    return {class_name}(**created)

@router.patch("/{{id}}", response_model={class_name})
def update_{name}(id: UUID, data: {class_name}):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = {name}_service.update_{name}(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="{class_name} not found")
    return {class_name}(**updated)

@router.delete("/{{id}}")
def delete_{name}(id: UUID):
    {name}_service.delete_{name}(id)
    return {{"deleted": True}}
"""

# === GÉNÉRATION TOTALE ===
routes_to_include = []
created_routes = []

schema_files = [p for p in schemas_dir.glob("*.py") if p.stem not in {"__init__", "_last_schema"}]
print(f"📂 Schémas trouvés ({len(schema_files)}) :", [p.name for p in schema_files])

# === Map table -> schema from contracts_summary.json ===
table_schema_candidates = {}
for schema_name, tables in contracts_summary.items():
    if not isinstance(tables, dict):
        continue
    for table_name, table_def in tables.items():
        fields = {}
        if isinstance(table_def, dict):
            fields = table_def.get("fields", {}) if isinstance(table_def.get("fields"), dict) else {}
        table_schema_candidates.setdefault(table_name, []).append(
            {"schema": schema_name, "fields": set(fields.keys()), "field_meta": fields}
        )

for schema_file in schema_files:
    name = schema_file.stem
    class_name = "".join(word.capitalize() for word in name.split("_"))

    # 🔍 Détection des colonnes existantes
    table_info = schema_summary.get(name)
    available_fields = []
    if table_info:
        for _, model in table_info.items():
            if isinstance(model, dict) and "fields" in model:
                available_fields = list(model["fields"].keys())
                break

    # --- Résolution du schéma (public/internal/etc.) ---
    schema_name = "public"
    candidates = table_schema_candidates.get(name, [])
    selected_fields_meta = {}
    if len(candidates) == 1:
        schema_name = candidates[0]["schema"]
        selected_fields_meta = candidates[0]["field_meta"]
    elif candidates and available_fields:
        best = max(
            candidates,
            key=lambda c: len(set(available_fields) & c["fields"]),
        )
        schema_name = best["schema"]
        selected_fields_meta = best["field_meta"]

    table_ref = (
        f'supabase.schema("{schema_name}").table("{name}")'
        if schema_name != "public"
        else f'supabase.table("{name}")'
    )

    # --- Filtres structurels (service) + filtres dynamiques (routes) ---
    filter_lines = []
    ignored_fields = []
    dynamic_filter_cols = []
    filters_mapping = ""

    for col in ["establishment_id", "supplier_id", "recipe_id"]:
        if col in available_fields:
            # service : filtre eq
            filter_lines.append(
                f'    if "{col}" in filters:\n        query = query.eq("{col}", filters["{col}"])\n'
            )
            # route : param dynamique
            dynamic_filter_cols.append(col)
            # mapping filters
            filters_mapping += f', "{col}": {col}'
            ignored_fields.append(f'"{col}"')

    filter_block = "".join(filter_lines) if filter_lines else "    # Aucun filtre structurel spécifique\n"
    ignored_fields_str = ", ".join(ignored_fields) if ignored_fields else ""

    # construction propre de dynamic_filters pour la signature
    if dynamic_filter_cols:
        dynamic_filters_str = ",\n    " + ",\n    ".join(
            f"{col}: Optional[str] = None" for col in dynamic_filter_cols
        )
    else:
        dynamic_filters_str = ""

    # 📄 Service
    service_path = services_dir / f"{name}_service.py"
    service_code = service_template.format(
        name=name,
        class_name=class_name,
        filter_block=filter_block,
        ignored_fields=ignored_fields_str,
        table_ref=table_ref,
    )
    service_path.write_text(service_code)
    print(f"✅ Service régénéré : {service_path.name}")

    # 📄 Route
    route_path = routes_dir / f"{name}.py"
    route_code = route_template.format(
        name=name,
        class_name=class_name,
        dynamic_filters=dynamic_filters_str,
        filters_mapping=filters_mapping
    )
    route_path.write_text(route_code)
    print(f"✅ Route régénérée : {route_path.name}")

    routes_to_include.append(name)
    created_routes.append((name, f"/{name}"))

# --- Mise à jour du main.py ---
if main_file.exists():
    main_content = main_file.read_text()
else:
    main_content = "from fastapi import FastAPI\n\napp = FastAPI()\n"

for name in routes_to_include:
    import_line = f"from app.api.routes import {name}"
    include_line = f"app.include_router({name}.router)"
    if import_line not in main_content:
        main_content = import_line + "\n" + main_content
    if include_line not in main_content:
        main_content += "\n" + include_line

main_file.write_text(main_content)
print("🔄 main.py mis à jour avec toutes les routes.")

print("\n📊 Récapitulatif :")
for name, route in created_routes:
    print(f"• {name:20s} → {route}")
print("🎉 Génération complète terminée (routes /read et /write préservées, filtres dynamiques conditionnels).")
