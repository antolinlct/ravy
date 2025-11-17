import uuid
from decimal import Decimal
from unittest.mock import patch
from contextlib import ExitStack
from app.logic.write.invoices_imports import import_invoice_from_import_job


def test_import_invoice_master_article_existing():
    import_job_id = uuid.uuid4()
    establishment_id = uuid.uuid4()
    supplier_id = uuid.uuid4()
    invoice_id = uuid.uuid4()
    master_article_id = uuid.uuid4()
    market_master_article_id = uuid.uuid4()

    ocr_payload = {
        "invoice": {
            "invoice_number": "F2024-010",
            "invoice_date": "2024-02-01",
            "total_excl_tax": "10",
            "total_incl_tax": "12",
            "total_vat": "2",
        },
        "supplier": {"raw_name": "Metro"},
        "lines": [
            {
                "product_name": "Tomate ronde",
                "unit": "kg",
                "quantity": "5",
                "unit_price_excl_tax": "2",
                "line_total_excl_tax": "10",
                "discounts": None,
                "duties_and_taxes": None,
            }
        ],
    }

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
        patch("app.logic.write.invoices_imports.market_master_articles_service"),
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
            mock_market_master_articles,
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

        mock_suppliers.create_suppliers.return_value = {
            "id": supplier_id,
            "label": "FOOD",
            "name": "Metro",
        }
        mock_suppliers.get_all_suppliers.return_value = [
            {"id": supplier_id, "label": "FOOD", "name": "Metro"}
        ]
        mock_regex.get_all_regex_patterns.return_value = []


        mock_master_articles.get_all_master_articles.return_value = [
            {
                "id": master_article_id,
                "unformatted_name": "Tomate ronde",
                "name": "Tomate ronde",
            }
        ]

        mock_market_master_articles.get_all_market_master_articles.return_value = [
            {
                "id": market_master_article_id,
                "unformatted_name": "Tomate ronde",
                "market_supplier_id": uuid.UUID(int=1),
            }
        ]

        mock_market_sup.create_market_suppliers.return_value = {
            "id": uuid.UUID(int=1),
            "label": "FOOD",
        }

        mock_articles.create_articles.return_value = {
            "id": uuid.uuid4(),
            "master_article_id": master_article_id,
            "unit_price": "2.00",
        }

        mock_invoices.create_invoices.return_value = {"id": invoice_id}

        import_invoice_from_import_job(import_job_id)

        mock_master_articles.create_master_articles.assert_not_called()
        mock_market_master_articles.create_market_master_articles.assert_not_called()
        mock_articles.create_articles.assert_called_once()
