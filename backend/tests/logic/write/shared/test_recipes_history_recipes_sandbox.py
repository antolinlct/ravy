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

from app.logic.write.shared.recipes_history_recipes import update_recipes_and_history_recipes


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

    #===============================================
    # UTILISATEURS
    #===============================================

    user_profiles1 = fake_db.create_user_profiles({
        "id": uuid4(),
        "first_name": "Artie",
        "last_name": "Bucco",
        "intern_notes": "Utilisateur principale",
        "phone_sms": "0749395210",
    })
    user_profiles2 = fake_db.create_user_profiles({
        "id": uuid4(),
        "first_name": "Tony",
        "last_name": "Soprano",
        "intern_notes": "Utilisateur secondaire",
        "phone_sms": "0782493290",
    })

    #===============================================
    # ESTABLISSEMENTS
    #===============================================

    est1 = fake_db.create_establishments({
        "id": uuid4(),
        "name": "VESUIVIO",
        "recommended_retail_price_method": "PERCENTAGE",
        "recommended_retail_price_value": 75,
        "active_sms": True,
        "type_sms": "FOOD",
        "sms_variation_trigger": "±5%",
    })

    est2 = fake_db.create_establishments({
        "id": uuid4(),
        "name": "CHENAVARD",
        "recommended_retail_price_method": "MULTIPLIER",
        "recommended_retail_price_value": 4,
        "active_sms": False,
        "type_sms": "FOOD & BEVERAGES",
        "sms_variation_trigger": "ALL",
    })

    #===============================================
    # PROFILE & STATUS DES UTILISATEURS
    #===============================================

    user_establishment1 = fake_db.create_user_establishment({
        "user_id": user_profiles1["id"],
        "establishment_id": est1["id"],
        "role": "owner",
    })
    user_establishment2 = fake_db.create_user_establishment({
        "user_id": user_profiles2["id"],
        "establishment_id": est2["id"],
        "role": "owner",
    })

    #===============================================
    # SUPPLIERS
    #===============================================

    suppliers1 = fake_db.create_suppliers({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "name": "FOURNISSEUR VESUVIO",
        "market_supplier_id": "uuid",
        "active": True,
        "active_analyses": True,
        "label": "FOOD",
    })

    suppliers2 = fake_db.create_suppliers({
        "id": uuid4(),
        "establishment_id": est2["id"],
        "name": "FOURNISSEUR CHENAVARD",
        "market_supplier_id": "uuid",
        "active": True,
        "active_analyses": True,
        "label": "BEVERAGES",
    })

    #===============================================
    # MASTER ARTICLES
    #===============================================

    master_articles1 = fake_db.create_master_articles({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "supplier_id": suppliers1["id"],
        "unformatted_name": "string",
        "unit": "P",
        "current_unit_price": 1.50,
        "name": "SALADE",
    })
    master_articles2 = fake_db.create_master_articles({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "supplier_id": suppliers1["id"],
        "unformatted_name": "string",
        "unit": "KG",
        "current_unit_price": 5,
        "name": "TOMATES",
    })
    master_articles3 = fake_db.create_master_articles({
        "id": uuid4(),
        "establishment_id": est2["id"],
        "supplier_id": suppliers2["id"],
        "unformatted_name": "string",
        "unit": "KG",
        "current_unit_price": 10,
        "name": "MOZZARELLA",
    })

    #===============================================
    # INVOICES
    #===============================================

    invoices1 = fake_db.create_invoices({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "supplier_id": suppliers1["id"],
        "date": datetime(2025, 1, 1),
        "total_excl_tax": 100,
        "total_tax": 25,
        "total_incl_tax": 125,
        "import_mode": "EMAIL",
    })

    invoices2 = fake_db.create_invoices({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "supplier_id": suppliers1["id"],
        "date": datetime(2025, 2, 2),
        "total_excl_tax": 100,
        "total_tax": 25,
        "total_incl_tax": 125,
        "import_mode": "EMAIL",
    })

    invoices3 = fake_db.create_invoices({
        "id": uuid4(),
        "establishment_id": est2["id"],
        "supplier_id": suppliers2["id"],
        "date": datetime(2025, 2, 2),
        "total_excl_tax": 200,
        "total_tax": 50,
        "total_incl_tax": 250,
        "import_mode": "EMAIL",
    })

    #===============================================
    # ARTICLES
    #===============================================

    articles1 = fake_db.create_articles({
        "id": uuid4(),
        "invoice_id": invoices1["id"],
        "establishment_id": est1["id"],
        "supplier_id": suppliers1["id"],
        "date": datetime(2025, 1, 1),
        "unit_price": 1,
        "master_article_id": master_articles1["id"],
    })
    articles2 = fake_db.create_articles({
        "id": uuid4(),
        "invoice_id": invoices2["id"],
        "establishment_id": est1["id"],
        "supplier_id": suppliers1["id"],
        "date": datetime(2025, 2, 2),
        "unit_price": 1.50,
        "master_article_id": master_articles1["id"],
    })
    articles3 = fake_db.create_articles({
        "id": uuid4(),
        "invoice_id": invoices1["id"],
        "establishment_id": est1["id"],
        "supplier_id": suppliers1["id"],
        "date": datetime(2025, 1, 1),
        "unit_price": 5,
        "master_article_id": master_articles2["id"],
    })
    articles4 = fake_db.create_articles({
        "id": uuid4(),
        "invoice_id": invoices2["id"],
        "establishment_id": est1["id"],
        "supplier_id": suppliers1["id"],
        "date": datetime(2025, 2, 2),
        "unit_price": 7.5,
        "master_article_id": master_articles2["id"],
    })
    articles5 = fake_db.create_articles({
        "id": uuid4(),
        "invoice_id": invoices1["id"],
        "establishment_id": est2["id"],
        "supplier_id": suppliers2["id"],
        "date": datetime(2025, 1, 1),
        "unit": "KG",
        "unit_price": 8,
        "master_article_id": master_articles3["id"],
    })
    articles6 = fake_db.create_articles({
        "id": uuid4(),
        "invoice_id": invoices2["id"],
        "establishment_id": est2["id"],
        "supplier_id": suppliers2["id"],
        "date": datetime(2025, 2, 2),
        "unit": "KG",
        "unit_price": 10,
        "master_article_id": master_articles3["id"],

    })

    #===============================================
    # CATEGORIES RECETTES
    #===============================================

    recipe_categories1 = fake_db.create_recipe_categories({
        "id": uuid4(),
        "name": "PLAT VESUVIO",
        "establishment_id": est1["id"],
    })
    recipe_categories2 = fake_db.create_recipe_categories({
        "id": uuid4(),
        "name": "DESSERT",
        "establishment_id": est1["id"],
    })
    recipe_categories3 = fake_db.create_recipe_categories({
        "id": uuid4(),
        "name": "PLAT CHENAVARD",
        "establishment_id": est2["id"],
    })

    #===============================================
    # SOUS-CATEGORIES RECETTES
    #===============================================

    recipes_subcategories1 = fake_db.create_recipes_subcategories({
        "id": uuid4(),
        "name": "CHAUD",
        "category_id": recipe_categories1["id"],
        "establishment_id": est1["id"],
    })
    recipes_subcategories2 = fake_db.create_recipes_subcategories({
        "id": uuid4(),
        "name": "FROID",
        "category_id": recipe_categories2["id"],
        "establishment_id": est1["id"],
    })
    recipes_subcategories3 = fake_db.create_recipes_subcategories({
        "id": uuid4(),
        "name": "TIEDE",
        "category_id": recipe_categories2["id"],
        "establishment_id": est2["id"],
    })
    #===============================================
    # RECETTES
    #===============================================

    recipes1 = fake_db.create_recipes({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "name": "RECETTE 1",
        "recommanded_retail_price": 0,
        "active": True,
        "saleable": True,
        "contains_sub_recipe": False,
        "purchase_cost_total": 3,
        "portion": 1,
        "purchase_cost_per_portion": 3,
        "current_margin": 70,
        "portion_weight": 10,
        "price_excl_tax": 10,
        "price_incl_tax": 11,
        "price_tax": 1,
        "category_id": recipe_categories1["id"],
        "subcategory_id": recipes_subcategories1["id"],
    })
    recipes2 = fake_db.create_recipes({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "name": "RECETTE 2",
        "recommanded_retail_price": 0,
        "active": True,
        "saleable": False,
        "contains_sub_recipe": False,
        "purchase_cost_total": 1.66,
        "portion": 2,
        "purchase_cost_per_portion": 0.83,
        "current_margin": 79.25,
        "portion_weight": 15,
        "price_excl_tax": 4,
        "price_incl_tax": 4.40,
        "price_tax": 0.40,
        "category_id": recipe_categories2["id"],
        "subcategory_id": recipes_subcategories2["id"],
    })
    recipes3 = fake_db.create_recipes({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "name": "RECETTE 3",
        "recommanded_retail_price": 0,
        "active": True,
        "saleable": True,
        "contains_sub_recipe": True,
        "purchase_cost_total": 3.93,
        "portion": 1,
        "purchase_cost_per_portion": 3.93,
        "current_margin": 80.35,
        "portion_weight": 12,
        "price_excl_tax": 20,
        "price_incl_tax": 22,
        "price_tax": 2,
        "category_id": recipe_categories2["id"],
        "subcategory_id": recipes_subcategories2["id"],
    })
    recipes4 = fake_db.create_recipes({
        "id": uuid4(),
        "establishment_id": est2["id"],
        "name": "RECETTE 4",
        "recommanded_retail_price": 0,
        "active": True,
        "saleable": True,
        "contains_sub_recipe": False,
        "purchase_cost_total": 5,
        "portion": 1,
        "purchase_cost_per_portion": 5,
        "current_margin": 80,
        "portion_weight": 24,
        "price_excl_tax": 20,
        "price_incl_tax": 22,
        "price_tax": 2,
        "category_id": recipe_categories3["id"],
        "subcategory_id": recipes_subcategories3["id"],
    })

    #===============================================
    # HISTORIQUE - RECETTES
    #===============================================

    history_recipes1 = fake_db.create_history_recipes({
        "id": uuid4(),
        "recipe_id": recipes1["id"],
        "establishment_id": est1["id"],
        "version_number": 1,
        "date": datetime(2025, 1, 1, 12, 00),
        "purchase_cost_total": 3,
        "purchase_cost_per_portion": 3,
        "portion": 1,
        "invoice_affected": False,
        "price_excl_tax": 10,
        "price_incl_tax": 11,
        "price_tax": 1,
        "margin": 70,
    })
    history_recipes2 = fake_db.create_history_recipes({
        "id": uuid4(),
        "recipe_id": recipes2["id"],
        "establishment_id": est1["id"],
        "version_number": 1,
        "date": datetime(2025, 1, 1, 12, 00),
        "purchase_cost_total": 1.66,
        "purchase_cost_per_portion": 0.83,
        "portion": 2,
        "invoice_affected": False,
        "price_excl_tax": 0,
        "price_incl_tax": 0,
        "price_tax": 0,
        "margin": 0,
    })
    history_recipes3 = fake_db.create_history_recipes({
        "id": uuid4(),
        "recipe_id": recipes3["id"],
        "establishment_id": est1["id"],
        "version_number": 1,
        "date": datetime(2025, 1, 1, 12, 00),
        "purchase_cost_total": 3.93,
        "purchase_cost_per_portion": 3.93,
        "portion": 1,
        "invoice_affected": False,
        "price_excl_tax": 20,
        "price_incl_tax": 22,
        "price_tax": 2,
        "margin": 80.35,
    })
    history_recipes4 = fake_db.create_history_recipes({
        "id": uuid4(),
        "recipe_id": recipes4["id"],
        "establishment_id": est2["id"],
        "version_number": 1,
        "date": datetime(2025, 1, 1, 12, 00),
        "purchase_cost_total": 5,
        "purchase_cost_per_portion": 5,
        "portion": 1,
        "invoice_affected": True,
        "price_excl_tax": 20,
        "price_incl_tax": 22,
        "price_tax": 2,
        "margin": 80,
    })

    #===============================================
    # INGREDIENTS
    #===============================================

    ingredients1 = fake_db.create_ingredients({
        "id": uuid4(),
        "recipe_id": recipes1["id"],
        "type": "ARTICLE",
        "master_article_id": master_articles1["id"],
        "unit_cost": 0.5,
        "quantity": 0.5,
        "unit": "P",
        "percentage_loss": 0,
        "gross_unit_price": 1,
        "establishment_id": est1["id"],
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 0.5,
    })
    ingredients2 = fake_db.create_ingredients({
        "id": uuid4(),
        "recipe_id": recipes1["id"],
        "type": "ARTICLE",
        "master_article_id": master_articles2["id"],
        "unit_cost": 2,
        "quantity": 0.5,
        "unit": "KG",
        "percentage_loss": 0,
        "gross_unit_price": 5,
        "establishment_id": est1["id"],
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 2,
    })
    ingredients3 = fake_db.create_ingredients({
        "id": uuid4(),
        "recipe_id": recipes2["id"],
        "type": "ARTICLE",
        "master_article_id": master_articles2["id"],
        "unit_cost": 1.66,
        "quantity": 0.33,
        "unit": "string",
        "percentage_loss": 0,
        "gross_unit_price": 0,
        "establishment_id": est1["id"],
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 0.83,
    })
    ingredients4 = fake_db.create_ingredients({
        "id": uuid4(),
        "recipe_id": recipes3["id"],
        "type": "SUBRECIPES",
        "subrecipe_id": recipes2["id"],
        "unit_cost": 0.83,
        "quantity": 1,
        "unit": "string",
        "percentage_loss": 0,
        "gross_unit_price": 0.83,
        "establishment_id": est1["id"],
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 0.83,
    })
    ingredients5 = fake_db.create_ingredients({
        "id": uuid4(),
        "recipe_id": recipes3["id"],
        "type": "ARTICLE",
        "master_article_id": master_articles1["id"],
        "unit_cost": 0.5,
        "quantity": 0.5,
        "unit": "string",
        "percentage_loss": 0,
        "gross_unit_price": 1,
        "establishment_id": est1["id"],
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 0.5,
    })
    ingredients6 = fake_db.create_ingredients({
        "id": uuid4(),
        "recipe_id": recipes3["id"],
        "type": "ARTICLE",
        "master_article_id": master_articles2["id"],
        "unit_cost": 2.5,
        "quantity": 0.5,
        "unit": "string",
        "percentage_loss": 0,
        "gross_unit_price": 5,
        "establishment_id": est1["id"],
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 2.5,
    })
    ingredients7 = fake_db.create_ingredients({
        "id": uuid4(),
        "recipe_id": recipes3["id"],
        "type": "FIXED",
        "unit_cost": 0.1,
        "quantity": 0,
        "percentage_loss": 0,
        "gross_unit_price": 0.1,
        "establishment_id": est1["id"],
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 0.1,
    })
    ingredients8 = fake_db.create_ingredients({
        "id": uuid4(),
        "recipe_id": recipes4["id"],
        "type": "ARTICLE",
        "master_article_id": master_articles3["id"],
        "subrecipe_id": recipes4["id"],
        "unit_cost": 4,
        "quantity": 0.5,
        "unit": "string",
        "percentage_loss": 0,
        "gross_unit_price": 8,
        "establishment_id": est2["id"],
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 4,
    })

    #===============================================
    # HISORY INGREDIENT
    #===============================================

    history_ingredients1 = fake_db.create_history_ingredients({
        "id": uuid4(),
        "ingredient_id": ingredients1["id"],
        "recipe_id": recipes1["id"],
        "establishment_id": est1["id"],
        "master_article_id": master_articles1["id"],
        "unit_cost": 0.5,
        "quantity": 0.5,
        "unit": "string",
        "version_number": 1,
        "gross_unit_price": 1,
        "percentage_loss": 0,
        "date": datetime(2025, 1, 1, 12, 00),
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 0.5,
    })
    history_ingredients2 = fake_db.create_history_ingredients({
        "id": uuid4(),
        "ingredient_id": ingredients2["id"],
        "recipe_id": recipes1["id"],
        "establishment_id": est1["id"],
        "master_article_id": master_articles2["id"],
        "unit_cost": 2.5,
        "quantity": 0.5,
        "unit": "string",
        "version_number": 1,
        "gross_unit_price": 5,
        "percentage_loss": 0,
        "date": datetime(2025, 1, 1, 12, 00),
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 2.5,
    })
    history_ingredients3 = fake_db.create_history_ingredients({
        "id": uuid4(),
        "ingredient_id": ingredients3["id"],
        "recipe_id": recipes2["id"],
        "establishment_id": est1["id"],
        "master_article_id": master_articles2["id"],
        "unit_cost": 1.66,
        "quantity": 0.33,
        "unit": "string",
        "version_number": 1,
        "gross_unit_price": 5,
        "percentage_loss": 0,
        "date": datetime(2025, 1, 1, 12, 00),
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 0.83,
    })
    history_ingredients4 = fake_db.create_history_ingredients({
        "id": uuid4(),
        "ingredient_id": ingredients4["id"],
        "recipe_id": recipes3["id"],
        "establishment_id": est1["id"],
        "subrecipe_id": recipes2["id"],
        "unit_cost": 0.83,
        "quantity": 1,
        "unit": "string",
        "version_number": 1,
        "gross_unit_price": 0.83,
        "percentage_loss": 0,
        "date": datetime(2025, 1, 1, 12, 00),
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 0.83,
    })
    history_ingredients5 = fake_db.create_history_ingredients({
        "id": uuid4(),
        "ingredient_id": ingredients5["id"],
        "recipe_id": recipes3["id"],
        "establishment_id": est1["id"],
        "master_article_id": master_articles1["id"],
        "unit_cost": 0.5,
        "quantity": 0.5,
        "unit": "string",
        "version_number": 1,
        "gross_unit_price": 1.50,
        "percentage_loss": 0,
        "date": datetime(2025, 1, 1, 12, 00),
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 0.5,
    })
    history_ingredients6 = fake_db.create_history_ingredients({
        "id": uuid4(),
        "ingredient_id": ingredients6["id"],
        "recipe_id": recipes3["id"],
        "establishment_id": est1["id"],
        "master_article_id": master_articles2["id"],
        "unit_cost": 2.5,
        "quantity": 0.5,
        "unit": "string",
        "version_number": 1,
        "gross_unit_price": 5,
        "percentage_loss": 0,
        "date": datetime(2025, 1, 1, 12, 00),
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 2.5,
    })
    history_ingredients7 = fake_db.create_history_ingredients({
        "id": uuid4(),
        "ingredient_id": ingredients7["id"],
        "recipe_id": recipes3["id"],
        "establishment_id": est1["id"],
        "unit_cost": 0.1,
        "quantity": 1,
        "unit": "string",
        "version_number": 0,
        "gross_unit_price": 0.10,
        "percentage_loss": 0,
        "date": datetime(2025, 1, 1, 12, 00),
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 0.1,
    })
    history_ingredients8 = fake_db.create_history_ingredients({
        "id": uuid4(),
        "ingredient_id": ingredients8["id"],
        "recipe_id": recipes4["id"],
        "establishment_id": est2["id"],
        "master_article_id": master_articles3["id"],
        "unit_cost": 4,
        "quantity": 0.5,
        "unit": "string",
        "version_number": 1,
        "gross_unit_price": 8,
        "percentage_loss": 0,
        "date": datetime(2025, 1, 1, 12, 00),
        "loss_value": 0,
        "unit_cost_per_portion_recipe": 4,
    })



    # ===========================================================
    # 2. BLOC DYNAMIQUE POUR TESTER DIFFÉRENTS CAS
    # ===========================================================
    list_recipes = [
        ingredients1["id"],
        ingredients2["id"],
        ingredients3["id"],
        ingredients4["id"],
        ingredients5["id"],
        ingredients6["id"],
        ingredients7["id"],
        # vous pouvez modifier ici pour tester des cas différents
    ]


    # ===========================================================
    # 3. APPEL DE LA LOGIQUE
    # ===========================================================

    print("\n============== LANCEMENT DU RECALCUL DES MARGES ==============\n")

    result = update_recipes_and_history_recipes (
        establishment_id=est1["id"],
        recipe_ids=list_recipes,
        trigger="manual",
        target_date=date(2025, 2, 2),
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
