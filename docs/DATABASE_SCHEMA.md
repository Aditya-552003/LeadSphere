# DATABASE SCHEMA & ROW-LEVEL SECURITY SPECIFICATION

# PostgreSQL 16 DDL Blueprint

---

## 1. ROW-LEVEL SECURITY ENFORCEMENT PATTERN

Every tenant-owned table incorporates `tenant_id uuid NOT NULL REFERENCES tenants(id)` and strictly enforces Row-Level Security:

```sql
-- Pattern applied programmatically to all tenant tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON leads
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

---

## 2. IDENTITY & PLATFORM MODULE SCHEMAS

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tenants Table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('provisioning','active','suspended','pending_deletion','deleted')),
    plan TEXT DEFAULT 'enterprise',
    timezone TEXT DEFAULT 'UTC',
    currency TEXT DEFAULT 'USD',
    branding JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform & Tenant Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    is_platform_admin BOOLEAN DEFAULT FALSE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspace Memberships
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, user_id),
    UNIQUE (tenant_id, id)
);

-- Roles & Permissions
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (tenant_id, role_id, permission_id)
);
```

---

## 3. CRM & LEADS MODULE SCHEMAS

```sql
-- Leads Table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT NOT NULL,
    company_name TEXT,
    designation TEXT,
    industry TEXT,
    email CITEXT,
    email_normalized CITEXT,
    phone TEXT,
    phone_e164 TEXT,
    whatsapp_e164 TEXT,
    website TEXT,
    linkedin TEXT,
    country TEXT,
    state TEXT,
    city TEXT,
    source TEXT DEFAULT 'manual',
    status_stage_id UUID,
    lead_score SMALLINT DEFAULT 0,
    score_source TEXT CHECK (score_source IN ('manual','rule','ai')),
    owner_membership_id UUID,
    last_contacted_at TIMESTAMPTZ,
    next_followup_at TIMESTAMPTZ,
    do_not_contact BOOLEAN DEFAULT FALSE,
    email_opt_out BOOLEAN DEFAULT FALSE,
    whatsapp_opt_out BOOLEAN DEFAULT FALSE,
    custom JSONB DEFAULT '{}',
    search_vector TSVECTOR,
    archived_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    import_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, id)
);

-- Pipeline Stages
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#1976d2',
    position INT NOT NULL DEFAULT 0,
    probability SMALLINT DEFAULT 10,
    is_won BOOLEAN DEFAULT FALSE,
    is_lost BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom Fields Definition
CREATE TABLE custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity TEXT NOT NULL DEFAULT 'lead',
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text','longtext','number','decimal','currency','date','datetime','boolean','select','multiselect','url','email','phone')),
    options JSONB DEFAULT '[]',
    required BOOLEAN DEFAULT FALSE,
    position INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (tenant_id, entity, key)
);
```

---

## 4. CAMPAIGN & OUTREACH SCHEMAS

```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp','multi')),
    status TEXT NOT NULL CHECK (status IN ('draft','scheduled','running','paused','completed','cancelled')),
    template_id UUID,
    schedule JSONB DEFAULT '{}',
    created_by UUID NOT NULL,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaign_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    current_step INT DEFAULT 1,
    next_run_at TIMESTAMPTZ,
    stopped_reason TEXT,
    last_event_at TIMESTAMPTZ,
    UNIQUE (tenant_id, campaign_id, lead_id)
);
```

---

## 5. AUDIT & CROSS-CUTTING SCHEMAS

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('user','system','super_admin_support')),
    on_behalf_of_tenant UUID,
    support_session_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IMMUTABILITY ENFORCEMENT ON AUDIT LOGS
REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;
```

---

## 6. COMPOSITE INDEXING STRATEGY

```sql
CREATE INDEX leads_tenant_status_idx ON leads (tenant_id, status_stage_id) WHERE deleted_at IS NULL;
CREATE INDEX leads_tenant_owner_idx ON leads (tenant_id, owner_membership_id) WHERE deleted_at IS NULL;
CREATE INDEX leads_tenant_score_idx ON leads (tenant_id, lead_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX leads_tenant_email_idx ON leads (tenant_id, email_normalized);
CREATE INDEX leads_search_gin_idx ON leads USING gin (search_vector);
CREATE INDEX leads_name_trgm_idx ON leads USING gin (full_name gin_trgm_ops);
CREATE INDEX leads_custom_gin_idx ON leads USING gin (custom jsonb_path_ops);
```
