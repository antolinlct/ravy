"""Lightweight tabulate fallback for testing environments without the real dependency.

The implementation supports the subset used in tests: passing an iterable of
rows and headers plus the ``tablefmt`` argument. Output aims to be predictable
rather than perfectly matching the real library.
"""
from typing import Iterable, List, Sequence


def _stringify(value: object) -> str:
    return "" if value is None else str(value)


def _column_widths(headers: Sequence[str], rows: Iterable[Sequence[object]]) -> List[int]:
    widths = [len(_stringify(h)) for h in headers]
    for row in rows:
        for idx, cell in enumerate(row):
            if idx >= len(widths):
                widths.append(0)
            widths[idx] = max(widths[idx], len(_stringify(cell)))
    return widths


def _render_separator(widths: List[int]) -> str:
    parts = ["+" + "+".join("-" * (w + 2) for w in widths) + "+"]
    return parts[0]


def _render_row(values: Sequence[object], widths: List[int]) -> str:
    cells = []
    for idx, width in enumerate(widths):
        cell = _stringify(values[idx]) if idx < len(values) else ""
        cells.append(f" {cell.ljust(width)} ")
    return "|" + "|".join(cells) + "|"


def tabulate(table: Iterable[Sequence[object]], headers: Sequence[str], tablefmt: str | None = None) -> str:
    """Render a minimal table string.

    Only the ``grid`` format is supported; other formats fall back to a simple
    newline-joined representation. This is sufficient for the sandbox tests that
    display database contents in the console.
    """
    rows = list(table)
    widths = _column_widths(headers, rows)

    if tablefmt != "grid":
        return "\n".join(
            ["\t".join(headers)] + ["\t".join(_stringify(cell) for cell in row) for row in rows]
        )

    separator = _render_separator(widths)
    rendered = [separator, _render_row(headers, widths), separator]
    rendered.extend(_render_row(row, widths) for row in rows)
    rendered.append(separator)
    return "\n".join(rendered)


__all__ = ["tabulate"]
