# MASTER BUILD SPECIFICATION — DETAILED EDITION

# Multi-Tenant Lead Management & Outreach Portal

> This edition expands every section of the original specification with concrete technical decisions, data models, API contracts, algorithms, acceptance criteria, and test cases. Where the original says "possible" or "recommended", this document picks a default so an AI coding agent or engineering team can start building without ambiguity. Defaults can be overridden, but overrides must be documented in `docs/adr/`.

**Precedence rule:** If anything here conflicts with tenant isolation or security, security wins (see Section 54 of the original: Build Priority).

---

## TABLE OF CONTENTS

1. Product Overview and Scope
2. Recommended Technology Stack
3. Tenant Model and Isolation (in depth)
4. Authentication and Sessions
5. Roles, Permissions and RBAC (with matrix)
6. Database Design (DDL-level)
7. Row-Level Security Implementation
8. API Design Standards
9. Leads Module
10. Custom Fields Architecture
11. Import Pipeline
12. Export Pipeline
13. Pipeline (Kanban) Module
14. Follow-ups Module
15. Campaign and Sequence Engine
16. Email Integration
17. WhatsApp Integration
18. Unified Inbox
19. AI Module
20. Analytics
21. Documents
22. Team Management
23. Audit Logging
24. Notifications
25. Search
26. Background Jobs
27. Frontend Architecture and Design System
28. Accessibility and Responsive Rules
29. Security Hardening Checklist
30. Observability
31. Testing Strategy (with mandatory cases)
32. Seed Data
33. Deployment and Environments
34. Phase-by-Phase Acceptance Criteria
35. Rules for AI Coding Agents
36. Definition of Done
37. Open Decisions Log

---

# 1. PRODUCT OVERVIEW AND SCOPE

## 1.1 What is being built

A multi-tenant SaaS where each customer company gets an isolated workspace to manage leads, run outreach (email and WhatsApp), track follow-ups, analyse results, use AI assistance, and store documents.

## 1.2 Personas

| Persona | Goal | Typical daily actions |
|---|---|---|
| Platform Owner (Super Admin) | Run the platform, onboard companies | Create company, suspend company, check health, review platform audit log |
| Company Admin | Configure and govern the company workspace | Import leads, invite users, configure email/WhatsApp, set pipeline stages, review audit |
| Member (Sales/Ops/Marketing) | Work leads and run outreach | Search leads, update status, log notes, create follow-ups, send messages, use AI drafts |
| Visitor | Observe | View dashboards, leads, reports (read-only) |

## 1.3 Scale targets

| Metric | Initial | Design target |
|---|---|---|
| Leads in first tenant | ~16,000 | 1,000,000+ per tenant |
| Tenants | 1–3 | 1,000+ |
| Concurrent users per tenant | 5–20 | 200+ |
| Import size | 16,000 rows | 500,000 rows per file |
| Lead list p95 latency | < 300 ms | < 500 ms at 1M rows |
| Search p95 latency | < 400 ms | < 800 ms at 1M rows |

## 1.4 Non-goals (initial release)

* Billing/payment processing (only a plan field placeholder)
* Native mobile apps (responsive web only)
* Voice calling / dialer
* Unofficial WhatsApp automation (explicitly forbidden)
* Vector database (only if a concrete use case arises)

---

# 2. RECOMMENDED TECHNOLOGY STACK

The original spec leaves the stack open. To remove ambiguity, the default is:

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + TypeScript + Vite, TanStack Query, TanStack Table / MUI X Data Grid, React Router, Material UI (MUI v6) | Type safety, enterprise component library & design system, strong table/data-fetching support |
| Backend | NestJS (TypeScript) + class-validator / class-transformer + TypeORM | Enterprise modular architecture, strong TypeScript DTO validation, async support, mature migrations |
| Database | PostgreSQL 16 | RLS, JSONB, full-text search, partitioning |
| Queue/Workers | Redis + BullMQ (or Celery/Arq) | Background imports, campaigns, scheduled jobs |
| Object storage | S3-compatible (AWS S3, MinIO in dev) | Documents, import files, export files |
| Search | PostgreSQL FTS + `pg_trgm` first; OpenSearch only if needed | Avoid premature complexity |
| Auth | Own implementation with Argon2id / Passport.js, or an OIDC provider | Must support MFA and SSO later |
| Email delivery | Provider abstraction: Microsoft Graph, Gmail API, SMTP, SES/SendGrid | As per spec |
| WhatsApp | Meta WhatsApp Business Cloud API (official) or an official BSP | Compliance |
| AI | LLM provider abstraction (Anthropic/OpenAI/etc.), server-side only | Keys never reach the browser |
| Containers | Docker, docker-compose for dev; Kubernetes or ECS for prod | Reproducibility |
| CI | GitHub Actions or equivalent | Lint, type-check, tests, migration check |

**Decision record:** Overridden default stack to **NestJS (TypeScript)** backend and **Material UI (MUI)** frontend as specified by user request. Further architectural changes require an ADR in `docs/adr/NNNN-title.md`.

---

# 3. TENANT MODEL AND ISOLATION (IN DEPTH)

## 3.1 Definitions

* **Platform:** the whole deployment.
* **Tenant:** one company. Identified by `tenants.id` (UUID).
* **Platform user:** Super Admin; has no tenant membership by default.
* **Tenant user:** belongs to exactly one tenant in V1. (Multi-tenant membership for one email is a possible V2 feature; design `memberships` so it is possible, see 6.2.)

## 3.2 Isolation layers (defence in depth)

Isolation must be enforced at **all** of the following layers. Failure of one layer must not cause a data leak.

1. **Token layer:** the JWT/session contains `user_id`, `tenant_id`, `role`, and a `session_id`. It is signed server-side. The client cannot alter it.
2. **API layer:** a middleware/dependency resolves the tenant from the token only. Any `tenant_id` in the URL, body, query, or header is either rejected or ignored (never trusted).
3. **Service layer:** all repository functions require a `TenantContext` argument. There is no repository function that can be called without one (except explicitly named `platform_*` functions used by Super Admin code paths).
4. **Database layer:** PostgreSQL Row-Level Security (RLS) with `FORCE ROW LEVEL SECURITY` on every tenant-owned table. The application DB role is NOT a superuser and does NOT have `BYPASSRLS`.
5. **Storage layer:** object keys are prefixed `tenants/{tenant_id}/...`. Signed URLs are generated only after a DB check confirming the object belongs to the caller's tenant.
6. **Queue layer:** every job payload contains `tenant_id`; workers set the DB tenant context before touching data. Jobs without `tenant_id` are rejected unless flagged as platform jobs.
7. **Cache layer:** every cache key is namespaced `t:{tenant_id}:...`.
8. **Search layer:** every search query includes a mandatory tenant filter applied server-side.
9. **AI layer:** prompts only include data from the caller's tenant; no cross-tenant retrieval; no shared conversational memory across tenants.
10. **Logging layer:** logs include `tenant_id` for traceability but never PII payloads.

## 3.3 Tenant context propagation

Request flow:

```text
HTTP request
  → authenticate (verify token, load session)
  → resolve tenant (from session only)
  → check tenant status (active? suspended? → reject if suspended)
  → begin DB transaction
  → SET LOCAL app.tenant_id = '<uuid>'
  → SET LOCAL app.user_id   = '<uuid>'
  → authorize (permission check)
  → validate input
  → execute
  → audit log (same transaction where possible)
  → commit
```

`SET LOCAL` is used so that the setting is scoped to the transaction and cannot leak across pooled connections. Never use session-level `SET` with a connection pool.

## 3.4 Super Admin controlled access ("impersonation")

Super Admin may enter a company workspace only via an explicit, audited "support access" flow:

1. Super Admin selects company and provides a reason (mandatory free text).
2. System issues a **time-limited** (default 30 minutes) support token with `impersonating_tenant_id` and `support_session = true`.
3. Every action during the session is written to the audit log with `actor_id = super_admin_id`, `on_behalf_of_tenant = tenant_id`, and `support_session_id`.
4. The company's Admins see a "Platform support accessed your workspace" entry in their audit log.
5. Support sessions are **read-only by default**; write access requires a second explicit toggle plus reason.
6. Tenants may disable support access in Settings → Security (except for legal/abuse cases, which are logged).

## 3.5 Tenant lifecycle

| State | Meaning | Behaviour |
|---|---|---|
| `provisioning` | Being created | Not accessible |
| `active` | Normal | Full access per roles |
| `suspended` | Suspended by Super Admin | Logins blocked; API returns 403 `TENANT_SUSPENDED`; workers skip tenant jobs; data retained |
| `pending_deletion` | Deletion requested | Read-only export window (e.g., 30 days) |
| `deleted` | Data purged | Hard-deleted after retention period, with a deletion certificate log |

## 3.6 ID strategy (anti-enumeration)

* All primary keys are UUIDv7 (time-ordered) or UUIDv4. No sequential integers exposed.
* Accessing another tenant's ID must return **404 Not Found** (not 403), to avoid confirming existence.

---

# 4. AUTHENTICATION AND SESSIONS

## 4.1 Methods

* Email + password (Argon2id; parameters tuned to ~250 ms per hash)
* MFA: TOTP (RFC 6238) mandatory for Super Admin and Company Admin; optional for others (configurable per tenant)
* Recovery codes (10 single-use codes, stored hashed)
* SSO (OIDC/SAML) as a later enterprise feature; design `auth_identities` table for it

## 4.2 Password policy

* Minimum 12 characters; check against breached password list (k-anonymity API or local list)
* No forced periodic rotation (NIST guidance); force reset on suspected compromise
* Lockout: progressive delay after 5 failed attempts per account and per IP; alert on abnormal patterns

## 4.3 Sessions and tokens

* Short-lived access token (15 min) + rotating refresh token (7–30 days) stored in an `HttpOnly; Secure; SameSite=Lax` cookie
* Refresh token rotation with reuse detection: if an old refresh token is reused, revoke the entire token family
* `sessions` table records device, IP, user agent, created, last_seen, revoked_at
* Users can view and revoke their sessions
* Idle timeout and absolute timeout configurable per tenant (Settings → Security)

## 4.4 CSRF

* Cookie-based auth: require a double-submit CSRF token or `SameSite=Strict` plus custom header check for state-changing requests.

## 4.5 Invitations and onboarding

1. Admin invites user by email with role and groups.
2. System creates `invitations` row with hashed token, expiry (72 hours), tenant_id, role.
3. Recipient opens link, sets password, enrolls MFA if required.
4. Invitation is single-use and revocable.
5. Invitation email must never reveal other tenants or users.

## 4.6 Login response requirements

* Generic error message for wrong email/password ("Email or password is incorrect").
* Suspended tenant → generic-but-clear message ("Your workspace is currently unavailable. Contact your administrator.").
* All login attempts (success/failure) go to the auth log.

---

# 5. ROLES, PERMISSIONS AND RBAC

## 5.1 Model

```text
users ── memberships ── tenants
             │
             ├── role_id      → roles → role_permissions → permissions
             ├── groups       → group_members → groups → group_permissions (optional)
             └── permission_overrides (allow/deny, per user)
```

**Effective permissions** = (role permissions ∪ group permissions ∪ user allow-overrides) − user deny-overrides.

Deny overrides win over allows.

## 5.2 System roles (seeded per tenant, cloneable)

* `company_admin`
* `member`
* `visitor`

Tenants may create **custom roles** (e.g., "Sales Manager") built from the permission catalogue. System roles' base permissions can be edited only by Company Admin and never below a defined safety floor (e.g., `company_admin` always retains `users.*` and `settings.*`; there must always be at least one active Company Admin).

## 5.3 Permission catalogue

```text
leads.view          leads.view_all      leads.view_assigned_only
leads.create        leads.update        leads.delete
leads.import        leads.export        leads.assign
leads.bulk_update   leads.merge         leads.archive

pipeline.view       pipeline.manage

tags.view           tags.manage
views.manage_shared

campaigns.view      campaigns.create    campaigns.update
campaigns.delete    campaigns.send      campaigns.approve
templates.view      templates.manage

communications.view communications.send
inbox.view_all      inbox.view_assigned_only

followups.view      followups.create    followups.update
followups.view_team

ai.use              ai.configure

analytics.view      analytics.team      reports.export

documents.view      documents.create    documents.update
documents.delete    documents.manage_permissions

users.view          users.create        users.update
users.delete        users.reset_access
groups.manage       roles.manage

settings.view       settings.update
integrations.view   integrations.manage
audit.view          security.manage
```

## 5.4 Default permission matrix

Legend: ✔ = allowed, ◐ = allowed on own/assigned records only, ✖ = denied.

| Permission | Company Admin | Member | Visitor |
|---|---|---|---|
| leads.view | ✔ | ✔ | ✔ |
| leads.create | ✔ | ✔ | ✖ |
| leads.update | ✔ | ◐ (assigned or unassigned, configurable) | ✖ |
| leads.delete | ✔ | ✖ | ✖ |
| leads.import | ✔ | ✖ (configurable) | ✖ |
| leads.export | ✔ | ✖ (configurable) | ✖ |
| leads.assign | ✔ | ✖ (configurable) | ✖ |
| pipeline.view | ✔ | ✔ | ✔ |
| pipeline.manage (stages config) | ✔ | ✖ | ✖ |
| campaigns.view | ✔ | ✔ | ✔ (results only) |
| campaigns.create | ✔ | ✔ (draft only) | ✖ |
| campaigns.send | ✔ | ✖ (requires approval) | ✖ |
| communications.send | ✔ | ✔ (1:1 only) | ✖ |
| followups.create | ✔ | ✔ | ✖ |
| ai.use | ✔ | ✔ | ✖ |
| analytics.view | ✔ | ✔ | ✔ |
| analytics.team | ✔ | ✖ | ✖ |
| documents.view | ✔ | ✔ | ◐ (explicit) |
| documents.create/update | ✔ | ✔ | ✖ |
| users.* | ✔ | ✖ | ✖ |
| settings.* | ✔ | ✖ | ✖ |
| integrations.manage | ✔ | ✖ | ✖ |
| audit.view | ✔ | ✖ | ✖ |

## 5.5 Enforcement

* A single `@RequirePermission('leads.update')` NestJS Guard / custom decorator on every controller route.
* Permission checks must be **resource-aware** where scoped (◐): the check receives the resource and evaluates ownership.
* Permissions are cached per session for a short TTL (≤ 60 s) and invalidated on role change.
* A CI test enumerates all routes and fails if any route lacks an explicit permission declaration or an explicit `@Public()` decorator.

---

# 6. DATABASE DESIGN

## 6.1 Conventions

* Table and column names: `snake_case`, plural table names.
* Every tenant-owned table: `id uuid PK`, `tenant_id uuid NOT NULL REFERENCES tenants(id)`, `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()`, `created_by uuid`, `updated_by uuid`.
* Soft delete where undo/retention matters: `deleted_at timestamptz NULL`. Hard delete is available only via retention jobs.
* All timestamps stored in UTC; presentation converts using the tenant/user timezone.
* Composite foreign keys that include `tenant_id` to prevent cross-tenant references, e.g., `FOREIGN KEY (tenant_id, lead_id) REFERENCES leads(tenant_id, id)`. This requires `UNIQUE (tenant_id, id)` on parent tables.
* Migrations only via Alembic (or equivalent). No manual schema edits.

## 6.2 Core tables (essential columns)

### Platform / identity

```sql
tenants (
  id uuid PK, name text NOT NULL, slug text UNIQUE NOT NULL,
  status text NOT NULL CHECK (status IN ('provisioning','active','suspended','pending_deletion','deleted')),
  plan text, timezone text DEFAULT 'UTC', currency text, date_format text,
  branding jsonb, settings jsonb, created_at, updated_at
);

users (
  id uuid PK, email citext UNIQUE NOT NULL, password_hash text,
  full_name text, is_platform_admin boolean DEFAULT false,
  mfa_enabled boolean DEFAULT false, status text, last_login_at timestamptz,
  created_at, updated_at
);

memberships (
  id uuid PK, tenant_id uuid NOT NULL, user_id uuid NOT NULL,
  role_id uuid NOT NULL, status text, last_active_at timestamptz,
  UNIQUE (tenant_id, user_id), UNIQUE (tenant_id, id)
);

roles (id, tenant_id, name, is_system boolean, description);
permissions (id, code text UNIQUE, description);           -- global catalogue
role_permissions (tenant_id, role_id, permission_id);
groups (id, tenant_id, name, description);
group_members (tenant_id, group_id, membership_id);
permission_overrides (tenant_id, membership_id, permission_id, effect text CHECK (effect IN ('allow','deny')));

sessions (id, user_id, tenant_id, refresh_hash, device, ip, user_agent, created_at, last_seen_at, revoked_at);
invitations (id, tenant_id, email, role_id, token_hash, expires_at, accepted_at, revoked_at, invited_by);
mfa_factors (id, user_id, type, secret_encrypted, verified_at);
recovery_codes (id, user_id, code_hash, used_at);
```

### CRM

```sql
leads (
  id uuid PK, tenant_id uuid NOT NULL,
  first_name text, last_name text, full_name text,
  company_name text, designation text, industry text,
  email citext, email_normalized citext,
  phone text, phone_e164 text, whatsapp_e164 text,
  website text, linkedin text,
  country text, state text, city text, location_text text,
  source text, status_stage_id uuid, lead_score smallint,
  score_source text CHECK (score_source IN ('manual','rule','ai')),
  owner_membership_id uuid,
  last_contacted_at timestamptz, next_followup_at timestamptz,
  do_not_contact boolean DEFAULT false, email_opt_out boolean DEFAULT false, whatsapp_opt_out boolean DEFAULT false,
  custom jsonb DEFAULT '{}',
  search_vector tsvector,
  archived_at timestamptz, deleted_at timestamptz,
  import_id uuid, created_at, updated_at,
  UNIQUE (tenant_id, id)
);

pipeline_stages (id, tenant_id, name, color, position int, probability smallint, is_won boolean, is_lost boolean, is_active boolean);
tags (id, tenant_id, name, color, UNIQUE (tenant_id, lower(name)));
lead_tags (tenant_id, lead_id, tag_id, PRIMARY KEY (tenant_id, lead_id, tag_id));
lead_notes (id, tenant_id, lead_id, author_membership_id, body text, pinned boolean);
lead_activities (id, tenant_id, lead_id, type text, actor_membership_id, payload jsonb, occurred_at timestamptz);   -- timeline
lead_assignments (id, tenant_id, lead_id, from_membership_id, to_membership_id, assigned_by, assigned_at);
saved_views (id, tenant_id, owner_membership_id, name, filters jsonb, columns jsonb, sort jsonb, is_shared boolean);
lead_lists (id, tenant_id, name, type text CHECK (type IN ('static','dynamic')), filters jsonb);
lead_list_members (tenant_id, list_id, lead_id);
custom_fields (id, tenant_id, entity text, key text, label text, type text, options jsonb, required boolean, position int, is_active boolean);
```

### Follow-ups

```sql
followups (
  id, tenant_id, lead_id, owner_membership_id, due_at timestamptz,
  type text CHECK (type IN ('call','email','whatsapp','meeting','task','other')),
  priority text CHECK (priority IN ('low','medium','high','urgent')),
  notes text, status text CHECK (status IN ('pending','completed','cancelled')),
  completed_at timestamptz, source text CHECK (source IN ('manual','sequence','ai_suggested'))
);
```

> **Note:** "Overdue" is a **derived** state (`status='pending' AND due_at < now()`), not stored, to avoid needing a job to flip statuses. The API exposes it as a computed field.

### Campaigns and communications

```sql
templates (id, tenant_id, channel text, name, subject text, body text, variables jsonb, provider_template_id text, provider_status text, locale text, version int);
campaigns (id, tenant_id, name, channel text, status text, audience_snapshot_id uuid, audience_filters jsonb, template_id uuid, sequence_id uuid,
           schedule jsonb, send_window jsonb, throttle jsonb, created_by, approved_by, approved_at, started_at, completed_at);
campaign_steps (id, tenant_id, campaign_id, step_order int, channel text, template_id uuid, delay_minutes int, conditions jsonb);
campaign_members (id, tenant_id, campaign_id, lead_id, status text, current_step int, next_run_at timestamptz, stopped_reason text, last_event_at, UNIQUE (tenant_id, campaign_id, lead_id));
conversations (id, tenant_id, lead_id, channel text, external_thread_id text, status text, assigned_membership_id, last_message_at, unread_count int);
messages (id, tenant_id, conversation_id, lead_id, campaign_id, campaign_step_id, direction text CHECK (direction IN ('outbound','inbound')),
          channel text, provider text, provider_message_id text, subject text, body text, body_html text,
          status text, error_code text, error_detail text, sent_at, delivered_at, opened_at, clicked_at, replied_at,
          sent_by_membership_id, ai_classification jsonb);   -- classification stored separately from body
message_events (id, tenant_id, message_id, type text, payload jsonb, occurred_at);   -- webhook events
unsubscribes / suppressions (id, tenant_id, channel, address_normalized, reason, source, created_at, UNIQUE (tenant_id, channel, address_normalized));
integrations (id, tenant_id, type text, provider text, status text, config jsonb, secret_ref text, connected_by, connected_at);  -- secrets NOT stored in plain text
```

### Files, imports, exports

```sql
documents (id, tenant_id, folder_id, name, mime_type, size_bytes, storage_key, checksum, current_version int, metadata jsonb, deleted_at);
document_folders (id, tenant_id, parent_id, name, path);
document_versions (id, tenant_id, document_id, version int, storage_key, size_bytes, checksum, uploaded_by, uploaded_at);
document_permissions (id, tenant_id, document_id, principal_type, principal_id, access text);
imports (id, tenant_id, uploaded_by, file_key, original_filename, status text, mapping jsonb, duplicate_strategy text,
         total_rows int, valid_rows int, invalid_rows int, duplicate_rows int, created_rows int, updated_rows int, skipped_rows int,
         started_at, finished_at, error_report_key text);
import_rows (id, tenant_id, import_id, row_number int, raw jsonb, normalized jsonb, status text, errors jsonb, matched_lead_id uuid);
exports (id, tenant_id, requested_by, entity text, format text, filters jsonb, columns jsonb, status text, file_key text, row_count int, created_at, expires_at);
```

### Cross-cutting

```sql
notifications (id, tenant_id, membership_id, type text, title text, body text, entity_type text, entity_id uuid, read_at, created_at);
notification_preferences (tenant_id, membership_id, type text, in_app boolean, email boolean);
audit_logs (id, tenant_id, actor_id, actor_type text, on_behalf_of_tenant uuid, support_session_id uuid, action text, entity_type text, entity_id uuid,
            metadata jsonb, ip_address inet, user_agent text, request_id uuid, created_at timestamptz);
ai_requests (id, tenant_id, membership_id, feature text, model text, prompt_hash text, input_tokens int, output_tokens int, cost_micro int, status text, created_at);
ai_insights (id, tenant_id, lead_id, type text, content jsonb, model text, generated_at, is_stale boolean);
```

## 6.3 Index plan

Base indexes for `leads` (all begin with `tenant_id`):

```sql
CREATE INDEX leads_tenant_status_idx      ON leads (tenant_id, status_stage_id) WHERE deleted_at IS NULL;
CREATE INDEX leads_tenant_owner_idx       ON leads (tenant_id, owner_membership_id) WHERE deleted_at IS NULL;
CREATE INDEX leads_tenant_score_idx       ON leads (tenant_id, lead_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX leads_tenant_created_idx     ON leads (tenant_id, created_at DESC);
CREATE INDEX leads_tenant_updated_idx     ON leads (tenant_id, updated_at DESC);
CREATE INDEX leads_tenant_followup_idx    ON leads (tenant_id, next_followup_at) WHERE next_followup_at IS NOT NULL;
CREATE INDEX leads_tenant_email_idx       ON leads (tenant_id, email_normalized);
CREATE INDEX leads_tenant_phone_idx       ON leads (tenant_id, phone_e164);
CREATE INDEX leads_tenant_whatsapp_idx    ON leads (tenant_id, whatsapp_e164);
CREATE INDEX leads_tenant_industry_idx    ON leads (tenant_id, industry);
CREATE INDEX leads_search_idx             ON leads USING gin (search_vector);
CREATE INDEX leads_name_trgm_idx          ON leads USING gin (full_name gin_trgm_ops);
CREATE INDEX leads_company_trgm_idx       ON leads USING gin (company_name gin_trgm_ops);
CREATE INDEX leads_custom_gin_idx         ON leads USING gin (custom jsonb_path_ops);
```

Additional guidance:

* Uniqueness for duplicate prevention is **policy-driven** (configurable), so do not put a hard `UNIQUE (tenant_id, email)` constraint unless the tenant chooses "skip duplicates". Use a partial unique index only if enforced by tenant setting.
* Use **keyset pagination** (cursor on `(sort_column, id)`) for large lists rather than `OFFSET`. Offer page numbers only for smaller filtered result sets.
* Use `EXPLAIN (ANALYZE, BUFFERS)` on the top 15 queries before Phase 11. Record results in `docs/performance.md`.
* Consider table partitioning (hash by `tenant_id` or range by `created_at`) for `messages`, `lead_activities`, and `audit_logs` once they exceed ~50M rows.

---

# 7. ROW-LEVEL SECURITY IMPLEMENTATION

## 7.1 Pattern

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON leads
  USING      (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

* `current_setting(..., true)` returns NULL if not set, which makes the policy evaluate to false → **no rows** (fail closed).
* Apply the same policy programmatically to **every** table with `tenant_id` via a migration helper. A CI check queries `information_schema.columns` for all tables having `tenant_id` and fails if any lacks RLS enabled and forced.

## 7.2 Database roles

| Role | Purpose | Privileges |
|---|---|---|
| `app_owner` | Runs migrations | Owns schema; not used at runtime |
| `app_runtime` | API and workers | DML only; **no** `BYPASSRLS`, not superuser |
| `app_platform` | Super Admin cross-tenant queries | Separate connection pool; only used from `platform_*` code paths; audited |
| `app_readonly_analytics` (optional) | Reporting replica | Read-only; RLS still applied |

## 7.3 Audit log immutability

* `audit_logs`: `REVOKE UPDATE, DELETE ON audit_logs FROM app_runtime;` plus a trigger that raises an exception on UPDATE/DELETE.
* Optional: hash-chain (each row stores `prev_hash` and `row_hash`) to make tampering detectable; periodically anchor the chain head externally.

## 7.4 Tests

* Automated test: connect as `app_runtime` with `app.tenant_id` set to A; attempt `SELECT * FROM leads WHERE tenant_id = B` → must return 0 rows.
* Test: `INSERT` with mismatched `tenant_id` → must fail the `WITH CHECK`.
* Test: without setting `app.tenant_id` → 0 rows.

---

# 8. API DESIGN STANDARDS

## 8.1 Conventions

* Base path `/api/v1`, JSON only, `snake_case` fields (or `camelCase` consistently — pick one and enforce with a shared schema).
* Resource-oriented URLs; verbs via HTTP methods; actions as sub-resources (`POST /leads/{id}/assign`).
* Every request gets a `request_id` (generated or from `X-Request-ID`), echoed in responses and logs.
* Idempotency: `POST` endpoints that trigger sends/imports accept `Idempotency-Key` header; server stores the key and response for 24 h.
* Rate limits per user, per tenant, and per IP (see Section 29).

## 8.2 Request pipeline (mandatory order)

1. Authenticate
2. Resolve tenant (from session only)
3. Check tenant status
4. Check permission (and resource-level scope)
5. Validate input (schema validation, size limits, allow-listed sort/filter fields)
6. Execute in transaction with RLS context
7. Audit log (if in the auditable list)
8. Return sanitized response DTO (never raw ORM objects)

## 8.3 Response envelope

Success (list):

```json
{
  "data": [ { "id": "…", "…": "…" } ],
  "page": { "next_cursor": "eyJ…", "has_more": true, "total_estimate": 16000 },
  "request_id": "…"
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields need attention.",
    "details": [ { "field": "email", "issue": "Invalid email format" } ],
    "request_id": "…"
  }
}
```

Standard error codes: `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `VALIDATION_ERROR` (422), `CONFLICT` (409), `RATE_LIMITED` (429), `TENANT_SUSPENDED` (403), `PROVIDER_ERROR` (502), `INTERNAL_ERROR` (500 — generic message only; stack trace logged server-side).

## 8.4 Endpoint catalogue (representative)

**Auth**

```text
POST   /auth/login
POST   /auth/mfa/verify
POST   /auth/refresh
POST   /auth/logout
POST   /auth/password/forgot
POST   /auth/password/reset
POST   /auth/invitations/accept
GET    /auth/sessions            DELETE /auth/sessions/{id}
```

**Platform (Super Admin only)**

```text
GET/POST        /platform/tenants
GET/PATCH       /platform/tenants/{id}
POST            /platform/tenants/{id}/suspend | /activate
POST            /platform/tenants/{id}/support-access      (reason required)
GET             /platform/stats | /platform/health | /platform/audit
```

**Leads**

```text
GET    /leads?cursor=&limit=&q=&status=&owner=&tag=&score_min=&score_max=&industry=&location=&source=
       &created_from=&created_to=&last_contact_from=&last_contact_to=&followup_from=&followup_to=
       &has_email=&has_whatsapp=&sort=&order=
POST   /leads
GET    /leads/{id}
PATCH  /leads/{id}
DELETE /leads/{id}                 (soft delete)
POST   /leads/{id}/restore
POST   /leads/{id}/assign
POST   /leads/{id}/status
POST   /leads/{id}/notes           GET /leads/{id}/notes
GET    /leads/{id}/timeline
POST   /leads/{id}/tags            DELETE /leads/{id}/tags/{tag_id}
POST   /leads/bulk                 { action, selection: {ids[] | filter}, params }
GET    /leads/facets               (counts for filters)
POST   /leads/merge
GET/POST/PATCH/DELETE /saved-views
```

**Import/Export**

```text
POST   /imports                    (returns upload URL / creates import in 'uploaded')
POST   /imports/{id}/detect        (detect columns, sample rows)
PUT    /imports/{id}/mapping
POST   /imports/{id}/validate      (async)
GET    /imports/{id}/summary
GET    /imports/{id}/rows?status=invalid|duplicate
POST   /imports/{id}/commit        (async)
POST   /imports/{id}/cancel
GET    /imports                    (history)
GET    /imports/{id}/error-report  (signed URL)
POST   /exports                    GET /exports/{id}  GET /exports/{id}/download
```

**Others** follow the same style: `/pipeline/stages`, `/followups`, `/campaigns`, `/campaigns/{id}/start|pause|resume|cancel`, `/templates`, `/conversations`, `/messages`, `/documents`, `/ai/*`, `/analytics/*`, `/integrations/*`, `/audit`.

## 8.5 Bulk operation contract

```json
POST /leads/bulk
{
  "action": "assign",
  "selection": { "mode": "filter", "filter": { "status": "New", "industry": "SaaS" }, "expected_count": 1240 },
  "params": { "owner_id": "…" },
  "dry_run": false
}
```

Rules:

* `selection.mode` is `ids` (max 1,000) or `filter` (server re-evaluates filter; **must** include `expected_count` and the server rejects if the count differs by more than a small tolerance, to prevent stale-selection accidents).
* `dry_run: true` returns the affected count and a sample without changes.
* Bulk actions above a threshold (default 500 rows) run as background jobs and return a `job_id`.
* Communication-related bulk actions (`add_to_campaign`) never send anything; sending only happens through campaign start with its own approval.

---

# 9. LEADS MODULE

## 9.1 Lead list behaviour

* Server-side filtering, sorting and cursor pagination. Default page size 50; max 200.
* Columns: user-selectable, persisted per user; default set: Name, Company, Designation, Email, Phone, Status, Owner, Score, Last Contacted, Next Follow-up, Tags.
* Virtualised rows for smooth scrolling.
* Select modes: "This page", "All matching filter (N)". The second requires an explicit confirmation showing the count.
* Saved views: personal or shared (`views.manage_shared` to share). A view stores filters, columns, sort.
* Facet counts (status, owner, industry, tags) computed with capped, cached queries; approximate counts are acceptable above ~100k rows (label as "~").
* Empty state: guides to import or add a lead. Error state: retry with request ID.

## 9.2 Lead creation and update rules

* Normalisation on write: trim, collapse whitespace; email lower-cased and validated (syntax; optional MX check async); phone parsed with `libphonenumber` using the tenant's default country to E.164; store raw and normalised values.
* `full_name` derived if only first/last given (and vice versa, best-effort).
* Every field change appends a `lead_activities` entry (`field_changed` with old/new values, limited to non-sensitive fields).
* Optimistic concurrency: PATCH requires `If-Match` / `version` field; on conflict return 409 with the current state.
* Ownership scoping: a user with only `leads.view_assigned_only` sees only their leads.

## 9.3 Lead detail page (360°)

Layout: header (name, company, status chip, score with "AI"/"Rule" badge, owner, quick actions) + tabs/sections:

1. **Overview:** contact, company, custom fields (editable inline with permission)
2. **Timeline:** merged stream of activities, messages, notes, follow-ups, imports, assignments; filterable by type; infinite scroll
3. **Communications:** conversations by channel; composer respecting opt-out flags
4. **Follow-ups:** upcoming/completed
5. **Campaigns:** membership, step position, stop reason
6. **AI Insights:** each insight labelled "AI-generated", with model, timestamp, "regenerate", "mark useful/not useful"
7. **Documents:** linked files
8. **Notes:** pinned notes first

**Verified vs AI:** fields directly from import/user input display normally; AI-derived content sits in visually distinct panels with a persistent "AI-generated — verify before use" label and never overwrites verified fields without explicit user acceptance.

## 9.4 Lead scoring (rule-based first)

Configurable weighted rules stored per tenant:

```json
{
  "rules": [
    { "factor": "industry_match", "weight": 20, "config": { "industries": ["SaaS","FinTech"] } },
    { "factor": "designation_seniority", "weight": 20, "config": { "keywords": {"cto":1.0,"vp":0.8,"manager":0.5} } },
    { "factor": "company_size", "weight": 10, "config": { "bands": [[1,10,0.2],[11,200,0.7],[201,5000,1.0]] } },
    { "factor": "contact_availability", "weight": 10, "config": { "email":0.5, "phone":0.3, "whatsapp":0.2 } },
    { "factor": "engagement", "weight": 25, "config": { "opened":0.3, "clicked":0.6, "replied":1.0, "decay_days":30 } },
    { "factor": "campaign_activity", "weight": 15 }
  ],
  "hot_threshold": 75
}
```

* Score = clamp(sum(weight × factor_value), 0, 100), stored with `score_source='rule'` and a `score_breakdown` (explainability) available on the lead.
* Recalculation: on relevant events (debounced) and nightly batch; never block the request path.
* AI-assisted score (Phase 9) is stored separately (`ai_score`), never silently replacing the rule score.

---

# 10. CUSTOM FIELDS ARCHITECTURE

**Approach:** hybrid. Core, frequently filtered fields are real columns. Tenant-specific fields live in `leads.custom` (JSONB) with definitions in `custom_fields`.

* Supported types: text, long text, number, decimal, currency, date, datetime, boolean, single-select, multi-select, URL, email, phone.
* Validation on write against the definition (type, required, options, min/max).
* Filtering: JSONB containment (`custom @> '{"budget_band":"10-50L"}'`) with the GIN index; for heavily used fields, an admin action "Promote to indexed field" can create an expression index (`CREATE INDEX … ((custom->>'key'))`) — executed via a controlled migration job with a per-tenant limit.
* Renaming a field label doesn't change the key; deleting a field is soft (hidden) with a data-retention prompt.
* Import mapping can target custom fields (and can create them on the fly with admin permission).
* Alternative considered: EAV (`custom_field_values` table). Rejected as default because of query cost at millions of rows; keep the `custom_field_values` table only if strict per-value auditing or typed indexing is later required. Record this decision in an ADR.

---

# 11. IMPORT PIPELINE

## 11.1 Stages and states

```text
uploaded → detecting → awaiting_mapping → validating → awaiting_review → importing → completed
                                                     ↘ failed / cancelled
```

## 11.2 Step-by-step

1. **Upload**
   * Accept `.xlsx`, `.csv` (and optionally `.xls`, `.tsv`). Max size configurable (default 100 MB).
   * Upload directly to object storage via presigned URL (`tenants/{tenant}/imports/{import_id}/original.ext`).
   * Validate: extension + MIME + magic bytes; reject macros (`.xlsm`); scan for malware if scanner available.
   * Guard against zip bombs / XML entity attacks (use `defusedxml`; cap uncompressed size and row count).
2. **Detect columns**
   * Stream the first N rows (e.g., 200) to detect header row (heuristics: first row with mostly non-empty strings), sheet selection for multi-sheet XLSX, delimiter and encoding for CSV (charset detection; default UTF-8, fallback Windows-1252).
   * Return headers plus sample values and inferred types.
3. **Map columns**
   * Auto-suggest mapping via header synonyms (`Mobile`, `Phone No`, `Contact` → `phone`; `Organisation` → `company_name`), fuzzy matching, and previous mapping templates (saved per tenant).
   * User maps `Excel Column → Portal Field` (including custom fields, "Ignore", "Split into first/last name").
   * Mandatory rule: at least one identifying field (email, phone, whatsapp, or name+company) must be mapped.
   * Save mapping as a reusable template.
4. **Validate** (background job, streaming, chunks of e.g. 1,000 rows)
   * Normalise: trim, case, phone → E.164 (using default country + per-row country if present), email syntax, URL normalisation, date parsing with declared format.
   * Row statuses: `valid`, `warning` (e.g., missing optional field), `invalid` (with machine-readable error codes: `INVALID_EMAIL`, `INVALID_PHONE`, `MISSING_IDENTIFIER`, `TOO_LONG`, …).
   * Write to `import_rows` (staging). For very large files, store `raw` compactly and purge after retention (e.g., 30 days).
5. **Duplicate detection** (see 11.3)
6. **Preview**
   * Summary counts (valid/invalid/duplicates), first N rows of each category, downloadable error CSV.
   * Admin selects duplicate strategy and whether to include warnings/invalid rows (invalid never imported).
7. **Import** (background job)
   * Batches of 1,000–5,000 rows using `INSERT … ON CONFLICT` / `COPY` into a staging table then set-based merge, in short transactions. RLS context set per batch.
   * Progress reported via `imports.progress` and SSE/polling.
   * Idempotent and resumable: job can restart from the last committed batch; re-running must not duplicate leads.
   * After import: assign `import_id` on leads, add a `lead_activities` entry ("Imported"), optionally apply tags/owner/stage to all imported leads (import options).
   * Post-processing tasks (search vector, scoring) queued asynchronously in batches.
8. **Summary**
   * Created, updated, skipped, failed; link to error report; undo option (see 11.4).

## 11.3 Duplicate detection

Configurable per tenant (and overridable per import):

| Rule | Method | Notes |
|---|---|---|
| Email exact | `email_normalized` equality | Gmail dot/plus normalisation optional |
| Phone exact | `phone_e164` equality | After E.164 normalisation |
| WhatsApp exact | `whatsapp_e164` equality | |
| Company + name | normalised (`lower`, strip punctuation/suffixes like "Pvt Ltd") | |
| Fuzzy | `pg_trgm` similarity ≥ threshold on name + company, plus at least one matching secondary field | Flag for review, never auto-merge |

Two duplicate scopes:

* **Within file** (same email twice in the upload)
* **Against existing leads** (DB lookup by index)

Strategies: `skip`, `update_existing` (with field-level policy: only fill blanks / overwrite / per-field), `create_anyway`, `review` (rows placed in a review queue UI showing side-by-side comparison with merge choices).

## 11.4 Undo and history

* Each import stores created lead IDs (via `leads.import_id`), enabling "Undo import" within a time window for leads that haven't been edited/contacted since; otherwise show which leads can't be safely reverted.
* Import history lists file, uploader, date, counts, status, duration, and links.

## 11.5 Error handling and UX copy

Use human-readable messages, e.g.:

```text
We couldn't import 3,421 of 16,000 rows.
• 2,900 have an invalid phone number
• 521 are missing both email and phone
[Download error report]   [Review rows]   [Import valid rows only]
```

## 11.6 Performance targets

* 16,000 rows: validate + import in under ~60 seconds on default infrastructure.
* 500,000 rows: complete without exhausting memory (streaming parsers only; never load entire workbook into memory unless file is small).
* UI never blocks; polling/SSE shows progress and ETA.

---

# 12. EXPORT PIPELINE

* Requires `leads.export`. Every export is recorded in `exports` and written to the audit log (`LEAD_EXPORTED`, with filters and row count).
* Formats: CSV (streamed), XLSX (write-only streaming, sheet split at ~1M rows).
* Exports run as background jobs; results stored at `tenants/{tenant}/exports/{export_id}.ext`, served through short-lived signed URLs, expiring (default 7 days), then purged.
* Column-level control: sensitive columns (phone, email) may be excluded for roles without a specific permission (`leads.export_contact_details`).
* Guard rails: max rows per export per role (configurable), rate limit (e.g., 5 exports/hour/user), optional admin approval for exports over a threshold, optional watermark column (exporter + timestamp).
* CSV injection protection: prefix cells starting with `= + - @` with a single quote.
* Notify the requester when ready (in-app + email).

---

# 13. PIPELINE (KANBAN) MODULE

* Stages are per-tenant rows: `name`, `color`, `position`, `probability`, `is_won`, `is_lost`, `is_active`.
* Defaults seeded on tenant creation: New (10%), Contacted (20%), Interested (40%), Meeting (60%), Proposal (80%), Won (100%, `is_won`), Lost (0%, `is_lost`).
* Rules: exactly one or more won/lost terminal stages allowed; a stage with leads cannot be deleted—only deactivated, or leads must be reassigned to another stage first.
* Kanban board: columns load lazily (first 25 cards each, infinite scroll per column), counts from aggregate queries; drag and drop calls `POST /leads/{id}/status` with optimistic UI and rollback on failure; keyboard-accessible alternative ("Move to…" menu).
* Moving to Lost prompts for a loss reason (configurable list); moving to Won can prompt for deal value.
* Status change writes activity, triggers sequence stop rules ("stop on manual status change" or "stop on meeting"), and updates analytics.
* List view = lead list with a stage grouping option and stage filter.
* Forecast: sum(deal_value × stage probability) shown on the pipeline header (only if deal values are used).

---

# 14. FOLLOW-UPS MODULE

* Creation from lead page, bulk action, inbox message ("follow up on this"), AI suggestion (user must accept), or sequence step (type `task`).
* Views: Today, Upcoming (next 7/30 days), Overdue, Calendar (month/week/day), My, Team (requires `followups.view_team`).
* Timezone: `due_at` stored UTC; displayed in the assigned user's timezone; "Today" boundaries computed in the viewer's timezone.
* Reminders: notification at due time and optional 15 min/1 h/1 day before; daily digest email of due/overdue items (user-configurable).
* Snooze (reschedule) preserves history (`followup_events`).
* Completing a follow-up prompts an optional outcome note and offers to schedule the next one; updates `leads.next_followup_at` (denormalised; recomputed as the earliest pending follow-up) and `last_contacted_at` if the type was a contact.
* Calendar sync (Google/Microsoft) as an optional later integration; use ICS export as an interim.
* Reassignment when a user is deactivated: admin prompted to reassign their pending follow-ups and leads.

---

# 15. CAMPAIGN AND SEQUENCE ENGINE

## 15.1 Concepts

* **Template:** message content per channel with variables.
* **Sequence:** ordered steps with delays and conditions.
* **Campaign:** audience + sequence/template + schedule + safeguards.
* **Campaign member:** one lead's progress through the sequence.

## 15.2 Campaign lifecycle

```text
Draft → (Submit for approval if required) → Scheduled → Running ⇄ Paused → Completed
                                                    ↘ Cancelled
```

* Only `Draft` is editable; editing a Running campaign's future steps creates a new version, applied to members who haven't reached the changed step.
* Start requires `campaigns.send`; Members may need `campaigns.approve` from an Admin (tenant setting "Require approval before sending").

## 15.3 Audience

* Built from a saved view, dynamic filter, static list, or manual selection.
* On start, the audience is **snapshotted** into `campaign_members` (so later changes don't silently expand it). Optional "auto-enrol new matching leads" flag (off by default and requires re-approval).
* Automatic exclusions (cannot be overridden by Members): `do_not_contact`, channel opt-outs, suppression list matches, bounced addresses, invalid contact for the channel, leads already in an active campaign for the same channel (configurable), leads contacted within X days (configurable frequency cap).
* Pre-send review screen shows: total selected, excluded (with reasons), estimated send duration, sample rendered messages for 3 random leads, and the sender identity.

## 15.4 Safeguards against accidental mass outreach

* Two-step confirmation with typed confirmation for large audiences (e.g., type the campaign name or "SEND 2,431").
* Test send to self before launch (required at least once for a new template).
* Hard daily caps per channel per tenant and per sender; warm-up schedule for new sending domains.
* Emergency **Pause all outreach** switch for tenant admins (and Super Admin).
* Every send is logged in `messages` and the audit log summary (`CAMPAIGN_STARTED`, `MESSAGE_SENT` aggregated for bulk).
* Dry-run mode renders messages but sends nothing.

## 15.5 Sequence execution

Scheduler design:

1. `campaign_members.next_run_at` marks when the member's next step is due.
2. A scheduler job (every minute) selects due members using `SELECT … FOR UPDATE SKIP LOCKED` in batches, per tenant fairness (round-robin) to prevent one tenant starving others.
3. For each member: re-check stop conditions and exclusions **at send time**, evaluate business hours (member's/lead's or tenant's timezone) and working days; if outside window, push `next_run_at` to the next valid window.
4. Enqueue a `send_message` job with an idempotency key `(campaign_id, lead_id, step_id)`.
5. Worker renders template, sends via provider adapter, records result, computes the next step's `next_run_at`.

Stop conditions (checked continuously and by event handlers): reply received, meeting booked / stage moved to Meeting+, unsubscribe or WhatsApp opt-out, manual status change to configured stages, bounce (hard), lead deleted/archived, campaign paused/cancelled, tenant suspended.

Conditional branching (later): steps may have conditions such as "if opened but no reply after 3 days".

## 15.6 Templates and variables

* Variable syntax `{{first_name}}`, with fallbacks `{{first_name|there}}`; custom fields available as `{{custom.key}}`.
* Rendering uses a sandboxed template engine (no code execution); HTML output escaped by default.
* Preview with real lead data; block sending if any required variable is empty (or use fallback).
* Email templates: subject + HTML + plain-text alternative, unsubscribe footer auto-inserted (cannot be removed for marketing campaigns).
* WhatsApp templates: must map to provider-approved templates (see Section 17).

## 15.7 Campaign analytics (per campaign)

Sent, delivered, opened, clicked, replies, interested (by classification), meetings, conversions, unsubscribes, bounces, failures; by step and by day; per-sender breakdown; funnel visualisation. Open tracking is treated as an **unreliable signal** (mail-privacy proxies) and labelled accordingly.

---

# 16. EMAIL INTEGRATION

## 16.1 Provider abstraction

```text
EmailProvider (interface)
  connect(tenant_config) → ConnectionStatus
  send(message) → ProviderMessageId
  fetch_replies(since) / handle_webhook(payload)
  get_delivery_status(id)
  disconnect()

Adapters: MicrosoftGraphProvider, GmailProvider, SmtpProvider, SesProvider/SendGridProvider
```

Adding a provider = new adapter + registration; no changes to campaign logic.

## 16.2 Connection

* OAuth 2.0 for Microsoft 365 / Google Workspace (least-privilege scopes: send + read replies for the connected mailbox). Tokens stored **encrypted** (envelope encryption with a KMS key), refresh handled server-side, connection health monitored with alerts to admins on failure.
* SMTP: host, port, TLS mode, credentials encrypted at rest; "Send test email" verification.
* Sender identities: per-user connected mailboxes and/or shared company sender; the campaign chooses the sender pool.

## 16.3 Deliverability

* Guide admin to set up SPF, DKIM, DMARC; run DNS checks in the UI.
* Per-mailbox sending limits (respect provider quotas), randomised small delays, warm-up ramp.
* `List-Unsubscribe` and `List-Unsubscribe-Post` headers; one-click unsubscribe endpoint (public, token-based, tenant-scoped).
* Physical address/company identification in footer (legal requirement in many jurisdictions).

## 16.4 Tracking

* Open: optional tracking pixel (tenant setting; default off or clearly disclosed). Click: link wrapping via tenant-scoped redirect domain (custom domain support later). Tokens are signed and unguessable; redirects validated against an allow-list to prevent open-redirect abuse.
* Replies: thread matching using `In-Reply-To`/`References` headers and provider thread IDs; inbound messages create/append `conversations` and `messages` and trigger stop-on-reply and AI classification jobs.

## 16.5 Bounces and complaints

* Hard bounce → mark address invalid, add to suppression, stop sequence. Soft bounce → retry with backoff (max 3), then mark `soft_bounced`.
* Spam complaint (feedback loop) → suppress and flag tenant sender reputation.
* Alert admins if bounce rate exceeds a threshold (e.g., > 5%) and auto-pause the campaign.

## 16.6 Unsubscribe handling

* Global per-tenant suppression list checked before **every** send.
* Manual add/remove with audit trail; import of an existing suppression list supported.
* Unsubscribe events update `leads.email_opt_out` and add a timeline entry.

---

# 17. WHATSAPP INTEGRATION

**Compliance-first:** only the official WhatsApp Business Platform (Cloud API or an authorised BSP). No scraping, no browser automation, no unofficial libraries.

## 17.1 Connection (per tenant)

* Embedded signup / manual entry of WABA ID, phone number ID, and access token (system user token) — stored encrypted; never returned to the frontend.
* Webhook endpoint per tenant (`/webhooks/whatsapp/{opaque_endpoint_id}`) with signature verification (`X-Hub-Signature-256`) and a verify token; the tenant is derived from the opaque endpoint ID mapped server-side, and the payload's phone number ID is cross-checked.
* Display verification status, quality rating and messaging limit tier from the API.

## 17.2 Templates

* Create/edit template drafts in the portal (category: marketing/utility/authentication; language; header/body/footer/buttons; variables `{{1}}`, `{{2}}` mapped to lead fields).
* Submit to Meta for approval via API; track status (`pending`, `approved`, `rejected` with reason, `paused`); only `approved` templates selectable for campaigns.
* Sync template status via webhook/polling.

## 17.3 Messaging rules

* **Outside the 24-hour customer-service window:** only approved template messages may be sent.
* **Inside the window** (after the lead's inbound message): free-form messages allowed; UI shows a countdown badge.
* Require explicit **opt-in** evidence for marketing messages: `whatsapp_opt_in_at`, `opt_in_source`. Leads without opt-in are excluded from marketing campaigns by default (tenant admin acknowledgement required to change, with a compliance warning).
* Opt-out: keywords ("STOP", "UNSUBSCRIBE", localized variants, configurable) detected on inbound → immediate suppression, confirmation message (if permitted), timeline entry.
* Respect Meta's per-number messaging limits and pacing; implement a token-bucket rate limiter per phone number; backoff on 429/131xxx errors; automatic pause on quality-rating drop.

## 17.4 Delivery and status

Track `sent → delivered → read → failed` via webhooks with idempotent event processing (dedupe by provider message ID + status). Map provider error codes to friendly messages and retry policy (retry only transient errors).

## 17.5 Inbound

* Store inbound text and media metadata (download media to tenant-scoped storage, virus scan, size limits).
* Match sender phone to lead via `whatsapp_e164`/`phone_e164`; if no match, create an "unknown contact" conversation with a "Create lead" action (tenant setting).
* Trigger stop-on-reply and AI classification.

---

# 18. UNIFIED INBOX

* Conversation list with filters: channel (All/Email/WhatsApp), assigned to me/unassigned/team, unread, campaign-related, classification (AI label), date range; search within messages.
* Conversation view: message thread, lead summary sidebar (status, owner, score, next follow-up, campaign membership), quick actions (change status, create follow-up, assign, snooze, mark handled, insert template, "Draft with AI").
* Composer: channel-aware (subject for email; 24-hour window banner and template picker for WhatsApp), variable insertion, attachments (validated), send requires `communications.send`; blocked with an explanation when the lead is opted-out/suppressed.
* Real-time updates via WebSocket/SSE scoped by tenant (channel name includes tenant; server verifies subscription authorisation on connect).
* Assignment: default to lead owner; round-robin optional for unassigned.
* Every message has `tenant_id`, links to `lead_id`, optional `campaign_id`, and produces an activity entry.
* Visitors: read access only if explicitly granted (`communications.view`); otherwise hidden.

---

# 19. AI MODULE

## 19.1 Architecture

```text
UI → API (permission: ai.use) → AI Service
        ├─ Prompt Builder (tenant-scoped data only, PII minimisation)
        ├─ Provider Adapter (model routing, retries, timeouts)
        ├─ Guardrails (output validation, JSON schema, content filters)
        └─ Usage Ledger (ai_requests: tokens, cost, feature, user)
```

* API keys held server-side only. Per-tenant AI enable/disable and monthly budget/quota; rate limits per user.
* Tenants may opt out of provider-side retention/training where the provider supports it; document data-processing terms; do not send data to any provider that the tenant/contract hasn't allowed.
* AI results are **suggestions** — persisted separately (`ai_insights`, `messages.ai_classification`, `ai_score`) and labelled with model + timestamp.

## 19.2 Features and specifications

| Feature | Input | Output | Human control |
|---|---|---|---|
| Lead summary | Lead fields, notes, recent activity | 3–5 sentence summary + key signals | Regenerate, dismiss, mark useful |
| Company summary | Company name/website field, user-provided notes (no unsanctioned scraping) | Short description, possible relevance | Editable; source disclosure |
| Suggested next action | Timeline, stage, follow-ups | Action + reasoning + suggested follow-up date | One-click "Create follow-up" (user confirms) |
| Lead scoring assist | Rule-score breakdown + attributes | Score suggestion + rationale | Stored as `ai_score`; user may adopt |
| Outreach generator | Lead, campaign goal, tone, length, language, company value proposition | Email/WhatsApp/follow-up/subject lines/call opening | Edit, regenerate, shorten, formalise, conversational, approve; **never auto-sent** |
| Reply classifier | Inbound message + short thread context | Label from fixed set + confidence + rationale | Manual correction; corrections logged for evaluation |
| Reply analyzer (batch) | Set of replies | Aggregated themes, objections | Read-only insights |
| AI Assistant | Natural-language question ("show hot leads in Delhi with no follow-up") | Translated to a **validated filter object** (not raw SQL) executed under the user's permissions; or a drafted answer | Preview the filter before running actions |

## 19.3 Safety and quality rules

* **Prompt injection defence:** lead-provided text and inbound messages are treated as untrusted data; they are delimited, never given tool-calling authority; AI can't call send/delete/export tools directly.
* **No autonomous sending:** any send needs a human click or an approved campaign.
* **Structured outputs:** use JSON schemas and validate; on failure retry once, then return a friendly error.
* **Label everything:** "AI-generated insight — not verified data".
* **Confidence:** classifier returns a confidence; low confidence → `Unknown` and flagged for review. No auto-actions beyond configured, reversible ones (e.g., auto-tag), and stop-sequence on `Unsubscribe` is allowed as it is the safe direction.
* **Evaluation:** maintain a small labelled set per feature; track accuracy from manual corrections; version prompts (`prompt_version` stored on outputs).
* **Cost control:** cache results keyed by input hash; batch and queue heavy jobs; per-tenant quotas with clear UI messaging.
* **Privacy:** minimise fields sent; redact tokens/secrets; never send data from other leads/tenants in the same prompt; log prompt hashes rather than full content by default.

---

# 20. ANALYTICS

## 20.1 Metrics definitions (must be unambiguous)

| Metric | Definition |
|---|---|
| Total leads | Non-deleted, non-archived leads in tenant |
| New leads (period) | Leads created in period |
| Contacted | Leads with ≥ 1 outbound message/logged call in period (or `last_contacted_at` not null for all-time) |
| Response rate | Leads with ≥ 1 inbound reply ÷ leads contacted (same cohort) |
| Conversion rate | Won leads ÷ total leads in cohort (cohort = created in period, or all-time per view) |
| Stage conversion | Leads that reached stage N+1 ÷ leads that reached stage N |
| Avg. time in stage | Mean time between stage-enter and stage-exit events |
| Campaign delivered | Provider-confirmed delivery |
| Open rate | Unique opens ÷ delivered (flagged as approximate) |
| Reply rate | Unique replies ÷ delivered |

Stage history is required: store `lead_stage_history (tenant_id, lead_id, from_stage, to_stage, changed_by, changed_at)` for accurate funnel metrics.

## 20.2 Implementation

* Start with live indexed queries for small tenants; introduce **pre-aggregated rollup tables** (`analytics_daily_*` by tenant, day, dimension) refreshed by background jobs when queries exceed targets.
* Dashboard cards must load in < 1 s using rollups/caches (cache key `t:{tenant}:dash:{hash}` with short TTL, invalidated by events).
* Filters: date range, owner, team/group, source, campaign, tag.
* Team analytics restricted to `analytics.team`; Members see their own numbers by default.
* Reports: saved report definitions, scheduled email delivery (PDF/CSV), export via the export pipeline.
* Charts: funnel, time series, stacked bars, leaderboard, heatmap (best send times).

## 20.3 Super Admin platform analytics

Aggregate counts only (tenants, active users, leads volume, messages sent, job failures, storage) — never individual tenant lead content. Per-tenant drill-down shows metadata, not business data, unless a support session is active.

---

# 21. DOCUMENTS

* Folders (seeded: Contracts, Proposals, Case Studies, Marketing, Templates, Campaign Assets) with nesting, rename, move, breadcrumbs.
* Upload: presigned uploads; allow-list of MIME types/extensions; max size (default 50 MB); antivirus scan (quarantine until clean); content-type sniffing; filenames sanitised; storage key is random (`tenants/{tenant}/docs/{doc_id}/{version}`), original name kept as metadata.
* Metadata: title, description, tags, type, related lead/campaign links, owner, timestamps.
* Versioning: each upload to an existing document creates a new version; restore previous; version comments.
* Preview: PDF and images inline (sandboxed viewer, `Content-Disposition` and CSP headers); Office previews via server-side conversion later.
* Permissions: inherits from folder; explicit grants to users/groups/roles; Visitors see only explicitly shared documents.
* Download via short-lived signed URLs after a permission check; downloads for sensitive folders are audited.
* Attach documents to campaign emails (size limits) and share via expiring links (optional, with password/expiry).
* Search by name/metadata; full-text extraction (PDF/DOCX) as a later enhancement.

---

# 22. TEAM MANAGEMENT

* User list columns: Name, Email, Role, Groups, Status (`invited`, `active`, `deactivated`), Last active, Created.
* Actions: invite (email, role, groups), create with temporary password (forces reset), resend/revoke invitation, deactivate/reactivate, change role, assign groups, reset MFA/sessions ("Reset access"), remove.
* Safeguards: cannot remove/demote the last active Company Admin; cannot elevate beyond own permissions; role/permission changes are audited (`PERMISSION_CHANGED`) and take effect within the permission cache TTL (or immediately via session invalidation).
* Deactivation triggers: revoke sessions and API tokens, prompt to reassign leads/follow-ups/conversations.
* Groups: default Administrators, Operations, Sales, Marketing, Visitors; used for assignment, visibility scoping, and permission bundles.
* Seat limits by plan (optional) enforced on invite.

---

# 23. AUDIT LOGGING

## 23.1 Event catalogue (extended)

```text
AUTH:        LOGIN, LOGIN_FAILED, LOGOUT, MFA_ENABLED, MFA_DISABLED, PASSWORD_CHANGED, SESSION_REVOKED
USERS:       USER_INVITED, USER_CREATED, USER_UPDATED, USER_DEACTIVATED, USER_DELETED, ROLE_CHANGED, PERMISSION_CHANGED
LEADS:       LEAD_CREATED, LEAD_UPDATED, LEAD_DELETED, LEAD_RESTORED, LEAD_ASSIGNED, LEAD_EXPORTED, LEAD_BULK_ACTION, LEAD_MERGED
IMPORT:      IMPORT_STARTED, IMPORT_COMPLETED, IMPORT_FAILED, IMPORT_UNDONE
CAMPAIGNS:   CAMPAIGN_CREATED, CAMPAIGN_UPDATED, CAMPAIGN_APPROVED, CAMPAIGN_STARTED, CAMPAIGN_PAUSED, CAMPAIGN_RESUMED, CAMPAIGN_CANCELLED
MESSAGES:    MESSAGE_SENT (individual, bulk summarised), MESSAGE_FAILED
DOCUMENTS:   DOCUMENT_UPLOADED, DOCUMENT_VERSIONED, DOCUMENT_DOWNLOADED (sensitive), DOCUMENT_DELETED, DOCUMENT_PERMISSION_CHANGED
INTEGRATIONS: INTEGRATION_CONNECTED, INTEGRATION_DISCONNECTED, INTEGRATION_ERROR
SETTINGS:    SETTINGS_CHANGED (with diff), SECURITY_SETTINGS_CHANGED
PLATFORM:    TENANT_CREATED, TENANT_SUSPENDED, TENANT_ACTIVATED, SUPPORT_ACCESS_STARTED, SUPPORT_ACCESS_ENDED
AI:          AI_GENERATION (metadata only), AI_SETTINGS_CHANGED
```

## 23.2 Requirements

* Fields as in the original spec plus `request_id`, `user_agent`, `actor_type` (`user`, `system`, `super_admin_support`).
* Written in the same transaction as the change where feasible, or via a reliable outbox to guarantee no silent loss.
* Metadata records **what changed** (field names and old/new for non-sensitive fields) but not secrets or full message bodies.
* Viewer UI: filter by actor, action, entity, date; export (itself audited). Retention configurable (default ≥ 1 year; platform logs ≥ 2 years).
* Immutable to normal users (see 7.3). Tenant Admins can read but never edit/delete.

---

# 24. NOTIFICATIONS

* Types: follow-up due/overdue, lead assigned, new reply, meeting scheduled, campaign started/completed/paused (auto-pause reason), import completed/failed, export ready, integration disconnected, template approved/rejected, AI quota reached.
* Delivery: in-app (bell + list, unread count, mark read/all), email (immediate or digest), later web push.
* Preferences per user per type per channel; tenant-level defaults; quiet hours.
* Real-time via SSE/WebSocket; fall back to polling.
* Dedupe/aggregate noisy notifications (e.g., "12 new replies").
* Notifications are tenant-scoped and only visible to the intended membership.

---

# 25. SEARCH

* **Phase 2:** leads search using `search_vector` (name, company, designation, email, phone, city, tags) with `websearch_to_tsquery`, plus `pg_trgm` for typo-tolerant name/company matching; exact matches (email/phone) boosted; prefix matching for type-ahead.
* Keep `search_vector` updated by trigger or background job (batched for imports).
* **Global search (command palette, `Ctrl/Cmd+K`):** parallel scoped queries across leads, campaigns, documents, conversations, followups, and navigation actions; each result set permission-filtered; results grouped by type.
* Escalate to OpenSearch/Meilisearch only if measured latency at scale requires it; every query still enforces a mandatory tenant filter (index-per-tenant or filtered alias).
* Semantic/vector search: only for a concrete use case such as "find similar leads" or searching document contents; if added, embeddings are stored per tenant and queried with a tenant filter, and reviewed via ADR.

---

# 26. BACKGROUND JOBS

## 26.1 Job catalogue

| Job | Trigger | Priority | Notes |
|---|---|---|---|
| `import.detect/validate/commit` | User action | Normal | Resumable, batch commits |
| `export.generate` | User action | Low | Streams to storage |
| `campaign.scheduler` | Every minute | High | SKIP LOCKED; per-tenant fairness |
| `message.send` | Scheduler / user | High | Idempotent; provider rate-limited |
| `webhook.process` | Provider webhooks | High | Idempotent by event ID |
| `inbox.sync` | Interval / webhook | High | Replies |
| `ai.generate/classify` | User / event | Normal | Quota-checked |
| `score.recalculate` | Event / nightly | Low | Batched |
| `analytics.rollup` | Hourly/nightly | Low | |
| `followup.reminders` | Every minute | High | |
| `notifications.digest` | Daily | Low | |
| `retention.purge` | Nightly | Low | Exports, import rows, expired invites, deleted tenants |
| `search.reindex` | Admin/import | Low | |

## 26.2 Requirements

* Every payload includes `tenant_id`, `actor_id` (if any), `request_id`; workers set RLS context first and abort if the tenant is suspended/deleted.
* Idempotency keys and unique constraints prevent duplicate sends on retries.
* Retries with exponential backoff and jitter; poison messages go to a dead-letter queue with alerting; admin-visible failure status with a "Retry" action where safe.
* Separate queues (and worker pools) for `critical`, `default`, `bulk`, and `ai` so imports can't starve sends.
* Per-tenant concurrency limits to avoid noisy-neighbour effects.
* Graceful shutdown; visibility timeouts; long jobs report heartbeat/progress.
* Scheduled tasks defined in code with a single leader (avoid duplicate schedulers).

---

# 27. FRONTEND ARCHITECTURE AND DESIGN SYSTEM

## 27.1 Structure

```text
frontend/src/
  app/            (providers, router, error boundaries)
  components/     (design-system primitives: Button, Input, DataTable, Modal, Drawer, …)
  features/       (leads/, pipeline/, campaigns/, inbox/, followups/, ai/, analytics/, team/, documents/, settings/, super-admin/)
      each feature: api/, hooks/, components/, pages/, types/
  layouts/        (AuthLayout, WorkspaceLayout, SuperAdminLayout)
  hooks/ services/ types/ utils/
  styles/         (tokens.css, theme)
```

* Feature modules import only from `components/`, `hooks/`, `services/`, `utils/` — not from other features (enforced via lint rule).
* API client generated from OpenAPI schema for type safety; single Axios/fetch wrapper handles auth refresh, request IDs, error normalisation.
* State: server state via TanStack Query (cache keys include tenant ID to prevent cross-tenant cache bleed after switching context); minimal client state (Zustand/Context).
* Route guards are UX only; the backend is the authority. Unauthorised responses trigger friendly "no access" screens.
* Feature flags to gate incomplete modules by phase.

## 27.2 Design tokens and theming

* Material UI `ThemeProvider` (`createTheme`) with dynamic Palette tokens for primary, secondary, background, surface, text, and status colors. Tenant branding overrides primary/secondary palette colors after **contrast validation** (reject or auto-adjust colors failing WCAG AA).
* MUI `CssBaseline` for normalized styling, light and dark mode palette switching (`mode: 'light' | 'dark'`), logo/favicon per tenant; timezone/date/currency formatting via the tenant settings (`Intl`).

## 27.3 Component checklist (each with states: default, hover, focus, disabled, loading, error, empty)

Button, IconButton, Input, Textarea, Select/Combobox, MultiSelect, DatePicker/DateTimePicker, Checkbox/Radio/Switch, DataTable (server-driven, virtualised, column chooser, sticky header, row selection), Pagination/InfiniteLoader, Modal/ConfirmDialog, Drawer, Dropdown/Menu, Tabs, Badge/StatusChip, Avatar/AvatarGroup, Tooltip, Toast, Banner/Alert, EmptyState, LoadingState/Skeleton, ErrorState, StatCard, Chart wrappers, Timeline, KanbanBoard/Column/Card, UserPicker, LeadPicker, TagPicker, FilterBar, CommandPalette, Breadcrumbs, FileUploader, RichTextEditor (sanitised output), VariablePicker.

## 27.4 UX rules

* Destructive actions: confirmation dialog stating the impact and count ("Delete 3 leads? You can restore them for 30 days.").
* Forms: inline validation, preserve input on error, warn on unsaved changes.
* Long operations: progress indicators, non-blocking, resumable from notifications.
* Toasts for outcomes; persistent banners for account-level problems (integration disconnected).
* Copy tone: plain, specific, actionable.

---

# 28. ACCESSIBILITY AND RESPONSIVE RULES

* Target WCAG 2.2 AA.
* Keyboard: all interactions reachable; logical tab order; focus trap in dialogs and return focus on close; skip-to-content link; Kanban has keyboard move controls; shortcuts documented and non-conflicting.
* Semantics: landmarks (`nav`, `main`, `header`), headings hierarchy, `<table>` with proper `th scope`, `aria-live` regions for toasts/progress, `aria-sort` for sortable columns.
* Visuals: contrast ≥ 4.5:1 text, 3:1 UI; do not rely on colour alone (stage chips include text/icon); respect `prefers-reduced-motion` and `prefers-color-scheme`.
* Targets ≥ 44×44 px on touch devices; text resizable to 200% without loss.
* Breakpoints: ≥1280 desktop (fixed sidebar), 768–1279 tablet (collapsible sidebar), <768 mobile (bottom nav + drawer, tables become card lists, filters in a drawer, sticky primary action).
* Automated checks (axe in CI + Playwright) and a manual screen-reader pass per release.

---

# 29. SECURITY HARDENING CHECKLIST

**Application**

* Input validation with strict schemas; reject unknown fields; max body sizes; allow-listed sort/filter fields (prevents SQL injection via column names). Parameterised queries only.
* Output encoding; sanitise rich text/HTML (server-side allow-list, e.g., `bleach`/`DOMPurify`); no `dangerouslySetInnerHTML` on untrusted content.
* SSRF protection for any URL-fetching feature (block private ranges, metadata IPs, redirects).
* File uploads: type/size validation, random storage keys, malware scanning, no direct execution, isolated download domain or `Content-Disposition: attachment`.
* Mass-assignment protection: explicit DTOs; clients can't set `tenant_id`, `created_by`, `role`, etc.
* Object-level authorisation checks on every ID-based route (IDOR prevention) — covered by RLS **and** explicit service checks.

**Transport / headers**

* HTTPS everywhere, HSTS, TLS 1.2+.
* CSP (no inline scripts, nonce/hashes), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'` (or allow-list), CORS allow-list only for known origins, no wildcard with credentials.

**Data**

* Encryption at rest (DB volumes, object storage, backups) and column-level/envelope encryption for integration tokens/secrets (KMS; key rotation supported).
* Secrets only in a secrets manager/environment — never in the repo, frontend bundle, logs, or error messages; pre-commit secret scanning.
* PII minimisation, data-retention policies, data-subject export/delete workflows (GDPR/DPDP-style requests), documented sub-processors.
* Backups: automated, encrypted, tested restores (RPO ≤ 15 min via WAL/PITR, RTO ≤ 4 h as defaults); tenant-level restore procedure documented.

**Rate limiting and abuse**

| Scope | Default limit |
|---|---|
| Login | 5 attempts/15 min/account + IP throttle |
| API general | 300 req/min/user, 3,000/min/tenant |
| Search | 60/min/user |
| Exports | 5/hour/user |
| AI | per-plan quota + 20/min/user |
| Outbound messages | per-channel daily caps per tenant/sender |
| Public endpoints (unsubscribe, webhooks) | per-IP + signature validation |

**Operational**

* Dependency scanning (SCA), SAST, container scanning in CI; pin versions; regular updates.
* Least-privilege service accounts; network segmentation (DB not internet-facing); WAF/DDoS protection at the edge.
* Incident response runbook, breach notification process, security contact page, periodic external penetration test before production launch.

---

# 30. OBSERVABILITY

* **Logging:** structured JSON; fields `ts, level, service, request_id, tenant_id, user_id, route, status, latency_ms, error_code`. PII redaction filters (emails, phones, tokens, message bodies).
* **Metrics** (Prometheus/OpenTelemetry): request rate/latency/error by route; DB pool, slow queries, lock waits; queue depth/age/failed jobs by queue; provider API success/latency/error codes; send rates; auth failures; RLS policy violations; per-tenant usage.
* **Tracing:** OpenTelemetry across API → queue → worker → provider, propagating `request_id`.
* **Alerts:** error rate > 2% for 5 min; p95 latency SLO breach; queue age > threshold; DLQ growth; provider auth failures; bounce/complaint spikes; DB replication lag; disk/storage thresholds; failed backups.
* **Health endpoints:** `/healthz` (liveness), `/readyz` (DB, Redis, storage), platform System Health page for Super Admin.
* **SLOs (initial):** API availability 99.9%; p95 read latency < 500 ms; campaign scheduler lag < 2 minutes.
* Error tracking (Sentry-like) with scrubbing of sensitive data.

---

# 31. TESTING STRATEGY

## 31.1 Test pyramid

* **Unit:** scoring engine, permission evaluation, normalisers (phone/email), template rendering, duplicate matching, schedulers' time-window logic.
* **Integration (real Postgres + Redis in CI):** auth flows, CRUD, import/export pipeline, campaign scheduler, webhook handling (with recorded provider payloads).
* **Contract tests:** provider adapters against sandbox/mocks; OpenAPI schema diff check to prevent accidental breaking changes.
* **End-to-end (Playwright):** login → import → filter → assign → follow-up → campaign draft → approval; mobile viewport runs.
* **Performance:** load tests (k6/Locust) with 1M synthetic leads: lead list, search, bulk update, import 500k.
* **Accessibility:** axe checks and keyboard-only flows.
* **Chaos/resilience:** provider outage, worker crash mid-import, duplicate webhook delivery.

## 31.2 Mandatory tenant-isolation test matrix

Run against seeded data (see Section 32). All must pass in CI; failing any blocks merge.

| # | Scenario | Expected |
|---|---|---|
| T1 | User A lists leads | Only Tenant A leads |
| T2 | User A GET `/leads/{B_lead_id}` | 404 |
| T3 | User A PATCH/DELETE B lead | 404, no change |
| T4 | User A sends `tenant_id=B` in body/query/header | Ignored or 422; data written under A |
| T5 | Forged JWT with `tenant_id=B` (invalid signature) | 401 |
| T6 | Valid JWT for A, URL path `/tenants/B/...` | 403/404 |
| T7 | Bulk action with B's lead IDs | 0 rows affected |
| T8 | Import mapping referencing B's IDs (owner, tags, stages) | Rejected |
| T9 | Assign lead to a user from Tenant B | Rejected (composite FK / validation) |
| T10 | Add B's tag to A's lead | Rejected |
| T11 | Export requested by A | Contains only A rows; export download by B user → 404 |
| T12 | Document download using B's document ID | 404; signed URL for A can't be used to read B objects |
| T13 | Search terms known to exist only in B | No results for A |
| T14 | Analytics endpoints as A | Aggregates A only |
| T15 | Campaign start referencing B's list/template | Rejected |
| T16 | Webhook for B's WhatsApp number posted to A's endpoint | Rejected (signature/phone ID mismatch) |
| T17 | AI request as A | Prompt contains only A data (assert via prompt capture) |
| T18 | Worker job with missing/mismatched `tenant_id` | Rejected/dead-lettered; no data touched |
| T19 | Cache: A then B request identical key | No shared data |
| T20 | Direct SQL as `app_runtime` with tenant A context selecting B | 0 rows |
| T21 | Suspended tenant user API call | 403 `TENANT_SUSPENDED` |
| T22 | Real-time subscription to B's channel by A | Rejected |
| T23 | Audit log query as A | Only A entries |
| T24 | Super Admin without support session reading tenant business data | Denied |

## 31.3 Role/permission test matrix

* Member calling Admin endpoints (users, settings, integrations, audit) → 403.
* Visitor calling any write endpoint → 403.
* Member with `leads.view_assigned_only` requesting others' leads → 404.
* Permission override deny beats role allow.
* Last-admin protection cannot be bypassed.
* CI route-audit test: every route has a permission declaration.

## 31.4 Coverage expectations

* ≥ 80% line coverage for `auth`, `permissions`, `tenants`, `leads`, `import` modules; 100% of tenant-isolation matrix; critical paths covered by E2E.

---

# 32. SEED DATA

* Script `database/seeds/dev_seed.ts` / NestJS CLI command `npm run seed` (idempotent, dev/test only — refuses to run when `NODE_ENV=production`).
* Content as in original Section 49, plus:
  * Distinct, recognisable data per tenant (e.g., all Company A names prefixed `A-`, domains `@company-a.test`) so leaks are visually and programmatically detectable.
  * Same email address present in two tenants to prove duplicates aren't detected across tenants.
  * Varied pipeline stages, tags, follow-ups (overdue/today/upcoming), a sample campaign per tenant, sample conversations, documents (tiny files), and an audit trail.
  * A "large" profile that generates 1M leads for one tenant for performance tests (`--profile=large`).
* Default credentials for dev are documented in the README and disabled outside dev.

---

# 33. DEPLOYMENT AND ENVIRONMENTS

| Environment | Purpose | Data |
|---|---|---|
| Local (docker-compose: api, worker, scheduler, postgres, redis, minio, mailhog) | Development | Seed data |
| CI | Automated tests | Ephemeral DB |
| Staging | Pre-release, integration with provider sandboxes | Synthetic |
| Production | Live | Real; access restricted |

* 12-factor configuration via environment variables; config validation at startup (fail fast).
* Migrations run as a separate release step; backward-compatible (expand → migrate → contract) to allow zero-downtime deploys; CI verifies migration up/down on a copy.
* Blue/green or rolling deploys; feature flags for phased rollout.
* Infrastructure as code (Terraform); reproducible builds; SBOM.
* Disaster recovery: cross-region backups, documented restore drills quarterly.
* Data residency: note region choices per tenant as a future option (design `tenants.region`).

---

# 34. PHASE-BY-PHASE ACCEPTANCE CRITERIA

## Phase 1 — Foundation
* Register/login with MFA for admins; refresh rotation works; sessions revocable.
* Super Admin can create/suspend/activate a company and its first Admin; invitation flow works.
* RLS enabled and forced on all tenant tables; CI check enforces it.
* RBAC with system roles; route-audit test passes.
* Tenant-isolation tests T1–T4, T5–T6, T20–T24 pass.
* Base layout, navigation, design-system primitives, error/empty/loading patterns.
* Audit log records auth/user/tenant events; immutability verified.

## Phase 2 — CRM
* Lead CRUD with validation; custom fields; tags; assignments; notes; activity timeline.
* List with server-side search/filter/sort and cursor pagination; saved views; column chooser.
* Kanban + list pipeline; configurable stages; stage history.
* With 100k synthetic leads: list p95 < 300 ms, search p95 < 400 ms.
* Tests T7, T9, T10, T13 pass.

## Phase 3 — Excel Import/Export
* Import wizard end-to-end with mapping templates, validation report, duplicate strategies (skip/update/create/review), background processing with progress, resumability, history, undo.
* The 16,000-row sample imports in < 60 s; a 500k-row file completes without memory blow-up.
* Export CSV/XLSX in background with signed expiring downloads and audit entries.
* Tests T8, T11 pass; CSV-injection and malformed-file tests pass.

## Phase 4 — Follow-ups
* CRUD, Today/Upcoming/Overdue/Calendar views, reminders & notifications, timezone correctness tests, reassignment on user deactivation.

## Phase 5 — Campaigns
* Templates, audience snapshot with exclusion reasons, sequence builder, scheduling with business hours, approval workflow, safeguards (typed confirmation, caps, test send, pause-all), scheduler with SKIP LOCKED, campaign analytics skeleton. Test T15 passes. Dry-run verified to send nothing.

## Phase 6 — Email
* At least two providers (e.g., Microsoft Graph + SMTP) via the abstraction; reply threading; stop-on-reply; bounce/complaint/unsubscribe handling; suppression enforced pre-send; DNS check UI; encrypted token storage verified.

## Phase 7 — WhatsApp
* Official Cloud API connection, template lifecycle, 24-hour window logic, opt-in/opt-out enforcement, webhook signature verification, delivery statuses, rate limiting; test T16 passes.

## Phase 8 — Analytics
* Metrics per Section 20 verified against hand-computed fixtures; rollups for large tenants; scheduled reports; team analytics permissioned.

## Phase 9 — AI
* Each feature behind `ai.use`; quotas; outputs labelled; classification stored separately with manual correction; prompt-injection test suite; T17 passes; no auto-send verified.

## Phase 10 — Documents
* Folders, versioning, previews, permissions inheritance and overrides, malware scan quarantine, signed downloads; T12 passes.

## Phase 11 — Production Hardening
* Independent security review/pen-test findings resolved; full tenant-isolation matrix green; load tests meet SLOs; backup/restore drill done; monitoring & alerting live; accessibility audit passed; runbooks complete.

---

# 35. RULES FOR AI CODING AGENTS (EXPANDED)

Retain all 25 rules from the original specification and add:

26. Before creating a table, add `tenant_id`, RLS policy, composite FKs, and indexes in the **same** migration.
27. Never write a repository query without a tenant context parameter.
28. Every new endpoint must include: permission declaration, request/response schemas, audit decision (log or explicitly not), and tests (allowed, forbidden, cross-tenant).
29. Never construct SQL by string concatenation; never accept column names from clients except from an allow-list.
30. Do not add a dependency without stating why and checking its licence/maintenance.
31. Store no secrets in code, fixtures, tests, or logs; use fake keys in tests.
32. When uncertain about a requirement, write the assumption in `docs/assumptions.md` and choose the safer (more restrictive) behaviour.
33. Keep PRs small and phase-scoped; do not implement features from later phases prematurely.
34. Update `docs/` (architecture, API, runbooks, ADRs) with every significant change.
35. Run linters, type-checkers, tests (including the isolation matrix) before declaring a task complete; report failures honestly rather than weakening tests.
36. Never disable RLS, weaken a policy, or use the platform DB role in tenant request paths to "make something work".
37. Any code that sends a message must go through the central `OutreachGuard` (opt-out, suppression, caps, approval checks) — no direct provider calls from feature code.

---

# 36. DEFINITION OF DONE (CHECKLIST)

A feature is done only when every box is checked:

- [ ] UI implemented (all states: loading, empty, error, success, permission-denied)
- [ ] API implemented with schemas and OpenAPI docs
- [ ] Database migration (versioned, reversible/expand-contract) including `tenant_id`, RLS, indexes
- [ ] Authorization enforced (permission + resource scope) and tested
- [ ] Tenant isolation verified with cross-tenant tests
- [ ] Input validation and sanitisation
- [ ] Error handling with user-friendly messages; no stack traces exposed
- [ ] Audit logging decision made and implemented where appropriate
- [ ] Background job behaviour (idempotent, retryable) where relevant
- [ ] Accessibility checks (keyboard, labels, contrast)
- [ ] Responsive behaviour verified (desktop/tablet/mobile)
- [ ] Unit + integration tests (+ E2E for key flows)
- [ ] Performance considered (indexes, pagination, query plan reviewed)
- [ ] Observability (logs/metrics) added
- [ ] Documentation updated (user-facing help + developer docs)
- [ ] Feature flag / rollout plan if needed

---

# 37. OPEN DECISIONS LOG

Track and resolve before the corresponding phase begins:

| # | Decision | Options | Needed by |
|---|---|---|---|
| D1 | Backend framework | FastAPI (default) vs NestJS | Phase 1 |
| D2 | Auth: build vs managed IdP (Auth0/Cognito/Keycloak) | Build (default) / Managed | Phase 1 |
| D3 | Cloud/hosting provider and region (data residency) | AWS / Azure / GCP / India-region | Phase 1 |
| D4 | Multi-tenant membership for the same email | V1 single tenant / V2 multiple | Phase 1 |
| D5 | Default country for phone parsing (e.g., IN) | Per tenant setting | Phase 3 |
| D6 | Duplicate default behaviour | Skip (default) / Review | Phase 3 |
| D7 | Email providers to support first | Graph, Gmail, SMTP, SES | Phase 6 |
| D8 | WhatsApp: direct Cloud API vs BSP | Cloud API / BSP | Phase 7 |
| D9 | LLM provider(s), data-retention terms | TBD | Phase 9 |
| D10 | Legal/compliance regime (GDPR, DPDP Act, TRAI/DND rules, CAN-SPAM) | Per target markets | Phase 5 |
| D11 | Whether Members can import/export by default | Restrictive (default) | Phase 2 |
| D12 | Open/click tracking default | Off (default) vs On | Phase 6 |
| D13 | Search engine escalation threshold | Postgres FTS until p95 > target | Phase 2/11 |
| D14 | Billing/plans and seat limits | Deferred | Post-MVP |

---

## APPENDIX A — Example lead list query (illustrating tenant-safe, keyset-paginated SQL)

```sql
-- app.tenant_id already set via SET LOCAL; RLS enforces tenant, the explicit predicate helps the planner
SELECT id, full_name, company_name, designation, email, status_stage_id, lead_score, owner_membership_id, next_followup_at, created_at
FROM leads
WHERE tenant_id = $1
  AND deleted_at IS NULL
  AND archived_at IS NULL
  AND ($2::uuid IS NULL OR status_stage_id = $2)
  AND ($3::uuid IS NULL OR owner_membership_id = $3)
  AND ($4::text IS NULL OR search_vector @@ websearch_to_tsquery('simple', $4))
  AND (created_at, id) < ($5, $6)            -- keyset cursor
ORDER BY created_at DESC, id DESC
LIMIT 51;                                    -- fetch limit+1 to compute has_more
```

## APPENDIX B — Example RLS bootstrap helper (migration utility)

```sql
CREATE OR REPLACE FUNCTION enable_tenant_rls(tbl regclass) RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', tbl);
  EXECUTE format($p$
    CREATE POLICY tenant_isolation ON %s
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
      WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)
  $p$, tbl);
END;
$$ LANGUAGE plpgsql;
```

## APPENDIX C — Glossary

* **Tenant:** an isolated company workspace.
* **RLS:** PostgreSQL Row-Level Security.
* **RBAC:** Role-Based Access Control.
* **IDOR:** Insecure Direct Object Reference — accessing a resource by guessing its ID.
* **Keyset pagination:** paging by "last seen sort key" rather than numeric offset.
* **Suppression list:** addresses/numbers that must never be contacted on a channel.
* **Idempotency:** performing the same operation repeatedly produces the same result (no duplicates).
* **DLQ:** Dead-letter queue for jobs that repeatedly fail.
* **ADR:** Architecture Decision Record.

---

*End of Detailed Edition. The original master specification remains the source of product intent; this document defines the default technical realisation.*
