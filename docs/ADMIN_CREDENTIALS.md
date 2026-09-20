# LeadSphere Admin Credentials & Authentication Guide

This document outlines all system admin credentials, demo accounts, single sign-on options, and OTP verification bypass codes across the LeadSphere Multi-Tenant SaaS platform.

---

## 🔑 1. Platform Super Admin (Portal Owner)

The Super Admin account has global platform access across all tenant workspaces, subscription billing management, security audit logs, and 30-minute audited support impersonation tokens.

| Attribute | Details |
| :--- | :--- |
| **Account Type** | Platform Super Admin (Portal Owner) |
| **Work Email** | `admin@leadsphere.io` |
| **Password** | `LeadSphere2026!` |
| **Role** | `Super Admin` |
| **Console URL** | `http://localhost:5173/super-admin` |
| **Quick Access** | Click **"Log in as Platform Super Admin Console"** on the `/login` page |

> [!IMPORTANT]
> Non-Super Admin users (Company Admins, Members, Visitors) attempting to access `/super-admin` will be blocked by an explicit HTTP 403 Forbidden RBAC Route Guard.

---

## 🏢 2. Demo Company Admin Accounts

These accounts demonstrate multi-tenant workspace isolation. Each tenant operates with row-level security (RLS) policies enforced at the PostgreSQL database layer.

### A. Apex Digital (Tenant 1)
| Attribute | Details |
| :--- | :--- |
| **Company Name** | Apex Digital Corp |
| **Tenant Slug** | `apex-digital` |
| **Admin Name** | Alex Vance |
| **Work Email** | `admin@apexdigital.test` |
| **Password** | `Password123!` |
| **Role** | `Company Admin` |
| **Dashboard URL** | `http://localhost:5173/dashboard` |

### B. Cokooon Tech (Tenant 2)
| Attribute | Details |
| :--- | :--- |
| **Company Name** | Cokooon Technologies |
| **Tenant Slug** | `cokooon-tech` |
| **Admin Name** | Rahul Sharma |
| **Work Email** | `rahul@cokooon.com` |
| **Password** | `Password123!` |
| **Role** | `Company Admin` |
| **Dashboard URL** | `http://localhost:5173/dashboard` |

---

## 📝 3. Self-Registration & Dual OTP Verification Bypass

New company administrators can register and auto-provision a new tenant workspace directly from the `/login` page.

### Registration Flow:
1. Navigate to **`http://localhost:5173/login`** and select the **"Register Company"** tab.
2. Fill in the Company Name, Domain Subdomain, Admin Full Name, Work Email, Mobile Phone, and Password.
3. On Step 2 (Dual OTP Verification), enter the bypass verification code:

| Verification Type | Dev Bypass OTP Code |
| :--- | :--- |
| **Email OTP** | **`123456`** |
| **Phone OTP** | **`123456`** |

4. Click **"Verify OTPs & Launch Workspace"** to auto-provision the workspace and sign in as `Company Admin`.

---

## 🌐 4. Google Auth / OAuth 2.0 Integration

LeadSphere supports instant Google Workspace sign-in.

| Attribute | Details |
| :--- | :--- |
| **Provider** | Google Auth (OAuth 2.0) |
| **Backend Endpoint** | `@Public()` `POST /api/v1/auth/google` |
| **Demo Email** | `alex.vance@gmail.com` |
| **Default Workspace** | `Vance Tech (Google Workspace)` |
| **Access Method** | Click **"Continue with Google Auth"** on `/login` |

---

## 🛡️ 5. Role-Based Access Control (RBAC) Summary

| Role | Workspace Access | Team Mgmt | Audit Logs | Document Vault | Super Admin Console |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | Platform-wide | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Company Admin** | Tenant Isolated | ✅ Full | ✅ Tenant | ✅ Full | ❌ Blocked (403) |
| **Company Member** | Tenant Isolated | ❌ No | ❌ No | ✅ Full | ❌ Blocked (403) |
| **Company Visitor** | Tenant Isolated (Read-Only) | ❌ No | ❌ No | 👁️ Read-Only | ❌ Blocked (403) |
