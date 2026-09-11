# API reference

Base URL: `http://localhost:8000/patient-service/api/v1` (local)

## Conventions

- **`POST` for list, export, update and delete**; `GET` only for single-entity
  fetches and analytics. This follows the platform convention the service was
  modelled on, and lets list endpoints carry a structured filter body rather
  than encoding nested filters into a query string.
- **One response envelope** for success and failure alike.
- **`Authorization: Bearer <token>`** on everything except `/auth/login` and
  the health check.

### Response envelope

```jsonc
{
  "success": true,
  "status_code": 200,
  "request_id": "0194f2c1-8a3b-7c4d-9e2f-1a2b3c4d5e6f",
  "request_timestamp": "2026-09-10T17:42:01.114Z",
  "data": { }
}
```

`data` holds `{ data: [...], count: n }` for list endpoints, the record itself
for single-entity endpoints, and `{ detail, errors?, code? }` for errors.

`request_id` correlates the response with the server log line and the audit row
for the same request.

### Status codes

| Code | Meaning |
|---|---|
| 200 / 201 | Success |
| 401 | Missing, invalid or expired session |
| 403 | Authenticated but not permitted (`code: PERMISSION_DENIED`) |
| 404 | Not found, **or** found but outside the caller's ownership scope |
| 409 | Conflict — duplicate, or deleting a patient with clinical history |
| 422 | Validation failure (`code: VALIDATION_ERROR`) |
| 429 | Rate limited |
| 500 | Unhandled server error |

### List request shape

Every `/list` and `/export` endpoint accepts:

```jsonc
{
  "filter": { },                    // endpoint-specific
  "page": 1,
  "limit": 10,                      // capped at 1000
  "sort": { "encounter_date": -1 }, // -1 desc, 1 asc; allow-listed fields only
  "export_format": "CSV"            // export only: CSV | JSON | XLS
}
```

---

## Authentication

### `POST /auth/login`

```jsonc
// request
{ "email": "doctor@sanjeevani.health", "password": "Sanjeevani@123" }
```

```jsonc
// 200
{
  "success": true,
  "status_code": 200,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 10800,
    "user": {
      "id": "USER-20260910-aBcD123",
      "email": "doctor@sanjeevani.health",
      "employee_id": "SNJ-DOC-001",
      "first_name": "Meera",
      "last_name": "Kulkarni",
      "role": "DOCTOR",
      "facility_details": { "id": "FACILITY-...", "name": "Mangaon Primary Health Centre" }
    },
    "permissions": [
      { "module": "PATIENT_MANAGEMENT", "sub_module": "ENCOUNTERS_MANAGEMENT", "name": "READ_ALL" }
    ]
  }
}
```

A wrong password and an unknown email return the **same** 401 body, so the
endpoint cannot be used to enumerate accounts:

```jsonc
{ "success": false, "status_code": 401,
  "data": { "detail": "Invalid email address or password." } }
```

The JWT payload is AES-encrypted before signing, so decoding the token without
the secret reveals nothing about the clinician.

### `GET /auth/profile`

Returns the user with `role_details`, `facility_details` and the resolved
`permissions` array.

### `POST /auth/change-password`

```jsonc
{ "current_password": "…", "new_password": "…" }
```

Requires 8+ characters with upper, lower and a digit.

---

## Master data

`GET /masters/facilities` · `GET /masters/diagnosis-categories` ·
`GET /masters/clinicians`

Reference data for dropdowns and filters. Available to any authenticated user —
none of it is patient data.

---

## Patients

### `POST /patients/list`

```jsonc
{
  "filter": {
    "search": "SNJ-PT-0001",
    "gender": ["FEMALE"],
    "district": ["Raigad"],
    "facility_id": ["FACILITY-..."],
    "min_age": 18, "max_age": 60,
    "is_pregnant": true
  },
  "page": 1, "limit": 20,
  "sort": { "created_at": -1 }
}
```

A caller holding only `READ_OWNED` receives just the patients they registered —
the filter is applied in SQL, so `count` is correct for their scope too.

### `POST /patients`

```jsonc
{
  "age": 34,
  "gender": "FEMALE",
  "district": "Raigad",
  "state": "Maharashtra",
  "facility_id": "FACILITY-20260910-QwErT12",
  "chronic_conditions": ["Hypertension"],
  "is_pregnant": false
}
```

`patient_code` is issued by the server (`SNJ-PT-000123`). There is no field for
a name, phone number or identifier — the schema strips unknown keys.

### `GET /patients/:id`

Returns the patient with `facility_details` and the 20 most recent encounters.

### `POST /patients/delete/:id`

Soft-deletes. Returns **409** if the patient has any recorded encounter —
clinical history is never orphaned.

---

## Encounters

### `POST /encounters/list`

```jsonc
{
  "filter": {
    "search": "fever",
    "patient_id": "PATIENT-...",
    "severity": ["SEVERE", "CRITICAL"],
    "status": ["REFERRED"],
    "visit_type": ["EMERGENCY"],
    "diagnosis_category_id": ["DIAGNOSIS-CATEGORY-..."],
    "facility_id": ["FACILITY-..."],
    "from": "2026-06-01", "to": "2026-09-10"
  },
  "page": 1, "limit": 20,
  "sort": { "encounter_date": -1 }
}
```

### `POST /encounters`

```jsonc
{
  "patient_id": "PATIENT-20260910-aBcD123",
  "facility_id": "FACILITY-20260910-QwErT12",
  "diagnosis_category_id": "DIAGNOSIS-CATEGORY-20260910-Zx1",
  "encounter_date": "2026-09-10T09:30:00.000Z",
  "visit_type": "NEW_CONSULTATION",
  "chief_complaint": "High-grade fever for three days",
  "symptoms": ["Fever", "Headache", "Body ache"],
  "diagnosis": "Acute viral fever",
  "severity": "MODERATE",
  "status": "UNDER_TREATMENT",
  "treatment": "Paracetamol 500mg TDS for three days, oral fluids, rest",
  "vitals": {
    "temperature_celsius": 38.8,
    "systolic_bp": 118, "diastolic_bp": 76,
    "pulse_bpm": 92, "spo2_percentage": 98, "weight_kg": 54.5
  },
  "follow_up_date": "2026-09-17",
  "notes": "Counselled on warning signs."
}
```

`clinician_id` is **not** accepted — it is taken from the token, so a nurse
cannot file an encounter under a doctor's name.

Validation rejects: a future `encounter_date`, an empty `symptoms` array,
vitals outside physiological range, systolic ≤ diastolic, and a
`follow_up_date` on or before the encounter.

### `POST /encounters/update/:id` · `POST /encounters/delete/:id`

Both apply the ownership predicate for `WRITE_OWNED` callers, and both return
404 rather than 403 when the record is out of scope.

---

## Analytics

All three require `ANALYTICS : DASHBOARD : READ_ALL` and return aggregates
only. Query parameters: `from`, `to`, `facility_id`, `district`,
`granularity` (`day` | `week` | `month`).

### `GET /analytics/overview`

```jsonc
{
  "data": {
    "total_encounters": 412,
    "unique_patients": 118,
    "critical_cases": 24,
    "notifiable_cases": 37,
    "referred_cases": 24,
    "follow_ups_due": 63,
    "active_clinicians": 5,
    "facilities_reporting": 5,
    "previous_total_encounters": 356,
    "encounter_change_percentage": 15.7,
    "range": { "from": "2026-06-12T00:00:00.000Z", "to": "2026-09-10T23:59:59.999Z" }
  }
}
```

`previous_total_encounters` covers the immediately preceding window of equal
length, which is what the period-on-period delta on each stat tile is computed
from.

### `GET /analytics/trends`

Returns `series` (total, critical, notifiable per bucket) and `category_series`
(per bucket per diagnosis category).

### `GET /analytics/distribution`

Returns six groupings: `by_category`, `by_severity`, `by_gender`,
`by_age_band`, `by_facility`, `by_status`.

---

## Audit logs

`POST /audit-logs/list` · `POST /audit-logs/export` — administrator only.

Filterable by `action`, `status`, `entity_type`, `user_id` and date range.
Recorded actions include `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`,
`CREATE_PATIENT`, `UPDATE_PATIENT`, `CREATE_ENCOUNTER`, `UPDATE_ENCOUNTER`,
`DELETE_ENCOUNTER`, `PERMISSION_DENIED`, `EXPORT_DATA` and `VIEW_ANALYTICS`.

A denied request is itself logged, with the attempted path and the permissions
that would have been required.

---

## Users

`POST /users/list` · `GET /users/:id` · `POST /users` ·
`POST /users/update/:id` — administrator only.

Changing a user's role invalidates the cached permission set immediately rather
than waiting for the TTL, so a revocation takes effect on the next request.

---

## Exports

`/export` endpoints stream a file rather than JSON, honouring the same filters
as the matching `/list` call. `export_format` selects `CSV`, `JSON` or `XLS`
(a styled XLSX with a frozen, filtered header row). The filename arrives in
`Content-Disposition`, which CORS exposes to the browser.

Every export is recorded in the audit trail with the row count and format.

---

## Health check

`GET /patient-service/health-check` — no auth.

```jsonc
{
  "data": {
    "service": "sanjeevani-patient-service",
    "status": "HEALTHY",
    "dependencies": { "database": "UP" },
    "uptime_in_seconds": 3814
  }
}
```

Returns 503 with `status: "DEGRADED"` if the database is unreachable.

---

## Try it with curl

```bash
BASE=http://localhost:8000/patient-service/api/v1

TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H 'content-type: application/json' \
  -d '{"email":"doctor@sanjeevani.health","password":"Sanjeevani@123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.access_token')

# list the ten most recent encounters
curl -s -X POST "$BASE/encounters/list" \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"page":1,"limit":10,"sort":{"encounter_date":-1}}'

# a doctor is refused the dashboard - expect 403
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/analytics/overview" \
  -H "authorization: Bearer $TOKEN"
```
