import os
from uuid import UUID
from typing import Any, Literal, Optional

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr

from app.core.supabase_client import supabase
from postgrest.exceptions import APIError

try:
    from app.services.telegram.gordon_service import GordonTelegram

    _telegram = GordonTelegram()

    def _send_telegram(message: str) -> bool:
        return bool(_telegram.send_text(message))
except Exception:
    def _send_telegram(message: str) -> bool:
        return False

router = APIRouter(prefix="/invite", tags=["Invite"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM = os.getenv("RESEND_FROM")
RESEND_REPLY_TO = os.getenv("RESEND_REPLY_TO")


class InviteRequest(BaseModel):
    email: EmailStr
    establishment_id: UUID
    role: Literal["admin", "manager", "staff", "accountant"]
    redirect_to: Optional[str] = None


class AccessUpdateRequest(BaseModel):
    user_id: UUID
    establishment_id: UUID
    role: Literal["admin", "manager", "staff", "accountant"]


class AccessDeleteRequest(BaseModel):
    user_id: UUID
    establishment_id: UUID


def _require_config():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration manquante.")


def _get_auth_user_id(request: Request) -> str:
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authorization manquante.")

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authorization invalide.")

    with httpx.Client(timeout=10.0) as client:
        resp = client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_KEY,
            },
        )

    if resp.status_code >= 400:
        raise HTTPException(status_code=401, detail="Utilisateur non autorisé.")

    payload = resp.json()
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Utilisateur non autorisé.")
    return user_id


def _safe_get_role(filters: dict) -> Optional[str]:
    try:
        response = (
            supabase.table("user_establishment")
            .select("role")
            .match(filters)
            .maybe_single()
            .execute()
        )
        if not response or not getattr(response, "data", None):
            return None
        return response.data.get("role")
    except (APIError, AttributeError):
        return None


def _safe_row_exists(table: str, filters: dict) -> bool:
    try:
        response = (
            supabase.table(table)
            .select("*")
            .match(filters)
            .maybe_single()
            .execute()
        )
        return bool(getattr(response, "data", None))
    except (APIError, AttributeError):
        return False


def _rest_get_row(table: str, filters: dict, select: str = "*") -> Optional[dict]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None

    params: dict[str, str] = {"select": select, "limit": "1"}
    for key, value in filters.items():
        params[key] = f"eq.{value}"

    try:
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers={
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "apikey": SUPABASE_KEY,
            },
            params=params,
            timeout=10.0,
        )
        if resp.status_code >= 400:
            return None
        data = resp.json()
        if isinstance(data, list) and data:
            return data[0]
    except Exception:
        return None
    return None


def _assert_can_invite(user_id: str, establishment_id: UUID):
    role_row = _rest_get_row(
        "user_establishment",
        {"user_id": user_id, "establishment_id": str(establishment_id)},
        select="role",
    )
    role = role_row.get("role") if role_row else None
    if role in {"owner", "admin"}:
        return

    padrino_row = _rest_get_row(
        "user_establishment",
        {"user_id": user_id, "role": "padrino"},
        select="role",
    )
    if not (padrino_row and padrino_row.get("role") == "padrino"):
        raise HTTPException(status_code=403, detail="Accès refusé.")

def _get_establishment_name(establishment_id: UUID) -> str:
    response = (
        supabase.table("establishments")
        .select("name")
        .eq("id", str(establishment_id))
        .maybe_single()
        .execute()
    )
    name = response.data.get("name") if response and getattr(response, "data", None) else None
    return name or "Établissement"


def _get_user_label(user_id: str) -> str:
    response = (
        supabase.table("user_profiles")
        .select("first_name,last_name")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    if response and getattr(response, "data", None):
        first = response.data.get("first_name") or ""
        last = response.data.get("last_name") or ""
        label = f"{first} {last}".strip()
        if label:
            return label
    return user_id

def _get_invited_user_id(invite_response: dict, email: str) -> Optional[str]:
    user = invite_response.get("user")
    if isinstance(user, dict) and user.get("id"):
        return user.get("id")

    if isinstance(invite_response.get("id"), str):
        return invite_response.get("id")

    with httpx.Client(timeout=10.0) as client:
        resp = client.get(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers={
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "apikey": SUPABASE_KEY,
            },
            params={"email": email},
        )
    if resp.status_code >= 400:
        return None

    payload = resp.json()
    users = payload.get("users") if isinstance(payload, dict) else payload
    if isinstance(users, list) and users:
        return users[0].get("id")
    return None


def _find_user_id_by_email(email: str) -> Optional[str]:
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers={
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "apikey": SUPABASE_KEY,
            },
            params={"email": email},
        )
    if resp.status_code >= 400:
        return None
    payload = resp.json()
    users = payload.get("users") if isinstance(payload, dict) else payload
    if isinstance(users, list) and users:
        return users[0].get("id")
    return None


def _generate_invite_link(email: str, redirect_to: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    payload: dict[str, Any] = {"type": "invite", "email": email}
    if redirect_to:
        payload["redirect_to"] = redirect_to

    with httpx.Client(timeout=10.0) as client:
        resp = client.post(
            f"{SUPABASE_URL}/auth/v1/admin/generate_link",
            headers={
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "apikey": SUPABASE_KEY,
                "Content-Type": "application/json",
            },
            json=payload,
        )

    if resp.status_code >= 400:
        return None, None

    data = resp.json() or {}
    user = data.get("user") or {}
    return user.get("id"), data.get("action_link")


def _send_resend_template(
    template_id: str,
    to: str,
    variables: dict[str, Any],
) -> bool:
    if not RESEND_API_KEY or not RESEND_FROM:
        return False

    payload: dict[str, Any] = {
        "from": RESEND_FROM,
        "to": [to],
        "template": {
            "id": template_id,
            "variables": variables,
        },
    }
    if RESEND_REPLY_TO:
        payload["reply_to"] = RESEND_REPLY_TO

    try:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json=payload,
            timeout=10.0,
        )
        return resp.status_code < 400
    except Exception:
        return False


@router.post("/")
def invite_user(payload: InviteRequest, request: Request):
    _require_config()
    inviter_id = _get_auth_user_id(request)
    _assert_can_invite(inviter_id, payload.establishment_id)

    existing_user_id = _find_user_id_by_email(payload.email)
    invited_user_id = existing_user_id
    invite_sent = False
    invite_link: Optional[str] = None

    if existing_user_id:
        if _safe_row_exists(
            "user_establishment",
            {
                "user_id": existing_user_id,
                "establishment_id": str(payload.establishment_id),
            },
        ):
            raise HTTPException(status_code=409, detail="user_already_has_access")

    if not invited_user_id:
        invited_user_id, invite_link = _generate_invite_link(
            payload.email, payload.redirect_to
        )
        invite_sent = bool(invited_user_id and invite_link)

    if not invited_user_id:
        raise HTTPException(status_code=500, detail="Utilisateur invité introuvable.")

    # user_profiles (insert if missing)
    if not _safe_row_exists("user_profiles", {"id": invited_user_id}):
        supabase.table("user_profiles").insert(
            {
                "id": invited_user_id,
            }
        ).execute()

    # user_establishment (insert if missing)
    if not _safe_row_exists(
        "user_establishment",
        {
            "user_id": invited_user_id,
            "establishment_id": str(payload.establishment_id),
        },
    ):
        supabase.table("user_establishment").insert(
            {
                "user_id": invited_user_id,
                "establishment_id": str(payload.establishment_id),
                "role": payload.role,
                "created_by": inviter_id,
            }
        ).execute()

    try:
        establishment_name = _get_establishment_name(payload.establishment_id)
        inviter_label = _get_user_label(inviter_id)
        if invite_sent:
            sent = _send_telegram(
                "\n".join(
                    [
                        "👤 Invitation envoyée",
                        f"Invité : {payload.email}",
                        f"Rôle : {payload.role}",
                        f"Par : {inviter_label}",
                        "__",
                        establishment_name,
                    ]
                )
            )
            if not sent:
                print("telegram_send_failed", "invite", payload.email)
        else:
            sent = _send_telegram(
                "\n".join(
                    [
                        "🤝 Collaboration ajoutée",
                        f"Utilisateur : {payload.email}",
                        f"Rôle : {payload.role}",
                        f"Par : {inviter_label}",
                        "__",
                        establishment_name,
                    ]
                )
            )
            if not sent:
                print("telegram_send_failed", "collab_added", payload.email)
    except Exception:
        pass

    if invite_sent and invite_link:
        _send_resend_template(
            "invite-new-user",
            payload.email,
            {
                "ESTABLISHMENT_NAME": _get_establishment_name(payload.establishment_id),
                "INVITE_LINK": invite_link,
            },
        )
    elif not invite_sent:
        _send_resend_template(
            "invite-old-user",
            payload.email,
            {
                "ESTABLISHMENT_NAME": _get_establishment_name(payload.establishment_id),
            },
        )

    return {
        "ok": True,
        "user_id": invited_user_id,
        "invite_sent": invite_sent,
    }


@router.patch("/access")
def update_access(payload: AccessUpdateRequest, request: Request):
    _require_config()
    inviter_id = _get_auth_user_id(request)
    _assert_can_invite(inviter_id, payload.establishment_id)

    response = (
        supabase.table("user_establishment")
        .update({"role": payload.role, "updated_by": inviter_id})
        .eq("user_id", str(payload.user_id))
        .eq("establishment_id", str(payload.establishment_id))
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Accès introuvable.")

    try:
        establishment_name = _get_establishment_name(payload.establishment_id)
        inviter_label = _get_user_label(inviter_id)
        updated_label = _get_user_label(str(payload.user_id))
        sent = _send_telegram(
            "\n".join(
                [
                    "🔁 Statut modifié",
                    f"Utilisateur : {updated_label}",
                    f"Nouveau rôle : {payload.role}",
                    f"Par : {inviter_label}",
                    "__",
                    establishment_name,
                ]
            )
        )
        if not sent:
            print("telegram_send_failed", "role_updated", payload.user_id)
    except Exception:
        pass

    return {"ok": True}


@router.delete("/access")
def delete_access(payload: AccessDeleteRequest, request: Request):
    _require_config()
    inviter_id = _get_auth_user_id(request)
    _assert_can_invite(inviter_id, payload.establishment_id)

    response = (
        supabase.table("user_establishment")
        .delete()
        .eq("user_id", str(payload.user_id))
        .eq("establishment_id", str(payload.establishment_id))
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Accès introuvable.")

    try:
        establishment_name = _get_establishment_name(payload.establishment_id)
        inviter_label = _get_user_label(inviter_id)
        removed_label = _get_user_label(str(payload.user_id))
        sent = _send_telegram(
            "\n".join(
                [
                    "🚫 Accès retiré",
                    f"Utilisateur : {removed_label}",
                    f"Par : {inviter_label}",
                    "__",
                    establishment_name,
                ]
            )
        )
        if not sent:
            print("telegram_send_failed", "access_removed", payload.user_id)
    except Exception:
        pass

    return {"ok": True}
