import sys
from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest

from tests.fixtures import fake_db, fake_services

sys.modules["app.services"] = fake_services

from app.logic.write.update_recipes import LogicError, update_recipe  # noqa: E402


def _create_recipe(establishment_id, **overrides):
    payload = {
        "id": uuid4(),
        "establishment_id": establishment_id,
        "name": "Base Recipe",
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


def test_update_recipe_updates_histories_and_margins():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id, "name": "Test"})

    recipe = _create_recipe(est_id)
    sub_recipe = _create_recipe(est_id, name="Child", price_excl_tax=Decimal("6"))

    _create_ingredient(est_id, recipe["id"], type="SUBRECIPE", subrecipe_id=sub_recipe["id"])
    _create_ingredient(est_id, sub_recipe["id"], type="ARTICLE", unit_cost=Decimal("3"))

    result = update_recipe(
        recipe_id=sub_recipe["id"],
        establishment_id=est_id,
        target_date=date(2024, 5, 1),
    )

    sub_histories = fake_services.history_recipes_service.get_all_history_recipes(
        {"recipe_id": sub_recipe["id"]}
    )
    parent_histories = fake_services.history_recipes_service.get_all_history_recipes(
        {"recipe_id": recipe["id"]}
    )

    assert sub_histories and parent_histories
    assert result["dependent_ingredient_ids"]
    assert recipe["id"] in result["impacted_recipes"]

    margins = fake_services.recipe_margin_service.get_all_recipe_margin(
        {"establishment_id": est_id}
    )
    assert margins


def test_update_recipe_skips_margins_for_unsaleable_or_inactive():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id, "name": "Test"})

    recipe = _create_recipe(est_id, saleable=False)
    _create_ingredient(est_id, recipe["id"], unit_cost=Decimal("5"))

    result = update_recipe(
        recipe_id=recipe["id"],
        establishment_id=est_id,
        target_date=date(2024, 6, 1),
    )

    histories = fake_services.history_recipes_service.get_all_history_recipes(
        {"recipe_id": recipe["id"]}
    )
    assert histories
    assert recipe["id"] in result["impacted_recipes"]

    margins = fake_services.recipe_margin_service.get_all_recipe_margin(
        {"establishment_id": est_id}
    )
    assert not margins


def test_update_recipe_validation():
    fake_db.reset_db()
    est_id = uuid4()
    other_est_id = uuid4()
    fake_db.create_establishments({"id": est_id, "name": "Test"})
    recipe = _create_recipe(est_id)

    with pytest.raises(LogicError):
        update_recipe(
            recipe_id=None,  # type: ignore[arg-type]
            establishment_id=est_id,
            target_date=date.today(),
        )

    fake_db.create_recipes({"id": uuid4(), "establishment_id": other_est_id})

    with pytest.raises(LogicError):
        update_recipe(
            recipe_id=uuid4(),
            establishment_id=est_id,
            target_date=date.today(),
        )
