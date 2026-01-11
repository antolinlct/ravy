from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.stripe_webhook_events import StripeWebhookEvents
from app.services import stripe_webhook_events_service

router = APIRouter(prefix="/stripe_webhook_events", tags=["StripeWebhookEvents"])

@router.get("/", response_model=list[StripeWebhookEvents])
def list_stripe_webhook_events(
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
    return stripe_webhook_events_service.get_all_stripe_webhook_events(filters, limit=limit, page=page)

@router.get("/{id}", response_model=StripeWebhookEvents)
def get_stripe_webhook_events(id: UUID):
    item = stripe_webhook_events_service.get_stripe_webhook_events_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="StripeWebhookEvents not found")
    return item

@router.post("/", response_model=StripeWebhookEvents)
def create_stripe_webhook_events(data: StripeWebhookEvents):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = stripe_webhook_events_service.create_stripe_webhook_events(payload)
    return StripeWebhookEvents(**created)

@router.patch("/{id}", response_model=StripeWebhookEvents)
def update_stripe_webhook_events(id: UUID, data: StripeWebhookEvents):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = stripe_webhook_events_service.update_stripe_webhook_events(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="StripeWebhookEvents not found")
    return StripeWebhookEvents(**updated)

@router.delete("/{id}")
def delete_stripe_webhook_events(id: UUID):
    stripe_webhook_events_service.delete_stripe_webhook_events(id)
    return {"deleted": True}
