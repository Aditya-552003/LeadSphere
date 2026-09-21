import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Paper,
  CircularProgress,
  Menu,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Star as ScoreIcon,
  ViewColumn as KanbanIcon,
  ArrowForward as MoveIcon,
} from '@mui/icons-material';
import { LeadFormDrawer } from '../components/LeadFormDrawer';
import { LeadDetailDialog } from '../components/LeadDetailDialog';

interface Stage {
  id: string;
  name: string;
  color: string;
  position: number;
  probability: number;
  is_won?: boolean;
  is_lost?: boolean;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  company_name?: string;
  title?: string;
  designation?: string;
  status: string;
  stage_id?: string;
  score: number;
}

const DEFAULT_STAGES: Stage[] = [
  { id: 'stage_new', name: 'New / Lead In', color: '#3b82f6', position: 1, probability: 10 },
  { id: 'stage_contacted', name: 'Contacted', color: '#8b5cf6', position: 2, probability: 30 },
  { id: 'stage_interested', name: 'Interested / Proposal', color: '#f59e0b', position: 3, probability: 60 },
  { id: 'stage_negotiation', name: 'Negotiation', color: '#ec4899', position: 4, probability: 80 },
  { id: 'stage_won', name: 'Closed Won', color: '#10b981', position: 5, probability: 100, is_won: true },
  { id: 'stage_lost', name: 'Closed Lost', color: '#ef4444', position: 6, probability: 0, is_lost: true },
];

export const PipelinePage: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Drawers & Modals state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // New Stage Dialog state
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#3b82f6');
  const [creatingStage, setCreatingStage] = useState(false);

  // Stage transition menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeLeadForMove, setActiveLeadForMove] = useState<Lead | null>(null);

  const getStorageKey = () => {
    try {
      const storedTenant = localStorage.getItem('tenant');
      if (storedTenant) {
        const parsed = JSON.parse(storedTenant);
        const tId = parsed.id || parsed.slug;
        if (tId) return `leads_${tId}`;
      }
    } catch (e) {}
    return 'leads_default';
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let currentStages: Stage[] = DEFAULT_STAGES;
    let currentLeads: Lead[] = [];

    // 1. Read local storage first for reliable offline & cached lead display
    const key = getStorageKey();
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        currentLeads = parsed.map((l: any) => ({
          ...l,
          first_name: l.first_name || l.full_name?.split(' ')[0] || 'Lead',
          last_name: l.last_name || l.full_name?.split(' ').slice(1).join(' ') || '',
          score: l.score || l.lead_score || 0,
          title: l.title || l.designation || '',
          status: l.status || 'New',
        }));
      } catch (e) {}
    }

    // 2. Fetch fresh stages & leads from backend API if available
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const stagesRes = await fetch('/api/v1/pipeline/stages', { headers });
      if (stagesRes.ok) {
        const stagesData = await stagesRes.json();
        if (stagesData.data && Array.isArray(stagesData.data) && stagesData.data.length > 0) {
          currentStages = stagesData.data;
        }
      }

      const leadsRes = await fetch('/api/v1/leads?limit=100', { headers });
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        if (leadsData.data && Array.isArray(leadsData.data)) {
          const apiLeads = leadsData.data.map((l: any) => ({
            ...l,
            first_name: l.first_name || l.full_name?.split(' ')[0] || 'Lead',
            last_name: l.last_name || l.full_name?.split(' ').slice(1).join(' ') || '',
            score: l.score || l.lead_score || 0,
            title: l.title || l.designation || '',
            status: l.status || 'New',
          }));

          const apiIds = new Set(apiLeads.map((b: any) => b.id));
          const extraLocal = currentLeads.filter((l) => !apiIds.has(l.id));
          currentLeads = [...extraLocal, ...apiLeads];
        }
      }
    } catch (err) {
      console.error('Failed to fetch pipeline data from backend:', err);
    } finally {
      setStages(currentStages);
      setLeads(currentLeads);
      setLoading(false);
    }
  };

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    setCreatingStage(true);
    const newStageObj: Stage = {
      id: `stage_${Date.now()}`,
      name: newStageName.trim(),
      color: newStageColor || '#3b82f6',
      position: stages.length + 1,
      probability: 50,
    };

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token) {
        await fetch('/api/v1/pipeline/stages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newStageName.trim(), color: newStageColor }),
        });
      }
    } catch (err) {
      console.error('Failed to create stage backend:', err);
    }

    setStages((prev) => [...prev, newStageObj]);
    setIsStageDialogOpen(false);
    setNewStageName('');
    setCreatingStage(false);
  };

  const handleMoveStage = async (leadId: string, targetStage: Stage) => {
    setMenuAnchorEl(null);

    let newStatus = 'New';
    const stageNameStr = targetStage.name.toLowerCase();
    if (stageNameStr.includes('contact')) newStatus = 'Contacted';
    else if (stageNameStr.includes('interest') || stageNameStr.includes('propos')) newStatus = 'Interested';
    else if (stageNameStr.includes('negotiat')) newStatus = 'Proposal';
    else if (stageNameStr.includes('won')) newStatus = 'Closed Won';
    else if (stageNameStr.includes('lost')) newStatus = 'Closed Lost';

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage_id: targetStage.id, status: newStatus } : l)),
    );

    try {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        let list = JSON.parse(stored);
        list = list.map((l: any) =>
          String(l.id) === String(leadId) ? { ...l, stage_id: targetStage.id, status: newStatus } : l,
        );
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch (e) {}

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token && !leadId.startsWith('lead_')) {
        await fetch(`/api/v1/leads/${leadId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ stage_id: targetStage.id, status: newStatus }),
        });
      }
    } catch (err) {
      console.error('Failed to move lead stage on backend:', err);
    }
  };

  const openMoveMenu = (event: React.MouseEvent<HTMLElement>, lead: Lead) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setActiveLeadForMove(lead);
  };

  const closeMoveMenu = () => {
    setMenuAnchorEl(null);
    setActiveLeadForMove(null);
  };

  const filteredLeads = leads.filter((lead) => {
    const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase();
    const company = (lead.company_name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || company.includes(query);
  });

  const getStageLeads = (stage: Stage) => {
    return filteredLeads.filter((l) => {
      if (l.stage_id && l.stage_id === stage.id) return true;

      const statusStr = (l.status || '').toLowerCase();
      const stageNameStr = (stage.name || '').toLowerCase();

      if (stageNameStr.includes('new') || stageNameStr.includes('lead in')) {
        return statusStr === 'new' || !l.status || statusStr === 'default';
      }
      if (stageNameStr.includes('contact')) {
        return statusStr === 'contacted';
      }
      if (stageNameStr.includes('interest') || stageNameStr.includes('propos')) {
        return statusStr === 'interested' || statusStr === 'proposal';
      }
      if (stageNameStr.includes('negotiat')) {
        return statusStr === 'proposal' || statusStr === 'negotiation';
      }
      if (stageNameStr.includes('won')) {
        return statusStr === 'closed won' || statusStr === 'won';
      }
      if (stageNameStr.includes('lost')) {
        return statusStr === 'closed lost' || statusStr === 'lost';
      }

      // If no explicit match and first stage, assign remaining default leads
      if (stage.position === 1 && !l.stage_id && !['contacted', 'interested', 'proposal', 'closed won', 'closed lost'].includes(statusStr)) {
        return true;
      }

      return false;
    });
  };

  const getScoreColor = (score: number = 0) => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {/* Top Header & Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <KanbanIcon color="primary" /> Deal Pipeline (Kanban)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage stages, track lead values, and update deal progression.
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Filter deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 220 }}
          />

          <Button
            variant="outlined"
            size="medium"
            onClick={() => setIsStageDialogOpen(true)}
          >
            + Add Stage
          </Button>

          <Button
            variant="contained"
            size="medium"
            startIcon={<AddIcon />}
            onClick={() => setIsDrawerOpen(true)}
          >
            New Lead
          </Button>
        </Stack>
      </Box>

      {/* Kanban Board Container */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            minHeight: 'calc(100vh - 220px)',
          }}
        >
          {stages.map((stage) => {
            const stageLeads = getStageLeads(stage);

            return (
              <Paper
                key={stage.id}
                variant="outlined"
                sx={{
                  minWidth: 280,
                  maxWidth: 320,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '100%',
                }}
              >
                {/* Column Header */}
                <Box
                  sx={{
                    p: 2,
                    borderBottom: '2px solid',
                    borderColor: stage.color || 'primary.main',
                    bgcolor: 'background.paper',
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: stage.color || '#3b82f6',
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {stage.name}
                    </Typography>
                    <Chip
                      label={stageLeads.length}
                      size="small"
                      sx={{ height: 20, fontSize: '0.75rem', fontWeight: 700 }}
                    />
                  </Box>
                </Box>

                {/* Column Lead Cards */}
                <Box sx={{ p: 1.5, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {stageLeads.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                      <Typography variant="caption">No deals in stage</Typography>
                    </Box>
                  ) : (
                    stageLeads.map((lead) => (
                      <Card
                        key={lead.id}
                        variant="outlined"
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setIsDetailOpen(true);
                        }}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: 3,
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {lead.first_name} {lead.last_name}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => openMoveMenu(e, lead)}
                              sx={{ mt: -0.5, mr: -0.5 }}
                            >
                              <MoveIcon fontSize="small" />
                            </IconButton>
                          </Box>

                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                            {lead.company_name ? `${lead.company_name} ` : ''}
                            {lead.title || lead.designation ? `• ${lead.title || lead.designation}` : ''}
                          </Typography>

                          <Divider sx={{ my: 1 }} />

                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Chip
                              icon={<ScoreIcon style={{ fontSize: 12 }} />}
                              label={`${lead.score || 0}`}
                              color={getScoreColor(lead.score)}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Move Stage Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={closeMoveMenu}
      >
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, fontWeight: 700, display: 'block' }}>
          MOVE TO STAGE:
        </Typography>
        {stages.map((stg) => (
          <MenuItem
            key={stg.id}
            onClick={() => activeLeadForMove && handleMoveStage(activeLeadForMove.id, stg)}
            disabled={activeLeadForMove?.stage_id === stg.id}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: stg.color || '#3b82f6',
                mr: 1.5,
              }}
            />
            {stg.name}
          </MenuItem>
        ))}
      </Menu>

      {/* Add Lead Form Drawer */}
      <LeadFormDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSaved={() => {
          setIsDrawerOpen(false);
          fetchData();
        }}
      />

      {/* 360° Lead Detail Dialog */}
      <LeadDetailDialog
        leadId={selectedLeadId}
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedLeadId(null);
        }}
        onUpdated={fetchData}
      />

      {/* Add Stage Modal */}
      <Dialog open={isStageDialogOpen} onClose={() => setIsStageDialogOpen(false)}>
        <form onSubmit={handleCreateStage}>
          <DialogTitle sx={{ fontWeight: 700 }}>Add Pipeline Stage</DialogTitle>
          <DialogContent sx={{ minWidth: 320 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Stage Name"
              fullWidth
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              required
            />
            <TextField
              margin="dense"
              label="Color Code (Hex)"
              fullWidth
              value={newStageColor}
              onChange={(e) => setNewStageColor(e.target.value)}
              placeholder="#3b82f6"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIsStageDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creatingStage}>
              Create Stage
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
