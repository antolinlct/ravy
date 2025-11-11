from pathlib import Path
import shutil

# --- Chemins corrects ---
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

# === 🔥 Nettoyage des anciennes routes sauf /read et /write ===
print("\n🧹 Nettoyage du dossier routes...")
for route_file in routes_dir.glob("*.py"):
    if route_file.name not in {"__init__.py"}:
        route_file.unlink()
        print(f"  ❌ Supprimé : {route_file.name}")

# On garde les sous-dossiers intacts
print("  ✅ Dossiers 'read/' et 'write/' conservés.\n")

# === TEMPLATE SERVICE avec filtres intelligents ===
service_template = """from app.core.supabase_client import supabase
from app.schemas.{name} import {class_name}

def get_all_{name}(filters: dict | None = None):
    query = supabase.table("{name}").select("*")
    if not filters:
        filters = {{}}

    # --- 1️⃣ Filtres structurels
    if "establishment_id" in filters:
        query = query.eq("establishment_id", filters["establishment_id"])
    if "supplier_id" in filters:
        query = query.eq("supplier_id", filters["supplier_id"])

    # --- 2️⃣ Filtres dynamiques
    for key, value in filters.items():
        if key in ("order_by", "direction", "limit", "establishment_id", "supplier_id"):
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

    # --- 3️⃣ Tri et limite
    if "order_by" in filters:
        query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    if "limit" in filters:
        try:
            query = query.limit(int(filters["limit"]))
        except ValueError:
            pass

    response = query.execute()
    return [{class_name}(**r) for r in (response.data or [])]


def get_{name}_by_id(id: int):
    response = supabase.table("{name}").select("*").eq("id", id).single().execute()
    return {class_name}(**response.data) if response.data else None


def create_{name}(payload: dict):
    response = supabase.table("{name}").insert(payload).execute()
    return response.data[0] if response.data else None


def update_{name}(id: int, payload: dict):
    response = supabase.table("{name}").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None


def delete_{name}(id: int):
    supabase.table("{name}").delete().eq("id", id).execute()
    return {{"deleted": True}}
"""

# === TEMPLATE ROUTE (avec filtres structurels inclus) ===
route_template = """from fastapi import APIRouter, HTTPException
from app.schemas.{name} import {class_name}
from app.services import {name}_service

router = APIRouter(prefix="/{name}", tags=["{class_name}"])

@router.get("/", response_model=list[{class_name}])
def list_{name}(
    order_by: str | None = None,
    direction: str | None = None,
    limit: int | None = None,
    establishment_id: str | None = None,
    supplier_id: str | None = None,
):
    filters = {{
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "establishment_id": establishment_id,
        "supplier_id": supplier_id,
    }}
    filters = {{k: v for k, v in filters.items() if v is not None}}
    return {name}_service.get_all_{name}(filters)

@router.get("/{{id}}", response_model={class_name})
def get_{name}(id: int):
    item = {name}_service.get_{name}_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="{class_name} not found")
    return item

@router.post("/", response_model={class_name})
def create_{name}(data: {class_name}):
    created = {name}_service.create_{name}(data.dict())
    return {class_name}(**created)

@router.patch("/{{id}}", response_model={class_name})
def update_{name}(id: int, data: {class_name}):
    updated = {name}_service.update_{name}(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="{class_name} not found")
    return {class_name}(**updated)

@router.delete("/{{id}}")
def delete_{name}(id: int):
    {name}_service.delete_{name}(id)
    return {{"deleted": True}}
"""

# === GÉNÉRATION TOTALE ===
routes_to_include = []
created_routes = []

schema_files = [p for p in schemas_dir.glob("*.py") if p.stem not in {"__init__", "_last_schema"}]
print(f"📂 Schémas trouvés ({len(schema_files)}) :", [p.name for p in schema_files])
if not schema_files:
    raise SystemExit("❌ Aucun schéma trouvé. Vérifie que /app/app/schemas contient bien tes fichiers .py")

for schema_file in schema_files:
    name = schema_file.stem
    class_name = "".join(word.capitalize() for word in name.split("_"))

    service_path = services_dir / f"{name}_service.py"
    route_path   = routes_dir   / f"{name}.py"

    service_path.write_text(service_template.format(name=name, class_name=class_name))
    print(f"🔁 Service régénéré : {service_path.name}")

    route_path.write_text(route_template.format(name=name, class_name=class_name))
    print(f"🔁 Route régénérée : {route_path.name}")

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
print("🎉 Génération complète terminée.")
