import os
import importlib
import pytest

from .fake_supabase import FakeSupabase

# Set dummy environment to satisfy supabase client creation when modules are imported
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "fake-key")

from app.core import supabase_client  # noqa: E402


@pytest.fixture(autouse=True)
def patch_supabase(monkeypatch):
    fake = FakeSupabase({})
    monkeypatch.setattr(supabase_client, "supabase", fake)
    # Reload downstream modules can override in tests when specific datasets are required
    yield
