from fastapi import APIRouter, HTTPException
from app.schemas.regex_patterns import RegexPatterns
from app.services import regex_patterns_service

router = APIRouter(prefix="/regex_patterns", tags=["RegexPatterns"])

@router.get("/", response_model=list[RegexPatterns])
def list_regex_patterns(
    order_by: str | None = None,
    direction: str | None = None,
    limit: int | None = None,
    establishment_id: str | None = None,
    supplier_id: str | None = None,
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "establishment_id": establishment_id,
        "supplier_id": supplier_id,
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return regex_patterns_service.get_all_regex_patterns(filters)

@router.get("/{id}", response_model=RegexPatterns)
def get_regex_patterns(id: int):
    item = regex_patterns_service.get_regex_patterns_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="RegexPatterns not found")
    return item

@router.post("/", response_model=RegexPatterns)
def create_regex_patterns(data: RegexPatterns):
    created = regex_patterns_service.create_regex_patterns(data.dict())
    return RegexPatterns(**created)

@router.patch("/{id}", response_model=RegexPatterns)
def update_regex_patterns(id: int, data: RegexPatterns):
    updated = regex_patterns_service.update_regex_patterns(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="RegexPatterns not found")
    return RegexPatterns(**updated)

@router.delete("/{id}")
def delete_regex_patterns(id: int):
    regex_patterns_service.delete_regex_patterns(id)
    return {"deleted": True}
