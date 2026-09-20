import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { buildTenantTheme } from './theme/tenant-theme';
import { WorkspaceLayout } from './layouts/WorkspaceLayout';
import { LoginPage } from './pages/LoginPage';
import { MfaPage } from './pages/MfaPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { TeamPage } from './pages/TeamPage';
import { PipelinePage } from './pages/PipelinePage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { DataPipelinesPage } from './pages/DataPipelinesPage';
import { FollowupsPage } from './pages/FollowupsPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { UnifiedInboxPage } from './pages/UnifiedInboxPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LandingPage } from './pages/LandingPage';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  const [themeMode] = useState<'light' | 'dark'>('light');
  const theme = buildTenantTheme('#1976d2', themeMode);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/mfa" element={<MfaPage />} />
            
            <Route path="/app" element={<WorkspaceLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
            </Route>

            <Route path="/" element={<WorkspaceLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="followups" element={<FollowupsPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="inbox" element={<UnifiedInboxPage />} />
              <Route path="ai" element={<AiAssistantPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="data-pipelines" element={<DataPipelinesPage />} />
              <Route path="audit" element={<AuditLogPage />} />
              <Route path="super-admin" element={<SuperAdminPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
