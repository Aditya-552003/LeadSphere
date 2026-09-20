import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
  Paper,
  CircularProgress,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as MoneyIcon,
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
  status: string;
  stage_id?: string;
  score: number;
  estimated_value: number;
}

export const PipelinePage: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([]);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch stages
      const stagesRes = await fetch('/api/v1/pipeline/stages', { headers });
      const stagesData = await stagesRes.json();
      const fetchedStages: Stage[] = stagesData.data || [];

      // Fetch leads
      const leadsRes = await fetch('/api/v1/leads?limit=100', { headers });
      const leadsData = await leadsRes.json();
      const fetchedLeads: Lead[] = leadsData.data || [];

      setStages(fetchedStages);
      setLeads(fetchedLeads);
    } catch (err) {
      console.error('Failed to fetch pipeline data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    setCreatingStage(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/pipeline/stages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newStageName.trim(), color: newStageColor }),
      });

      if (res.ok) {
        setIsStageDialogOpen(false);
        setNewStageName('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create stage:', err);
    } finally {
      setCreatingStage(false);
    }
  };

  const handleMoveStage = async (leadId: string, stageId: string) => {
    setMenuAnchorEl(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stage_id: stageId }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to move lead stage:', err);
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
    const fullName = `${lead.first_name} ${lead.last_name}`.toLowerCase();
    const company = (lead.company_name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || company.includes(query);
  });

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
            const stageLeads = filteredLeads.filter((l) => {
              if (l.stage_id) return l.stage_id === stage.id;
              // default to first stage if no stage_id
              return stage.position === 1;
            });

            const totalValue = stageLeads.reduce(
              (acc, l) => acc + (Number(l.estimated_value) || 0),
              0
            );

            return (
              <Paper
                key={stage.id}
                variant="outlined"
                sx={{
                  minWidth: 300,
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
                    justify: 'space-between',
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
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', ml: 'auto' }}>
                    ${totalValue.toLocaleString()}
                  </Typography>
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
                            {lead.title ? `• ${lead.title}` : ''}
                          </Typography>

                          <Divider sx={{ my: 1 }} />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <MoneyIcon fontSize="small" color="success" />
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>
                                ${Number(lead.estimated_value || 0).toLocaleString()}
                              </Typography>
                            </Box>

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
            onClick={() => activeLeadForMove && handleMoveStage(activeLeadForMove.id, stg.id)}
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
