# app/manufacturers/wakeuppers/invoice_wakeupper.py

import requests
from app.manufacturers.base_wakeupper import BaseWakeupper
from app.manufacturers.config import WORKERS, MANUFACTURERS_KEY
from app.services.telegram.gordon_service import GordonTelegram


class InvoiceWakeupper(BaseWakeupper):
    """
    Wakeupper dédié à l'import de factures.
    Envoie 1 message au début : "le réveil sonne pour X workers",
    puis réveille chaque worker via /run.
    Les workers envoient eux-mêmes : réveillé / déjà occupé / je me rendors.
    """

    def __init__(self):
        self.worker_entries = WORKERS["import"]
        urls = [w["url"] for w in self.worker_entries]
        super().__init__("invoice", urls)
        self.telegram = GordonTelegram()

    def wake(self):
        # 1) Message unique : annonce du réveil
        worker_count = len(self.worker_entries)
        self.telegram.send_text(
            f"<b>⏰ Réveil de {worker_count} workers...</b>"
        )

        # 2) Réveil des workers (pas de messages ici)
        for w in self.worker_entries:
            try:
                requests.get(
                    f"{w['url']}/run",
                    headers={"X-RAVY-KEY": MANUFACTURERS_KEY},
                    timeout=2,
                )
            except Exception:
                # On ignore les erreurs ici ; les workers inexistants ne parlent pas
                pass

        # Rien d'autre. Le wakeupper ne parle plus.
        return {"status": "ok"}
