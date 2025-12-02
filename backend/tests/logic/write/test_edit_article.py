import sys
from datetime import date
from decimal import Decimal
from uuid import uuid4

from tests.fixtures import fake_db, fake_services

# Redirect app.services to sandbox services
sys.modules["app.services"] = fake_services

from app.logic.write import edit_article as edit_article_module


def test_no_price_change_stops_after_master_article(monkeypatch):
    fake_db.reset_db()

    est_id = uuid4()
    master_id = uuid4()
    article_id = uuid4()

    fake_db.create_master_articles(
        {
            "id": master_id,
            "establishment_id": est_id,
            "unit": "KG",
            "current_unit_price": Decimal("4.20"),
        }
    )
    fake_db.create_articles(
        {
            "id": article_id,
            "master_article_id": master_id,
            "establishment_id": est_id,
            "date": date(2023, 3, 1),
            "unit_price": Decimal("4.20"),
            "unit": "KG",
        }
    )

    # Ensure cascade functions are not called when price is unchanged
    monkeypatch.setattr(
        edit_article_module,
        "update_recipes_and_history_recipes",
        lambda **_: (_ for _ in ()).throw(AssertionError("recipes cascade should not run")),
    )
    monkeypatch.setattr(
        edit_article_module,
        "update_ingredients_and_history_ingredients",
        lambda **_: (_ for _ in ()).throw(AssertionError("ingredients cascade should not run")),
    )
    monkeypatch.setattr(
        edit_article_module,
        "recompute_recipe_margins",
        lambda **_: (_ for _ in ()).throw(AssertionError("margins cascade should not run")),
    )

    result = edit_article_module.edit_article(
        establishment_id=est_id,
        invoice_id=uuid4(),
        master_article_id=master_id,
        invoice_date=date(2023, 3, 2),
        article_id=article_id,
        article_unit="P",
        article_quantity="5",
        article_new_unit_price="4.20",
        article_old_unit_price=Decimal("4.20"),
        article_total="21",
        article_discounts="0",
        article_duties_and_taxes="0",
    )

    updated_article = fake_services.articles_service.get_articles_by_id(article_id)
    updated_master = fake_services.master_articles_service.get_master_articles_by_id(master_id)

    assert updated_article["unit"] == "P"
    assert updated_article["unit_price"] == Decimal("4.20")
    assert updated_master["unit"] == "P"
    assert updated_master["current_unit_price"] == Decimal("4.20")
    assert result["impacted_recipes"] == set()
    assert result["impacted_ingredients"] == set()


def test_price_change_cascades_to_histories_and_recipes(monkeypatch):
    fake_db.reset_db()

    est_id = uuid4()
    master_id = uuid4()
    invoice_id = uuid4()
    recipe_id = uuid4()
    subrecipe_recipe_id = uuid4()

    # Entities
    fake_db.create_master_articles(
        {
            "id": master_id,
            "establishment_id": est_id,
            "unit": "KG",
            "current_unit_price": Decimal("6.00"),
        }
    )

    # Two articles to check that master article picks most recent price
    old_article = fake_db.create_articles(
        {
            "id": uuid4(),
            "master_article_id": master_id,
            "establishment_id": est_id,
            "date": date(2023, 1, 1),
            "unit_price": Decimal("5.00"),
            "unit": "KG",
        }
    )
    target_article = fake_db.create_articles(
        {
            "id": uuid4(),
            "master_article_id": master_id,
            "establishment_id": est_id,
            "date": date(2023, 2, 1),
            "unit_price": Decimal("6.00"),
            "unit": "KG",
        }
    )

    fake_db.create_recipes(
        {"id": recipe_id, "establishment_id": est_id, "portion": Decimal("4")}
    )
    fake_db.create_recipes(
        {"id": subrecipe_recipe_id, "establishment_id": est_id, "portion": Decimal("8")}
    )

    ingredient = fake_db.create_ingredients(
        {
            "id": uuid4(),
            "recipe_id": recipe_id,
            "type": "ARTICLE",
            "master_article_id": master_id,
            "unit": "KG",
            "quantity": Decimal("3"),
            "unit_cost": Decimal("18"),
            "gross_unit_price": Decimal("6"),
            "percentage_loss": Decimal("5"),
            "loss_value": Decimal("0.9"),
            "unit_cost_per_portion_recipe": Decimal("4.5"),
            "establishment_id": est_id,
        }
    )

    history = fake_db.create_history_ingredients(
        {
            "id": uuid4(),
            "ingredient_id": ingredient["id"],
            "recipe_id": recipe_id,
            "source_article_id": target_article["id"],
            "quantity": Decimal("3"),
            "percentage_loss": Decimal("5"),
            "gross_unit_price": Decimal("6.00"),
            "unit_cost": Decimal("18.90"),
            "loss_value": Decimal("0.90"),
            "unit_cost_per_portion_recipe": Decimal("4.725"),
            "unit": "KG",
            "establishment_id": est_id,
        }
    )

    subrecipe_ingredient = fake_db.create_ingredients(
        {
            "id": uuid4(),
            "recipe_id": subrecipe_recipe_id,
            "type": "SUBRECIPE",
            "subrecipe_id": recipe_id,
            "master_article_id": None,
            "unit": "P",
            "quantity": Decimal("2"),
            "unit_cost": Decimal("9"),
            "gross_unit_price": Decimal("9"),
            "percentage_loss": Decimal("0"),
            "loss_value": Decimal("0"),
            "unit_cost_per_portion_recipe": Decimal("1.125"),
            "establishment_id": est_id,
        }
    )

    calls = {"recipes": [], "ingredients": [], "margins": []}

    def record_recipes(**kwargs):
        calls["recipes"].append(kwargs)

    def record_ingredients(**kwargs):
        calls["ingredients"].append(kwargs)

    def record_margins(**kwargs):
        calls["margins"].append(kwargs)

    monkeypatch.setattr(edit_article_module, "update_recipes_and_history_recipes", record_recipes)
    monkeypatch.setattr(
        edit_article_module, "update_ingredients_and_history_ingredients", record_ingredients
    )
    monkeypatch.setattr(edit_article_module, "recompute_recipe_margins", record_margins)

    result = edit_article_module.edit_article(
        establishment_id=est_id,
        invoice_id=invoice_id,
        master_article_id=master_id,
        invoice_date=date(2023, 2, 15),
        article_id=target_article["id"],
        article_unit="G",
        article_quantity="3",
        article_new_unit_price=Decimal("7.50"),
        article_old_unit_price=Decimal("6.00"),
        article_total="22.5",
        article_discounts="0",
        article_duties_and_taxes="0",
    )

    # Article and master article updated
    updated_article = fake_services.articles_service.get_articles_by_id(target_article["id"])
    updated_master = fake_services.master_articles_service.get_master_articles_by_id(master_id)
    assert updated_article["unit"] == "G"
    assert updated_article["unit_price"] == Decimal("7.50")
    assert updated_master["unit"] == "G"
    assert updated_master["current_unit_price"] == Decimal("7.50")

    # History ingredients recalculated
    refreshed_history = fake_services.history_ingredients_service.get_history_ingredients_by_id(
        history["id"]
    )
    assert refreshed_history["gross_unit_price"] == Decimal("7.50")
    assert refreshed_history["unit_cost"] == Decimal("23.625")
    assert refreshed_history["loss_value"] == Decimal("1.125")
    assert refreshed_history["unit_cost_per_portion_recipe"] == Decimal("5.90625")
    assert refreshed_history["unit"] == "G"

    # Ingredient refreshed from latest history
    refreshed_ingredient = fake_services.ingredients_service.get_ingredients_by_id(ingredient["id"])
    assert refreshed_ingredient["gross_unit_price"] == Decimal("7.50")
    assert refreshed_ingredient["unit_cost"] == Decimal("23.625")
    assert refreshed_ingredient["unit_cost_per_portion_recipe"] == Decimal("5.90625")
    assert refreshed_ingredient["loss_value"] == Decimal("1.125")
    assert refreshed_ingredient["unit"] == "G"

    # Cascades triggered for direct and indirect recipes
    assert calls["recipes"][0]["recipe_ids"] == [recipe_id]
    assert calls["ingredients"][0]["ingredient_ids"] == [subrecipe_ingredient["id"]]
    assert set(calls["recipes"][1]["recipe_ids"]) == {subrecipe_recipe_id}
    assert set(calls["margins"][0]["recipe_ids"]) == {recipe_id, subrecipe_recipe_id}

    # Returned ids are consistent
    assert ingredient["id"] in result["impacted_ingredients"]
    assert subrecipe_ingredient["id"] in result["impacted_ingredients"]
    assert recipe_id in result["impacted_recipes"]
    assert subrecipe_recipe_id in result["impacted_recipes"]
    assert history["id"] in result["updated_history_ingredients"]
