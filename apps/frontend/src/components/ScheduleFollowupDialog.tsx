import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';

interface ScheduleFollowupDialogProps {
  open: boolean;
  initialLeadId?: string | null;
  initialDate?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

interface LeadOption {
  id: string;
  first_name: string;
  last_name: string;
  company_name?: string;
}

const TIMEZONES = [
  { label: 'UTC (Universal Coordinated Time)', value: 'UTC' },
  { label: 'EST / EDT (Eastern Time - US)', value: 'America/New_York' },
  { label: 'CST / CDT (Central Time - US)', value: 'America/Chicago' },
  { label: 'PST / PDT (Pacific Time - US)', value: 'America/Los_Angeles' },
  { label: 'IST (India Standard Time)', value: 'Asia/Kolkata' },
  { label: 'GMT / BST (London)', value: 'Europe/London' },
];

export const ScheduleFollowupDialog: React.FC<ScheduleFollowupDialogProps> = ({
  open,
  initialLeadId,
  initialDate,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('10:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [priority, setPriority] = useState('medium');
  const [recurrence, setRecurrence] = useState('none');
  const [notes, setNotes] = useState('');

  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLeads();
      if (initialLeadId) setLeadId(initialLeadId);
      if (initialDate) {
        setDueDate(initialDate);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDueDate(tomorrow.toISOString().split('T')[0]);
      }
    }
  }, [open, initialLeadId, initialDate]);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/v1/leads?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLeads(data.data || []);
    } catch (err) {
      console.error('Failed to load leads for followup selector:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setSubmitting(true);
    try {
      const dueTimestamp = new Date(`${dueDate}T${dueTime}:00`).toISOString();

      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/followups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          notes,
          lead_id: leadId || undefined,
          due_at: dueTimestamp,
          timezone,
          priority,
          recurrence,
        }),
      });

      if (res.ok) {
        setTitle('');
        setNotes('');
        onSaved();
        onClose();
      }
    } catch (err) {
      console.error('Failed to schedule followup:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Schedule Follow-up Task
        </DialogTitle>

        <DialogContent sx={{ py: 2 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Title"
                placeholder="e.g., Call Alexander Vance to review proposal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Associated Lead (Optional)</InputLabel>
                <Select
                  value={leadId}
                  label="Associated Lead (Optional)"
                  onChange={(e) => setLeadId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>None (Standalone Task)</em>
                  </MenuItem>
                  {leads.map((l) => (
                    <MenuItem key={l.id} value={l.id}>
                      {l.first_name} {l.last_name} {l.company_name ? `(${l.company_name})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Due Time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={timezone}
                  label="Timezone"
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <MenuItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority Level</InputLabel>
                <Select
                  value={priority}
                  label="Priority Level"
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <MenuItem value="low">Low Priority</MenuItem>
                  <MenuItem value="medium">Medium Priority</MenuItem>
                  <MenuItem value="high">High Priority</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Recurrence Rule</InputLabel>
                <Select
                  value={recurrence}
                  label="Recurrence Rule"
                  onChange={(e) => setRecurrence(e.target.value)}
                >
                  <MenuItem value="none">No Recurrence (One-Time)</MenuItem>
                  <MenuItem value="daily">Repeat Daily</MenuItem>
                  <MenuItem value="weekly">Repeat Weekly</MenuItem>
                  <MenuItem value="monthly">Repeat Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Task Notes / Preparation"
                placeholder="Include agenda, call topics, or reminder context..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Save Follow-up'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
