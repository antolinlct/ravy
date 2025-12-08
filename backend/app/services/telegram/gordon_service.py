import os
import requests
from typing import Optional


class GordonTelegram:
    """
    Service Telegram simple et complet pour un seul bot.
    - Envoi de texte
    - Envoi de document (PDF, CSV, images…)
    - Envoi de photo
    """

    def __init__(self):
        self.token = os.getenv("TELEGRAM_GORDON_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_GORDON_CHAT_ID")

        if not self.token:
            raise RuntimeError("Missing env var: TELEGRAM_GORDON_TOKEN")
        if not self.chat_id:
            raise RuntimeError("Missing env var: TELEGRAM_GORDON_CHAT_ID")

        self.api_base = f"https://api.telegram.org/bot{self.token}"

    # ------------------------------------------------------------
    # Envoi texte simple
    # ------------------------------------------------------------
    def send_text(self, text: str, html: bool = True) -> bool:
        payload = {
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": "HTML" if html else None,
            "disable_web_page_preview": True,
        }

        try:
            r = requests.post(f"{self.api_base}/sendMessage", json=payload, timeout=5)
            return r.status_code == 200
        except Exception:
            return False

    # ------------------------------------------------------------
    # Envoi document (PDF, CSV, image, logs…)
    # ------------------------------------------------------------
    def send_document(
        self,
        file_path: Optional[str] = None,
        file_bytes: Optional[bytes] = None,
        filename: Optional[str] = None,
        caption: Optional[str] = None,
    ) -> bool:

        url = f"{self.api_base}/sendDocument"
        data = {"chat_id": self.chat_id}
        if caption:
            data["caption"] = caption

        files = {}

        try:
            # Envoi depuis fichier local
            if file_path:
                files["document"] = open(file_path, "rb")

            # Envoi depuis des bytes en mémoire
            elif file_bytes:
                if not filename:
                    return False
                files["document"] = (filename, file_bytes)

            else:
                return False

            response = requests.post(url, data=data, files=files, timeout=10)
            return response.status_code == 200

        except Exception:
            return False

        finally:
            if file_path and "document" in files:
                files["document"].close()

    # ------------------------------------------------------------
    # Envoi photo
    # ------------------------------------------------------------
    def send_photo(
        self,
        file_path: Optional[str] = None,
        file_bytes: Optional[bytes] = None,
        caption: Optional[str] = None,
    ) -> bool:

        url = f"{self.api_base}/sendPhoto"
        data = {"chat_id": self.chat_id}
        if caption:
            data["caption"] = caption

        files = {}

        try:
            if file_path:
                files["photo"] = open(file_path, "rb")
            elif file_bytes:
                files["photo"] = ("image.jpg", file_bytes)
            else:
                return False

            response = requests.post(url, data=data, files=files, timeout=10)
            return response.status_code == 200

        except Exception:
            return False

        finally:
            if file_path and "photo" in files:
                files["photo"].close()
