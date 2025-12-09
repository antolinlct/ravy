from types import SimpleNamespace
from typing import Any, Callable, Dict, List, Optional


class FakeQuery:
    def __init__(self, rows: List[Dict[str, Any]]):
        self._rows = list(rows)
        self._filters: List[Callable[[Dict[str, Any]], bool]] = []
        self._order_field: Optional[str] = None
        self._order_desc: bool = False
        self._limit: Optional[int] = None
        self._selected: Optional[List[str]] = None

    def select(self, columns: str):
        # Parse columns like "col1, col2" or "*"
        if columns.strip() != "*":
            self._selected = [c.strip() for c in columns.split(",")]
        return self

    def eq(self, field: str, value: Any):
        self._filters.append(lambda row: row.get(field) == value)
        return self

    def in_(self, field: str, values: List[Any]):
        values_set = set(values)
        self._filters.append(lambda row: row.get(field) in values_set)
        return self

    def gte(self, field: str, value: Any):
        self._filters.append(lambda row: row.get(field) is not None and str(row.get(field)) >= str(value))
        return self

    def lte(self, field: str, value: Any):
        self._filters.append(lambda row: row.get(field) is not None and str(row.get(field)) <= str(value))
        return self

    def order(self, field: str, desc: bool = False):
        self._order_field = field
        self._order_desc = desc
        return self

    def limit(self, count: int):
        self._limit = count
        return self

    def execute(self):
        rows = [r for r in self._rows if all(f(r) for f in self._filters)]
        if self._order_field:
            rows.sort(key=lambda r: r.get(self._order_field), reverse=self._order_desc)
        if self._limit is not None:
            rows = rows[: self._limit]
        if self._selected:
            rows = [
                {field: row.get(field) for field in self._selected if field in row}
                for row in rows
            ]
        return SimpleNamespace(data=rows)


class FakeSupabase:
    def __init__(self, data: Dict[str, List[Dict[str, Any]]]):
        self._data = data

    def table(self, name: str) -> FakeQuery:
        return FakeQuery(self._data.get(name, []))
