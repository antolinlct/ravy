import sys
from uuid import uuid4
from tabulate import tabulate
from datetime import datetime, date, time
from decimal import Decimal

from tests.fixtures import fake_db
from tests.fixtures.sample_ocr import SAMPLE_OCR
from tests.fixtures import fake_services

# Mock complet : remplacer app.services par les services fake
sys.modules["app.services"] = fake_services

from app.logic.write.invoices_imports import import_invoice_from_import_job


def dump_db_table(table, rows):
    """Affichage propre des tables DB en terminal"""
    if not rows:
        print(f"\n### {table.upper()} — (0 rows)")
        return

    print(f"\n### {table.upper()} — ({len(rows)} rows)")

    # colonnes = union de toutes les clés trouvées
    all_keys = set()
    for r in rows:
        all_keys.update(r.keys())
    headers = sorted(all_keys)

    # lignes
    table_data = []
    for r in rows:
        table_data.append([r.get(h) for h in headers])

    print(tabulate(table_data, headers=headers, tablefmt="grid"))


def test_sandbox():
    fake_db.reset_db()

    # 1. CE QUI EST DÉJÀ EN DB AU DÉBUT (CONFIGURABLE)
    est1 = fake_db.create_establishments({
        "id": uuid4(),
        "name": "Brasserie Vesuvio",
        "active_sms": True,
        "type_sms": "FOOD & BEVERAGES",
        "sms_variation_trigger": "ALL",
    })
    est2 = fake_db.create_establishments({
        "id": uuid4(),
        "name": "CHENAVARD",
        "active_sms": True,
    })
    user1 = fake_db.create_user_profiles ({
        "id": uuid4(),
        "first_name": "MC",
        "last_name": "Solaar",
        "phone_sms": "+330782493290",

    })
    user2 = fake_db.create_user_profiles ({
        "id": uuid4(),
        "first_name": "Camel",
        "last_name": "1913",
        "phone_sms": "+330782493291",

    })
    user3 = fake_db.create_user_profiles ({
        "id": uuid4(),
        "first_name": "Tony",
        "last_name": "Soprano",
        "phone_sms": "+330782493266",

    })
    adminaccess1 = fake_db.create_user_establishment ({
        "user_id": user1["id"],
        "establishment_id": est1["id"],
        "role": "owner",
    })
    owneraccess = fake_db.create_user_establishment ({
        "user_id": user2["id"],
        "establishment_id": est1["id"],
        "role": "admin",
    })
    manageraccess = fake_db.create_user_establishment ({
        "user_id": user3["id"],
        "establishment_id": est1["id"],
        "role": "manager",
    })


    # FONCTION REGEX
    rgx1 = fake_db.create_regex_patterns ({
        "id": uuid4(),
        "type": "supplier_name",
        "regex": r"(?i)\bfrance\b",
        "created_at": date(2025, 1, 1),
    })
    rgx1 = fake_db.create_regex_patterns ({
        "id": uuid4(),
        "type": "market_master_article_name",
        "regex": r"[^0-9A-Za-zÀ-ÖØ-öø-ÿ]+",
        "created_at": date(2025, 1, 1),
    })

    # TEST AVE MARKET SUPPLIER DÉJÀ PRESENT ET UN SUPPLIER DÉJÀ PRÉSENT CHEZ UN AUTRE USER
    ms1 = fake_db.create_market_suppliers ({
        "id": uuid4(),
        "name": "METRO",
        "active": True,
        "label": "BEVERAGES",
    })
    msa1 = fake_db.create_market_supplier_alias({
        "id": uuid4(),
        "supplier_market_id": ms1["id"],
        "alias": "METRO"
    })
    ps1 = fake_db.create_suppliers({
        "id": uuid4(),
        "establishment_id": est2["id"],
        "name": "METRO",
        "label": "FOOD",
        "market_supplier_id": ms1["id"],
    })

    # UN ARTICLE A DÉJÀ ÉTÉ IMPORTÉ
    mma1 = fake_db.create_market_master_articles ({
        "id": uuid4(),
        "market_supplier_id": ms1["id"],
        "name": "Tomate France",
        "unformatted_name": "tomatefrance",
        "unit": "kg",
        "created_at": datetime(2025, 1, 1, 12, 10),

    })
    s1 = fake_db.create_suppliers ({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "name": "METRO",
        "label": "FOOD",
        "market_supplier_id": ms1["id"],
    })
    ma1 = fake_db.create_master_articles({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "supplier_id": s1["id"],
        "market_master_article_id": mma1["id"],
        "created_at": datetime(2025, 1, 1, 12, 10),
        "unformatted_name": "tomatefrance",
        "unit": "kg",
    })
    a1 = fake_db.create_articles ({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "supplier_id": s1["id"],
        "date": date(2025, 1, 1),
        "unit_price": Decimal("1"),
        "master_article_id": ma1["id"],
        "created_at": datetime(2025, 1, 1, 12, 10),
    })

    # exemple : un supplier déjà existant
    # DB["suppliers"].append({
    #     "id": uuid4(),
    #     "name": "METRO",
    #     "contact_email": "metro@test.com",
    # })

    # exemple : un master_article déjà présent
    # DB["master_articles"].append({
    #     "id": uuid4(),
    #     "establishment_id": est["id"],
    #     "name": "Tomate",
    #     "unit": "kg",
    # })

    # exemple : une recette déjà présente
    # DB["recipes"].append({
    #     "id": uuid4(),
    #     "establishment_id": est["id"],
    #     "name": "Salade maison",
    # })

    # 2. JE MET UNE FACTURE PERSONNALISÉE DANS UN IMPORT_JOB
    job = fake_db.create_import_job({
        "id": uuid4(),
        "establishment_id": est1["id"],
        "ocr_result_json": SAMPLE_OCR,     # facture modifiable à volonté
        "status": "pending",
        "file_path": "chemindelafacture",
        "is_beverage": True,
    })

    # 3. JE LANCE LA LOGIQUE RÉELLE
    import_invoice_from_import_job(job["id"])

    # 4. AFFICHAGE PROPRE DE TOUTES LES TABLES (LECTURE FACILE)
    print("\n================ ÉTAT FINAL DE LA DB ================")
    for table, rows in sorted(fake_db.DB.items()):
        dump_db_table(table, rows)

    # Juste pour que pytest soit content
    assert True
