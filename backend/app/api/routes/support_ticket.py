from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.support_ticket import SupportTicket
from app.services import support_ticket_service

router = APIRouter(prefix="/support_ticket", tags=["SupportTicket"])

@router.get("/", response_model=list[SupportTicket])
def list_support_ticket(
    order_by: Optional[str] = None,
    direction: Optional[str] = None,
    limit: Optional[int] = 200,
    page: Optional[int] = 1,
    establishment_id: Optional[str] = None
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page, "establishment_id": establishment_id
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return support_ticket_service.get_all_support_ticket(filters, limit=limit, page=page)

@router.get("/{id}", response_model=SupportTicket)
def get_support_ticket(id: UUID):
    item = support_ticket_service.get_support_ticket_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="SupportTicket not found")
    return item

@router.post("/", response_model=SupportTicket)
def create_support_ticket(data: SupportTicket):
    created = support_ticket_service.create_support_ticket(data.dict())
    return SupportTicket(**created)

@router.patch("/{id}", response_model=SupportTicket)
def update_support_ticket(id: int, data: SupportTicket):
    updated = support_ticket_service.update_support_ticket(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="SupportTicket not found")
    return SupportTicket(**updated)

@router.delete("/{id}")
def delete_support_ticket(id: UUID):
    support_ticket_service.delete_support_ticket(id)
    return {"deleted": True}
