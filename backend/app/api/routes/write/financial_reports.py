from datetime import date
from typing import Any, Dict, Sequence
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.logic.write.financial_reports import (
    FinancialReportError,
    create_or_update_financial_report,
)


router = APIRouter()


class FinancialReportRequest(BaseModel):
    establishment_id: UUID
    target_month: date
    payload: Sequence[Dict[str, Any]]
    fte_count: float
    fte_cost: float
    total_fixed_cost: float
    total_variable_cost: float
    total_other_cost: float
    total_revenue_excl_tax: float
    total_revenue_food_excl_tax: float


@router.post("/financial-report")
def financial_report_endpoint(payload: FinancialReportRequest):
    try:
        return create_or_update_financial_report(**payload.model_dump())
    except FinancialReportError as exc:
        raise HTTPException(status_code=400, detail=str(exc))