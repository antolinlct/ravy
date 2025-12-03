import sys
from datetime import date
from decimal import Decimal
from uuid import uuid4

from tests.fixtures import fake_db, fake_services

# Redirect app.services to sandbox services
sys.modules["app.services"] = fake_services

from app.logic.write import delete_article as delete_article_module


def test_delete_article_removes_master_and_dependents(monkeypatch):
    fake_db.reset_db()

    est_id = uuid4()
    master_id = uuid4()
    article_id = uuid4()
    recipe_id = uuid4()

    fake_db.create_master_articles(
        {
            "id": master_id,
            "establishment_id": est_id,
            "unit": "KG",
            "current_unit_price": Decimal("3.50"),
        }
    )
    fake_db.create_articles(
        {
            "id": article_id,
            "master_article_id": master_id,
            "establishment_id": est_id,
            "supplier_id": uuid4(),
            "date": date(2023, 2, 2),
            "unit_price": Decimal("3.50"),
        }
    )

    ing = fake_db.create_ingredients(
        {
            "establishment_id": est_id,
            "master_article_id": master_id,
            "recipe_id": recipe_id,
            "type": "ARTICLE",
            "quantity": Decimal("2"),
            "percentage_loss": Decimal("5"),
        }
    )

    fake_db.create_history_ingredients(
        {
            "ingredient_id": ing["id"],
            "establishment_id": est_id,
            "source_article_id": article_id,
            "gross_unit_price": Decimal("3.50"),
            "quantity": Decimal("2"),
            "percentage_loss": Decimal("5"),
            "date": date(2023, 2, 2),
        }
    )

    fake_db.create_recipes({"id": recipe_id, "establishment_id": est_id, "portion": Decimal("4")})
    fake_db.create_history_recipes(
        {
            "recipe_id": recipe_id,
            "establishment_id": est_id,
            "date": date(2023, 2, 2),
        }
    )

    monkeypatch.setattr(
        delete_article_module,
        "update_recipes_and_history_recipes",
        lambda **_: (_ for _ in ()).throw(AssertionError("recipe update should not run")),
    )
    monkeypatch.setattr(
        delete_article_module,
        "update_ingredients_and_history_ingredients",
        lambda **_: (_ for _ in ()).throw(AssertionError("subrecipe update should not run")),
    )
    monkeypatch.setattr(
        delete_article_module,
        "recompute_recipe_margins",
        lambda **_: (_ for _ in ()).throw(AssertionError("margins update should not run")),
    )

    result = delete_article_module.delete_article(
        establishment_id=est_id,
        invoice_id=uuid4(),
        invoice_date=date(2023, 3, 1),
        master_article_id=master_id,
        supplier_id=uuid4(),
        id_article_to_delete=article_id,
    )

    assert fake_services.master_articles_service.get_master_articles_by_id(master_id) is None
    assert fake_services.articles_service.get_articles_by_id(article_id) is None
    assert fake_services.ingredients_service.get_ingredients_by_id(ing["id"]) is None
    assert fake_services.history_ingredients_service.get_all_history_ingredients({}) == []
    assert fake_services.recipes_service.get_recipes_by_id(recipe_id) is None
    assert fake_services.history_recipes_service.get_all_history_recipes({}) == []
    assert result["deleted_master_article"] is True
    assert result["impacted_recipes"] == set()
    assert recipe_id in result["deleted_recipes"]


def test_delete_article_updates_master_and_cascades(monkeypatch):
    fake_db.reset_db()

    est_id = uuid4()
    master_id = uuid4()
    supplier_id = uuid4()
    article_to_delete = uuid4()
    article_to_keep = uuid4()
    recipe_id = uuid4()
    parent_recipe_id = uuid4()

    fake_db.create_master_articles(
        {
            "id": master_id,
            "establishment_id": est_id,
            "unit": "KG",
            "current_unit_price": Decimal("5.00"),
        }
    )

    fake_db.create_articles(
        {
            "id": article_to_delete,
            "master_article_id": master_id,
            "establishment_id": est_id,
            "supplier_id": supplier_id,
            "date": date(2023, 1, 1),
            "unit_price": Decimal("5.00"),
        }
    )
    fake_db.create_articles(
        {
            "id": article_to_keep,
            "master_article_id": master_id,
            "establishment_id": est_id,
            "supplier_id": supplier_id,
            "date": date(2023, 2, 1),
            "unit_price": Decimal("6.00"),
        }
    )

    ing = fake_db.create_ingredients(
        {
            "establishment_id": est_id,
            "master_article_id": master_id,
            "recipe_id": recipe_id,
            "type": "ARTICLE",
            "quantity": Decimal("2"),
            "percentage_loss": Decimal("10"),
        }
    )
    fake_db.create_history_ingredients(
        {
            "ingredient_id": ing["id"],
            "establishment_id": est_id,
            "source_article_id": article_to_delete,
            "gross_unit_price": Decimal("5.00"),
            "date": date(2023, 1, 1),
        }
    )
    remaining_history = fake_db.create_history_ingredients(
        {
            "ingredient_id": ing["id"],
            "establishment_id": est_id,
            "source_article_id": article_to_keep,
            "gross_unit_price": Decimal("6.00"),
            "date": date(2023, 2, 1),
        }
    )

    fake_db.create_recipes({"id": recipe_id, "establishment_id": est_id, "portion": Decimal("4")})

    sub_ing = fake_db.create_ingredients(
        {
            "establishment_id": est_id,
            "type": "SUBRECIPES",
            "recipe_id": parent_recipe_id,
            "subrecipes_id": recipe_id,
        }
    )
    fake_db.create_recipes(
        {"id": parent_recipe_id, "establishment_id": est_id, "portion": Decimal("6")}
    )

    recipe_updates = []
    subrecipe_updates = []
    margin_updates = []

    monkeypatch.setattr(
        delete_article_module,
        "update_recipes_and_history_recipes",
        lambda **kwargs: recipe_updates.append(kwargs),
    )
    monkeypatch.setattr(
        delete_article_module,
        "update_ingredients_and_history_ingredients",
        lambda **kwargs: subrecipe_updates.append(kwargs),
    )
    monkeypatch.setattr(
        delete_article_module, "recompute_recipe_margins", lambda **kwargs: margin_updates.append(kwargs)
    )

    invoice_id = uuid4()
    result = delete_article_module.delete_article(
        establishment_id=est_id,
        invoice_id=invoice_id,
        invoice_date=date(2023, 3, 1),
        master_article_id=master_id,
        supplier_id=supplier_id,
        id_article_to_delete=article_to_delete,
    )

    master = fake_services.master_articles_service.get_master_articles_by_id(master_id)
    assert master["current_unit_price"] == Decimal("6.00")

    histories = fake_services.history_ingredients_service.get_all_history_ingredients(
        {"ingredient_id": ing["id"], "establishment_id": est_id}
    )
    assert len(histories) == 1
    latest = histories[0]
    assert latest["id"] == remaining_history["id"]
    assert latest["quantity"] == Decimal("2")
    assert latest["percentage_loss"] == Decimal("10")
    assert latest["unit_cost"] == Decimal("13.2")
    assert latest["loss_value"] == Decimal("1.2")
    assert latest["unit_cost_per_portion_recipe"] == Decimal("3.3")

    updated_ing = fake_services.ingredients_service.get_ingredients_by_id(ing["id"])
    assert updated_ing["unit_cost"] == Decimal("13.2")
    assert updated_ing["gross_unit_price"] == Decimal("6.00")
    assert updated_ing["loss_value"] == Decimal("1.2")
    assert updated_ing["unit_cost_per_portion_recipe"] == Decimal("3.3")

    assert {frozenset(call["recipe_ids"]) for call in recipe_updates} == {
        frozenset({recipe_id}),
        frozenset({parent_recipe_id}),
    }
    assert subrecipe_updates == [
        {
            "establishment_id": est_id,
            "ingredient_ids": [sub_ing["id"]],
            "trigger": "import",
            "target_date": date(2023, 3, 1),
            "invoice_id": invoice_id,
        }
    ]

    assert margin_updates and margin_updates[0]["establishment_id"] == est_id
    assert set(margin_updates[0]["recipe_ids"]) == {recipe_id, parent_recipe_id}
    assert margin_updates[0]["target_date"] == date(2023, 3, 1)

    assert result["deleted_master_article"] is False
    assert result["deleted_recipes"] == set()
    assert result["impacted_recipes"] == {recipe_id, parent_recipe_id}

    # Ensure the deleted article is gone but the other one stays
    assert fake_services.articles_service.get_articles_by_id(article_to_delete) is None
    assert fake_services.articles_service.get_articles_by_id(article_to_keep) is not None
