# backend/app/core/supabase_client.py
import httpx
from supabase import create_client, Client
from supabase.lib.client_options import SyncClientOptions
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

options = SyncClientOptions(
    httpx_client=httpx.Client(http2=False, follow_redirects=True)
)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY, options)
