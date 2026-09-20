import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Send as CampaignIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  BarChart as AnalyticsIcon,
  GroupAdd as EnrollIcon,
  Description as TemplateIcon,
} from '@mui/icons-material';
import { EmailTemplateModal } from '../components/EmailTemplateModal';
import { CampaignBuilderDialog } from '../components/CampaignBuilderDialog';
import { CampaignAnalyticsDialog } from '../components/CampaignAnalyticsDialog';

interface CampaignRecord {
  id: string;
  name: string;
  status: string;
  sender_email: string;
  total_enrolled: number;
  delivered_count: number;
  opened_count: number;
  replied_count: number;
  created_at: string;
}

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);

  // Enrollment Modal state
  const [enrollCampaignId, setEnrollCampaignId] = useState<string | null>(null);
  const [tenantLeads, setTenantLeads] = useState<any[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/campaigns', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCampaigns(data.data || []);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/campaigns/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchCampaigns();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const openEnrollmentModal = async (campaignId: string) => {
    setEnrollCampaignId(campaignId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/leads?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTenantLeads(data.data || []);
      setSelectedLeadIds((data.data || []).map((l: any) => l.id)); // Default select all
    } catch (err) {
      console.error('Failed to fetch leads for campaign enrollment:', err);
    }
  };

  const handleExecuteEnrollment = async () => {
    if (!enrollCampaignId || selectedLeadIds.length === 0) return;
    setEnrolling(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/campaigns/${enrollCampaignId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ leadIds: selectedLeadIds }),
      });

      if (res.ok) {
        setEnrollCampaignId(null);
        fetchCampaigns();
      }
    } catch (err) {
      console.error('Failed to enroll leads:', err);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <Box>
      {/* Top Header & Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CampaignIcon color="primary" fontSize="large" /> Email Campaigns & Sequence Engine
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Build multi-step automated email outreach sequences, insert dynamic merge variables, and track engagement telemetry.
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<TemplateIcon />}
            onClick={() => setIsTemplateOpen(true)}
            sx={{ py: 1 }}
          >
            Create Template
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsBuilderOpen(true)}
            sx={{ py: 1 }}
          >
            New Campaign Sequence
          </Button>
        </Stack>
      </Box>

      {/* Campaigns Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : campaigns.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body1">No campaign sequences created yet.</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Campaign Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sender Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Enrolled Leads</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Delivered</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Open Rate</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((c) => {
                const openRate = c.delivered_count > 0 ? ((c.opened_count / c.delivered_count) * 100).toFixed(0) : '0';

                return (
                  <TableRow key={c.id}>
                    <TableCell sx={{ fontWeight: 700 }}>{c.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={c.status.toUpperCase()}
                        color={c.status === 'active' ? 'success' : c.status === 'paused' ? 'warning' : 'default'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>{c.sender_email}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{c.total_enrolled}</TableCell>
                    <TableCell>{c.delivered_count}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{openRate}%</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Enroll Leads">
                          <IconButton size="small" color="primary" onClick={() => openEnrollmentModal(c.id)}>
                            <EnrollIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={c.status === 'active' ? 'Pause Campaign' : 'Activate Campaign'}>
                          <IconButton
                            size="small"
                            color={c.status === 'active' ? 'warning' : 'success'}
                            onClick={() => handleToggleStatus(c.id, c.status)}
                          >
                            {c.status === 'active' ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="View Telemetry Analytics">
                          <IconButton size="small" onClick={() => setAnalyticsId(c.id)}>
                            <AnalyticsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Email Template Modal */}
      <EmailTemplateModal
        open={isTemplateOpen}
        onClose={() => setIsTemplateOpen(false)}
        onSaved={fetchCampaigns}
      />

      {/* Campaign Builder Dialog */}
      <CampaignBuilderDialog
        open={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSaved={fetchCampaigns}
      />

      {/* Campaign Telemetry Dialog */}
      <CampaignAnalyticsDialog
        campaignId={analyticsId}
        open={Boolean(analyticsId)}
        onClose={() => setAnalyticsId(null)}
      />

      {/* Lead Enrollment Dialog */}
      <Dialog open={Boolean(enrollCampaignId)} onClose={() => setEnrollCampaignId(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Enroll Leads into Campaign Sequence
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select leads to enroll into this automated outreach sequence.
          </Typography>

          <Paper variant="outlined" sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {tenantLeads.map((lead) => {
              const checked = selectedLeadIds.includes(lead.id);
              return (
                <Box
                  key={lead.id}
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Checkbox
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedLeadIds([...selectedLeadIds, lead.id]);
                        else setSelectedLeadIds(selectedLeadIds.filter((id) => id !== lead.id));
                      }}
                    />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {lead.first_name} {lead.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {lead.email || 'No Email'} • {lead.company_name || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEnrollCampaignId(null)} variant="outlined">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleExecuteEnrollment} disabled={enrolling}>
            {enrolling ? <CircularProgress size={24} /> : `Enroll ${selectedLeadIds.length} Leads`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
