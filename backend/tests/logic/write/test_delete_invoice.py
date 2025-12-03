import sys
from datetime import date
from decimal import Decimal
from uuid import uuid4

from tests.fixtures import fake_db, fake_services

# Redirect app.services to sandbox services
sys.modules["app.services"] = fake_services

from app.logic.write import delete_invoice as delete_invoice_module


def test_delete_invoice_removes_supplier_and_all_cascades(monkeypatch):
    fake_db.reset_db()

    est_id = uuid4()
    supplier_id = uuid4()
    invoice_id = uuid4()
    master_id = uuid4()
    recipe_id = uuid4()
    parent_recipe_id = uuid4()

    fake_db.create_suppliers({"id": supplier_id})
    fake_db.create_supplier_alias(
        {
            "establishment_id": est_id,
            "supplier_id": supplier_id,
            "alias": "ACME",
        }
    )
    fake_db.create_invoices({"id": invoice_id, "establishment_id": est_id})

    article_id = uuid4()
    fake_db.create_master_articles(
        {
            "id": master_id,
            "establishment_id": est_id,
            "current_unit_price": Decimal("4.00"),
        }
    )
    fake_db.create_articles(
        {
            "id": article_id,
            "master_article_id": master_id,
            "establishment_id": est_id,
            "invoice_id": invoice_id,
            "supplier_id": supplier_id,
            "date": date(2023, 1, 1),
            "unit_price": Decimal("4.00"),
        }
    )

    ing = fake_db.create_ingredients(
        {
            "establishment_id": est_id,
            "master_article_id": master_id,
            "recipe_id": recipe_id,
            "type": "ARTICLE",
            "quantity": Decimal("1.5"),
            "percentage_loss": Decimal("5"),
        }
    )
    fake_db.create_history_ingredients(
        {
            "ingredient_id": ing["id"],
            "establishment_id": est_id,
            "source_article_id": article_id,
            "gross_unit_price": Decimal("4.00"),
            "quantity": Decimal("1.5"),
            "percentage_loss": Decimal("5"),
            "date": date(2023, 1, 1),
        }
    )

    fake_db.create_recipes({"id": recipe_id, "establishment_id": est_id, "portion": Decimal("2")})
    fake_db.create_history_recipes(
        {"recipe_id": recipe_id, "establishment_id": est_id, "date": date(2023, 1, 1)}
    )

    sub_ing = fake_db.create_ingredients(
        {
            "establishment_id": est_id,
            "type": "SUBRECIPES",
            "recipe_id": parent_recipe_id,
            "subrecipes_id": recipe_id,
        }
    )
    fake_db.create_history_ingredients(
        {
            "ingredient_id": sub_ing["id"],
            "establishment_id": est_id,
            "date": date(2023, 1, 1),
        }
    )
    fake_db.create_recipes({"id": parent_recipe_id, "establishment_id": est_id, "portion": Decimal("4")})
    fake_db.create_history_recipes(
        {
            "recipe_id": parent_recipe_id,
            "establishment_id": est_id,
            "date": date(2023, 1, 2),
        }
    )

    monkeypatch.setattr(
        delete_invoice_module,
        "update_recipes_and_history_recipes",
        lambda **_: (_ for _ in ()).throw(AssertionError("recipe updates should not run")),
    )
    monkeypatch.setattr(
        delete_invoice_module,
        "update_ingredients_and_history_ingredients",
        lambda **_: (_ for _ in ()).throw(AssertionError("subrecipe updates should not run")),
    )
    monkeypatch.setattr(
        delete_invoice_module,
        "recompute_recipe_margins",
        lambda **_: (_ for _ in ()).throw(AssertionError("margin updates should not run")),
    )

    result = delete_invoice_module.delete_invoice(
        establishment_id=est_id,
        invoice_to_delete_id=invoice_id,
        invoice_to_delete_date=date(2023, 2, 1),
        supplier_id=supplier_id,
    )

    assert fake_services.master_articles_service.get_master_articles_by_id(master_id) is None
    assert fake_services.articles_service.get_articles_by_id(article_id) is None
    assert fake_services.suppliers_service.get_suppliers_by_id(supplier_id) is None
    assert fake_services.supplier_alias_service.get_all_supplier_alias({}) == []

    assert fake_services.ingredients_service.get_ingredients_by_id(ing["id"]) is None
    assert fake_services.history_ingredients_service.get_all_history_ingredients({}) == []

    assert fake_services.recipes_service.get_recipes_by_id(recipe_id) is None
    assert fake_services.recipes_service.get_recipes_by_id(parent_recipe_id) is None
    assert fake_services.history_recipes_service.get_all_history_recipes({}) == []

    assert fake_services.invoices_service.get_invoices_by_id(invoice_id) is None

    assert master_id in result["deleted_master_articles"]
    assert result["deleted_supplier"] is True
    assert recipe_id in result["deleted_recipes"] and parent_recipe_id in result["deleted_recipes"]
    assert result["updated_recipes"] == set()


def test_delete_invoice_updates_and_cleans_dependents(monkeypatch):
    fake_db.reset_db()

    est_id = uuid4()
    supplier_id = uuid4()
    invoice_id = uuid4()
    other_invoice_id = uuid4()

    master_keep = uuid4()
    master_drop = uuid4()

    recipe_keep = uuid4()
    recipe_drop = uuid4()
    parent_keep = uuid4()
    parent_drop = uuid4()

    fake_db.create_suppliers({"id": supplier_id})
    fake_db.create_supplier_alias(
        {"establishment_id": est_id, "supplier_id": supplier_id, "alias": "Alias"}
    )
    fake_db.create_invoices({"id": invoice_id, "establishment_id": est_id})
    fake_db.create_invoices({"id": other_invoice_id, "establishment_id": est_id})

    article_delete = uuid4()
    article_keep = uuid4()
    article_drop = uuid4()

    fake_db.create_master_articles(
        {"id": master_keep, "establishment_id": est_id, "current_unit_price": Decimal("5.00")}
    )
    fake_db.create_master_articles(
        {"id": master_drop, "establishment_id": est_id, "current_unit_price": Decimal("8.00")}
    )

    fake_db.create_articles(
        {
            "id": article_delete,
            "master_article_id": master_keep,
            "establishment_id": est_id,
            "invoice_id": invoice_id,
            "supplier_id": supplier_id,
            "date": date(2023, 1, 1),
            "unit_price": Decimal("5.00"),
        }
    )
    fake_db.create_articles(
        {
            "id": article_keep,
            "master_article_id": master_keep,
            "establishment_id": est_id,
            "invoice_id": other_invoice_id,
            "supplier_id": supplier_id,
            "date": date(2023, 2, 1),
            "unit_price": Decimal("6.00"),
        }
    )
    fake_db.create_articles(
        {
            "id": article_drop,
            "master_article_id": master_drop,
            "establishment_id": est_id,
            "invoice_id": invoice_id,
            "supplier_id": supplier_id,
            "date": date(2023, 1, 5),
            "unit_price": Decimal("8.00"),
        }
    )

    ing_keep = fake_db.create_ingredients(
        {
            "establishment_id": est_id,
            "master_article_id": master_keep,
            "recipe_id": recipe_keep,
            "type": "ARTICLE",
            "quantity": Decimal("2"),
            "percentage_loss": Decimal("10"),
        }
    )
    fake_db.create_history_ingredients(
        {
            "ingredient_id": ing_keep["id"],
            "establishment_id": est_id,
            "source_article_id": article_delete,
            "gross_unit_price": Decimal("5.00"),
            "date": date(2023, 1, 1),
        }
    )
    remaining_history = fake_db.create_history_ingredients(
        {
            "ingredient_id": ing_keep["id"],
            "establishment_id": est_id,
            "source_article_id": article_keep,
            "gross_unit_price": Decimal("6.00"),
            "date": date(2023, 2, 1),
        }
    )

    ing_drop = fake_db.create_ingredients(
        {
            "establishment_id": est_id,
            "master_article_id": master_drop,
            "recipe_id": recipe_drop,
            "type": "ARTICLE",
            "quantity": Decimal("1"),
            "percentage_loss": Decimal("0"),
        }
    )
    fake_db.create_history_ingredients(
        {
            "ingredient_id": ing_drop["id"],
            "establishment_id": est_id,
            "source_article_id": article_drop,
            "gross_unit_price": Decimal("8.00"),
            "date": date(2023, 1, 5),
        }
    )

    fake_db.create_recipes({"id": recipe_keep, "establishment_id": est_id, "portion": Decimal("4")})
    fake_db.create_history_recipes(
        {"recipe_id": recipe_keep, "establishment_id": est_id, "date": date(2023, 1, 1)}
    )

    fake_db.create_recipes({"id": recipe_drop, "establishment_id": est_id, "portion": Decimal("3")})
    fake_db.create_history_recipes(
        {"recipe_id": recipe_drop, "establishment_id": est_id, "date": date(2023, 1, 5)}
    )

    sub_keep = fake_db.create_ingredients(
        {
            "establishment_id": est_id,
            "type": "SUBRECIPES",
            "recipe_id": parent_keep,
            "subrecipes_id": recipe_keep,
        }
    )
    fake_db.create_history_ingredients(
        {"ingredient_id": sub_keep["id"], "establishment_id": est_id, "date": date(2023, 2, 1)}
    )

    sub_drop = fake_db.create_ingredients(
        {
            "establishment_id": est_id,
            "type": "SUBRECIPES",
            "recipe_id": parent_drop,
            "subrecipes_id": recipe_drop,
        }
    )
    fake_db.create_history_ingredients(
        {"ingredient_id": sub_drop["id"], "establishment_id": est_id, "date": date(2023, 2, 2)}
    )

    fake_db.create_recipes({"id": parent_keep, "establishment_id": est_id, "portion": Decimal("6")})
    fake_db.create_history_recipes(
        {"recipe_id": parent_keep, "establishment_id": est_id, "date": date(2023, 2, 2)}
    )

    fake_db.create_recipes({"id": parent_drop, "establishment_id": est_id, "portion": Decimal("5")})
    fake_db.create_history_recipes(
        {"recipe_id": parent_drop, "establishment_id": est_id, "date": date(2023, 2, 3)}
    )

    recipe_updates = []
    subrecipe_updates = []
    margin_updates = []

    monkeypatch.setattr(
        delete_invoice_module,
        "update_recipes_and_history_recipes",
        lambda **kwargs: recipe_updates.append(kwargs),
    )
    monkeypatch.setattr(
        delete_invoice_module,
        "update_ingredients_and_history_ingredients",
        lambda **kwargs: subrecipe_updates.append(kwargs),
    )
    monkeypatch.setattr(
        delete_invoice_module,
        "recompute_recipe_margins",
        lambda **kwargs: margin_updates.append(kwargs),
    )

    result = delete_invoice_module.delete_invoice(
        establishment_id=est_id,
        invoice_to_delete_id=invoice_id,
        invoice_to_delete_date=date(2023, 3, 1),
        supplier_id=supplier_id,
    )

    master_keep_payload = fake_services.master_articles_service.get_master_articles_by_id(master_keep)
    assert master_keep_payload["current_unit_price"] == Decimal("6.00")
    assert fake_services.master_articles_service.get_master_articles_by_id(master_drop) is None

    histories_keep = fake_services.history_ingredients_service.get_all_history_ingredients(
        {"ingredient_id": ing_keep["id"], "establishment_id": est_id}
    )
    assert len(histories_keep) == 1
    latest = histories_keep[0]
    assert latest["id"] == remaining_history["id"]
    assert latest["quantity"] == Decimal("2")
    assert latest["percentage_loss"] == Decimal("10")
    assert latest["unit_cost"] == Decimal("13.2")
    assert latest["loss_value"] == Decimal("1.2")
    assert latest["unit_cost_per_portion_recipe"] == Decimal("3.3")

    updated_ing = fake_services.ingredients_service.get_ingredients_by_id(ing_keep["id"])
    assert updated_ing["unit_cost"] == Decimal("13.2")
    assert updated_ing["gross_unit_price"] == Decimal("6.00")
    assert updated_ing["loss_value"] == Decimal("1.2")
    assert updated_ing["unit_cost_per_portion_recipe"] == Decimal("3.3")

    assert fake_services.ingredients_service.get_ingredients_by_id(ing_drop["id"]) is None
    assert fake_services.history_ingredients_service.get_all_history_ingredients(
        {"ingredient_id": ing_drop["id"], "establishment_id": est_id}
    ) == []

    assert fake_services.recipes_service.get_recipes_by_id(recipe_keep) is not None
    assert fake_services.recipes_service.get_recipes_by_id(recipe_drop) is None

    assert fake_services.ingredients_service.get_ingredients_by_id(sub_keep["id"]) is not None
    assert fake_services.ingredients_service.get_ingredients_by_id(sub_drop["id"]) is None

    assert fake_services.recipes_service.get_recipes_by_id(parent_keep) is not None
    assert fake_services.recipes_service.get_recipes_by_id(parent_drop) is None

    assert {frozenset(call["recipe_ids"]) for call in recipe_updates} == {
        frozenset({recipe_keep}),
        frozenset({parent_keep}),
    }
    assert subrecipe_updates == [
        {
            "establishment_id": est_id,
            "ingredient_ids": [sub_keep["id"]],
            "trigger": "import",
            "target_date": date(2023, 3, 1),
            "invoice_id": invoice_id,
        }
    ]

    assert margin_updates and set(margin_updates[0]["recipe_ids"]) == {recipe_keep, parent_keep}
    assert margin_updates[0]["target_date"] == date(2023, 3, 1)

    assert fake_services.suppliers_service.get_suppliers_by_id(supplier_id) is not None
    assert fake_services.supplier_alias_service.get_all_supplier_alias({})

    assert fake_services.articles_service.get_articles_by_id(article_delete) is None
    assert fake_services.articles_service.get_articles_by_id(article_drop) is None
    assert fake_services.articles_service.get_articles_by_id(article_keep) is not None

    assert fake_services.invoices_service.get_invoices_by_id(invoice_id) is None
    assert fake_services.invoices_service.get_invoices_by_id(other_invoice_id) is not None

    assert master_drop in result["deleted_master_articles"] and master_keep not in result["deleted_master_articles"]
    assert recipe_drop in result["deleted_recipes"] and parent_drop in result["deleted_recipes"]
    assert result["deleted_supplier"] is False
    assert result["updated_recipes"] == {recipe_keep, parent_keep}
