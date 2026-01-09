from typing import Optional, Literal
from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel

from app.services import establishments_service

try:
    from app.services.telegram.gordon_service import GordonTelegram

    _telegram_client = GordonTelegram()

    def _send_telegram(message: str) -> None:
        _telegram_client.send_text(message)
except Exception:
    def _send_telegram(message: str) -> None:
        return


router = APIRouter(prefix="/notifications", tags=["Notifications"])


class TelegramNotifyRequest(BaseModel):
    event: Literal["invite_sent", "password_reset"]
    email: Optional[str] = None
    establishment_id: Optional[UUID] = None
    role: Optional[str] = None


def _safe_get(obj: object, key: str) -> Optional[str]:
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj.get(key)
    return getattr(obj, key, None)


@router.post("/telegram")
def notify_telegram(payload: TelegramNotifyRequest):
    try:
        est_name = None
        if payload.establishment_id:
            establishment = establishments_service.get_establishments_by_id(payload.establishment_id)
            est_name = _safe_get(establishment, "name") or str(payload.establishment_id)

        if payload.event == "invite_sent":
            role_label = f"Rôle: {payload.role}" if payload.role else "Rôle: -"
            lines = [
                "Invitation envoyée",
                payload.email or "Email: -",
                est_name or "Établissement: -",
                role_label,
            ]
        else:
            lines = [
                "Demande de réinitialisation",
                payload.email or "Email: -",
                est_name or "Établissement: -",
            ]

        message = "\n".join(lines)
        _send_telegram(message)
    except Exception:
        pass
    return {"sent": True}
