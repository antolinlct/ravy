import sys
from uuid import uuid4
from tabulate import tabulate
from datetime import datetime, date


# Fake DB + Fake services (sandbox RAVY)
from tests.fixtures import fake_db
from tests.fixtures import fake_services

# Redirection totale : toutes les importations de app.services
# pointent vers notre sandbox local.
sys.modules["app.services"] = fake_services

from app.logic.write.shared.recipes_average_margins import recompute_recipe_margins


# ===============================================================
#    AFFICHAGE PROPRE DES TABLES (identique à votre standard)
# ===============================================================

def dump_db_table(table, rows):
    if not rows:
        print(f"\n### {table.upper()} — (0 rows)")
        return

    print(f"\n### {table.upper()} — ({len(rows)} rows)")

    all_keys = set()
    for r in rows:
        all_keys.update(r.keys())
    headers = sorted(all_keys)

    table_data = []
    for r in rows:
        table_data.append([r.get(h) for h in headers])

    print(tabulate(table_data, headers=headers, tablefmt="grid"))


# ===============================================================
#                    TEST SANDBOX PRINCIPAL
# ===============================================================

def test_sandbox():
    fake_db.reset_db()

    # ===========================================================
    # 1. CONFIG DE BASE (NE RIEN MODIFIER ICI)
    # ===========================================================

    # Etablissements
    est1 = fake_db.create_establishments({
        "id": uuid4(),
        "name": "Brasserie VESUVIO",
        "recommended_retail_price_method": "MULTIPLIER",
        "recommended_retail_price_value": 4,
    })
    est2 = fake_db.create_establishments({
        "id": uuid4(),
        "name": "CHENAVARD",
        "recommended_retail_price_method": "PERCENTAGE",
        "recommended_retail_price_value": 75,
    })

    # Catégories
    recipe_categories1 = fake_db.create_recipe_categories({
        "id": uuid4(),
        "created_at": datetime(2025, 1, 1, 12, 00),
        "name": "Entrée",
        "updated_at": datetime(2025, 1, 1, 12, 00),
        "establishment_id": est1["id"],
    })
    recipe_categories2 = fake_db.create_recipe_categories({
        "id": uuid4(),
        "created_at": datetime(2025, 1, 1, 12, 00),
        "name": "Plat",
        "updated_at": datetime(2025, 1, 1, 12, 00),
        "establishment_id": est1["id"],
    })
    recipe_categories3 = fake_db.create_recipe_categories({
        "id": uuid4(),
        "created_at": datetime(2025, 1, 1, 12, 00),
        "name": "Dessert",
        "updated_at": datetime(2025, 1, 1, 12, 00),
        "establishment_id": est1["id"],
    })
    recipe_categories4 = fake_db.create_recipe_categories({
        "id": uuid4(),
        "created_at": datetime(2025, 1, 1, 12, 00),
        "name": "Plat - Est2",
        "updated_at": datetime(2025, 1, 1, 12, 00),
        "establishment_id": est2["id"],
    })

    # Sous-catégories
    sub1 = fake_db.create_recipes_subcategories({
        "id": uuid4(),
        "created_at": datetime(2025, 1, 1, 12, 00),
        "name": "Entrés froides",
        "category_id": recipe_categories1["id"],
    })
    sub2 = fake_db.create_recipes_subcategories({
        "id": uuid4(),
        "created_at": datetime(2025, 1, 1, 12, 00),
        "name": "Entrés chaudes",
        "category_id": recipe_categories1["id"],
    })
    sub3 = fake_db.create_recipes_subcategories({
        "id": uuid4(),
        "created_at": datetime(2025, 1, 1, 12, 00),
        "name": "Plat chaud",
        "category_id": recipe_categories2["id"],
    })
    sub4 = fake_db.create_recipes_subcategories({
        "id": uuid4(),
        "created_at": datetime(2025, 1, 1, 12, 00),
        "name": "Tartes",
        "category_id": recipe_categories3["id"],
    })
    sub5 = fake_db.create_recipes_subcategories({
        "id": uuid4(),
        "created_at": datetime(2025, 1, 1, 12, 00),
        "name": "Plat chaud - Est2",
        "category_id": recipe_categories4["id"],
    })

    # Recettes
    recipes1 = fake_db.create_recipes({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "name": "Oeuf mayo",
        "active": True,
        "saleable": True,
        "current_margin": 80,
        "category_id": recipe_categories1["id"],
        "subcategory_id": sub1["id"],
    })
    recipes2 = fake_db.create_recipes({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "name": "Oeuf meurette",
        "active": True,
        "saleable": True,
        "current_margin": 60,
        "category_id": recipe_categories1["id"],
        "subcategory_id": sub1["id"],
    })
    recipes3 = fake_db.create_recipes({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "name": "Oeuf au plat",
        "active": True,
        "saleable": True,
        "current_margin": 50,
        "category_id": recipe_categories1["id"],
        "subcategory_id": sub2["id"],
    })
    recipes4 = fake_db.create_recipes({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "name": "Burger",
        "active": False,
        "saleable": True,
        "current_margin": 75,
        "category_id": recipe_categories2["id"],
        "subcategory_id": sub3["id"],
    })
    recipes5 = fake_db.create_recipes({
        "id": uuid4(),
        "establishment_id": est2["id"],
        "name": "Tarte au citron",
        "active": True,
        "saleable": True,
        "current_margin": 25,
        "category_id": recipe_categories4["id"],
        "subcategory_id": sub5["id"],
    })


    # TEST POUR VOIR SI ÇA GÈRE UN HISTORIQUE DÉJÀ PRESENT
    recipe_margin1 = fake_db.create_recipe_margin({
    "id": uuid4(),
    "date": datetime(2025, 1, 1, 12, 00),
    "average_margin": 30,
    "establishment_id": est1["id"],
    })
    recipe_margin_category1 = fake_db.create_recipe_margin_category({
    "id": uuid4(),
    "date": datetime(2025, 1, 1, 12, 00),
    "average_margin": 27,
    "establishment_id": est1["id"],
    "category_id": recipe_categories1["id"],
    })
    recipe_margin_subcategory1 = fake_db.create_recipe_margin_subcategory({
    "id": uuid4(),
    "date": datetime(2025, 1, 1, 12, 00),
    "average_margin": 12,
    "establishment_id": est1["id"],
    "subcategory_id": sub1["id"],
    })

    #TEST POUR VOIR SI ÇA UPDATE LE PLUS RECENT QUAND DATE PLUS RECENT > TARGET DATE
    recipe_margin2 = fake_db.create_recipe_margin({
    "id": uuid4(),
    "date": datetime(2025, 12, 25, 12, 00),
    "average_margin": 30,
    "establishment_id": est1["id"],
    })
    recipe_margin_category2 = fake_db.create_recipe_margin_category({
    "id": uuid4(),
    "date": datetime(2025, 12, 25, 12, 00),
    "average_margin": 27,
    "establishment_id": est1["id"],
    "category_id": recipe_categories1["id"],
    })
    recipe_margin_subcategory2 = fake_db.create_recipe_margin_subcategory({
    "id": uuid4(),
    "date": datetime(2025, 12, 25, 12, 00),
    "average_margin": 12,
    "establishment_id": est1["id"],
    "subcategory_id": sub1["id"],
    })
    # ===========================================================
    # 2. BLOC DYNAMIQUE POUR TESTER DIFFÉRENTS CAS
    # ===========================================================
    impacted_recipes = [
        recipes1["id"],
        recipes2["id"],
        recipes3["id"],
        recipes4["id"],
        # vous pouvez modifier ici pour tester des cas différents
    ]

    # ===========================================================
    # 3. APPEL DE LA LOGIQUE
    # ===========================================================

    print("\n============== LANCEMENT DU RECALCUL DES MARGES ==============\n")

    result = recompute_recipe_margins(
        establishment_id=est1["id"],
        recipe_ids=impacted_recipes,
        target_date=date(2025, 11, 19),
    )

    print("\n=== RESULTAT BRUT DE LA FONCTION ===")
    print(result)

    # ===========================================================
    # 4. AFFICHAGE FINAL DE LA DB
    # ===========================================================
    print("\n================ ÉTAT FINAL DE LA DB ================")
    for table, rows in sorted(fake_db.DB.items()):
        dump_db_table(table, rows)

    assert True
