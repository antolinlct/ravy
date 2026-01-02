# Dashboard invoices (invoices/*) - AGENTS

## Purpose
- Manage invoice ingestion (email + uploader), list invoices, and inspect one invoice in detail.
- Manage supplier metadata (labels, analyses toggle, merge requests) used by OCR and analytics.
- This folder is still mock-driven; wire it to backend data and manufacturers when ready.

## Pages
- `frontend/src/pages/dashboard/invoices/index.tsx`
  - Main list + importer + export sheet.
  - Filters: date range + supplier multi-select.
  - Uses `useEstablishment()` to scope data by `estId`.
  - Reads alias email from `/establishment_email_alias?establishment_id=...`.
- `frontend/src/pages/dashboard/invoices/detail.tsx`
  - Invoice detail + PDF reader + line items + edit dialogs.
  - Price history chart per line (mock today).
- `frontend/src/pages/dashboard/invoices/suppliers.tsx`
  - Supplier management, labels, analyses toggle.
  - Merge requests sheet (create + review).

## Current status
- All three pages are wired to backend endpoints (no mocks).
- `FileUpload06` is still UI-only; it only tracks local uploads and emits `onHasUploadsChange`.

## Data flow (wired)
- Invoices list (`index.tsx`)
  - `GET /invoices?establishment_id=...` (sorted by date desc).
  - Supplier names via `GET /suppliers` (establishment scoped).
- Invoice detail (`detail.tsx`)
  - `GET /invoices/{id}` for totals + `file_storage_path`.
  - `GET /invoices/{id}/details` for articles + variation percent.
  - `GET /master_articles/{id}` to resolve missing article names.
  - `GET /variations?establishment_id=...` to build price history charts.
- Supplier management (`suppliers.tsx`)
  - `GET /suppliers?establishment_id=...`
  - `PATCH /suppliers/{id}` for labels + analyses.
  - `GET /supplier_merge_request?requesting_establishment_id=...` and
    `POST /supplier_merge_request` for regroupements.
  - `GET /market_suppliers` to resolve merge request names.

## Import pipeline (email + uploader)
- Important: do **not** implement OCR here. The OCR ingestion is handled externally.
- Frontend will later call a dedicated endpoint that triggers the external OCR flow.
- Backend will create the import job + process the OCR result; UI only sends the request.
- Keep the flow details below for reference when that endpoint exists:
  - Create `internal.import_job` per file with:
    - `establishment_id`, `file_path`, `status=pending`, optional `is_beverage`, `invoice_date`.
  - Trigger wakeupper:
    - `POST /wake-up/invoice` with header `X-RAVY-KEY` (MANUFACTURERS_KEY).
    - Frontend must NOT own this key; call through backend or server-side.
  - Wakeupper triggers import workers:
    - Workers claim pending jobs and call `import_invoice_from_import_job`.
    - Import logic creates or updates:
      - `suppliers`, `master_articles`, `invoices`, `articles`, `variations`
      - Ingredients/recipes histories, margins, live_score, alert_logs
  - OCR fail path:
    - `public.invoices_rejected` is created
    - `import_job.status = ocr_failed`

## Backend logic to reference
- `backend/app/logic/write/invoices_imports.py`
  - Main OCR import + side effects (variations, alerts, live_score, etc).
  - Uses `internal.regex_patterns` to normalize supplier and article names.
- `backend/app/logic/write/import_manual_invoices.py`
  - Apply manual edits only (ingredients/recipes histories + live_score).
- Manufacturers:
  - `backend/app/manufacturers/*` (wakeuppers + workers)
  - `backend/app/api/routes/wakeuppers/wake_invoice.py`

## Contracts / tables (contracts_summary.json)
- `internal.import_job`
  - `status` enum: pending, running, completed, error, ocr_failed
  - `file_path`, `ocr_result_json`, `invoice_date`, `is_beverage`, `establishment_id`
- `public.invoices`
  - `invoice_number`, `date`, `total_excl_tax`, `total_tax`, `total_incl_tax`
  - `supplier_id`, `establishment_id`, `file_storage_path`
  - `import_mode`: EMAIL | FILEUPLOADER | MANUALLY
- `public.articles`
  - `invoice_id`, `master_article_id`, `unit`, `quantity`, `unit_price`, `total`
  - `discounts`, `duties_and_taxes`, `gross_unit_price`, `date`
- `public.master_articles`
  - `name`, `unformatted_name`, `unit`, `current_unit_price`
  - `supplier_id`, `market_master_article_id`
- `public.suppliers`
  - `name`, `label`, `active_analyses`, `active`, `market_supplier_id`
  - `contact_email`, `contact_phone`, `establishment_id`
- `public.supplier_alias`
  - `supplier_id`, `alias`, `establishment_id`
- `public.supplier_merge_request`
  - `source_market_supplier_ids`, `target_market_supplier_id`, `status`
- `public.variations`
  - `master_article_id`, `old_unit_price`, `new_unit_price`, `percentage`, `date`, `invoice_id`
- `public.invoices_rejected`
  - `file_path`, `rejection_reason`, `created_by`
- `public.establishment_email_alias`
  - `custom_email`, `custom_email_prefix`, `enabled`, `establishment_id`
- `market.market_suppliers` + `market.market_supplier_alias`
  - Used by import logic to normalize supplier names.
- `internal.regex_patterns`
  - `type` enum: supplier_name, market_master_article_name, master_article_alternative

## UI behavior to preserve
- List + export filters: date range and supplier multi-select.
- All queries must be scoped by `establishment_id` from `useEstablishment()`.
- PDF viewer controls (zoom + page navigation) on detail page.
- Editable invoice totals and line items (but saving should call write logic).

## Implementation notes
- `public.articles` does not store a product name. Use `master_articles.name`.
- Variations are computed by import logic; do not recompute in UI.
- If `import_mode = EMAIL`, show alias email and copy button only if `enabled`.
- `file_storage_path` should be converted to a signed URL for preview/download.
