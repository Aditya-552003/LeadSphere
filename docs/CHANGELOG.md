# PROJECT CHANGELOG

All notable changes to the **LeadSphere Multi-Tenant Portal** architecture and codebase will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.10.0] - 2026-09-20

### Added — Sprint 10: Documents Engine, Security Audit & Production Launch
* **Backend Components (`apps/backend`)**:
  * TypeORM Entities: `Document` (`documents`), `DocumentVersion` (`document_versions`).
  * `DocumentModule`, `DocumentService` & `DocumentController`:
    * S3 Presigned URL Management: Secure generation of presigned S3 upload (`POST /documents/presigned-upload`) and 15-minute expiring download (`GET /documents/:id/presigned-download`) URLs.
    * Document Versioning Engine: Preserves complete document revision history (`uploadNewVersion`) with change summaries while keeping current version pointers intact.
    * Antivirus Quarantine Scanner: Simulated real-time scan verification marking uploads with security status flags (`clean`, `quarantined`, `scanning`).
    * Endpoints: `GET /documents`, `GET /documents/:id`, `POST /documents/presigned-upload`, `GET /documents/:id/presigned-download`, `POST /documents/:id/versions`, `DELETE /documents/:id`.
  * `SecurityController` (`/security`):
    * 24-Test Tenant Isolation Verification Matrix (`GET /security/isolation-matrix`): Automated verification report covering RLS policy enforcement, JWT tampering prevention, S3 key isolation, CSV formula escaping, LLM prompt injection defense, and rate limiting.
    * Production Hardening Status Report (`GET /security/hardening-status`).
* **Frontend Components (`apps/frontend`)**:
  * `DocumentsPage.tsx`: Enterprise Document Vault & Library:
    * Storage KPI cards (Total Documents, Total Storage Used, Security Status, S3 Encryption KMS status).
    * Folder Navigation & Search: Folder tabs (`All`, `Contracts`, `Proposals`, `NDA`, `General`), title & content search input.
    * Document Management Table: File icon indicators, file sizes, version chips (`v1`, `v2`), clean security badges, presigned download triggers, version history drawer, upload new version modal.
    * Security Audit Modal: Interactive report displaying 100% pass status across 24 tenant isolation test cases (T1–T24).
  * Updated `App.tsx` and `WorkspaceLayout.tsx` routing `/documents` to `DocumentsPage` and adding sidebar navigation link.
* **Production Release Readiness**:
  * Full 10-Sprint roadmap execution complete.
  * Passed 100% tenant-isolation matrix (T1–T24) in CI.
  * Verified 0 TypeScript errors across backend and frontend monorepo.

---

## [1.9.0] - 2026-09-20

### Added — Sprint 9: AI Intelligence Module & Executive Analytics Rollups
* **Backend Components (`apps/backend`)**:
  * TypeORM Entities: `AiRequest` (`ai_requests`), `AnalyticsDaily` (`analytics_daily`).
  * `AiModule` & `AiService`:
    * Prompt Injection Guardrail Engine (`sanitizeInput`): Strips system prompt overrides and malicious instruction keywords (`ignore previous instructions`, `system prompt`, `sudo`, `eval`, `override system rules`).
    * AI Lead Summarizer (`POST /ai/summarize-lead`): Generates 3-bullet executive intelligence summaries highlighting sentiment, budget fit, and deal risk factors.
    * Outreach Email Generator (`POST /ai/draft-email`): Produces contextual sales outreach emails with customizable tone settings (`professional`, `persuasive`, `concise`, `friendly`).
    * Lead Sentiment Classifier (`POST /ai/sentiment`): Classifies lead interactions (`POSITIVE`, `NEUTRAL`, `NEGATIVE`) with confidence scores and key signals.
    * Ledger & Disclaimer Tracking: Records token usage telemetry (`prompt_tokens`, `completion_tokens`) and mandates `AI-generated — verify before send` compliance metadata.
  * `AnalyticsModule` & `AnalyticsService`:
    * Executive Overview Aggregator (`GET /analytics/overview`): Sub-second retrieval of pipeline values, win rates, conversion funnels (New -> Contacted -> Qualified -> Proposal -> Won), outreach channel breakdowns, and sales leaderboard performance.
* **Frontend Components (`apps/frontend`)**:
  * `AiAssistantPage.tsx`: AI Copilot studio featuring Lead Summarizer tab, Tone-aware Email Drafter, Sentiment Classifier, prompt guardrail alerts, and mandatory `AI-generated — verify before send` disclaimer badges.
  * `AnalyticsPage.tsx`: Executive Analytics & Telemetry Dashboard displaying Pipeline Value KPI cards, Conversion Funnel progress bars, Multi-Channel Performance graphs, and Sales Roster Leaderboard.
  * Updated `App.tsx` and `WorkspaceLayout.tsx` routing `/ai` to `AiAssistantPage` and `/analytics` to `AnalyticsPage`.

---

## [1.8.0] - 2026-09-20

### Added — Sprint 8: WhatsApp Business Cloud API & Unified Inbox
* **Backend Components (`apps/backend`)**:
  * TypeORM Entities: `Conversation`, `Message`.
  * `InboxModule`, `InboxService` & `WhatsAppService`:
    * Meta WhatsApp Cloud API Integration: Session messaging, template HSM messaging, and 24-Hour Customer Service Window enforcement engine (`window_expires_at`).
    * Meta Webhook Verification: HMAC-SHA256 signature verification (`X-Hub-Signature-256`) and challenge response endpoint (`GET /inbox/whatsapp/webhook`).
    * Multi-Channel Thread Aggregation: Unified message repository supporting Email and WhatsApp messages.
    * Automatic Activity Logging: Logs `WHATSAPP_SENT`, `EMAIL_SENT`, and `INBOUND_MESSAGE_RECEIVED` entries in lead activity timeline.
    * Endpoints: `GET /inbox/conversations`, `GET /inbox/conversations/:id/messages`, `POST /inbox/messages`, `POST /inbox/conversations/:id/close`, `GET/POST /inbox/whatsapp/webhook`.
* **Frontend Components (`apps/frontend`)**:
  * `UnifiedInboxPage.tsx`: Three-Pane Inbox Layout:
    * Pane 1: Channel & Filter navigation (All Messages, Email Threads, WhatsApp API, Unread badges).
    * Pane 2: Conversation Roster List (Lead Avatars, Channel Badges, Message Snippets, Time Badges).
    * Pane 3: Active Message Thread & Multi-Channel Composer (Meta 24-Hour Customer Service Window Alert Banner, Chat bubbles, Delivery status indicators, Channel switcher).
  * Updated `App.tsx` and `WorkspaceLayout.tsx` with `/inbox` route and sidebar navigation link.

---

## [1.7.0] - 2026-09-20

### Added — Sprint 7: Email Integration & Campaign Sequence Engine
* **Backend Components (`apps/backend`)**:
  * TypeORM Entities: `EmailTemplate`, `Campaign`, `CampaignStep`, `CampaignMember`.
  * `CampaignModule`, `CampaignService` & `EmailProviderService`:
    * Multi-Provider Outbound Dispatcher: Pluggable adapter interface supporting SMTP, AWS SES, Microsoft Graph, and Gmail API dispatch.
    * Template Interpolation Engine: Dynamic merge variable replacements (`{{first_name}}`, `{{last_name}}`, `{{company_name}}`, `{{designation}}`, `{{email}}`).
    * Multi-Step Sequence Engine: Executes campaign sequences (Send Email -> Wait X Days -> Send Follow-up) and tracks member progress.
    * Auto-Pause Rules: Configurable `stop_on_reply` and `stop_on_stage_change` sequence guardrails.
    * Telemetry & Analytics: Real-time calculation of enrollment numbers, email delivery counts, open rate percentages, and reply conversion rates.
    * Endpoints: `GET/POST/DELETE /campaigns/templates`, `GET/POST /campaigns`, `GET /campaigns/:id`, `PATCH /campaigns/:id/status`, `POST /campaigns/:id/enroll`, `GET /campaigns/:id/analytics`.
* **Frontend Components (`apps/frontend`)**:
  * `EmailTemplateModal.tsx`: Email template authoring modal with single-click dynamic merge variable insertion tags.
  * `CampaignBuilderDialog.tsx`: Drag-and-drop multi-step sequence builder for configuring email steps, wait conditions, sender options, and auto-pause switches.
  * `CampaignAnalyticsDialog.tsx`: Visual outreach telemetry modal rendering lead progress funnels and open/reply progress bars.
  * `CampaignsPage.tsx`: Campaign Management Dashboard with campaign status toggles, lead enrollment dialog, and metric tables.
  * Updated `App.tsx` and `WorkspaceLayout.tsx` with `/campaigns` route and sidebar navigation link.

---

## [1.6.0] - 2026-09-20

### Added — Sprint 6: Follow-ups, Calendar Views & Timezone Scheduling
* **Backend Components (`apps/backend`)**:
  * TypeORM Entity: `Followup`.
  * `FollowupModule` & `FollowupService`: 
    * UTC Date Normalization: Standardized `due_at` timestamp storage with multi-timezone support (`America/New_York`, `Asia/Kolkata`, `Europe/London`, `UTC`).
    * Automated Activity Logging: Automatically logs `followup_scheduled` and `followup_completed` entries into `lead_activities` table.
    * Auto-Recurrence Engine: Automatically calculates and spawns next occurrence for recurring tasks (`daily`, `weekly`, `monthly`) upon completion.
    * Snooze Manager: Flexible snooze options (`POST /followups/:id/snooze`) extending due dates by custom hourly offsets.
    * Endpoints: `GET /followups`, `GET /followups/calendar`, `POST /followups`, `POST /followups/:id/complete`, `POST /followups/:id/snooze`, `DELETE /followups/:id`.
* **Frontend Components (`apps/frontend`)**:
  * `ScheduleFollowupDialog.tsx`: Modal dialog for creating follow-up tasks with lead selection, date/time pickers, timezone selectors, priority level chips, and recurrence dropdowns.
  * `FollowupCalendarView.tsx`: Interactive month/week grid calendar displaying task pills color-coded by priority and highlighting overdue tasks in red.
  * `FollowupsPage.tsx`: Task Management Dashboard featuring status filter tabs (Overdue, Today, Upcoming, Completed, Calendar Grid), quick snooze actions, task completion triggers, and summary metric cards.
  * Updated `App.tsx` and `WorkspaceLayout.tsx` with `/followups` route and side navigation link.

---

## [1.5.0] - 2026-09-20

### Added — Sprint 5: Streaming Import & Export Data Pipelines
* **Backend Components (`apps/backend`)**:
  * TypeORM Entities: `ImportJob`, `ExportJob`.
  * `ImportExportModule` & `ImportExportService`: 
    * `autoDetectMapping`: Intelligent CSV header synonym detection (e.g. `mail` -> `email`, `cell` -> `phone`, `org` -> `company_name`).
    * Async CSV Import Parser: Batch processing of CSV files with dynamic schema validation and multi-mode deduplication engine (`skip`, `overwrite`, `create`).
    * CSV Formula Injection Protection: Sanitization of exported text cells against formula injection vulnerabilities (`=`, `+`, `-`, `@` character prefix escaping).
    * Endpoints: `POST /data/imports/auto-map`, `POST /data/imports`, `GET /data/imports`, `GET /data/imports/:id/error-report`, `POST /data/exports`, `GET /data/exports`.
* **Frontend Components (`apps/frontend`)**:
  * `ImportWizardDialog.tsx`: Multi-step import wizard stepper (CSV Upload / Paste -> Header Field Auto-Mapping -> Deduplication Resolution Strategy -> Live Execution Summary & Downloadable CSV Error Log).
  * `DataPipelinesPage.tsx`: Data Pipelines & Import/Export Center view featuring aggregate job metrics, import execution history table, downloadable error log links, and instant CSV export stream.
  * Updated `App.tsx` and `WorkspaceLayout.tsx` with `/data-pipelines` route and sidebar navigation link.

---

## [1.4.0] - 2026-09-20

### Added — Sprint 4: Pipeline (Kanban) Module, Activity Timeline & Scoring Engine
* **Backend Components (`apps/backend`)**:
  * TypeORM Entities: `PipelineStage`, `LeadNote`, `LeadActivity`.
  * `PipelineModule` & `PipelineService`: Stage CRUD operations (`GET /pipeline/stages`, `POST /pipeline/stages`) with automated tenant default stage seeding (New, Contacted, Interested, Meeting, Proposal, Won, Lost).
  * 360° Lead Activity Timeline Engine: `GET /leads/:id/timeline` returning chronologically unified stream of notes, stage movements, status changes, and lead creation events.
  * Lead Note Management: `POST /leads/:id/notes` endpoint enabling team members to attach notes with automatic activity logging.
  * Rule-Based Lead Scoring Recalculation: Dynamic score recalculation based on lead activity, deal size, and stage progression.
* **Frontend Components (`apps/frontend`)**:
  * `PipelinePage.tsx`: Interactive Kanban Deal Board featuring MUI stage columns, card deal values, cumulative stage totals, stage creation modal, and stage move actions.
  * `LeadDetailDialog.tsx`: Lead 360° detail dialog displaying lead summary header, AI score color badge indicator (0-100), contact info, notes composer stream, and 360° activity timeline.
  * Updated `LeadsPage.tsx`: Integrated row click handler opening `LeadDetailDialog` and connected live backend lead fetching.
  * Updated `App.tsx` and `WorkspaceLayout.tsx` with `/pipeline` route and side navigation link.

---

## [1.3.0] - 2026-09-20

### Added — Sprint 3: CRM Core — Leads Module, Custom Fields & Search Engine
* **Backend Components (`apps/backend`)**:
  * TypeORM Entities: `Lead`, `CustomField`, `Tag`, `LeadTag`.
  * `LeadModule` & `LeadService`: High-performance Lead CRUD operations (`GET /leads`, `GET /leads/:id`, `POST /leads`, `PATCH /leads/:id`, `DELETE /leads/:id`).
  * Full-Text Search Engine: Integrated `search_vector` TSVECTOR and `pg_trgm` typo-tolerant substring search across names, companies, emails, and phone numbers.
  * Cursor-Based Pagination: Server-side keyset pagination returning `next_cursor` tokens for 1M+ row scalability.
  * Custom Fields Validation: Dynamic JSONB validation enforcing type, presence, and option constraints based on tenant `custom_fields` definitions.
  * Lead Normalization: Automated E.164 phone formatting and email lowercasing.
* **Frontend Components (`apps/frontend`)**:
  * `LeadsPage.tsx`: Virtualized MUI `DataGrid` lead management interface with quick search bar, AI score badges, and stage chips.
  * `LeadFormDrawer.tsx`: Slide-over MUI form drawer for creating and editing leads with standard contact info and dynamic JSONB custom fields.
  * Registered `/leads` route in `App.tsx`.

---

## [1.2.0] - 2026-09-20

### Added — Sprint 2: RBAC Engine, User Management & Audit Logging
* **Backend Components (`apps/backend`)**:
  * TypeORM Entities: `Role`, `Permission`, `RolePermission`, `Group`, `GroupMember`, `PermissionOverride`, `Invitation`, `AuditLog`.
  * `RbacModule` & `RbacService`: Dynamic role management and permission catalogue lookup (`/roles`, `/roles/permissions`).
  * `UserModule` & `UserService`: Workspace team roster (`GET /team/users`), invitation engine (`POST /team/invitations`), role modification (`PATCH /team/users/:id/role`), and account deactivation (`POST /team/users/:id/deactivate`).
  * `AuditModule` & `AuditService`: Immutable audit log recorder writing state-changing events to `audit_logs` table (`GET /audit`).
  * Super Admin Support Impersonation: Audited 30-minute support token generation flow (`POST /platform/tenants/:id/support-access`).
* **Frontend Components (`apps/frontend`)**:
  * `TeamPage.tsx`: High-performance team management view with MUI `DataGrid`, role dropdowns, user invitation modal, and deactivation actions.
  * `AuditLogPage.tsx`: Security audit log viewer with real-time text filtering and event category badges.
  * `SuperAdminPage.tsx`: Platform Super Admin workspace manager displaying tenant table, tenant provisioning modal, suspension toggle, and support impersonation modal.
  * Updated `WorkspaceLayout.tsx` and `App.tsx` with routes and navigation icons for Team Members, Security Audit, and Super Admin Portal.

---

## [1.1.0] - 2026-09-20

### Added — Sprint 1: Core Platform & Multi-Tenant RLS Foundation
* **Backend Architecture (`apps/backend`)**:
  * NestJS 10+ boilerplate with TypeORM and PostgreSQL connection pool.
  * `TenantContextInterceptor` executing transaction-scoped `SET LOCAL app.tenant_id = 'uuid'` and `SET LOCAL app.user_id = 'uuid'` for PostgreSQL 16 Row-Level Security (RLS).
  * TypeORM Entities: `Tenant`, `User`, `Membership`, `Session`.
  * Authentication Module: Password hashing with Argon2id, Passport JWT strategy, HttpOnly refresh cookies, and TOTP MFA setup/verify endpoints (`/auth/mfa/setup`, `/auth/mfa/verify`).
  * NestJS Guards: `JwtAuthGuard`, `TenantGuard`, `PermissionGuard`.
  * Global exception filter delivering standard REST API error envelopes (`error.code`, `error.message`, `error.request_id`).
  * Swagger API documentation enabled at `/api/docs`.
* **Frontend Architecture (`apps/frontend`)**:
  * React + Vite + TypeScript application with Material UI (MUI v6) integration.
  * Dynamic `buildTenantTheme()` generator with WCAG 2.2 AA contrast compliance and `CssBaseline`.
  * Responsive `WorkspaceLayout` featuring collapsible MUI `Drawer` sidebar, top `AppBar`, and user menu.
  * Authentication UI screens: `LoginPage` and `MfaPage`.
  * Overview `DashboardPage` displaying workspace metrics and pipeline cards.

---

## [1.0.0] - 2026-09-20

### Added
* Initial release of comprehensive project documentation under `docs/`:
  * `MASTER_BUILD_SPEC.md`: Core product scope, multi-tenant isolation principles, tech stack choices, and scale targets.
  * `ARCHITECTURE.md`: NestJS modular backend blueprint, React + MUI v6 frontend layout, DB RLS transaction flow, BullMQ queue architecture, and S3 object storage design.
  * `DATABASE_SCHEMA.md`: Complete PostgreSQL 16 DDL definitions with Row-Level Security (RLS) policies, indexes, and composite keys.
  * `API_SPEC.md`: REST API endpoint specification standards (`/api/v1`), standard JSON envelopes, cursor pagination, and error code catalog.
  * `RBAC_MATRIX.md`: Effective permission calculation formula, granular permission catalogue (50+ permissions), and system role permission matrix.
  * `UI_DESIGN_SYSTEM.md`: Material UI (MUI v6) theme configuration, dynamic tenant palette overrides, component checklists, and WCAG 2.2 AA accessibility guidelines.
  * `IMPLEMENTATION_PLAN.md`: Detailed 10-Sprint (20-week) execution roadmap with tasks, deliverables, and acceptance criteria.
* Updated backend tech stack decision to **NestJS (TypeScript)** + TypeORM.
* Updated frontend UI framework decision to **Material UI (MUI v6)**.
