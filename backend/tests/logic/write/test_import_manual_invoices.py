import sys
from datetime import date
from uuid import uuid4

import pytest

# Redirige app.services vers les fake services pour les imports indirects
from tests.fixtures import fake_services  # noqa: F401

sys.modules["app.services"] = fake_services

from app.logic.write import import_manual_invoices
from app.logic.write.import_manual_invoices import LogicError


class _StubArticlesService:
    def __init__(self, articles):
        self.articles = articles

    def get_all_articles(self, filters=None, limit=200, page=1):
        return self.articles


class _StubIngredientsService:
    def __init__(self, ingredients):
        self.ingredients = ingredients

    def get_all_ingredients(self, filters=None, limit=200, page=1):
        return self.ingredients


class _StubInvoicesService:
    def __init__(self, invoice):
        self.invoice = invoice

    def get_invoices_by_id(self, invoice_id):
        return self.invoice


class _StubMasterArticlesService:
    def __init__(self, master_articles):
        self.master_articles = master_articles

    def get_all_master_articles(self, filters=None, limit=200, page=1):
        return self.master_articles


class _StubFinancialReportsService:
    def __init__(self, has_report=True):
        self.has_report = has_report

    def get_all_financial_reports(self, filters=None, limit=1, page=1):
        return [{}] if self.has_report else []


def test_import_manual_invoice_happy_path(monkeypatch):
    establishment_id = uuid4()
    invoice_id = uuid4()
    master_article_id = uuid4()
    recipe_id = uuid4()
    subrecipe_id = uuid4()
    ing_article_id = uuid4()
    ing_sub_id = uuid4()

    invoice = {
        "id": invoice_id,
        "establishment_id": establishment_id,
        "invoice_date": date(2024, 1, 1),
    }

    invoice_articles = [
        {"id": uuid4(), "master_article_id": master_article_id, "establishment_id": establishment_id},
    ]

    master_articles = [{"id": master_article_id, "establishment_id": establishment_id}]

    ingredients = [
        {
            "id": ing_article_id,
            "type": "ARTICLE",
            "master_article_id": master_article_id,
            "establishment_id": establishment_id,
        },
        {
            "id": ing_sub_id,
            "type": "SUBRECIPE",
            "subrecipe_id": subrecipe_id,
            "establishment_id": establishment_id,
        },
    ]

    ingredient_calls = []
    recipe_calls = []
    margin_calls = []
    live_score_calls = []

    def stub_update_ingredients_and_history_ingredients(**kwargs):
        ingredient_calls.append(kwargs)
        if ing_article_id in kwargs.get("ingredient_ids", []):
            return {
                "recipes_directly_impacted": {recipe_id},
                "recipes_indirectly_impacted": {subrecipe_id},
            }
        return {
            "recipes_directly_impacted": {subrecipe_id},
            "recipes_indirectly_impacted": set(),
        }

    def stub_update_recipes_and_history_recipes(**kwargs):
        recipe_calls.append(kwargs)
        return {
            "all_recipes": set(kwargs.get("recipe_ids", [])),
            "recipes_with_subrecipes": {subrecipe_id},
        }

    def stub_recompute_recipe_margins(**kwargs):
        margin_calls.append(kwargs)

    def stub_create_or_update_live_score(**kwargs):
        live_score_calls.append(kwargs)

    monkeypatch.setattr(import_manual_invoices, "articles_service", _StubArticlesService(invoice_articles))
    monkeypatch.setattr(import_manual_invoices, "ingredients_service", _StubIngredientsService(ingredients))
    monkeypatch.setattr(import_manual_invoices, "invoices_service", _StubInvoicesService(invoice))
    monkeypatch.setattr(
        import_manual_invoices,
        "master_articles_service",
        _StubMasterArticlesService(master_articles),
    )
    monkeypatch.setattr(import_manual_invoices, "financial_reports_service", _StubFinancialReportsService())
    monkeypatch.setattr(
        import_manual_invoices,
        "update_ingredients_and_history_ingredients",
        stub_update_ingredients_and_history_ingredients,
    )
    monkeypatch.setattr(
        import_manual_invoices, "update_recipes_and_history_recipes", stub_update_recipes_and_history_recipes
    )
    monkeypatch.setattr(import_manual_invoices, "recompute_recipe_margins", stub_recompute_recipe_margins)
    monkeypatch.setattr(import_manual_invoices, "create_or_update_live_score", stub_create_or_update_live_score)

    result = import_manual_invoices.import_manual_invoice(invoice_id)

    assert ingredient_calls and ingredient_calls[0]["ingredient_ids"] == [ing_article_id]
    assert recipe_calls and set(recipe_calls[0]["recipe_ids"]) == {recipe_id, subrecipe_id}
    assert margin_calls and set(margin_calls[0]["recipe_ids"]) == {recipe_id, subrecipe_id}
    assert live_score_calls and live_score_calls[0]["establishment_id"] == establishment_id
    assert result["ingredient_ids_article"] == [ing_article_id]
    assert result["ingredient_ids_subrecipes"] == [ing_sub_id]
    assert set(result["impacted_article_recipes"]) == {recipe_id, subrecipe_id}
    assert set(result["impacted_sub_recipes"]) == {subrecipe_id}


def test_import_manual_invoice_missing_master_articles(monkeypatch):
    establishment_id = uuid4()
    invoice_id = uuid4()
    invoice = {
        "id": invoice_id,
        "establishment_id": establishment_id,
        "invoice_date": date(2024, 1, 1),
    }

    invoice_articles = [{"id": uuid4(), "master_article_id": uuid4(), "establishment_id": establishment_id}]
    ingredients = []

    monkeypatch.setattr(import_manual_invoices, "articles_service", _StubArticlesService(invoice_articles))
    monkeypatch.setattr(import_manual_invoices, "ingredients_service", _StubIngredientsService(ingredients))
    monkeypatch.setattr(import_manual_invoices, "invoices_service", _StubInvoicesService(invoice))
    monkeypatch.setattr(import_manual_invoices, "master_articles_service", _StubMasterArticlesService([]))

    with pytest.raises(LogicError):
        import_manual_invoices.import_manual_invoice(invoice_id)
