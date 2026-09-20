# SPRINT-WISE IMPLEMENTATION PLAN

# LeadSphere 10-Sprint Execution Roadmap

---

## ROADMAP OVERVIEW

This document outlines the detailed 20-week (10 Sprints of 2 weeks each) engineering roadmap for building **LeadSphere** using **NestJS** (Backend) and **React + Material UI v6** (Frontend).

```text
Sprint 1  [Core Platform & Multi-Tenant RLS Foundation]
Sprint 2  [RBAC Engine, User Management & Audit Logging]
Sprint 3  [Leads Module, Custom Fields & Search Engine]
Sprint 4  [Kanban Pipeline, Activity Timeline & Scoring Engine]
Sprint 5  [Streaming Import & Export Data Pipelines]
Sprint 6  [Follow-ups, Calendar Views & Timezone Scheduling]
Sprint 7  [Email Integration & Campaign Sequence Engine]
Sprint 8  [WhatsApp Business Cloud API & Unified Inbox]
Sprint 9  [AI Intelligence Module & Analytics Rollups]
Sprint 10 [Documents Engine, Security Audit & Production Launch]
```

---

## SPRINT 1: CORE PLATFORM & MULTI-TENANT RLS FOUNDATION
**Duration:** Weeks 1–2  
**Focus:** Scaffold repository structure, NestJS backend, PostgreSQL RLS engine, Auth module, Base MUI layout.

### Backend Tasks
- [ ] Scaffold NestJS monorepo workspace (`apps/backend`).
- [ ] Configure TypeORM connection pool to PostgreSQL 16.
- [ ] Implement database migration pipeline using TypeORM CLI.
- [ ] Create `tenants`, `users`, `sessions` database tables.
- [ ] Write global `TenantContextInterceptor` to execute transaction-scoped `SET LOCAL app.tenant_id = 'uuid'`.
- [ ] Build Auth Module: Password hashing with Argon2id, JWT issuance, `HttpOnly` refresh token rotation.
- [ ] Build TOTP MFA enrollment and verification endpoints (`/auth/mfa/*`).

### Frontend Tasks
- [ ] Scaffold React + Vite + TypeScript application (`apps/frontend`).
- [ ] Configure Material UI (MUI v6) with dynamic `buildTenantTheme()` wrapper and `CssBaseline`.
- [ ] Set up React Router v6 with `ProtectedRoute` guards.
- [ ] Build Authentication screens: Login, MFA Verification, Password Reset using MUI `TextField`, `Button`, `Alert`.
- [ ] Build Workspace Shell Layout: Responsive MUI `Drawer` sidebar, Header AppBar, User Profile Menu.

### Acceptance Criteria
- [ ] User can log in, complete TOTP MFA, and receive signed JWT.
- [ ] All database queries executed via `TenantContextInterceptor` automatically enforce RLS policies.
- [ ] Tenant-isolation integration tests (T1–T6) pass in CI.

---

## SPRINT 2: RBAC ENGINE, USER MANAGEMENT & AUDIT LOGGING
**Duration:** Weeks 3–4  
**Focus:** Implement permission matrix calculation, user invitations, audit trail, Super Admin support access.

### Backend Tasks
- [ ] Create database tables: `memberships`, `roles`, `permissions`, `role_permissions`, `audit_logs`.
- [ ] Implement `PermissionGuard` and `@RequirePermission()` decorator.
- [ ] Build RBAC evaluation service supporting allow/deny overrides.
- [ ] Build Team Management endpoints: Invite user, change role, deactivate account (`/team/*`).
- [ ] Implement immutable audit logging interceptor writing state-changing events to `audit_logs`.
- [ ] Build Super Admin support impersonation flow (30-minute signed token with mandatory access reason).

### Frontend Tasks
- [ ] Build Team Management UI: User roster table with MUI `DataGrid`, role dropdowns, invite user modal.
- [ ] Build Audit Log Viewer: Filterable security log table displaying timestamp, actor, action, and IP.
- [ ] Build Platform Admin Workspace: Tenant list, tenant creation modal, suspend workspace button.

### Acceptance Criteria
- [ ] Users without required permissions receive 403 `FORBIDDEN` status.
- [ ] Audit log table cannot be edited or deleted (`REVOKE UPDATE, DELETE ON audit_logs`).
- [ ] Super Admin support sessions are logged with explicit rationale.

---

## SPRINT 3: LEADS MODULE, CUSTOM FIELDS & SEARCH ENGINE
**Duration:** Weeks 5–6  
**Focus:** Core lead management, dynamic JSONB custom fields, full-text search, cursor pagination.

### Backend Tasks
- [ ] Create `leads` and `custom_fields` database tables with UUIDv7 primary keys.
- [ ] Implement lead normalization pipeline: E.164 phone parsing via `libphonenumber`, email lowercasing.
- [ ] Build Lead CRUD service supporting JSONB custom field validation against custom field definitions.
- [ ] Implement PostgreSQL full-text search (`search_vector` TSVECTOR) with `pg_trgm` typo tolerance.
- [ ] Build cursor-based pagination API endpoint (`GET /leads?cursor=...`).

### Frontend Tasks
- [ ] Build Lead List View: High-performance virtualized MUI `DataGrid` with custom column chooser.
- [ ] Build Quick Filter Bar: Search input, status filter chips, lead owner select menu.
- [ ] Build Lead Creation / Edit Drawer: Form rendered dynamically from custom field schema definitions.

### Acceptance Criteria
- [ ] Lead queries for 100,000 records return in < 300 ms.
- [ ] Custom fields validate data types (e.g., date, number, select options) before saving.

---

## SPRINT 4: KANBAN PIPELINE, ACTIVITY TIMELINE & SCORING ENGINE
**Duration:** Weeks 7–8  
**Focus:** Visual deal pipeline, 360° lead timeline, rule-based lead scoring engine.

### Backend Tasks
- [ ] Create `pipeline_stages`, `lead_notes`, `lead_activities` database tables.
- [ ] Build Pipeline configuration service (`/pipeline/stages`).
- [ ] Build Lead Activity Timeline service: Aggregate updates, notes, emails, status changes.
- [ ] Implement Rule-Based Lead Scoring Engine: Configurable weighted JSON scoring schema.

### Frontend Tasks
- [ ] Build Kanban Pipeline Board: MUI drag-and-drop columns displaying deal cards, aggregate totals.
- [ ] Build Lead 360° Detail Page: Header with score badge, tabbed view (Overview, Timeline, Notes, Follow-ups).
- [ ] Build Activity Stream Component: Timeline entries with category icons and author timestamps.

### Acceptance Criteria
- [ ] Dragging a lead to a new Kanban stage updates database status and appends activity entry.
- [ ] Lead score recalculates automatically upon field updates.

---

## SPRINT 5: STREAMING IMPORT & EXPORT DATA PIPELINES
**Duration:** Weeks 9–10  
**Focus:** Async file processing, Excel/CSV mapping, deduplication engine, downloadable reports.

### Backend Tasks
- [ ] Create `imports`, `import_rows`, `exports` database tables.
- [ ] Build Upload API: Presigned S3 upload URL generation with `defusedxml` validation.
- [ ] Build Column Detection Service: Auto-suggest mapping based on header synonyms.
- [ ] Implement BullMQ Async Import Worker: Process chunks of 1,000 rows, validate, and set-based merge.
- [ ] Build Deduplication Engine: Match existing leads by exact email, phone, or company name.
- [ ] Implement Background Export Worker: Stream CSV/XLSX to S3 with sanitization against CSV injection.

### Frontend Tasks
- [ ] Build Lead Import Wizard: Multi-step stepper (Upload file, Map columns, Preview validation, Commit).
- [ ] Build Import History Page: Status chips, valid/invalid row counts, download error report button.

### Acceptance Criteria
- [ ] 16,000 row CSV imports cleanly in < 60 seconds without blocking NestJS main loop.
- [ ] Invalid rows generate a downloadable error report CSV detailing exact issues.

---

## SPRINT 6: FOLLOW-UPS, CALENDAR VIEWS & TIMEZONE SCHEDULING
**Duration:** Weeks 11–12  
**Focus:** Task management, reminder notifications, user timezone localization.

### Backend Tasks
- [ ] Create `followups` database table.
- [ ] Build Follow-up CRUD API: Timezone parsing (`due_at` stored in UTC).
- [ ] Implement BullMQ Minute Scheduler: Check due follow-ups and emit reminders.
- [ ] Build Follow-up Snooze & Recurrence logic.

### Frontend Tasks
- [ ] Build Follow-up Dashboard: Filter tabs (Today, Upcoming, Overdue).
- [ ] Build Calendar View: Month/Week/Day grid displaying scheduled follow-up cards.
- [ ] Build Schedule Follow-up Dialog: MUI Date/Time pickers, priority selector, notes input.

### Acceptance Criteria
- [ ] Follow-ups display in the viewing user's local timezone.
- [ ] Overdue follow-ups highlight with visual warning chips.

---

## SPRINT 7: EMAIL INTEGRATION & CAMPAIGN SEQUENCE ENGINE
**Duration:** Weeks 13–14  
**Focus:** Multi-provider email adapters, sequence builder, background scheduler with SKIP LOCKED.

### Backend Tasks
- [ ] Build Email Provider Interface: Adapters for Microsoft Graph, Gmail API, SMTP, AWS SES.
- [ ] Create `templates`, `campaigns`, `campaign_steps`, `campaign_members` tables.
- [ ] Build Campaign Scheduler Worker: Every minute execution using `SELECT ... FOR UPDATE SKIP LOCKED`.
- [ ] Implement Stop Conditions: Auto-pause sequence upon lead reply or status stage change.

### Frontend Tasks
- [ ] Build Email Template Editor: Rich text composer with dynamic merge variables (`{{first_name}}`).
- [ ] Build Campaign Builder: Drag-and-drop step sequence builder (Send email, wait 2 days, condition check).
- [ ] Build Campaign Analytics Screen: Delivery rates, open rates, reply rates, conversion funnel.

### Acceptance Criteria
- [ ] Campaign scheduler processes messages round-robin across tenants without thread starvation.
- [ ] Inbound reply automatically halts future sequence steps for that lead.

---

## SPRINT 8: WHATSAPP BUSINESS CLOUD API & UNIFIED INBOX
**Duration:** Weeks 15–16  
**Focus:** Official Meta WhatsApp API integration, 24-hr customer service window engine, real-time inbox.

### Backend Tasks
- [ ] Build WhatsApp Cloud API Client: Template submission, message sending, media uploads.
- [ ] Build WhatsApp Webhook Controller: Signature verification (`X-Hub-Signature-256`), event deduplication.
- [ ] Implement 24-Hour Customer Service Window Tracker: Enforce approved templates outside window.
- [ ] Build Unified Inbox Gateway: WebSockets / SSE for real-time messaging updates.

### Frontend Tasks
- [ ] Build Unified Inbox Interface: Three-pane layout (Channel filters, Conversation list, Message thread).
- [ ] Build Message Composer: Channel selector (Email / WhatsApp), template picker, 24-hr window banner countdown.

### Acceptance Criteria
- [ ] WhatsApp webhooks process incoming messages and update thread in real time.
- [ ] Outbound free-form WhatsApp messages are blocked outside the 24-hour window.

---

## SPRINT 9: AI INTELLIGENCE MODULE & ANALYTICS ROLLUPS
**Duration:** Weeks 17–18  
**Focus:** LLM integration, prompt injection guardrails, lead summary, pre-aggregated analytics.

### Backend Tasks
- [ ] Build AI Provider Service: Sandboxed LLM client (OpenAI / Anthropic) with usage ledger (`ai_requests`).
- [ ] Implement AI Features: Lead summary generator, outreach email drafter, reply sentiment classifier.
- [ ] Implement Prompt Injection Filter: Treat untrusted lead input as data; block autonomous execution.
- [ ] Build Analytics Rollup Engine: Nightly background job aggregating `analytics_daily_*` tables.

### Frontend Tasks
- [ ] Build AI Assistant Drawer: Quick outreach drafting helper, tone adjustments, one-click insert to composer.
- [ ] Build Analytics Dashboard: MUI Charts (Lead conversion funnel, outreach performance, sales leaderboards).

### Acceptance Criteria
- [ ] AI generated content is clearly labeled with "AI-generated — verify before send".
- [ ] Dashboard cards render in < 1 second using pre-aggregated rollups.

---

## SPRINT 10: DOCUMENTS ENGINE, SECURITY AUDIT & PRODUCTION LAUNCH
**Duration:** Weeks 19–20  
**Focus:** Document management, full tenant isolation testing matrix, load testing, production release.

### Backend Tasks
- [ ] Create `documents`, `document_versions` database tables.
- [ ] Implement S3 Document Upload/Download Presigned URL Service with antivirus quarantine check.
- [ ] Execute Security Hardening: Rate limit configurations, CSP headers, CORS restriction.
- [ ] Run Full Tenant Isolation Matrix (Tests T1–T24) in CI.

### Frontend Tasks
- [ ] Build Document Library Screen: Folder tree navigation, file upload dropzone, version history modal.
- [ ] Conduct Keyboard & Screen Reader Accessibility Pass (WCAG 2.2 AA).

### Acceptance Criteria
- [ ] 100% of tenant-isolation test matrix passes cleanly in CI.
- [ ] Load tests (k6) prove system stability under design scale target.
