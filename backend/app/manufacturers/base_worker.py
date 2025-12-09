"""
BaseWorker
-----------

Classe mère pour tous les workers RAVY.
Un worker :
- ignore les réveils s’il travaille déjà
- exécute ses jobs séquentiellement
- se rendort une fois la file vide
"""

from __future__ import annotations

import traceback
from typing import Any, Iterable, Optional, Set
from uuid import UUID

from fastapi import FastAPI, HTTPException, Request

from app.core.supabase_client import supabase
from app.manufacturers.config import ALLOWED_IPS, MANUFACTURERS_KEY
from app.logic.write.invoices_imports import import_invoice_from_import_job
from app.schemas.import_job import ImportJob
from app.services import import_job_service

try:
    from app.services.telegram.gordon_service import GordonTelegram

    send_telegram = GordonTelegram()  # simple alias
except Exception:  # fallback if telegram is unavailable
    def send_telegram(message: str) -> None:
        print(f"[GORDON FALLBACK] {message}")


class BaseWorker:
    def __init__(self, name: str):
        self.name = name
        self.is_running = False

    def wake_up(self):
        """Appelée par /run – réveille le worker si libre."""
        if self.is_running:
            print(f"[{self.name}] 🔄 Déjà en cours — réveil ignoré.")
            return  # pas de retour
        print(f"[{self.name}] 🟢 Réveil reçu.")
        self.is_running = True
        try:
            self.run()
        except Exception as e:
            print(f"[{self.name}] ❌ Erreur : {e}")
            traceback.print_exc()
        finally:
            self.is_running = False
            print(f"[{self.name}] 💤 Travail terminé, retour au repos.")

    def run(self):
        """À implémenter dans les sous-classes concrètes."""
        raise NotImplementedError


def _safe_get(obj: Any, key: str, default: Any = None) -> Any:
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _as_uuid(value: Any) -> Optional[UUID]:
    if isinstance(value, UUID):
        return value
    try:
        if value:
            return UUID(str(value))
    except Exception:
        return None
    return None


def _normalize_uuid(value: Any) -> Optional[UUID]:
    return _as_uuid(value)


def list_running_establishment_ids() -> Set[Optional[UUID]]:
    """Return establishment ids currently processed by running jobs."""
    response = (
        supabase.table("import_job")
        .select("establishment_id")
        .eq("status", "running")
        .execute()
    )
    result: Set[Optional[UUID]] = set()
    for row in response.data or []:
        result.add(_normalize_uuid(row.get("establishment_id")))
    return result


def claim_next_pending_import_job(
    *, excluded_establishment_ids: Iterable[Optional[UUID]] | None = None, batch_size: int = 10
) -> Optional[ImportJob]:
    """Attempt to claim the next pending import job.

    The claim is optimistic but defensive: each attempt refreshes the list of
    running establishments to avoid picking a job for an establishment already
    handled by another worker mid-loop, and the update is guarded by the
    `status = pending` predicate to prevent double-claiming the same row.
    """

    base_exclusions: Set[Optional[UUID]] = set(excluded_establishment_ids or [])

    pending_jobs = import_job_service.get_all_import_job(
        filters={"status": "pending", "order_by": "invoice_date", "direction": "asc"},
        limit=batch_size,
        page=1,
    )

    for job in pending_jobs:
        live_exclusions = base_exclusions | list_running_establishment_ids()

        job_id = job.id
        establishment_id = _normalize_uuid(job.establishment_id)

        if establishment_id in live_exclusions:
            continue

        if not job_id:
            continue

        update_response = (
            supabase.table("import_job")
            .update({"status": "running"})
            .eq("id", str(job_id))
            .eq("status", "pending")
            .execute()
        )
        if update_response.data:
            return ImportJob(**update_response.data[0])

    return None


class ImportInvoicesWorker(BaseWorker):
    """Generic worker that processes pending import jobs sequentially."""

    def __init__(self, worker_id: str) -> None:
        self.worker_id = worker_id
        super().__init__(name=f"worker_import_{worker_id}")

    @property
    def display_id(self) -> str:
        return str(self.worker_id)[-3:]

    def run(self) -> None:  # noqa: D401
        """Process pending import jobs until none are left."""
        send_telegram(f"→ [{self.display_id}] Awake ⚡︎")

        while True:
            running_establishments = list_running_establishment_ids()
            job = claim_next_pending_import_job(
                excluded_establishment_ids=running_establishments,
            )

            if not job:
                msg = f"→ [{self.display_id}] Jobs done ☽"
                print(msg)
                send_telegram(msg)
                break

            job_id = _as_uuid(_safe_get(job, "id"))
            establishment_id = _as_uuid(_safe_get(job, "establishment_id"))

            if not job_id:
                send_telegram(
                    f"→ [{self.display_id}] job without valid id skipped (etablissement={establishment_id})"
                )
                continue

            send_telegram(
                f"→ [{self.display_id}] started:{job_id} (etablissement={establishment_id})"
            )

            try:
                import_invoice_from_import_job(job_id)
                import_job_service.update_import_job(job_id, {"status": "completed"})
                send_telegram(f"→ [{self.display_id}] finished: {job_id} ")
            except Exception:
                try:
                    import_job_service.update_import_job(job_id, {"status": "error"})
                except Exception:
                    pass
                continue


def build_import_worker_app(worker_id: str) -> tuple[FastAPI, ImportInvoicesWorker]:
    """Create a FastAPI app and worker instance for a given worker id."""
    worker = ImportInvoicesWorker(worker_id)
    app = FastAPI(title=f"RAVY Worker Import {worker_id}")

    @app.get("/run")
    async def run_worker(request: Request):
        client_ip = request.client.host
        if client_ip not in ALLOWED_IPS:
            raise HTTPException(status_code=403, detail="IP non autorisee")

        header_key = request.headers.get("X-RAVY-KEY")
        if header_key != MANUFACTURERS_KEY:
            raise HTTPException(status_code=403, detail="Cle interne invalide")

        worker.wake_up()
        return {"status": "ok", "worker": worker.name}

    return app, worker