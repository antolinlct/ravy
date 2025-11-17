import sys
import types
import uuid
from unittest.mock import patch
from contextlib import ExitStack


# ---------------------------------------------------------------------------
# 1. Mock du module supabase (empêche tout accès réel)
# ---------------------------------------------------------------------------
sys.modules['supabase'] = types.ModuleType('supabase')
sys.modules['supabase'].create_client = lambda *args, **kwargs: None
sys.modules['supabase'].Client = object

# ---------------------------------------------------------------------------
# 2. Import de la fonction à tester
# ---------------------------------------------------------------------------
from app.logic.write.invoices_imports import import_invoice_from_import_job


# ---------------------------------------------------------------------------
# 3. Test minimal
# ---------------------------------------------------------------------------
def test_import_invoice_minimal():

    import_job_id = uuid.uuid4()
    establishment_id = uuid.uuid4()
    supplier_id = uuid.uuid4()
    invoice_id = uuid.uuid4()

    ocr_payload = {
        "invoice": {
            "invoice_number": "F2024-001",
            "invoice_date": "2024-02-01",
            "total_excl_tax": "100",
            "total_incl_tax": "120",
            "total_vat": "20",
        },
        "supplier": {"raw_name": "Metro"},
        "lines": [],
    }

    # -------------------------------------------------------------------
    # MOCK Propre (une seule parenthèse, pas de backslash)
    # -------------------------------------------------------------------
    service_patches = [
        patch("app.logic.write.invoices_imports.import_jobs_service"),
        patch("app.logic.write.invoices_imports.establishments_service"),
        patch("app.logic.write.invoices_imports.suppliers_service"),
        patch("app.logic.write.invoices_imports.market_suppliers_service"),
        patch("app.logic.write.invoices_imports.market_supplier_alias_service"),
        patch("app.logic.write.invoices_imports.invoices_service"),
        patch("app.logic.write.invoices_imports.regex_patterns_service"),
        patch("app.logic.write.invoices_imports.ingredients_service"),
        patch("app.logic.write.invoices_imports.recipes_service"),
        patch("app.logic.write.invoices_imports.history_ingredients_service"),
        patch("app.logic.write.invoices_imports.history_recipes_service"),
        patch("app.logic.write.invoices_imports.market_articles_service"),
        patch("app.logic.write.invoices_imports.master_articles_service"),
        patch("app.logic.write.invoices_imports.articles_service"),
        patch("app.logic.write.invoices_imports.variations_service"),
        patch("app.logic.write.invoices_imports.alert_logs_service"),
        patch("app.logic.write.invoices_imports.user_establishment_service"),
        patch("app.logic.write.invoices_imports.user_profiles_service"),
        patch("app.logic.write.invoices_imports.recipe_margin_service"),
        patch("app.logic.write.invoices_imports.recipe_margin_category_service"),
        patch("app.logic.write.invoices_imports.recipe_margin_subcategory_service"),
    ]

    with ExitStack() as stack:
        (
            mock_jobs,
            mock_est,
            mock_suppliers,
            mock_market_sup,
            mock_alias,
            mock_invoices,
            mock_regex,
            mock_ingredients,
            mock_recipes,
            mock_history_ing,
            mock_history_rec,
            mock_mk_articles,
            mock_master_articles,
            mock_articles,
            mock_variations,
            mock_alerts,
            mock_user_est,
            mock_user_profiles,
            mock_margin,
            mock_margin_cat,
            mock_margin_subcat,
        ) = [stack.enter_context(p) for p in service_patches]

        # -------------------------------
        # Données minimalistes
        # -------------------------------
        mock_jobs.get_import_job_by_id.return_value = {
            "id": import_job_id,
            "status": "pending",
            "establishment_id": establishment_id,
            "ocr_result_json": ocr_payload,
            "file_path": "/fake.pdf",
            "is_beverage": False,
        }

        mock_est.get_establishments_by_id.return_value = {
            "id": establishment_id,
            "active_sms": False,
            "type_sms": "FOOD",
        }

        mock_regex.get_all_regex_patterns.return_value = []

        mock_alias.get_all_market_supplier_alias.return_value = []

        mock_market_sup.create_market_suppliers.return_value = {
            "id": uuid.UUID(int=1),
            "label": "FOOD",
        }

        mock_suppliers.create_suppliers.return_value = {
            "id": supplier_id,
            "name": "Metro",
            "label": "FOOD",
        }
        mock_suppliers.get_all_suppliers.return_value = [
        {"id": supplier_id, "label": "FOOD", "name": "Metro"}
        ]

        mock_invoices.create_invoices.return_value = {"id": invoice_id}

        # Tout renvoie des données neutres
        mock_ingredients.get_all_ingredients.return_value = []
        mock_recipes.get_all_recipes.return_value = []
        mock_history_ing.get_all_history_ingredients.return_value = []
        mock_history_rec.get_all_history_recipes.return_value = []
        mock_articles.get_all_articles.return_value = []
        mock_user_est.get_all_user_establishment.return_value = []
        mock_user_profiles.get_user_profiles_by_id.return_value = None

        mock_margin.get_all_recipe_margin.return_value = []
        mock_margin_cat.get_all_recipe_margin_category.return_value = []
        mock_margin_subcat.get_all_recipe_margin_subcategory.return_value = []

        # -------------------------------------------------------------------
        # Appel de la fonction
        # -------------------------------------------------------------------
        import_invoice_from_import_job(import_job_id)

        # -------------------------------------------------------------------
        # Assertions minimales
        # -------------------------------------------------------------------
        mock_invoices.create_invoices.assert_called_once()
        mock_jobs.update_import_job.assert_called_with(import_job_id, {"status": "completed"})
