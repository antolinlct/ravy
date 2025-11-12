from fastapi import APIRouter, HTTPException
from app.schemas.master_articles import MasterArticles
from app.services import master_articles_service

router = APIRouter(prefix="/master_articles", tags=["MasterArticles"])

@router.get("/", response_model=list[MasterArticles])
def list_master_articles(
    order_by: str | None = None,
    direction: str | None = None,
    limit: int | None = 200,
    page: int | None = 1,
    establishment_id: str | None = None
    supplier_id: str | None = None
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page, "establishment_id": establishment_id, "supplier_id": supplier_id
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return master_articles_service.get_all_master_articles(filters, limit=limit, page=page)

@router.get("/{id}", response_model=MasterArticles)
def get_master_articles(id: int):
    item = master_articles_service.get_master_articles_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="MasterArticles not found")
    return item

@router.post("/", response_model=MasterArticles)
def create_master_articles(data: MasterArticles):
    created = master_articles_service.create_master_articles(data.dict())
    return MasterArticles(**created)

@router.patch("/{id}", response_model=MasterArticles)
def update_master_articles(id: int, data: MasterArticles):
    updated = master_articles_service.update_master_articles(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="MasterArticles not found")
    return MasterArticles(**updated)

@router.delete("/{id}")
def delete_master_articles(id: int):
    master_articles_service.delete_master_articles(id)
    return {"deleted": True}
