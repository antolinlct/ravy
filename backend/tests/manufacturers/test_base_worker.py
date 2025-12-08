from pathlib import Path
import os
import sys
from uuid import uuid4

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "test-key")
os.environ.setdefault("RAVY_MANUFCATURERS_KEY", "test-manufacturers-key")

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.manufacturers import base_worker
from app.schemas.import_job import ImportJob


class FakeResponse:
    def __init__(self, data):
        self.data = data


class FakeTable:
    def __init__(self, rows):
        self.rows = rows
        self._filters = []
        self._update_payload = None

    def select(self, _columns="*"):
        return self

    def eq(self, field, value):
        self._filters.append((field, value))
        return self

    def update(self, payload):
        self._update_payload = payload
        return self

    def execute(self):
        filtered = [row for row in self.rows if all(row.get(f) == v for f, v in self._filters)]

        if self._update_payload is not None:
            updated = []
            for row in filtered:
                row.update(self._update_payload)
                updated.append(dict(row))
            return FakeResponse(updated)

        return FakeResponse([dict(row) for row in filtered])


class FakeSupabase:
    def __init__(self, rows):
        self.rows = rows

    def table(self, _name):
        return FakeTable(self.rows)


def test_list_running_establishment_ids(monkeypatch):
    running_id = uuid4()
    fake_rows = [
        {"establishment_id": str(running_id), "status": "running"},
        {"establishment_id": str(uuid4()), "status": "pending"},
    ]
    monkeypatch.setattr(base_worker, "supabase", FakeSupabase(fake_rows))

    result = base_worker.list_running_establishment_ids()

    assert result == {running_id}


def test_claim_next_pending_import_job_respects_exclusions(monkeypatch):
    allowed_establishment = uuid4()
    blocked_establishment = uuid4()
    job_one_id = uuid4()
    job_two_id = uuid4()
    fake_rows = [
        {"id": str(job_one_id), "status": "pending", "establishment_id": str(blocked_establishment)},
        {"id": str(job_two_id), "status": "pending", "establishment_id": str(allowed_establishment)},
    ]
    fake_supabase = FakeSupabase(fake_rows)
    monkeypatch.setattr(base_worker, "supabase", fake_supabase)

    def fake_get_all_import_job(filters, limit, page):
        return [
            ImportJob(**row)
            for row in fake_rows
            if row["status"] == filters.get("status")
        ]

    monkeypatch.setattr(base_worker.import_job_service, "get_all_import_job", fake_get_all_import_job)

    claimed = base_worker.claim_next_pending_import_job(
        excluded_establishment_ids={blocked_establishment}
    )

    assert claimed is not None
    assert claimed.id == job_two_id
    assert fake_rows[1]["status"] == "running"


def test_claim_next_pending_import_job_refreshes_running_view(monkeypatch):
    establishment = uuid4()
    job_one_id = uuid4()
    job_two_id = uuid4()
    fake_rows = [
        {"id": str(job_one_id), "status": "pending", "establishment_id": str(establishment)},
        {"id": str(job_two_id), "status": "pending", "establishment_id": str(establishment)},
    ]
    fake_supabase = FakeSupabase(fake_rows)
    monkeypatch.setattr(base_worker, "supabase", fake_supabase)

    def fake_get_all_import_job(filters, limit, page):
        return [
            ImportJob(**row)
            for row in fake_rows
            if row.get("status") == filters.get("status")
        ]

    running_views = [set(), {establishment}]

    def fake_list_running_establishment_ids():
        if running_views:
            return running_views.pop(0)
        return {establishment}

    monkeypatch.setattr(base_worker, "list_running_establishment_ids", fake_list_running_establishment_ids)
    monkeypatch.setattr(base_worker.import_job_service, "get_all_import_job", fake_get_all_import_job)

    claimed = base_worker.claim_next_pending_import_job()

    assert claimed is not None
    assert claimed.id == job_one_id
    assert fake_rows[0]["status"] == "running"
    assert fake_rows[1]["status"] == "pending"  # second job skipped because establishment now busy


def test_claim_next_pending_import_job_prefers_oldest_invoice(monkeypatch):
    job_old_id = uuid4()
    job_new_id = uuid4()
    fake_rows = [
        {
            "id": str(job_old_id),
            "status": "pending",
            "establishment_id": None,
            "invoice_date": "2021-01-01",
        },
        {
            "id": str(job_new_id),
            "status": "pending",
            "establishment_id": None,
            "invoice_date": "2023-01-01",
        },
    ]
    fake_supabase = FakeSupabase(fake_rows)
    monkeypatch.setattr(base_worker, "supabase", fake_supabase)

    def fake_get_all_import_job(filters, limit, page):
        ordered = sorted(
            [ImportJob(**row) for row in fake_rows if row.get("status") == filters.get("status")],
            key=lambda job: job.invoice_date,
        )
        return ordered

    monkeypatch.setattr(base_worker.import_job_service, "get_all_import_job", fake_get_all_import_job)

    claimed = base_worker.claim_next_pending_import_job()

    assert claimed is not None
    assert claimed.id == job_old_id

def test_worker_run_uses_suffix_in_telegrams(monkeypatch):
    establishment_one = uuid4()
    establishment_two = uuid4()
    job_one_id = uuid4()
    job_two_id = uuid4()
    fake_rows = [
        {"id": str(job_one_id), "status": "pending", "establishment_id": str(establishment_one)},
        {"id": str(job_two_id), "status": "pending", "establishment_id": str(establishment_two)},
    ]
    fake_supabase = FakeSupabase(fake_rows)
    monkeypatch.setattr(base_worker, "supabase", fake_supabase)

    def fake_get_all_import_job(filters, limit, page):
        return [
            ImportJob(**row)
            for row in fake_rows
            if row.get("status") == filters.get("status")
        ]

    statuses = {}
    processed = []
    sent_messages = []

    def fake_update_import_job(job_id, payload):
        statuses[str(job_id)] = payload["status"]

    monkeypatch.setattr(base_worker.import_job_service, "get_all_import_job", fake_get_all_import_job)
    monkeypatch.setattr(base_worker.import_job_service, "update_import_job", fake_update_import_job)
    monkeypatch.setattr(base_worker, "import_invoice_from_import_job", lambda job_id: processed.append(job_id))
    monkeypatch.setattr(base_worker, "send_telegram", lambda message: sent_messages.append(message))

    worker = base_worker.ImportInvoicesWorker("worker-789")
    worker.run()

    assert all(message.startswith("→ [789]") for message in sent_messages)
    assert statuses == {str(job_one_id): "completed", str(job_two_id): "completed"}
    assert processed == [job_one_id, job_two_id]
