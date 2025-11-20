import sys
import types
import pytest

# --- MOCK COMPLET DE app.services ---
fake_services = types.ModuleType("app.services")

service_names = [
    "alert_logs_service",
    "articles_service",
    "establishments_service",
    "history_ingredients_service",
    "history_recipes_service",
    "import_job_service",
    "ingredients_service",
    "invoices_service",
    "market_articles_service",
    "market_master_articles_service",
    "market_supplier_alias_service",
    "market_suppliers_service",
    "master_articles_service",
    "recipe_margin_category_service",
    "recipe_margin_service",
    "recipe_margin_subcategory_service",
    "recipes_service",
    "regex_patterns_service",
    "suppliers_service",
    "user_establishment_service",
    "user_profiles_service",
    "variations_service",
]

for name in service_names:
    setattr(fake_services, name, object())

sys.modules["app.services"] = fake_services


# --- IMPORTS DES FONCTIONS À TESTER ---
from app.logic.write.invoices_imports import (
    _apply_regex,
    _as_decimal,
    _unique,
    _compute_recipe_cost,
)


# --- TESTS UNITAIRES ---
def test_apply_regex_basic():
    assert _apply_regex(None, " METRO ") == "METRO"


def test_as_decimal_valid():
    assert _as_decimal("3.50") == 3.50


def test_as_decimal_invalid():
    assert _as_decimal("abc") is None


def test_unique_order_preserved():
    result = _unique(["a", "b", "a", "c"])
    assert result == ["a", "b", "c"]
