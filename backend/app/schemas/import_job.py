from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Import_job_status = Literal["pending", "running", "completed", "error", "ocr_failed"]

class ImportJob(BaseModel):
    created_at: Optional[datetime] = None
    id: Optional[UUID] = None
    status: Optional[Import_job_status] = None
    establishment_id: Optional[UUID] = None
    file_path: Optional[str] = None
    ocr_result_json: Optional[dict] = None
    updated_at: Optional[datetime] = None
