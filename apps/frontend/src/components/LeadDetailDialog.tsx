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
  MenuItem,
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
  Star as ScoreIcon,
  LocationOn as LocationOnIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
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

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState('New');
  const [editIndustry, setEditIndustry] = useState('Technology & SaaS');
  const [editBudgetBand, setEditBudgetBand] = useState('10L - 25L');

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
    if (open && leadId) {
      setIsEditing(false);
      fetchLeadDetails();
    } else if (!open) {
      setLead(null);
      setIsEditing(false);
    }
  }, [open, leadId]);

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    setLoading(true);

    // 1. Check local storage first as a fast and reliable fallback
    let localFound: any = null;
    try {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        localFound = parsed.find((l: any) => String(l.id) === String(leadId));
        if (localFound) {
          setLead(localFound);
        }
      }
    } catch (e) {}

    // 2. Fetch fresh lead info & timeline from backend API
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const leadRes = await fetch(`/api/v1/leads/${leadId}`, { headers });
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        if (leadData.data) {
          setLead(leadData.data);
        }
      }

      const timelineRes = await fetch(`/api/v1/leads/${leadId}/timeline`, { headers });
      if (timelineRes.ok) {
        const timelineData = await timelineRes.json();
        setTimeline(timelineData.data || []);
      }
    } catch (err) {
      console.error('Failed to load lead details from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEditMode = () => {
    if (!lead) return;
    const name = lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || '';
    setEditFullName(name);
    setEditCompanyName(lead.company_name || '');
    setEditDesignation(lead.title || lead.designation || '');
    setEditEmail(lead.email || '');
    setEditPhone(lead.phone || '');
    setEditLocation(lead.location || lead.city || '');
    setEditStatus(lead.status || 'New');
    setEditIndustry(lead.industry || lead.custom?.industry || 'Technology & SaaS');
    setEditBudgetBand(lead.custom?.budget_band || '10L - 25L');
    setIsEditing(true);
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lead) return;
    setSubmittingEdit(true);

    const nameParts = editFullName.trim().split(' ');
    const firstName = nameParts[0] || 'Lead';
    const lastName = nameParts.slice(1).join(' ') || '';

    const updatePayload = {
      full_name: editFullName.trim(),
      first_name: firstName,
      last_name: lastName,
      company_name: editCompanyName.trim(),
      title: editDesignation.trim(),
      designation: editDesignation.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      location: editLocation.trim(),
      city: editLocation.trim(),
      status: editStatus,
      industry: editIndustry,
      custom: {
        ...(lead.custom || {}),
        industry: editIndustry,
        budget_band: editBudgetBand,
        location: editLocation.trim(),
      },
    };

    const updatedLeadObj = {
      ...lead,
      ...updatePayload,
      score: lead.score || lead.lead_score || 50,
      lead_score: lead.lead_score || lead.score || 50,
    };

    // 1. Send update to backend if available
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token && leadId && !leadId.startsWith('lead_')) {
        const res = await fetch(`/api/v1/leads/${leadId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatePayload),
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.data) {
            Object.assign(updatedLeadObj, resData.data);
          }
        }
      }
    } catch (err) {
      console.error('Failed to save lead update to backend:', err);
    }

    // 2. Persist update in local storage cache
    try {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        let list = JSON.parse(stored);
        list = list.map((item: any) =>
          String(item.id) === String(leadId) ? { ...item, ...updatedLeadObj } : item,
        );
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch (e) {
      console.error('Failed to update local storage:', e);
    }

    setLead(updatedLeadObj);
    setIsEditing(false);
    setSubmittingEdit(false);

    if (onUpdated) onUpdated();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !leadId) return;

    setSubmittingNote(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
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

  const leadName = lead
    ? lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Lead Details'
    : 'Lead Details';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontWeight: 700 }}>
            {lead ? leadName.charAt(0).toUpperCase() : 'L'}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {isEditing ? 'Edit Lead Details' : leadName}
            </Typography>
            {!isEditing && (
              <Typography variant="caption" color="text.secondary">
                {lead?.company_name ? `${lead.company_name} • ` : ''}
                {lead?.title || lead?.designation || 'No Title'}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lead && !isEditing && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={startEditMode}
              sx={{ borderRadius: 2 }}
            >
              Edit Lead
            </Button>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3 }}>
        {loading && !lead ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : isEditing ? (
          /* EDIT MODE FORM */
          <Box component="form" onSubmit={handleSaveEdit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
              Basic Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Designation / Title"
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Status / Stage"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <MenuItem value="New">New</MenuItem>
                  <MenuItem value="Contacted">Contacted</MenuItem>
                  <MenuItem value="Interested">Interested</MenuItem>
                  <MenuItem value="Proposal">Proposal</MenuItem>
                  <MenuItem value="Closed Won">Closed Won</MenuItem>
                  <MenuItem value="Closed Lost">Closed Lost</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mt: 1 }}>
              Contact Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location / City"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mt: 1 }}>
              Custom Fields (JSONB)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Industry Category"
                  value={editIndustry}
                  onChange={(e) => setEditIndustry(e.target.value)}
                >
                  <MenuItem value="Technology & SaaS">Technology & SaaS</MenuItem>
                  <MenuItem value="FinTech & Banking">FinTech & Banking</MenuItem>
                  <MenuItem value="Healthcare & Biotech">Healthcare & Biotech</MenuItem>
                  <MenuItem value="Manufacturing & Retail">Manufacturing & Retail</MenuItem>
                  <MenuItem value="Real Estate & Construction">Real Estate & Construction</MenuItem>
                  <MenuItem value="E-Commerce & Retail">E-Commerce & Retail</MenuItem>
                  <MenuItem value="Consulting & Services">Consulting & Services</MenuItem>
                  <MenuItem value="Education & EdTech">Education & EdTech</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Budget Band"
                  value={editBudgetBand}
                  onChange={(e) => setEditBudgetBand(e.target.value)}
                >
                  <MenuItem value="< 5L">&lt; 5L</MenuItem>
                  <MenuItem value="5L - 10L">5L - 10L</MenuItem>
                  <MenuItem value="10L - 25L">10L - 25L</MenuItem>
                  <MenuItem value="25L - 50L">25L - 50L</MenuItem>
                  <MenuItem value="50L+">50L+</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => setIsEditing(false)}
                disabled={submittingEdit}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={submittingEdit}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        ) : lead ? (
          /* VIEW MODE */
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
                      label={`${lead.lead_score || lead.score || 0} / 100`}
                      color={getScoreColor(lead.lead_score || lead.score)}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
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
                    <Typography variant="body2">{lead.title || lead.designation || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2">{lead.location || lead.city || 'N/A'}</Typography>
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
          <Typography color="error">Lead details not available.</Typography>
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
