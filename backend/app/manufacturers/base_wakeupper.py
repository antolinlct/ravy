"""
BaseWakeupper
--------------

Envoie un signal de réveil à un ou plusieurs workers.
Ne récupère ni n’attend de réponse — fire & forget.
"""

import requests
from typing import List

class BaseWakeupper:
    def __init__(self, name: str, worker_urls: List[str]):
        self.name = name
        self.worker_urls = worker_urls

    def wake(self):
        """Réveille tous les workers du domaine."""
        print(f"[{self.name.upper()} WAKEUPPER] ⚡ Réveil de {len(self.worker_urls)} workers.")
        for url in self.worker_urls:
            try:
                requests.get(f"{url}/run", timeout=2)
                print(f" → {url} réveillé avec succès.")
            except Exception as e:
                print(f" ⚠️  Impossible de réveiller {url} ({e})")
        print(f"[{self.name.upper()} WAKEUPPER] ✅ Réveil terminé.")
