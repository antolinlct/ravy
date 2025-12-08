from fastapi import APIRouter, Header, HTTPException

from app.manufacturers.wakeuppers.invoice_wakeupper import InvoiceWakeupper
from app.manufacturers.config import MANUFACTURERS_KEY


router = APIRouter(prefix="/wake-up", tags=["Wakeup"])


@router.post("/invoice")
def wake_invoice(x_ravy_key: str = Header(None)):
    """
    Réveille les workers d'import et renvoie un rapport JSON.
    """
    if x_ravy_key != MANUFACTURERS_KEY:
        raise HTTPException(status_code=401, detail="Clé invalide")

    wake = InvoiceWakeupper()
    result = wake.wake()

    return result
