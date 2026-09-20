import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  IconButton,
  Stack,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Send as EmailIcon,
  AccessTime as WaitIcon,
} from '@mui/icons-material';

interface CampaignBuilderDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface TemplateOption {
  id: string;
  name: string;
  subject: string;
}

interface StepInput {
  step_order: number;
  step_type: 'send_email' | 'wait_days';
  template_id?: string;
  wait_days?: number;
}

export const CampaignBuilderDialog: React.FC<CampaignBuilderDialogProps> = ({
  open,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [senderEmail, setSenderEmail] = useState('outreach@leadsphere.io');
  const [stopOnReply, setStopOnReply] = useState(true);
  const [stopOnStageChange, setStopOnStageChange] = useState(true);

  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [steps, setSteps] = useState<StepInput[]>([
    { step_order: 1, step_type: 'send_email', template_id: '' },
    { step_order: 2, step_type: 'wait_days', wait_days: 2 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) fetchTemplates();
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/campaigns/templates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTemplates(data.data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleAddStep = (type: 'send_email' | 'wait_days') => {
    const nextOrder = steps.length + 1;
    if (type === 'send_email') {
      setSteps([...steps, { step_order: nextOrder, step_type: 'send_email', template_id: templates[0]?.id || '' }]);
    } else {
      setSteps([...steps, { step_order: nextOrder, step_type: 'wait_days', wait_days: 3 }]);
    }
  };

  const handleRemoveStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index).map((s, idx) => ({ ...s, step_order: idx + 1 }));
    setSteps(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || steps.length === 0) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          sender_email: senderEmail,
          stop_on_reply: stopOnReply,
          stop_on_stage_change: stopOnStageChange,
          steps,
        }),
      });

      if (res.ok) {
        setName('');
        onSaved();
        onClose();
      }
    } catch (err) {
      console.error('Failed to create campaign sequence:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Create Campaign Sequence
        </DialogTitle>

        <DialogContent sx={{ py: 2 }}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                sx={{ flexGrow: 1 }}
                label="Campaign Name"
                placeholder="e.g., Q4 Tech Executives Outreach"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
              <TextField
                sx={{ width: 260 }}
                label="Sender Email Address"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                required
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={stopOnReply}
                    onChange={(e) => setStopOnReply(e.target.checked)}
                    color="primary"
                  />
                }
                label="Auto-Pause Sequence on Lead Reply"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={stopOnStageChange}
                    onChange={(e) => setStopOnStageChange(e.target.checked)}
                    color="primary"
                  />
                }
                label="Pause on Stage Progression"
              />
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                Sequence Steps Builder
              </Typography>

              <Stack spacing={2}>
                {steps.map((step, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, minWidth: 60 }}>
                      Step {step.step_order}
                    </Typography>

                    {step.step_type === 'send_email' ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Select Email Template</InputLabel>
                        <Select
                          value={step.template_id || ''}
                          label="Select Email Template"
                          onChange={(e) => {
                            const updated = [...steps];
                            updated[idx].template_id = e.target.value;
                            setSteps(updated);
                          }}
                        >
                          {templates.map((t) => (
                            <MenuItem key={t.id} value={t.id}>
                              {t.name} ({t.subject})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
                        <WaitIcon color="action" />
                        <Typography variant="body2">Wait</Typography>
                        <TextField
                          type="number"
                          size="small"
                          value={step.wait_days}
                          onChange={(e) => {
                            const updated = [...steps];
                            updated[idx].wait_days = Number(e.target.value);
                            setSteps(updated);
                          }}
                          sx={{ width: 90 }}
                          inputProps={{ min: 1, max: 30 }}
                        />
                        <Typography variant="body2">Days before next step</Typography>
                      </Box>
                    )}

                    <IconButton size="small" onClick={() => handleRemoveStep(idx)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>

              <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  onClick={() => handleAddStep('send_email')}
                >
                  + Add Email Step
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<WaitIcon />}
                  onClick={() => handleAddStep('wait_days')}
                >
                  + Add Wait Condition
                </Button>
              </Box>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Save Campaign Sequence'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
