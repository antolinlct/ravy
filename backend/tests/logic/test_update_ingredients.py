import sys
from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest

from tests.fixtures import fake_db, fake_services

sys.modules["app.services"] = fake_services

from app.logic.write.update_ingredients import (  # noqa: E402
    LogicError,
    update_ingredient,
)


def _create_recipe(establishment_id, **overrides):
    payload = {
        "id": uuid4(),
        "establishment_id": establishment_id,
        "name": "Test Recipe",
        "portion": Decimal("4"),
        "saleable": True,
        "active": True,
        "price_excl_tax": Decimal("12"),
        "price_incl_tax": Decimal("14"),
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
        "quantity": Decimal("2"),
        "unit_cost": Decimal("3"),
    }
    payload.update(overrides)
    return fake_db.create_ingredients(payload)


def test_update_ingredient_creates_histories_and_margins():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id})

    recipe = _create_recipe(est_id)
    master_article_id = uuid4()
    fake_db.create_articles(
        {
            "id": uuid4(),
            "master_article_id": master_article_id,
            "establishment_id": est_id,
            "unit_price": Decimal("1.50"),
            "date": date(2024, 4, 1),
        }
    )

    ingredient = _create_ingredient(
        est_id,
        recipe["id"],
        type="ARTICLE",
        master_article_id=master_article_id,
        unit_cost=Decimal("1.50"),
        quantity=Decimal("2"),
    )

    result = update_ingredient(
        ingredient_id=ingredient["id"],
        recipe_id=recipe["id"],
        establishment_id=est_id,
        target_date=date(2024, 4, 1),
    )

    histories = fake_services.history_ingredients_service.get_all_history_ingredients(
        {"ingredient_id": ingredient["id"]}
    )
    assert len(histories) == 1
    assert histories[0]["date"].date() == date(2024, 4, 1)

    recipe_histories = fake_services.history_recipes_service.get_all_history_recipes(
        {"recipe_id": recipe["id"]}
    )
    assert len(recipe_histories) == 1
    assert recipe_histories[0]["purchase_cost_total"] == Decimal("1.50")

    margins = fake_services.recipe_margin_service.get_all_recipe_margin(
        {"establishment_id": est_id}
    )
    assert margins
    assert recipe["id"] in result["impacted_recipes"]


def test_update_ingredient_propagates_to_parent_subrecipes():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id})

    sub_recipe = _create_recipe(est_id, name="Sub", price_excl_tax=Decimal("8"))
    parent_recipe = _create_recipe(est_id, name="Parent", price_excl_tax=Decimal("20"))

    master_article_id = uuid4()
    fake_db.create_articles(
        {
            "id": uuid4(),
            "master_article_id": master_article_id,
            "establishment_id": est_id,
            "unit_price": Decimal("2"),
            "date": date(2024, 4, 2),
        }
    )

    sub_ing = _create_ingredient(
        est_id,
        sub_recipe["id"],
        type="ARTICLE",
        master_article_id=master_article_id,
        unit_cost=Decimal("2"),
        quantity=Decimal("1"),
    )

    parent_ing = _create_ingredient(
        est_id,
        parent_recipe["id"],
        type="SUBRECIPE",
        subrecipe_id=sub_recipe["id"],
        quantity=Decimal("1"),
        unit_cost=Decimal("2"),
    )

    result = update_ingredient(
        ingredient_id=sub_ing["id"],
        recipe_id=sub_recipe["id"],
        establishment_id=est_id,
        target_date=date(2024, 4, 2),
    )

    sub_histories = fake_services.history_ingredients_service.get_all_history_ingredients(
        {"ingredient_id": sub_ing["id"]}
    )
    parent_histories = fake_services.history_ingredients_service.get_all_history_ingredients(
        {"ingredient_id": parent_ing["id"]}
    )
    assert sub_histories and parent_histories

    parent_recipe_histories = fake_services.history_recipes_service.get_all_history_recipes(
        {"recipe_id": parent_recipe["id"]}
    )
    assert parent_recipe_histories

    assert parent_recipe["id"] in result["impacted_recipes"]

    margins = fake_services.recipe_margin_service.get_all_recipe_margin(
        {"establishment_id": est_id}
    )
    assert margins


def test_validation_errors_on_missing_inputs():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id})
    recipe = _create_recipe(est_id)
    ing = _create_ingredient(est_id, recipe["id"])

    with pytest.raises(LogicError):
        update_ingredient(
            ingredient_id=None,  # type: ignore[arg-type]
            recipe_id=recipe["id"],
            establishment_id=est_id,
            target_date=date.today(),
        )

    with pytest.raises(LogicError):
        update_ingredient(
            ingredient_id=ing["id"],
            recipe_id=uuid4(),
            establishment_id=est_id,
            target_date=date.today(),
        )
