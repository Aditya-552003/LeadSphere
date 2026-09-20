import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Code as VariableIcon } from '@mui/icons-material';

interface EmailTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const MERGE_VARIABLES = [
  { label: 'First Name', tag: '{{first_name}}' },
  { label: 'Last Name', tag: '{{last_name}}' },
  { label: 'Full Name', tag: '{{full_name}}' },
  { label: 'Company Name', tag: '{{company_name}}' },
  { label: 'Title / Designation', tag: '{{designation}}' },
  { label: 'Email Address', tag: '{{email}}' },
];

export const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({ open, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState(
    'Hi {{first_name}},\n\nI noticed your work at {{company_name}} and wanted to connect regarding our enterprise solution.\n\nBest regards,\nAlex',
  );
  const [submitting, setSubmitting] = useState(false);

  const handleInsertVariable = (tag: string) => {
    setBodyHtml((prev) => prev + ` ${tag} `);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !bodyHtml.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/campaigns/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          subject,
          body_html: bodyHtml,
          variables: ['first_name', 'company_name', 'designation'],
        }),
      });

      if (res.ok) {
        setName('');
        setSubject('');
        onSaved();
        onClose();
      }
    } catch (err) {
      console.error('Failed to create email template:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Create Email Template
        </DialogTitle>

        <DialogContent sx={{ py: 2 }}>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Template Name"
              placeholder="e.g., Initial Cold Outreach Sequence #1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />

            <TextField
              fullWidth
              label="Subject Line"
              placeholder="e.g., Quick question regarding {{company_name}}"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                INSERT DYNAMIC MERGE VARIABLES:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {MERGE_VARIABLES.map((v) => (
                  <Chip
                    key={v.tag}
                    icon={<VariableIcon style={{ fontSize: 14 }} />}
                    label={v.label}
                    onClick={() => handleInsertVariable(v.tag)}
                    size="small"
                    color="primary"
                    variant="outlined"
                    clickable
                  />
                ))}
              </Stack>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={8}
              label="Email Body (Plain Text or HTML)"
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              required
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Save Template'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
