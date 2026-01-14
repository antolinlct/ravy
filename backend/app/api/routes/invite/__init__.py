from fastapi import APIRouter

from app.api.routes.invite import invite

router = APIRouter(tags=["Invite"])
router.include_router(invite.router)

__all__ = ["router"]
