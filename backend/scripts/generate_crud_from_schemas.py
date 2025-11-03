from pathlib import Path

# --- chemins alignés avec le montage ./backend:/app ---
base_dir   = Path("/app")
app_dir    = base_dir / "app"
schemas_dir= base_dir / "schemas"
services_dir = app_dir / "services"
routes_dir   = app_dir / "api" / "routes"
main_file    = app_dir / "main.py"

print("🔎 DEBUG paths")
print(f"  base_dir   = {base_dir}")
print(f"  app_dir    = {app_dir}")
print(f"  schemas_dir= {schemas_dir}")
print(f"  services_dir= {services_dir}")
print(f"  routes_dir  = {routes_dir}")
print(f"  main_file   = {main_file}")

services_dir.mkdir(parents=True, exist_ok=True)
routes_dir.mkdir(parents=True, exist_ok=True)

service_template = """from app.core.supabase_client import supabase
from app.schemas.{name} import {class_name}

def get_all_{name}(filters: dict | None = None):
    query = supabase.table("{name}").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
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

route_template = """from fastapi import APIRouter, HTTPException
from app.schemas.{name} import {class_name}
from app.services import {name}_service

router = APIRouter(prefix="/{name}", tags=["{class_name}"])

@router.get("/", response_model=list[{class_name}])
def list_{name}(order_by: str | None = None, direction: str | None = None):
    filters = {{"order_by": order_by, "direction": direction}}
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

routes_to_include = []
created_routes = []

schema_files = [p for p in schemas_dir.glob("*.py") if p.stem not in {"__init__", "_last_schema"}]
print(f"📂 Schémas trouvés ({len(schema_files)}) :", [p.name for p in schema_files])
if not schema_files:
    raise SystemExit("❌ Aucun schéma trouvé. Vérifie que /app/schemas contient bien tes fichiers .py")

for schema_file in schema_files:
    name = schema_file.stem
    class_name = "".join(word.capitalize() for word in name.split("_"))

    service_path = services_dir / f"{name}_service.py"
    route_path   = routes_dir   / f"{name}.py"

    if not service_path.exists():
        service_path.write_text(service_template.format(name=name, class_name=class_name))
        print(f"✅ Service créé : {service_path.name}")
    else:
        print(f"↪︎ Service déjà présent : {service_path.name} (skip)")

    if not route_path.exists():
        route_path.write_text(route_template.format(name=name, class_name=class_name))
        print(f"✅ Route créée : {route_path.name}")
    else:
        print(f"↪︎ Route déjà présente : {route_path.name} (skip)")

    routes_to_include.append(name)
    created_routes.append((name, f"/{name}"))

if main_file.exists():
    main_content = main_file.read_text()
    changed = False
    for name in routes_to_include:
        import_line = f"from app.api.routes import {name}"
        include_line = f"app.include_router({name}.router)"
        if import_line not in main_content:
            main_content = import_line + "\n" + main_content
            changed = True
        if include_line not in main_content:
            main_content += "\n" + include_line
            changed = True
    if changed:
        main_file.write_text(main_content)
        print("🔄 main.py mis à jour avec les nouvelles routes.")
    else:
        print("↪︎ main.py déjà à jour.")

print("\n📊 Récapitulatif :")
for name, route in created_routes:
    print(f"• {name:20s} → {route}")
print("🎉 Génération terminée.")
