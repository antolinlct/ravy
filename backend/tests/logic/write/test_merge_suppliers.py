import sys
from uuid import uuid4

import pytest

from tests.fixtures import fake_db, fake_services

# Redirection vers l'environnement sandbox pour tous les services
sys.modules["app.services"] = fake_services

from app.logic.write.merge_suppliers import LogicError, merge_suppliers


def test_rejects_non_accepted_merge_request():
    fake_db.reset_db()

    req = fake_db.create_supplier_merge_request(
        {
            "status": "pending",
            "source_market_supplier_ids": {"ids": [uuid4()]},
            "target_market_supplier_id": uuid4(),
        }
    )

    with pytest.raises(LogicError):
        merge_suppliers(merge_request_id=req["id"])


def test_full_merge_workflow_updates_public_and_private_data():
    fake_db.reset_db()

    target_market_supplier = uuid4()
    source_market_supplier_a = uuid4()
    source_market_supplier_b = uuid4()

    merge_request = fake_db.create_supplier_merge_request(
        {
            "id": uuid4(),
            "status": "accepted",
            "source_market_supplier_ids": {"ids": [source_market_supplier_a, source_market_supplier_b]},
            "target_market_supplier_id": target_market_supplier,
        }
    )

    # === MARKET LAYER ===
    target_market_master = fake_db.create_market_master_articles(
        {
            "id": uuid4(),
            "market_supplier_id": target_market_supplier,
            "unformatted_name": "TOMATE",
        }
    )
    source_market_master_dupe = fake_db.create_market_master_articles(
        {
            "id": uuid4(),
            "market_supplier_id": source_market_supplier_a,
            "unformatted_name": "TOMATE",
        }
    )
    source_market_master_unique = fake_db.create_market_master_articles(
        {
            "id": uuid4(),
            "market_supplier_id": source_market_supplier_a,
            "unformatted_name": "BASILIC",
        }
    )
    source_market_master_second = fake_db.create_market_master_articles(
        {
            "id": uuid4(),
            "market_supplier_id": source_market_supplier_b,
            "unformatted_name": "MOZZA",
        }
    )

    fake_db.create_market_articles(
        {
            "id": uuid4(),
            "market_master_article_id": source_market_master_dupe["id"],
            "market_supplier_id": source_market_supplier_a,
        }
    )
    dupe_article_second = fake_db.create_market_articles(
        {
            "id": uuid4(),
            "market_master_article_id": source_market_master_second["id"],
            "market_supplier_id": source_market_supplier_b,
        }
    )
    unique_article = fake_db.create_market_articles(
        {
            "id": uuid4(),
            "market_master_article_id": source_market_master_unique["id"],
            "market_supplier_id": source_market_supplier_a,
        }
    )

    fake_db.create_market_supplier_alias(
        {
            "id": uuid4(),
            "supplier_market_id": source_market_supplier_a,
            "alias": "Alias Source",
        }
    )

    # === PRIVATE LAYER — ESTABLISHMENT 1 (TARGET ALREADY EXISTS) ===
    est1 = fake_db.create_establishments({"id": uuid4(), "name": "EST1"})

    target_supplier_est1 = fake_db.create_suppliers(
        {
            "id": uuid4(),
            "establishment_id": est1["id"],
            "market_supplier_id": target_market_supplier,
        }
    )
    source_supplier_est1 = fake_db.create_suppliers(
        {
            "id": uuid4(),
            "establishment_id": est1["id"],
            "market_supplier_id": source_market_supplier_a,
        }
    )

    master_dup_est1 = fake_db.create_master_articles(
        {
            "id": uuid4(),
            "supplier_id": source_supplier_est1["id"],
            "market_master_article_id": source_market_master_dupe["id"],
            "unformatted_name": "TOMATE",
        }
    )
    master_unique_est1 = fake_db.create_master_articles(
        {
            "id": uuid4(),
            "supplier_id": source_supplier_est1["id"],
            "market_master_article_id": source_market_master_unique["id"],
            "unformatted_name": "BASILIC",
        }
    )

    article_dup_est1 = fake_db.create_articles(
        {
            "id": uuid4(),
            "supplier_id": source_supplier_est1["id"],
            "master_article_id": master_dup_est1["id"],
        }
    )
    fake_db.create_articles(
        {
            "id": uuid4(),
            "supplier_id": source_supplier_est1["id"],
            "master_article_id": master_unique_est1["id"],
        }
    )

    ingredient_dup = fake_db.create_ingredients(
        {
            "id": uuid4(),
            "establishment_id": est1["id"],
            "type": "ARTICLE",
            "master_article_id": master_dup_est1["id"],
        }
    )
    fake_db.create_history_ingredients(
        {
            "id": uuid4(),
            "ingredient_id": ingredient_dup["id"],
            "master_article_id": master_dup_est1["id"],
        }
    )
    fake_db.create_financial_ingredients(
        {
            "id": uuid4(),
            "establishment_id": est1["id"],
            "master_article_id": master_dup_est1["id"],
        }
    )
    fake_db.create_variations(
        {
            "id": uuid4(),
            "establishment_id": est1["id"],
            "master_article_id": master_dup_est1["id"],
            "is_deleted": False,
        }
    )
    fake_db.create_invoices(
        {
            "id": uuid4(),
            "supplier_id": source_supplier_est1["id"],
        }
    )

    # === PRIVATE LAYER — ESTABLISHMENT 2 (NO TARGET SUPPLIER) ===
    est2 = fake_db.create_establishments({"id": uuid4(), "name": "EST2"})

    supplier_est2_primary = fake_db.create_suppliers(
        {
            "id": uuid4(),
            "establishment_id": est2["id"],
            "market_supplier_id": source_market_supplier_b,
        }
    )
    supplier_est2_secondary = fake_db.create_suppliers(
        {
            "id": uuid4(),
            "establishment_id": est2["id"],
            "market_supplier_id": source_market_supplier_a,
        }
    )

    master_primary_est2 = fake_db.create_master_articles(
        {
            "id": uuid4(),
            "supplier_id": supplier_est2_primary["id"],
            "market_master_article_id": source_market_master_second["id"],
            "unformatted_name": "MOZZA",
        }
    )
    master_secondary_est2 = fake_db.create_master_articles(
        {
            "id": uuid4(),
            "supplier_id": supplier_est2_secondary["id"],
            "market_master_article_id": source_market_master_dupe["id"],
            "unformatted_name": "MOZZA",
        }
    )
    fake_db.create_articles(
        {
            "id": uuid4(),
            "supplier_id": supplier_est2_secondary["id"],
            "master_article_id": master_secondary_est2["id"],
        }
    )
    fake_db.create_ingredients(
        {
            "id": uuid4(),
            "establishment_id": est2["id"],
            "type": "ARTICLE",
            "master_article_id": master_secondary_est2["id"],
        }
    )

    summary = merge_suppliers(merge_request_id=merge_request["id"])

    # === Assertions marché ===
    assert all(
        ma["market_supplier_id"] == target_market_supplier
        for ma in fake_db.DB["market_articles"]
    )
    assert target_market_master["id"] in [
        mma["id"] for mma in fake_db.DB["market_master_articles"]
    ]
    assert source_market_master_dupe["id"] not in [
        mma["id"] for mma in fake_db.DB["market_master_articles"]
    ]
    # les articles du master supprimé sont remappés vers le master cible
    assert all(
        art["market_master_article_id"] != source_market_master_dupe["id"]
        for art in fake_db.DB["market_articles"]
    )
    assert all(
        alias["supplier_market_id"] == target_market_supplier
        for alias in fake_db.DB["market_supplier_alias"]
    )

    # === Assertions établissement 1 ===
    assert target_supplier_est1 in fake_db.DB["suppliers"]
    assert source_supplier_est1 not in fake_db.DB["suppliers"]

    remaining_master_ids_est1 = [
        ma["id"]
        for ma in fake_db.DB["master_articles"]
        if ma["supplier_id"] == target_supplier_est1["id"]
    ]
    assert master_dup_est1["id"] in remaining_master_ids_est1
    assert master_unique_est1["id"] in remaining_master_ids_est1
    master_unique_updated = next(
        ma for ma in fake_db.DB["master_articles"] if ma["id"] == master_unique_est1["id"]
    )
    assert master_unique_updated["supplier_id"] == target_supplier_est1["id"]
    assert master_unique_updated["market_master_article_id"] == source_market_master_unique["id"]

    for article in fake_db.DB["articles"]:
        if article["master_article_id"] in remaining_master_ids_est1:
            assert article["supplier_id"] == target_supplier_est1["id"]

    # Ingredients & historiques remappés
    for ingredient in fake_db.DB["ingredients"]:
        assert ingredient["master_article_id"] not in summary["master_article_deleted_ids"]
    for history in fake_db.DB["history_ingredients"]:
        assert history["master_article_id"] not in summary["master_article_deleted_ids"]

    # Variations soft-deleted pour les master supprimés
    for variation in fake_db.DB["variations"]:
        if variation["master_article_id"] in summary["master_article_deleted_ids"]:
            assert variation["is_deleted"] is True
        else:
            assert variation["is_deleted"] is False

    # Factures ré-assignées
    assert all(inv["supplier_id"] == target_supplier_est1["id"] for inv in fake_db.DB["invoices"])

    # === Assertions établissement 2 ===
    suppliers_est2 = [s for s in fake_db.DB["suppliers"] if s["establishment_id"] == est2["id"]]
    assert len(suppliers_est2) == 1
    assert suppliers_est2[0]["market_supplier_id"] == target_market_supplier
    assert suppliers_est2[0]["id"] in {supplier_est2_primary["id"], supplier_est2_secondary["id"]}
    for article in fake_db.DB["articles"]:
        if article["master_article_id"] == master_primary_est2["id"]:
            assert article["supplier_id"] == suppliers_est2[0]["id"]

    remaining_master_ids = {ma["id"] for ma in fake_db.DB["master_articles"]}
    assert len({master_primary_est2["id"], master_secondary_est2["id"]} & remaining_master_ids) == 1
    assert set(summary["processed_establishments"]) == {est1["id"], est2["id"]}
    assert not summary["skipped_establishments"]
