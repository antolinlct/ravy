import sys
from uuid import uuid4

import pytest

from tests.fixtures import fake_db, fake_services
from tests.logic.write.test_invoices_import_live_score import _setup_import_job

# Mock complet : remplacer app.services par les services fake
sys.modules["app.services"] = fake_services

from app.logic.write import invoices_imports


def test_invoice_rejection_created_on_failure():
    fake_db.reset_db()

    establishment = fake_db.create_establishments(
        {"id": uuid4(), "name": "Test Establishment", "active_sms": False}
    )

    job = fake_db.create_import_job(
        {
            "id": uuid4(),
            "establishment_id": establishment["id"],
            "ocr_result_json": {"invoice": {}, "supplier": {}, "lines": []},
            "status": "pending",
            "file_path": "rejected/path.pdf",
        }
    )

    with pytest.raises(invoices_imports.LogicError):
        invoices_imports.import_invoice_from_import_job(job["id"])

    rejected = fake_services.invoices_rejected_service.get_all_invoices_rejected()
    assert len(rejected) == 1
    assert rejected[0]["file_path"] == "rejected/path.pdf"
    assert "Date de facture manquante" in rejected[0]["rejection_reason"]

    updated_job = fake_services.import_job_service.get_import_job_by_id(job["id"])
    assert updated_job["status"] == "error"


def test_invoice_rejection_not_created_on_success():
    job, _ = _setup_import_job(with_financial_report=False)

    invoices_imports.import_invoice_from_import_job(job["id"])

    assert fake_services.invoices_rejected_service.get_all_invoices_rejected() == []
