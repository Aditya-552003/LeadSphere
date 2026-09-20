# MATERIAL UI (MUI v6) DESIGN SYSTEM & THEMING SPECIFICATION

# LeadSphere UI Component & Token System

---

## 1. DESIGN TOKENS & THEMING SPECIFICATION

LeadSphere utilizes **Material UI (MUI v6)** with dynamic theme overrides using `@mui/material/styles`:

```typescript
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

export const buildTenantTheme = (tenantBranding?: { primaryColor?: string; mode?: 'light' | 'dark' }) => {
  let theme = createTheme({
    palette: {
      mode: tenantBranding?.mode || 'light',
      primary: {
        main: tenantBranding?.primaryColor || '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#9c27b0',
      },
      background: {
        default: tenantBranding?.mode === 'dark' ? '#0a0e17' : '#f8fafc',
        paper: tenantBranding?.mode === 'dark' ? '#111827' : '#ffffff',
      },
    },
    typography: {
      fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'].join(','),
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 8,
    },
  });

  return responsiveFontSizes(theme);
};
```

---

## 2. TENANT BRANDING CONTRAST VALIDATION

Custom tenant primary colors submitted via tenant settings are programmatically validated before application:
* Calculated contrast ratio against `#FFFFFF` must be **≥ 4.5:1** (WCAG 2.2 AA compliance).
* If contrast ratio fails, the theme engine automatically calculates a darkened variant ensuring legibility.

---

## 3. CORE COMPONENT SPECIFICATIONS

### 3.1 Data Grid (`@mui/x-data-grid`)
* **Virtualization:** Enabled for both row and column rendering.
* **Sticky Headers:** Enabled with elevation shadow on scroll.
* **States:** Custom skeleton loaders (`Skeleton`), empty state banner, server-side pagination bar with total count estimate.

### 3.2 Lead 360° Timeline
* **Component:** `@mui/lab/Timeline` / Custom MUI List.
* **Events:** Distinct icons and chip colors for emails sent, WhatsApp messages, status changes, notes, and AI insights.

### 3.3 Kanban Deal Board
* **Grid:** Drag-and-drop columns utilizing MUI `Card`, `Chip`, and `Typography`.
* **Keyboard Accessibility:** Alternative "Move to stage..." menu accessible via keyboard shortcuts.

---

## 4. RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Layout Behaviour |
|---|---|---|
| **`xs`** | < 600px | Mobile: Sticky bottom navigation drawer, full-screen dialogs, cards replace tables |
| **`sm`** | 600px–899px | Tablet: Collapsible left navigation drawer |
| **`md`** | 900px–1199px | Small Desktop: Persistent compact sidebar navigation |
| **`lg`** | 1200px+ | Large Desktop: Full dual-column workspace layout with sticky lead summary sidebar |
