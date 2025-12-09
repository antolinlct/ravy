import importlib
from datetime import date

from app.logic.read import market_comparator
from app.core import supabase_client

from .fake_supabase import FakeSupabase


def test_fetch_product_data_market_vs_user(monkeypatch):
    fake = FakeSupabase(
        {
            "market_articles": [
                {"market_master_article_id": "prod-1", "unit_price": 5, "date": "2024-04-01"},
                {"market_master_article_id": "prod-1", "unit_price": 7, "date": "2024-04-15"},
                {"market_master_article_id": "prod-2", "unit_price": 9, "date": "2024-04-20"},
                {"market_master_article_id": "prod-1", "unit_price": None, "date": "2024-04-21"},
                {"market_master_article_id": "prod-1", "unit_price": "n/a", "date": "2024-04-22"},
            ],
            "master_articles": [
                {"id": "m1", "market_master_article_id": "prod-1", "establishment_id": "est-1"},
                {"id": "m2", "market_master_article_id": "prod-1", "establishment_id": "est-2"},
            ],
            "articles": [
                {"master_article_id": "m1", "unit_price": 6, "date": "2024-04-10"},
                {"master_article_id": "m1", "unit_price": 8, "date": "2024-04-18"},
                {"master_article_id": "m2", "unit_price": 99, "date": "2024-04-12"},
                {"master_article_id": "m1", "unit_price": None, "date": "2024-04-25"},
            ],
        }
    )

    monkeypatch.setattr(supabase_client, "supabase", fake)
    importlib.reload(market_comparator)
    monkeypatch.setattr(market_comparator, "supabase", fake)

    start = date(2024, 4, 1)
    end = date(2024, 4, 30)

    market_data = market_comparator._fetch_product_data(
        market_master_article_id="prod-1",
        establishment_id="est-1",
        start_date=start,
        end_date=end,
        only_my_invoices=False,
    )

    assert market_data["stats"]["avg_unit_price"] == 6.0
    assert market_data["stats"]["min_unit_price"] == 5.0
    assert market_data["stats"]["max_unit_price"] == 7.0
    assert market_data["stats"]["last_unit_price"] == 7.0
    assert market_data["stats"]["count_purchases"] == 4  # deux entrées ignorées pour les stats mais comptées

    personal_data = market_comparator._fetch_product_data(
        market_master_article_id="prod-1",
        establishment_id="est-1",
        start_date=start,
        end_date=end,
        only_my_invoices=True,
    )

    assert personal_data["stats"]["avg_unit_price"] == 7.0
    assert personal_data["stats"]["count_purchases"] == 3
    assert [point["avg_unit_price"] for point in personal_data["series_daily"]] == [6.0, 8.0]
