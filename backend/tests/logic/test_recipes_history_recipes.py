import sys
from datetime import date, datetime
from decimal import Decimal
from uuid import uuid4

import pytest

from tests.fixtures import fake_db, fake_services

sys.modules["app.services"] = fake_services

from app.logic.write.recipes_history_recipes import (  # noqa: E402
    LogicError,
    update_recipes_and_history_recipes,
)


def _create_recipe(establishment_id, **overrides):
    data = {
        "id": uuid4(),
        "establishment_id": establishment_id,
        "portion": Decimal("4"),
        "saleable": True,
        "price_excl_tax": Decimal("10"),
    }
    data.update(overrides)
    return fake_db.create_recipes(data)


def _create_ingredient(establishment_id, recipe_id, **overrides):
    payload = {
        "id": uuid4(),
        "establishment_id": establishment_id,
        "recipe_id": recipe_id,
        "unit_cost": Decimal("2.00"),
        "type": "ARTICLE",
    }
    payload.update(overrides)
    return fake_db.create_ingredients(payload)


def test_trigger_validation():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id})
    recipe = _create_recipe(est_id)

    with pytest.raises(LogicError):
        update_recipes_and_history_recipes(
            establishment_id=est_id,
            recipe_ids=[recipe["id"]],
            target_date=date(2024, 1, 1),
            trigger="invalid",
        )


def test_create_history_for_manual_with_subrecipe_flag():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id})
    recipe = _create_recipe(est_id, portion=Decimal("5"))
    _create_ingredient(est_id, recipe["id"], unit_cost=Decimal("3.5"), type="SUBRECIPE")

    result = update_recipes_and_history_recipes(
        establishment_id=est_id,
        recipe_ids=recipe["id"],
        target_date=date(2024, 2, 1),
        trigger="manual",
    )

    history = fake_services.history_recipes_service.get_all_history_recipes({
        "recipe_id": recipe["id"],
    })[0]

    assert history["contains_sub_recipe"] is True
    assert history["purchase_cost_total"] == Decimal("3.5")
    assert history["purchase_cost_per_portion"] == Decimal("0.7")
    assert history["version_number"] == Decimal("1")
    assert result["recipes_with_subrecipes"] == {recipe["id"]}

    updated_recipe = fake_services.recipes_service.get_recipes_by_id(recipe["id"])
    assert updated_recipe["purchase_cost_total"] == Decimal("3.5")
    assert updated_recipe["current_margin"]


def test_invoices_creates_history_with_incremented_version():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id})
    recipe = _create_recipe(est_id, price_excl_tax=Decimal("20"))
    _create_ingredient(est_id, recipe["id"], unit_cost=Decimal("6"))
    fake_db.create_history_recipes({
        "id": uuid4(),
        "recipe_id": recipe["id"],
        "establishment_id": est_id,
        "date": datetime(2024, 1, 1),
        "purchase_cost_total": Decimal("5"),
        "purchase_cost_per_portion": Decimal("1.25"),
        "portion": Decimal("4"),
        "version_number": Decimal("1"),
    })

    update_recipes_and_history_recipes(
        establishment_id=est_id,
        recipe_ids=[recipe["id"]],
        target_date=date(2024, 3, 1),
        trigger="invoices",
    )

    histories = fake_services.history_recipes_service.get_all_history_recipes({
        "recipe_id": recipe["id"],
        "order_by": "date",
    })
    assert len(histories) == 2
    new_history = histories[-1]
    assert new_history["version_number"] == Decimal("1.01")
    assert new_history["invoice_affected"] is True
    assert new_history["margin"] == Decimal("92.5")


def test_update_future_history_without_creation():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id})
    recipe = _create_recipe(est_id, portion=Decimal("2"), price_excl_tax=Decimal("8"))
    _create_ingredient(est_id, recipe["id"], unit_cost=Decimal("4"))
    future_history = fake_db.create_history_recipes({
        "id": uuid4(),
        "recipe_id": recipe["id"],
        "establishment_id": est_id,
        "date": datetime(2024, 5, 1),
        "purchase_cost_total": Decimal("1"),
        "purchase_cost_per_portion": Decimal("0.5"),
        "portion": Decimal("2"),
        "version_number": Decimal("2"),
    })

    result = update_recipes_and_history_recipes(
        establishment_id=est_id,
        recipe_ids=[recipe["id"]],
        target_date=date(2024, 4, 1),
        trigger="invoices",
    )

    histories = fake_services.history_recipes_service.get_all_history_recipes({
        "recipe_id": recipe["id"],
    })
    assert len(histories) == 1
    updated = histories[0]
    assert updated["id"] == future_history["id"]
    assert updated["purchase_cost_total"] == Decimal("4")
    assert updated["purchase_cost_per_portion"] == Decimal("2")
    assert updated["invoice_affected"] is True
    assert result["all_recipes"] == {recipe["id"]}

    updated_recipe = fake_services.recipes_service.get_recipes_by_id(recipe["id"])
    assert updated_recipe["purchase_cost_total"] == Decimal("4")
    assert updated_recipe["purchase_cost_per_portion"] == Decimal("2")
    assert updated_recipe["current_margin"] == Decimal("75")
