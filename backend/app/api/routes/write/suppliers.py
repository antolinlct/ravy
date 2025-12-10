from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel

from app.logic.write.merge_suppliers import merge_suppliers


router = APIRouter()


class MergeSuppliersRequest(BaseModel):
    merge_request_id: UUID


@router.post("/merge-suppliers")
def merge_suppliers_endpoint(payload: MergeSuppliersRequest):
    return merge_suppliers(**payload.model_dump())