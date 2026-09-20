# ROLE-BASED ACCESS CONTROL (RBAC) MATRIX

# Permission Model & Policy Catalogue

---

## 1. PERMISSION CALCULATION ENGINE FORMULA

```text
Effective User Permissions = (
    Role Permissions 
    ∪ Group Permissions 
    ∪ User Allow Overrides
) \ User Deny Overrides
```

> **Deny Rule:** Deny overrides **always** take precedence over any role or group allow permission.

---

## 2. GRANULAR PERMISSION CATALOGUE

### 2.1 Leads & CRM
* `leads.view` — View lead records
* `leads.view_all` — View all workspace leads
* `leads.view_assigned_only` — View only assigned leads
* `leads.create` — Create new leads
* `leads.update` — Edit lead details
* `leads.delete` — Soft delete leads
* `leads.import` — Upload and commit bulk lead imports
* `leads.export` — Request background CSV/XLSX exports
* `leads.assign` — Change lead ownership
* `leads.merge` — Merge duplicate leads

### 2.2 Pipeline & Kanban
* `pipeline.view` — View Kanban deal board
* `pipeline.manage` — Create, edit, reorder, or deactivate pipeline stages

### 2.3 Campaigns & Outreach
* `campaigns.view` — View marketing campaigns
* `campaigns.create` — Draft new campaigns
* `campaigns.update` — Edit campaign parameters
* `campaigns.send` — Launch or resume campaign executions
* `campaigns.approve` — Provide admin approval for campaign launching
* `communications.send` — Send direct 1:1 email or WhatsApp messages

### 2.4 Follow-ups & Tasks
* `followups.view` — View own tasks
* `followups.view_team` — View team member task schedules
* `followups.create` — Schedule follow-ups
* `followups.update` — Edit or complete follow-ups

### 2.5 AI & Intelligence
* `ai.use` — Use AI assistant, message drafting, and scoring suggestions
* `ai.configure` — Modify AI prompts, model selections, and quota allocations

### 2.6 Administration & Security
* `users.view` — View workspace user roster
* `users.create` — Invite new team members
* `users.update` — Edit user details and group assignments
* `users.delete` — Deactivate user accounts
* `roles.manage` — Create and configure custom workspace roles
* `settings.update` — Modify workspace branding, timezone, and integrations
* `audit.view` — Access security audit logs

---

## 3. DEFAULT SYSTEM ROLES PERMISSION MATRIX

Legend: **✔** = Allowed | **◐** = Allowed on assigned records only | **✖** = Denied

| Permission Code | Company Admin | Member | Visitor |
|---|---|---|---|
| `leads.view` | ✔ | ✔ | ✔ |
| `leads.view_all` | ✔ | ✔ (Configurable) | ✔ |
| `leads.view_assigned_only` | ✖ | ◐ | ✖ |
| `leads.create` | ✔ | ✔ | ✖ |
| `leads.update` | ✔ | ◐ (Assigned/Unassigned) | ✖ |
| `leads.delete` | ✔ | ✖ | ✖ |
| `leads.import` | ✔ | ✖ | ✖ |
| `leads.export` | ✔ | ✖ | ✖ |
| `leads.assign` | ✔ | ✖ | ✖ |
| `pipeline.view` | ✔ | ✔ | ✔ |
| `pipeline.manage` | ✔ | ✖ | ✖ |
| `campaigns.create` | ✔ | ✔ (Drafts only) | ✖ |
| `campaigns.send` | ✔ | ✖ (Needs approval) | ✖ |
| `communications.send` | ✔ | ✔ (1:1 messaging) | ✖ |
| `followups.create` | ✔ | ✔ | ✖ |
| `ai.use` | ✔ | ✔ | ✖ |
| `analytics.team` | ✔ | ✖ | ✖ |
| `users.*` | ✔ | ✖ | ✖ |
| `settings.update` | ✔ | ✖ | ✖ |
| `audit.view` | ✔ | ✖ | ✖ |

---

## 4. NESTJS GUARD ENFORCEMENT SPECIFICATION

Route permission authorization is declared via `@RequirePermission()` decorator and evaluated by `PermissionGuard`:

```typescript
@Controller('leads')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class LeadsController {
  
  @Patch(':id')
  @RequirePermission('leads.update')
  async updateLead(
    @Param('id') leadId: string,
    @Body() dto: UpdateLeadDto,
    @TenantContext() ctx: ITenantContext,
  ) {
    return this.leadsService.update(ctx, leadId, dto);
  }
}
```
