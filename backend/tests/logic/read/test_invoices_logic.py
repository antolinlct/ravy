import importlib
from datetime import date
import pytest

from app.logic.read import invoices_logic
from app.core import supabase_client

from .fake_supabase import FakeSupabase


def test_invoices_sum_filters_and_totals(monkeypatch):
    fake = FakeSupabase(
        {
            "invoices": [
                {
                    "id": "a1",
                    "date": "2024-05-10",
                    "supplier_id": "sup-ok",
                    "total_ht": 100,
                    "total_tva": 20,
                    "total_ttc": 120,
                    "establishment_id": "est-1",
                },
                {
                    "id": "a2",
                    "date": "2024-05-15",
                    "supplier_id": "sup-label",
                    "total_ht": 50,
                    "total_tva": 10,
                    "total_ttc": 60,
                    "establishment_id": "est-1",
                },
                {
                    "id": "a3",
                    "date": "2024-05-20",
                    "supplier_id": "sup-label",
                    "total_ht": None,
                    "total_tva": 0,
                    "total_ttc": 0,
                    "establishment_id": "est-1",
                },
                {
                    "id": "a4",
                    "date": "2024-05-12",
                    "supplier_id": "sup-other-est",
                    "total_ht": 999,
                    "total_tva": 999,
                    "total_ttc": 999,
                    "establishment_id": "est-2",
                },
            ],
            "suppliers": [
                {"id": "sup-ok", "label_id": "FOOD", "establishment_id": "est-1"},
                {"id": "sup-label", "label_id": "BEVERAGES", "establishment_id": "est-1"},
                {"id": "sup-other-est", "label_id": "FOOD", "establishment_id": "est-2"},
            ],
        }
    )

    # Patch supabase client everywhere it is imported
    monkeypatch.setattr(supabase_client, "supabase", fake)
    importlib.reload(invoices_logic)
    monkeypatch.setattr(invoices_logic, "supabase", fake)

    start = date(2024, 5, 1)
    end = date(2024, 5, 31)

    result = invoices_logic.invoices_sum(
        establishment_id="est-1",
        start_date=start,
        end_date=end,
        supplier_labels=["BEVERAGES"],
    )

    assert result["filters"]["start_date"] == str(start)
    assert result["filters"]["end_date"] == str(end)
    assert result["count"] == 2  # only est-1 invoices and label filter applied
    assert result["totals"] == {"sum_ht": 50.0, "sum_tva": 10.0, "sum_ttc": 60.0}
    assert {inv["id"] for inv in result["invoices"]} == {"a2", "a3"}


def test_invoices_sum_rejects_inverted_period_and_parses_numbers(monkeypatch):
    fake = FakeSupabase(
        {
            "invoices": [
                {
                    "id": "a1",
                    "date": "2024-05-10",
                    "supplier_id": "sup-ok",
                    "total_ht": "100.5",
                    "total_tva": "19.5",
                    "total_ttc": "120.0",
                    "establishment_id": "est-1",
                }
            ],
            "suppliers": [
                {"id": "sup-ok", "label_id": "FOOD", "establishment_id": "est-1"},
            ],
        }
    )

    monkeypatch.setattr(supabase_client, "supabase", fake)
    importlib.reload(invoices_logic)
    monkeypatch.setattr(invoices_logic, "supabase", fake)

    with pytest.raises(ValueError):
        invoices_logic.invoices_sum(
            establishment_id="est-1",
            start_date=date(2024, 5, 31),
            end_date=date(2024, 5, 1),
        )

    result = invoices_logic.invoices_sum(
        establishment_id="est-1",
        start_date=date(2024, 5, 1),
        end_date=date(2024, 5, 31),
    )

    assert result["totals"] == {"sum_ht": 100.5, "sum_tva": 19.5, "sum_ttc": 120.0}
