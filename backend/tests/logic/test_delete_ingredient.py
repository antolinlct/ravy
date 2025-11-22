import sys
from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest

from tests.fixtures import fake_db, fake_services

sys.modules["app.services"] = fake_services

from app.logic.write.delete_ingredient import LogicError, delete_ingredient  # noqa: E402


def _create_recipe(establishment_id, **overrides):
    payload = {
        "id": uuid4(),
        "establishment_id": establishment_id,
        "name": "Recipe",
        "portion": Decimal("4"),
        "saleable": True,
        "active": True,
        "price_excl_tax": Decimal("10"),
        "price_incl_tax": Decimal("12"),
        "price_tax": Decimal("2"),
    }
    payload.update(overrides)
    return fake_db.create_recipes(payload)


def _create_ingredient(establishment_id, recipe_id, **overrides):
    payload = {
        "id": uuid4(),
        "establishment_id": establishment_id,
        "recipe_id": recipe_id,
        "type": "ARTICLE",
        "quantity": Decimal("1"),
        "unit_cost": Decimal("2"),
    }
    payload.update(overrides)
    return fake_db.create_ingredients(payload)


def test_delete_ingredient_updates_dependencies_and_margins():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id, "name": "Test"})

    recipe = _create_recipe(est_id)
    parent_recipe = _create_recipe(est_id, name="Parent")

    ingredient = _create_ingredient(est_id, recipe["id"], type="ARTICLE")
    fake_services.history_ingredients_service.create_history_ingredients(
        {
            "id": uuid4(),
            "ingredient_id": ingredient["id"],
            "recipe_id": recipe["id"],
            "establishment_id": est_id,
            "date": date(2024, 1, 1),
        }
    )

    dependent_ing = _create_ingredient(
        est_id,
        parent_recipe["id"],
        type="SUBRECIPE",
        subrecipe_id=recipe["id"],
    )

    result = delete_ingredient(
        ingredient_id=ingredient["id"],
        establishment_id=est_id,
        target_date=date(2024, 7, 1),
    )

    assert fake_services.ingredients_service.get_ingredients_by_id(ingredient["id"]) is None

    histories = fake_services.history_ingredients_service.get_all_history_ingredients(
        {"ingredient_id": ingredient["id"]}
    )
    assert not histories

    dependent_histories = fake_services.history_ingredients_service.get_all_history_ingredients(
        {"ingredient_id": dependent_ing["id"]}
    )
    assert dependent_histories

    assert recipe["id"] in result["impacted_recipes"]
    assert parent_recipe["id"] in result["impacted_recipes"]

    margins = fake_services.recipe_margin_service.get_all_recipe_margin(
        {"establishment_id": est_id}
    )
    assert margins


def test_delete_ingredient_skips_margins_when_unsaleable_or_inactive():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id, "name": "Test"})

    recipe = _create_recipe(est_id, saleable=False, active=False)
    ingredient = _create_ingredient(est_id, recipe["id"])

    result = delete_ingredient(
        ingredient_id=ingredient["id"],
        establishment_id=est_id,
        target_date=date(2024, 8, 1),
    )

    assert recipe["id"] in result["impacted_recipes"]

    margins = fake_services.recipe_margin_service.get_all_recipe_margin(
        {"establishment_id": est_id}
    )
    assert not margins


def test_delete_ingredient_validation_errors():
    fake_db.reset_db()
    est_id = uuid4()
    other_est = uuid4()
    fake_db.create_establishments({"id": est_id, "name": "Test"})
    ingredient = _create_ingredient(est_id, uuid4())

    with pytest.raises(LogicError):
        delete_ingredient(
            ingredient_id=None,  # type: ignore[arg-type]
            establishment_id=est_id,
            target_date=date.today(),
        )

    fake_db.create_ingredients({"id": uuid4(), "establishment_id": other_est})

    with pytest.raises(LogicError):
        delete_ingredient(
            ingredient_id=uuid4(),
            establishment_id=est_id,
            target_date=date.today(),
        )

    fake_db.create_ingredients({"id": uuid4(), "establishment_id": est_id})

    with pytest.raises(LogicError):
        delete_ingredient(
            ingredient_id=ingredient["id"],
            establishment_id=other_est,
            target_date=date.today(),
        )
