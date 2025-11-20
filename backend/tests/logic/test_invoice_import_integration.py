import sys
from uuid import uuid4
from datetime import datetime

import pytest

from tests.fixtures import fake_services
from tests.fixtures.fake_db import (
    DB,
    reset_db,
    create_establishment,
    create_import_job,
)
from tests.fixtures.sample_ocr import SAMPLE_OCR

# --- MOCK COMPLET : remplace tout app.services par nos services fake ---
sys.modules["app.services"] = fake_services

from app.logic.write.invoices_imports import import_invoice_from_import_job  # noqa: E402


@pytest.fixture(autouse=True)
def clean_db():
    reset_db()
    yield
    reset_db()

# ---------------------------------------------------------------------
# AUCUN TEST POUR LE MOMENT
# ---------------------------------------------------------------------
# Le fichier est maintenant propre et prêt pour vos directives.
# Vous me dites ce qu’on ajoute, je produis la structure exacte.
