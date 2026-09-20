import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Avatar,
  Divider,
  Grid,
  TextField,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Timeline as TimelineIcon,
  Note as NoteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AttachMoney as MoneyIcon,
  Star as ScoreIcon,
} from '@mui/icons-material';

interface LeadDetailDialogProps {
  leadId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

interface TimelineItem {
  id: string;
  type: string;
  description: string;
  metadata?: any;
  createdAt: string;
  user?: { first_name: string; last_name: string };
}

export const LeadDetailDialog: React.FC<LeadDetailDialogProps> = ({
  leadId,
  open,
  onClose,
  onUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (open && leadId) {
      fetchLeadDetails();
    }
  }, [open, leadId]);

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch Lead Info
      const leadRes = await fetch(`/api/v1/leads/${leadId}`, { headers });
      const leadData = await leadRes.json();
      setLead(leadData.data || null);

      // Fetch Lead Timeline
      const timelineRes = await fetch(`/api/v1/leads/${leadId}/timeline`, { headers });
      const timelineData = await timelineRes.json();
      setTimeline(timelineData.data || []);
    } catch (err) {
      console.error('Failed to load lead details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !leadId) return;

    setSubmittingNote(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/leads/${leadId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: newNote.trim() }),
      });

      if (res.ok) {
        setNewNote('');
        fetchLeadDetails(); // refresh timeline & notes
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const getScoreColor = (score: number = 0) => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontWeight: 700 }}>
            {lead ? `${lead.first_name?.[0] || ''}${lead.last_name?.[0] || ''}` : 'L'}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {lead ? `${lead.first_name} ${lead.last_name}` : 'Lead Details'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lead?.company_name ? `${lead.company_name} • ` : ''}{lead?.title || 'No Title'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : lead ? (
          <Grid container spacing={3}>
            {/* Left Column: Quick Metadata & Summary */}
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                  LEAD METRICS & SCORE
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ScoreIcon fontSize="small" color="primary" /> Lead Score
                    </Typography>
                    <Chip
                      label={`${lead.score || 0} / 100`}
                      color={getScoreColor(lead.score)}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MoneyIcon fontSize="small" color="success" /> Deal Value
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                      ${Number(lead.estimated_value || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip label={lead.status || 'New'} size="small" variant="outlined" color="primary" />
                  </Box>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                  CONTACT DETAILS
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2" noWrap>{lead.email || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">{lead.phone || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body2">{lead.company_name || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">{lead.title || 'N/A'}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Right Column: Activity Stream & Notes */}
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NoteIcon color="primary" fontSize="small" /> Add Note
                </Typography>
                <form onSubmit={handleAddNote}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Add meeting notes, call summary, or updates..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="small"
                      disabled={!newNote.trim() || submittingNote}
                      startIcon={<SendIcon />}
                    >
                      Post Note
                    </Button>
                  </Box>
                </form>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon color="primary" fontSize="small" /> 360° Activity Timeline
              </Typography>

              {timeline.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No activities recorded yet.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {timeline.map((item) => (
                    <Card key={item.id} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Chip
                            label={item.type.replace('_', ' ').toUpperCase()}
                            size="small"
                            color={item.type === 'note_created' ? 'info' : 'default'}
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Grid>
          </Grid>
        ) : (
          <Typography color="error">Failed to load lead details.</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
