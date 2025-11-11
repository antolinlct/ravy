import os
import re

BASE_PATH = os.path.join(os.path.dirname(__file__), "..", "app")
routes_path = os.path.join(BASE_PATH, "api", "routes")
main_path = os.path.join(BASE_PATH, "main.py")

# --- Liste tous les fichiers de routes ---
all_routes = []
for root, _, files in os.walk(routes_path):
    for f in files:
        if f.endswith(".py") and f != "__init__.py":
            rel_path = os.path.relpath(os.path.join(root, f), routes_path)
            route_name = rel_path.replace(os.sep, ".").replace(".py", "")
            all_routes.append(route_name)

# --- Lis main.py ---
with open(main_path, "r", encoding="utf-8") as f:
    main_code = f.read()

# --- Cherche les includes ---
pattern_import = re.compile(r"include_router\(([^)]+)\)")
found_includes = set(pattern_import.findall(main_code))

# --- Vérifie les fichiers manquants ---
missing = []
for route in all_routes:
    if route.split(".")[-1] not in main_code:
        missing.append(route)

print("\n=== Vérification des routes importées ===")
if not missing:
    print("✅ Toutes les routes de backend/app/api/routes sont bien incluses dans main.py")
else:
    print("⚠️ Routes non incluses dans main.py :")
    for m in missing:
        print("  -", m)

print("\nTotal fichiers routes :", len(all_routes))
