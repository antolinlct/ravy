from fastapi import APIRouter
from app.core.supabase_client import supabase

router = APIRouter()

@router.get("/supabase/users")
def list_supabase_users():
    try:
        # Retourne une liste d'utilisateurs
        response = supabase.auth.admin.list_users()
        users = response  # c’est déjà une liste d’utilisateurs

        return {
            "status": "ok",
            "count": len(users),
            "users": [u.email for u in users],
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
