from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
import os
import requests
from app.schemas.support_ticket import SupportTicket
from app.services import support_ticket_service, establishments_service, user_profiles_service
from app.core.supabase_client import supabase


class SupportTicketCreate(SupportTicket):
    user_email: Optional[str] = None

try:
    from app.services.telegram.gordon_service import GordonTelegram

    _telegram_client = GordonTelegram()

    def _notify_ticket(
        message: str,
        file_bytes: Optional[bytes] = None,
        filename: Optional[str] = None,
    ) -> None:
        if file_bytes:
            _telegram_client.send_document(
                file_bytes=file_bytes,
                filename=filename or "ticket",
                caption=message,
            )
            return
        _telegram_client.send_text(message)
except Exception:
    def _notify_ticket(
        message: str,
        file_bytes: Optional[bytes] = None,
        filename: Optional[str] = None,
    ) -> None:
        return


def _safe_get(obj: object, key: str):
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj.get(key)
    return getattr(obj, key, None)


def _download_ticket_file(path: Optional[str]) -> tuple[Optional[bytes], Optional[str]]:
    if not path:
        return None, None
    storage_path = path.replace("tickets/", "", 1)
    filename = storage_path.split("/")[-1] if storage_path else None
    try:
        response = supabase.storage.from_("tickets").download(storage_path)
    except Exception:
        return None, filename
    if isinstance(response, (bytes, bytearray)):
        return bytes(response), filename
    return None, filename


def _send_ticket_email(to_email: Optional[str], ticket_id: str, subject: str) -> None:
    if not to_email:
        return
    api_key = os.getenv("RESEND_API_KEY")
    sender = os.getenv("RESEND_FROM")
    if not api_key or not sender:
        return
    payload = {
        "from": sender,
        "to": [to_email],
        "subject": "Nous avons bien reçu votre ticket.",
        "text": (
            "Votre ticket a bien été reçu et sera traité par notre équipe sous 24h.\n\n"
            f"Objet : {subject}\n"
            f"Numéro : {ticket_id}\n\n"
            "Merci pour votre patience,\n"
            "L’équipe Ravy"
        ),
    }
    reply_to = os.getenv("RESEND_REPLY_TO")
    if reply_to:
        payload["reply_to"] = reply_to
        headers = payload.setdefault("headers", {})
        headers["Reply-To"] = reply_to
    try:
        requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10,
        )
    except Exception:
        return

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
def create_support_ticket(data: SupportTicketCreate):
    payload = jsonable_encoder(data.dict(exclude={"id", "user_email"}))
    created = support_ticket_service.create_support_ticket(payload)
    try:
        est_id = _safe_get(created, "establishment_id")
        establishment = (
            establishments_service.get_establishments_by_id(est_id) if est_id else None
        )
        est_name = _safe_get(establishment, "name") or str(est_id)
        ticket_id = _safe_get(created, "ticket_id") or _safe_get(created, "id")
        subject = _safe_get(created, "object") or "-"
        description = _safe_get(created, "description") or "-"
        invoice_path = _safe_get(created, "invoice_path")
        user_profile_id = _safe_get(created, "user_profile_id")
        user_label = "-"
        if user_profile_id:
            profile = user_profiles_service.get_user_profiles_by_id(user_profile_id)
            first_name = _safe_get(profile, "first_name") or ""
            last_name = _safe_get(profile, "last_name") or ""
            full_name = f"{first_name} {last_name}".strip()
            user_label = full_name or str(user_profile_id)
        file_bytes, filename = _download_ticket_file(invoice_path)
        file_line = "Fichier: joint" if file_bytes else f"Fichier: {invoice_path or '-'}"
        _notify_ticket(
            f"🚨 Nouveau ticket : N°{ticket_id}\n"
            f"{subject}\n"
            f"➡ {description}\n"
            f"📎 {file_line}\n"
            f"--\n{est_name}",
            file_bytes=file_bytes,
            filename=filename,
        )
        user_email = data.user_email
        _send_ticket_email(user_email, str(ticket_id), subject)
    except Exception:
        pass
    return SupportTicket(**created)

@router.patch("/{id}", response_model=SupportTicket)
def update_support_ticket(id: UUID, data: SupportTicket):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = support_ticket_service.update_support_ticket(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="SupportTicket not found")
    return SupportTicket(**updated)

@router.delete("/{id}")
def delete_support_ticket(id: UUID):
    support_ticket_service.delete_support_ticket(id)
    return {"deleted": True}
