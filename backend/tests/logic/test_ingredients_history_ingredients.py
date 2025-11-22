import sys
from datetime import date, datetime, time
from decimal import Decimal
from uuid import uuid4

import pytest

from tests.fixtures import fake_db, fake_services

sys.modules["app.services"] = fake_services

from app.logic.write.ingredients_history_ingredients import (  # noqa: E402
    LogicError,
    update_ingredients_and_history_ingredients,
)


def _create_basic_recipe(establishment_id: str, *, portion: Decimal = Decimal("4")):
    return fake_db.create_recipes({
        "id": uuid4(),
        "establishment_id": establishment_id,
        "portion": portion,
    })


def test_import_article_requires_invoice_id():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id})
    recipe = _create_basic_recipe(est_id)
    ingredient = fake_db.create_ingredients({
        "id": uuid4(),
        "establishment_id": est_id,
        "recipe_id": recipe["id"],
        "type": "ARTICLE",
        "master_article_id": uuid4(),
    })

    with pytest.raises(LogicError):
        update_ingredients_and_history_ingredients(
            establishment_id=est_id,
            ingredient_ids=[ingredient["id"]],
            trigger="import",
            target_date=date(2024, 1, 1),
        )


def test_import_article_updates_same_day_history_without_new_version():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id})
    recipe = _create_basic_recipe(est_id, portion=Decimal("6"))
    ingredient = fake_db.create_ingredients({
        "id": uuid4(),
        "establishment_id": est_id,
        "recipe_id": recipe["id"],
        "type": "ARTICLE",
        "master_article_id": uuid4(),
        "quantity": Decimal("2"),
        "percentage_loss": Decimal("5"),
        "unit": "kg",
    })
    target_date = date(2024, 6, 15)
    history = fake_db.create_history_ingredients({
        "id": uuid4(),
        "ingredient_id": ingredient["id"],
        "recipe_id": recipe["id"],
        "establishment_id": est_id,
        "master_article_id": ingredient["master_article_id"],
        "quantity": Decimal("1.5"),
        "percentage_loss": Decimal("10"),
        "gross_unit_price": Decimal("2.00"),
        "unit_cost": Decimal("3.30"),
        "version_number": Decimal("1"),
        "unit_cost_per_portion_recipe": Decimal("0.55"),
        "date": datetime.combine(target_date, time()),
    })
    invoice_id = uuid4()
    fake_db.create_articles({
        "id": uuid4(),
        "master_article_id": ingredient["master_article_id"],
        "invoice_id": invoice_id,
        "establishment_id": est_id,
        "unit_price": Decimal("2.50"),
        "date": datetime.combine(target_date, time()),
    })

    result = update_ingredients_and_history_ingredients(
        establishment_id=est_id,
        ingredient_ids=[ingredient["id"]],
        trigger="import",
        target_date=target_date,
        invoice_id=invoice_id,
    )

    histories = fake_services.history_ingredients_service.get_all_history_ingredients(
        filters={"ingredient_id": ingredient["id"]}
    )
    assert len(histories) == 1
    updated = histories[0]
    assert updated["version_number"] == history["version_number"]
    assert updated["gross_unit_price"] == Decimal("2.50")
    assert updated["unit_cost"] == Decimal("4.1250")  # 2.5 * 1.5 * 1.10
    assert updated["unit_cost_per_portion_recipe"] == Decimal("0.6875")
    assert result["recipes_directly_impacted"] == {recipe["id"]}
    assert result["ingredients_processed"] == {ingredient["id"]}


def test_manual_article_promotes_decimal_version_to_next_integer():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id})
    recipe = _create_basic_recipe(est_id, portion=Decimal("2"))
    ingredient = fake_db.create_ingredients({
        "id": uuid4(),
        "establishment_id": est_id,
        "recipe_id": recipe["id"],
        "type": "ARTICLE",
        "master_article_id": uuid4(),
        "quantity": Decimal("1"),
        "percentage_loss": Decimal("0"),
    })
    older_date = datetime(2024, 1, 1)
    newer_date = datetime(2024, 2, 1)
    fake_db.create_history_ingredients({
        "id": uuid4(),
        "ingredient_id": ingredient["id"],
        "recipe_id": recipe["id"],
        "establishment_id": est_id,
        "master_article_id": ingredient["master_article_id"],
        "quantity": Decimal("1"),
        "percentage_loss": Decimal("0"),
        "gross_unit_price": Decimal("2.00"),
        "unit_cost": Decimal("2.00"),
        "version_number": Decimal("1"),
        "unit_cost_per_portion_recipe": Decimal("1.00"),
        "date": older_date,
    })
    fake_db.create_history_ingredients({
        "id": uuid4(),
        "ingredient_id": ingredient["id"],
        "recipe_id": recipe["id"],
        "establishment_id": est_id,
        "master_article_id": ingredient["master_article_id"],
        "quantity": Decimal("1"),
        "percentage_loss": Decimal("0"),
        "gross_unit_price": Decimal("2.50"),
        "unit_cost": Decimal("2.50"),
        "version_number": Decimal("1.01"),
        "unit_cost_per_portion_recipe": Decimal("1.25"),
        "date": newer_date,
    })

    update_ingredients_and_history_ingredients(
        establishment_id=est_id,
        ingredient_ids=[ingredient["id"]],
        trigger="manual",
        target_date=date(2024, 2, 15),
    )

    histories = fake_services.history_ingredients_service.get_all_history_ingredients(
        filters={"ingredient_id": ingredient["id"]}
    )
    assert len(histories) == 2
    latest = histories[-1]
    assert latest["version_number"] == Decimal("2")
    assert latest["unit_cost_per_portion_recipe"] == Decimal("1.25")


def test_import_subrecipe_updates_future_history():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id})
    main_recipe = _create_basic_recipe(est_id, portion=Decimal("3"))
    sub_recipe = fake_db.create_recipes({
        "id": uuid4(),
        "establishment_id": est_id,
        "portion": Decimal("5"),
        "purchase_cost_per_portion": Decimal("3.50"),
    })
    ingredient = fake_db.create_ingredients({
        "id": uuid4(),
        "establishment_id": est_id,
        "recipe_id": main_recipe["id"],
        "subrecipe_id": sub_recipe["id"],
        "type": "SUBRECIPE",
        "quantity": Decimal("2"),
    })
    future_date = datetime(2024, 6, 2)
    fake_db.create_history_ingredients({
        "id": uuid4(),
        "ingredient_id": ingredient["id"],
        "recipe_id": main_recipe["id"],
        "establishment_id": est_id,
        "subrecipe_id": sub_recipe["id"],
        "quantity": Decimal("2"),
        "gross_unit_price": Decimal("3.00"),
        "unit_cost": Decimal("6.00"),
        "unit_cost_per_portion_recipe": Decimal("2.00"),
        "version_number": Decimal("1.0"),
        "date": future_date,
    })

    result = update_ingredients_and_history_ingredients(
        establishment_id=est_id,
        ingredient_ids=[ingredient["id"]],
        trigger="import",
        target_date=date(2024, 6, 1),
        invoice_id=uuid4(),
    )

    histories = fake_services.history_ingredients_service.get_all_history_ingredients(
        filters={"ingredient_id": ingredient["id"]}
    )
    assert len(histories) == 1
    updated = histories[0]
    assert updated["gross_unit_price"] == Decimal("3.50")
    assert updated["unit_cost"] == Decimal("7.00")
    assert updated["unit_cost_per_portion_recipe"] == Decimal("2.333333333333333333333333333")
    assert result["recipes_indirectly_impacted"] == {main_recipe["id"]}
    assert result["ingredients_processed"] == {ingredient["id"]}


def test_manual_fixed_creates_new_history_with_incremented_version():
    fake_db.reset_db()
    est_id = uuid4()
    fake_db.create_establishments({"id": est_id})
    recipe = _create_basic_recipe(est_id)
    ingredient = fake_db.create_ingredients({
        "id": uuid4(),
        "establishment_id": est_id,
        "recipe_id": recipe["id"],
        "type": "FIXED",
        "unit_cost": Decimal("5.00"),
    })
    fake_db.create_history_ingredients({
        "id": uuid4(),
        "ingredient_id": ingredient["id"],
        "recipe_id": recipe["id"],
        "establishment_id": est_id,
        "unit_cost": Decimal("4.00"),
        "version_number": Decimal("1"),
        "date": datetime(2024, 1, 1),
    })
    fake_db.create_history_ingredients({
        "id": uuid4(),
        "ingredient_id": ingredient["id"],
        "recipe_id": recipe["id"],
        "establishment_id": est_id,
        "unit_cost": Decimal("4.50"),
        "version_number": Decimal("2"),
        "date": datetime(2024, 2, 1),
    })

    result = update_ingredients_and_history_ingredients(
        establishment_id=est_id,
        ingredient_ids=[ingredient["id"]],
        trigger="manual",
        target_date=date(2024, 3, 1),
    )

    histories = fake_services.history_ingredients_service.get_all_history_ingredients(
        filters={"ingredient_id": ingredient["id"]}
    )
    assert len(histories) == 3
    newest = histories[-1]
    assert newest["unit_cost"] == Decimal("5.00")
    assert newest["version_number"] == Decimal("3")
    assert result["recipes_directly_impacted"] == {recipe["id"]}
    assert result["ingredients_processed"] == {ingredient["id"]}

