import sys
from datetime import date, datetime
from uuid import uuid4

from decimal import Decimal

from tests.fixtures import fake_db, fake_services
from tests.fixtures.sample_ocr import SAMPLE_OCR

# Mock complet : remplacer app.services par les services fake
sys.modules["app.services"] = fake_services

from app.logic.write import invoices_imports


def _setup_import_job(*, with_financial_report: bool):
    fake_db.reset_db()

    establishment = fake_db.create_establishments(
        {"id": uuid4(), "name": "Test Establishment", "active_sms": False}
    )

    fake_db.create_regex_patterns(
        {
            "id": uuid4(),
            "type": "supplier_name",
            "regex": r"(?i)\\bfrance\\b",
            "created_at": date(2025, 1, 1),
        }
    )
    fake_db.create_regex_patterns(
        {
            "id": uuid4(),
            "type": "market_master_article_name",
            "regex": r"[^0-9A-Za-zÀ-ÖØ-öø-ÿ]+",
            "created_at": date(2025, 1, 1),
        }
    )

    market_supplier = fake_db.create_market_suppliers(
        {"id": uuid4(), "name": "METRO", "active": True, "label": "FOOD"}
    )
    fake_db.create_market_supplier_alias(
        {
            "id": uuid4(),
            "supplier_market_id": market_supplier["id"],
            "alias": "METRO",
        }
    )

    market_master_article = fake_db.create_market_master_articles(
        {
            "id": uuid4(),
            "market_supplier_id": market_supplier["id"],
            "name": "Tomate France",
            "unformatted_name": "tomatefrance",
            "unit": "kg",
            "created_at": datetime(2025, 1, 1, 12, 10),
        }
    )

    supplier = fake_db.create_suppliers(
        {
            "id": uuid4(),
            "establishment_id": establishment["id"],
            "name": "METRO",
            "label": "FOOD",
            "market_supplier_id": market_supplier["id"],
        }
    )
    master_article = fake_db.create_master_articles(
        {
            "id": uuid4(),
            "establishment_id": establishment["id"],
            "supplier_id": supplier["id"],
            "market_master_article_id": market_master_article["id"],
            "created_at": datetime(2025, 1, 1, 12, 10),
            "unformatted_name": "tomatefrance",
            "unit": "kg",
        }
    )
    fake_db.create_articles(
        {
            "id": uuid4(),
            "establishment_id": establishment["id"],
            "supplier_id": supplier["id"],
            "date": date(2025, 1, 1),
            "unit_price": Decimal("1"),
            "master_article_id": master_article["id"],
            "created_at": datetime(2025, 1, 1, 12, 10),
        }
    )

    job = fake_db.create_import_job(
        {
            "id": uuid4(),
            "establishment_id": establishment["id"],
            "ocr_result_json": SAMPLE_OCR,
            "status": "pending",
            "file_path": "chemindelafacture",
            "is_beverage": True,
        }
    )

    if with_financial_report:
        fake_db.create_financial_reports(
            {
                "id": uuid4(),
                "establishment_id": establishment["id"],
                "month": date(2025, 1, 1),
                "ebitda_ratio": Decimal("0.12"),
            }
        )

    return job, establishment


def test_live_score_not_triggered_without_reports(monkeypatch):
    job, establishment = _setup_import_job(with_financial_report=False)
    calls = []

    monkeypatch.setattr(
        invoices_imports,
        "create_or_update_live_score",
        lambda *, establishment_id: calls.append(establishment_id),
    )

    invoices_imports.import_invoice_from_import_job(job["id"])

    assert calls == []


def test_live_score_triggered_with_reports(monkeypatch):
    job, establishment = _setup_import_job(with_financial_report=True)
    calls = []

    def _fake_live_score(*, establishment_id):
        calls.append(establishment_id)
        return {"score": Decimal("1")}

    monkeypatch.setattr(invoices_imports, "create_or_update_live_score", _fake_live_score)

    invoices_imports.import_invoice_from_import_job(job["id"])

    assert calls == [establishment["id"]]
