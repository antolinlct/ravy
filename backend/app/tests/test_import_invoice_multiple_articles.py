import uuid
from decimal import Decimal
from unittest.mock import patch
from contextlib import ExitStack
from app.logic.write.invoices_imports import import_invoice_from_import_job


def test_import_invoice_multiple_articles():
    import_job_id = uuid.uuid4()
    establishment_id = uuid.uuid4()
    supplier_id = uuid.uuid4()
    invoice_id = uuid.uuid4()

    # ID du master article déjà existant
    existing_master_article_id = uuid.uuid4()
    # ID pour le nouveau master_article qui va être créé
    new_master_article_id = uuid.uuid4()

    # Ancien article (pour variation)
    previous_article_id = uuid.uuid4()

    # FACTURE OCR
    ocr_payload = {
        "invoice": {
            "invoice_number": "F2024-200",
            "invoice_date": "2024-02-01",
            "total_excl_tax": "60",
            "total_incl_tax": "72",
            "total_vat": "12",
        },
        "supplier": {"raw_name": "Metro"},
        "lines": [
            # 1. Article EXISTANT - stable (prix identique)
            {
                "product_name": "Tomate ronde",
                "unit": "kg",
                "quantity": "10",
                "unit_price_excl_tax": "2.00",
                "line_total_excl_tax": "20",
                "discounts": None,
                "duties_and_taxes": None,
            },
            # 2. Article NOUVEAU - doit créer un master_article
            {
                "product_name": "Courgette",
                "unit": "kg",
                "quantity": "5",
                "unit_price_excl_tax": "3.00",
                "line_total_excl_tax": "15",
                "discounts": None,
                "duties_and_taxes": None,
            },
            # 3. Article EXISTANT AVEC VARIATION (prix précédemment à 1.00 → maintenant 2.00)
            {
                "product_name": "Carotte",
                "unit": "kg",
                "quantity": "10",
                "unit_price_excl_tax": "2.00",
                "line_total_excl_tax": "20",
                "discounts": None,
                "duties_and_taxes": None,
            },
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

        # ------------------------
        # SETUP MOCKS
        # ------------------------

        # Import job
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

        # Supplier toujours FOOD
        mock_suppliers.get_all_suppliers.return_value = [
            {"id": supplier_id, "label": "FOOD", "name": "Metro"}
        ]
        mock_suppliers.create_suppliers.return_value = {
            "id": supplier_id,
            "label": "FOOD",
            "name": "Metro",
        }

        # MASTER ARTICLES déjà existants → Tomate ronde et Carotte existent déjà
        mock_master_articles.get_all_master_articles.return_value = [
            {"id": existing_master_article_id, "unformatted_name": "Tomate ronde"},
            {"id": uuid.uuid4(), "unformatted_name": "Carotte"},
        ]

        # MARKET MASTER ARTICLES existants
        mock_market_master_articles.get_all_market_master_articles.return_value = [
            {
                "id": uuid.uuid4(),
                "unformatted_name": "Tomate ronde",
                "market_supplier_id": uuid.UUID(int=1),
            },
            {
                "id": uuid.uuid4(),
                "unformatted_name": "Carotte",
                "market_supplier_id": uuid.UUID(int=1),
            },
        ]

        # COURGETTE doit créer un nouveau master
        mock_master_articles.create_master_articles.return_value = {
            "id": new_master_article_id,
            "unformatted_name": "Courgette",
        }

        mock_market_master_articles.create_market_master_articles.return_value = {
            "id": uuid.uuid4(),
            "unformatted_name": "Courgette",
        }

        # CREATION DES ARTICLES
        mock_articles.create_articles.return_value = {"id": uuid.uuid4()}

        # HISTORIQUE : Carotte avait un article à 1.00 → variation
        mock_articles.get_all_articles.return_value = [
            {"id": previous_article_id, 
             "master_article_id": mock_master_articles.get_all_master_articles.return_value[1]["id"],
             "unit_price": "1.00", 
             "date": "2024-01-01"}
        ]

        # Variation créée pour Carotte
        mock_variations.create_variations.return_value = {
            "id": uuid.uuid4(),
            "percentage": Decimal("100"),
        }

        mock_invoices.create_invoices.return_value = {"id": invoice_id}

        # ------------------------
        # EXECUTION
        # ------------------------
        import_invoice_from_import_job(import_job_id)

        # ------------------------
        # ASSERTIONS
        # ------------------------

        # COURGETTE : master_article créé 1 seule fois
        mock_master_articles.create_master_articles.assert_called_once()

        # CAROTTE & TOMATE : pas de duplication
        calls = mock_master_articles.get_all_master_articles.return_value
        assert len(calls) == 2

        # Variation appelée une seule fois (pour Carotte)
        mock_variations.create_variations.assert_called_once()

        # Job terminé
        mock_jobs.update_import_job.assert_called_once_with(import_job_id, {"status": "completed"})
