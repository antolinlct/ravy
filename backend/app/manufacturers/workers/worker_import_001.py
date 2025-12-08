# app/manufacturers/workers/worker_import_001.py

from __future__ import annotations

from typing import Any, List, Optional
from uuid import UUID

from fastapi import FastAPI, Request, HTTPException

from app.manufacturers.base_worker import BaseWorker
from app.manufacturers.config import MANUFACTURERS_KEY, ALLOWED_IPS
from app.logic.write.invoices_imports import import_invoice_from_import_job
from app.services import import_job_service

# Adaptez ces imports si votre service Telegram ne s'appelle pas comme ça
try:
    from app.services.telegram.gordon_service import GordonTelegram
    send_telegram = GordonTelegram()  # simple alias
except Exception:  # en cas d'absence ou de nom différent, on dégrade en print
    def send_telegram(message: str) -> None:
        print(f"[GORDON FALLBACK] {message}")


# =====================================================================
# Helpers
# =====================================================================

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


# =====================================================================
# Worker concret : traitement des import_job
# =====================================================================

class ImportInvoicesWorker001(BaseWorker):
    """
    Worker 001 : traite les import_job en file d'attente.
    - prend les jobs en status 'pending'
    - du plus ancien invoice_date au plus récent
    - traite en séquentiel jusqu'à ce qu'il n'y ait plus de pending
    """

    def __init__(self) -> None:
        super().__init__(name="worker_import_001")

    def run(self) -> None:
        """
        Boucle principale : tant qu'il reste des import_job en pending, on traite.
        """
        send_telegram("→ [001] Awake ⚡︎")

        while True:
            # 1) récupérer le prochain job pending le plus ancien
            jobs: List[Any] = import_job_service.get_all_import_job(
                filters={
                    "status": "pending",
                    "order_by": "invoice_date",
                    "direction": "asc",
                },
                limit=1,
                page=1,
            )

            if not jobs:
                # plus rien à faire → dodo
                msg = "→ [001] Jobs done ☽"
                print(msg)
                send_telegram(msg)
                break

            job = jobs[0]

            job_id = _as_uuid(_safe_get(job, "id"))
            establishment_id = _as_uuid(_safe_get(job, "establishment_id"))

            send_telegram(
                f"→ [001] started:{job_id} "
                f"(etablissement={establishment_id})"
            )

            # 2) marquer le job en running dès qu'on le prend
            try:
                import_job_service.update_import_job(job_id, {"status": "running"})
            except Exception as e:
                continue

            # 3) traitement métier principal
            try:
                import_invoice_from_import_job(job_id)
                # Si tout va bien : status completed
                import_job_service.update_import_job(job_id, {"status": "completed"})
                send_telegram(f"→ [001] finished: {job_id} ")
            except Exception as exc:
                try:
                    import_job_service.update_import_job(job_id, {"status": "error"})
                except Exception:
                    pass
                # on n'interrompt pas la boucle : on passe au job suivant
                continue
        # BaseWorker.wake_up se chargera de remettre is_running à False et d'afficher son message.


# =====================================================================
# API FastAPI exposée sur le port 9001
# =====================================================================

app = FastAPI(title="RAVY Worker Import 001")

worker = ImportInvoicesWorker001()


@app.get("/run")
async def run_worker(request: Request):
    """
    Endpoint appelé par le wakeupper.
    - Vérifie IP
    - Vérifie la clé X-RAVY-KEY
    - Réveille le worker si disponible
    """
    client_ip = request.client.host
    if client_ip not in ALLOWED_IPS:
        raise HTTPException(status_code=403, detail="IP non autorisee")

    header_key = request.headers.get("X-RAVY-KEY")
    if header_key != MANUFACTURERS_KEY:
        raise HTTPException(status_code=403, detail="Cle interne invalide")

    # Ici on ne renvoie pas le détail du traitement, juste l'ack du réveil
    worker.wake_up()
    return {"status": "ok", "worker": worker.name}
