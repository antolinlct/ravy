import importlib
from datetime import date

from app.logic.read import market_database_overview
from app.core import supabase_client

from .fake_supabase import FakeSupabase


def test_fetch_user_articles_filters_by_establishment_and_dates(monkeypatch):
    fake = FakeSupabase(
        {
            "master_articles": [
                {"id": "m1", "market_master_article_id": "prod-1", "establishment_id": "est-1"},
                {"id": "m2", "market_master_article_id": "prod-1", "establishment_id": "est-2"},
            ],
            "articles": [
                {"master_article_id": "m1", "unit_price": 10, "date": "2024-04-01"},
                {"master_article_id": "m1", "unit_price": 11, "date": "2024-04-15"},
                {"master_article_id": "m2", "unit_price": 99, "date": "2024-04-05"},
                {"master_article_id": "m1", "unit_price": 8, "date": "2024-03-10"},
            ],
        }
    )

    monkeypatch.setattr(supabase_client, "supabase", fake)
    importlib.reload(market_database_overview)
    monkeypatch.setattr(market_database_overview, "supabase", fake)

    start = date(2024, 4, 1)
    end = date(2024, 4, 30)

    rows = market_database_overview._fetch_user_articles_for_product(
        establishment_id="est-1",
        market_master_article_id="prod-1",
        start=start,
        end=end,
    )

    assert len(rows) == 2
    # Retourne uniquement les colonnes sélectionnées (unit_price, date) pour l'établissement demandé
    assert [r["unit_price"] for r in rows] == [10, 11]


def test_daily_avg_series_sorts_and_averages():
    rows = [
        {"date": "2024-05-02", "unit_price": 12.0},
        {"date": "2024-05-01", "unit_price": 10.0},
        {"date": "2024-05-01", "unit_price": 14.0},
        {"date": "2024-05-03", "unit_price": None},
        {"date": "2024-05-04", "unit_price": "n/a"},
    ]

    series = market_database_overview._daily_avg_series(rows)

    assert series == [
        {"date": "2024-05-01", "avg_unit_price": 12.0},
        {"date": "2024-05-02", "avg_unit_price": 12.0},
    ]


def test_stats_basic_and_variation_handle_nonnumeric_and_sorting():
    rows = [
        {"date": "2024-05-02", "unit_price": "bad"},
        {"date": "2024-05-01", "unit_price": 10.0},
        {"date": "2024-05-03", "unit_price": 15.0},
    ]

    stats = market_database_overview._stats_basic(rows)
    assert stats["avg_unit_price"] == 12.5
    assert stats["last_purchase_date"] == "2024-05-03"
    assert stats["count_purchases"] == 3

    diff_eur, diff_pct = market_database_overview._variation_over_period(rows)
    assert diff_eur == 5.0
    assert diff_pct == 50.0
