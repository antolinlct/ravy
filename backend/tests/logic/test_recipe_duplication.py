import sys
from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest

from tests.fixtures import fake_db, fake_services

sys.modules["app.services"] = fake_services

from app.logic.write.recipe_duplication import (  # noqa: E402
    LogicError,
    duplicate_recipe,
)


def _create_recipe(establishment_id, **overrides):
    data = {
        "id": uuid4(),
        "establishment_id": establishment_id,
        "name": "Base Recipe",
        "portion": Decimal("4"),
        "saleable": True,
        "active": True,
        "price_excl_tax": Decimal("12"),
        "price_incl_tax": Decimal("14"),
        "price_tax": Decimal("2"),
    }
    data.update(overrides)
    return fake_db.create_recipes(data)


def _create_ingredient(establishment_id, recipe_id, **overrides):
    payload = {
        "id": uuid4(),
        "establishment_id": establishment_id,
        "recipe_id": recipe_id,
        "type": "ARTICLE",
        "quantity": Decimal("2"),
        "unit_cost": Decimal("3.5"),
    }
    payload.update(overrides)
    return fake_db.create_ingredients(payload)


def test_validation_on_missing_parameters():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id})
    recipe = _create_recipe(est_id)

    with pytest.raises(LogicError):
        duplicate_recipe(
            recipe_id=recipe["id"],
            establishment_id=None,  # type: ignore[arg-type]
            new_name="",
            target_date=date(2024, 1, 1),
        )


def test_duplicate_recipe_creates_histories_and_margins():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id, "name": "Test"})
    recipe = _create_recipe(est_id)
    master_article_id = uuid4()
    fake_db.create_articles(
        {
            "id": uuid4(),
            "master_article_id": master_article_id,
            "establishment_id": est_id,
            "unit_price": Decimal("1"),
            "date": date(2024, 3, 2),
        }
    )
    _create_ingredient(
        est_id,
        recipe["id"],
        type="ARTICLE",
        unit_cost=Decimal("1"),
        quantity=Decimal("2"),
        master_article_id=master_article_id,
    )
    _create_ingredient(est_id, recipe["id"], type="FIXED", unit_cost=Decimal("2"))

    result = duplicate_recipe(
        recipe_id=recipe["id"],
        establishment_id=est_id,
        new_name="Copy",
        target_date=date(2024, 3, 2),
    )

    new_recipe = fake_services.recipes_service.get_recipes_by_id(result["new_recipe_id"])
    assert new_recipe["name"] == "Copy"
    assert new_recipe["establishment_id"] == est_id
    assert fake_services.ingredients_service.get_all_ingredients({"recipe_id": result["new_recipe_id"]})
    assert len(fake_services.ingredients_service.get_all_ingredients({"recipe_id": result["new_recipe_id"]})) == 2

    histories = fake_services.history_ingredients_service.get_all_history_ingredients(
        {"establishment_id": est_id}
    )
    assert len(histories) == 2
    assert all(h["ingredient_id"] in result["ingredient_ids"] for h in histories)
    assert all(h["date"].date() == date(2024, 3, 2) for h in histories)

    recipe_histories = fake_services.history_recipes_service.get_all_history_recipes(
        {"recipe_id": result["new_recipe_id"]}
    )
    assert len(recipe_histories) == 1
    assert recipe_histories[0]["purchase_cost_total"] == Decimal("3")

    assert fake_services.recipe_margin_service.get_all_recipe_margin({"establishment_id": est_id})


def test_duplicate_recipe_without_margin_when_not_saleable():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id})
    recipe = _create_recipe(est_id, saleable=False, active=False)
    _create_ingredient(est_id, recipe["id"], unit_cost=Decimal("1.5"))

    result = duplicate_recipe(
        recipe_id=recipe["id"],
        establishment_id=est_id,
        new_name="Non saleable copy",
        target_date=date(2024, 5, 1),
    )

    assert not fake_services.recipe_margin_service.get_all_recipe_margin(
        {"recipe_id": result["new_recipe_id"]}
    )
