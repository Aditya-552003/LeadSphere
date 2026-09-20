# REST API SPECIFICATION STANDARDS

# LeadSphere API Contracts (v1)

---

## 1. GENERAL API STANDARDS

* **Base Path:** `/api/v1`
* **Protocol:** HTTPS / JSON only (`snake_case` keys in payloads)
* **Request ID Header:** `X-Request-ID` (echoed in all response envelopes and server logs)
* **Authentication Header:** `Authorization: Bearer <access_token>` or `HttpOnly` cookie
* **Tenant Scoping:** Derived strictly server-side from session claim (never trusted from path/query/body)

---

## 2. STANDARD RESPONSE ENVELOPES

### 2.1 Success Response (Collection with Cursor Pagination)
```json
{
  "data": [
    {
      "id": "01920a4b-9e48-7d3a-b851-90184bfa0101",
      "full_name": "Alexander Vance",
      "company_name": "Apex Digital",
      "email": "alex@apexdigital.com",
      "lead_score": 85,
      "created_at": "2026-09-20T10:00:00Z"
    }
  ],
  "page": {
    "next_cursor": "eyJpZCI6IjAxOTIwYTRiLTllNDgtN2QzYS1iODUxLTkwMTg0YmZhMDEwMSJ9",
    "has_more": true,
    "total_estimate": 16420
  },
  "request_id": "req_8f192b04-58a1-4321-998a-129481ad0091"
}
```

### 2.2 Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for 2 fields.",
    "details": [
      { "field": "email", "issue": "Must be a valid email format." },
      { "field": "phone", "issue": "Invalid E.164 phone string." }
    ],
    "request_id": "req_8f192b04-58a1-4321-998a-129481ad0091"
  }
}
```

---

## 3. ERROR CODES CATALOG

| HTTP Code | Error Code | Description |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Missing, expired, or invalid session token |
| 403 | `FORBIDDEN` | Missing required RBAC permission |
| 403 | `TENANT_SUSPENDED` | The workspace is currently suspended |
| 404 | `NOT_FOUND` | Resource does not exist (or cross-tenant access attempt) |
| 409 | `CONFLICT` | Optimistic locking collision or duplicate record |
| 422 | `VALIDATION_ERROR` | Request payload failed class-validator DTO checks |
| 429 | `RATE_LIMITED` | Rate limit ceiling exceeded for account or IP |
| 500 | `INTERNAL_ERROR` | Server exception (stack trace logged server-side) |

---

## 4. ENDPOINT CATALOGUE SUMMARY

### 4.1 Authentication & Profile (`/auth`)
* `POST /auth/login` — Login with credentials (returns tokens & MFA requirement flag)
* `POST /auth/mfa/verify` — Verify TOTP token
* `POST /auth/refresh` — Rotate refresh token
* `POST /auth/logout` — Revoke active session
* `GET /auth/sessions` — List active user sessions
* `DELETE /auth/sessions/:id` — Remote session logout

### 4.2 Super Admin Platform Governance (`/platform`)
* `GET /platform/tenants` — List all customer workspaces
* `POST /platform/tenants` — Provision new company workspace
* `POST /platform/tenants/:id/suspend` — Suspend workspace
* `POST /platform/tenants/:id/support-access` — Initiate time-limited support impersonation session (audited)

### 4.3 Leads Module (`/leads`)
* `GET /leads` — List leads (cursor pagination, filters: status, owner, tag, score, search)
* `POST /leads` — Create lead
* `GET /leads/:id` — 360° lead details
* `PATCH /leads/:id` — Update lead (supports `If-Match` version lock)
* `DELETE /leads/:id` — Soft-delete lead
* `POST /leads/:id/assign` — Reassign lead owner
* `POST /leads/bulk` — Execute bulk actions (assign, tag, delete) with `expected_count` safety check

### 4.4 Imports & Exports (`/imports`, `/exports`)
* `POST /imports` — Initialize import job & upload presigned URL
* `POST /imports/:id/mapping` — Submit column mapping configuration
* `POST /imports/:id/commit` — Execute background import
* `POST /exports` — Request background CSV/XLSX export

### 4.5 Pipeline & Kanban (`/pipeline`)
* `GET /pipeline/stages` — List pipeline stages & columns
* `POST /pipeline/stages` — Create/reorder stages
* `POST /leads/:id/status` — Move lead between stages

### 4.6 Outreach & Unified Inbox (`/conversations`, `/messages`, `/campaigns`)
* `GET /conversations` — Unified inbox message threads
* `POST /messages` — Send 1:1 email or WhatsApp message
* `POST /campaigns` — Create campaign sequence
* `POST /campaigns/:id/start` — Launch campaign outreach
