from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.regex_patterns import RegexPatterns
from app.services import regex_patterns_service

router = APIRouter(prefix="/regex_patterns", tags=["RegexPatterns"])

@router.get("/", response_model=list[RegexPatterns])
def list_regex_patterns(
    order_by: Optional[str] = None,
    direction: Optional[str] = None,
    limit: Optional[int] = 200,
    page: Optional[int] = 1
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return regex_patterns_service.get_all_regex_patterns(filters, limit=limit, page=page)

@router.get("/{id}", response_model=RegexPatterns)
def get_regex_patterns(id: UUID):
    item = regex_patterns_service.get_regex_patterns_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="RegexPatterns not found")
    return item

@router.post("/", response_model=RegexPatterns)
def create_regex_patterns(data: RegexPatterns):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = regex_patterns_service.create_regex_patterns(payload)
    return RegexPatterns(**created)

@router.patch("/{id}", response_model=RegexPatterns)
def update_regex_patterns(id: UUID, data: RegexPatterns):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = regex_patterns_service.update_regex_patterns(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="RegexPatterns not found")
    return RegexPatterns(**updated)

@router.delete("/{id}")
def delete_regex_patterns(id: UUID):
    regex_patterns_service.delete_regex_patterns(id)
    return {"deleted": True}
