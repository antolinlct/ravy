import uuid
from unittest.mock import patch
from contextlib import ExitStack
from app.logic.write.invoices_imports import import_invoice_from_import_job


def test_import_invoice_credit_note():
    import_job_id = uuid.uuid4()
    establishment_id = uuid.uuid4()
    supplier_id = uuid.uuid4()
    invoice_id = uuid.uuid4()

    ocr_payload = {
        "invoice": {
            "invoice_number": "AV-2024-001",
            "invoice_date": "2024-02-01",
            "total_excl_tax": "-100",
            "total_incl_tax": "-120",
            "total_vat": "-20",
        },
        "supplier": {"raw_name": "Metro"},
        "lines": [],
    }

    service_patches = [
        patch("app.logic.write.invoices_imports.import_jobs_service"),
        patch("app.logic.write.invoices_imports.establishments_service"),
        patch("app.logic.write.invoices_imports.suppliers_service"),
        patch("app.logic.write.invoices_imports.invoices_service"),
        patch("app.logic.write.invoices_imports.regex_patterns_service"),
        patch("app.logic.write.invoices_imports.market_supplier_alias_service"),
        patch("app.logic.write.invoices_imports.market_suppliers_service"),

    ]

    with ExitStack() as stack:

        (
            mock_jobs,
            mock_est,
            mock_suppliers,
            mock_invoices,
            mock_regex,
            mock_alias,
            mock_market_sup,
        ) = [stack.enter_context(p) for p in service_patches]

        mock_alias.get_all_market_supplier_alias.return_value = []
        mock_market_sup.get_all_market_suppliers.return_value = []

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
        }

        mock_suppliers.get_all_suppliers.return_value = []
        mock_suppliers.create_suppliers.return_value = {"id": supplier_id}

        mock_regex.get_all_regex_patterns.return_value = []

        mock_invoices.create_invoices.return_value = {"id": invoice_id}

        # --- Exécution ---
        import_invoice_from_import_job(import_job_id)

        # --- Assertions ---
        mock_invoices.create_invoices.assert_called_once()
        mock_jobs.update_import_job.assert_called_once_with(
            import_job_id, {"status": "completed"}
        )
