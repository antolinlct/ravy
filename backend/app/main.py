from fastapi import FastAPI
from app.api.routes.health import router as health_router
from app.api.routes.supabase_test import router as supabase_router

app = FastAPI(title="RAVY Backend")

app.include_router(health_router)
app.include_router(supabase_router)
