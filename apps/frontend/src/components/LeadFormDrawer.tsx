import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  MenuItem,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface LeadFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (leadData: any) => void;
  onSaved?: () => void;
}

export const LeadFormDrawer: React.FC<LeadFormDrawerProps> = ({ open, onClose, onSubmit, onSaved }) => {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [source, setSource] = useState('Website');
  const [budgetBand, setBudgetBand] = useState('10L - 25L');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || 'Lead';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload = {
      first_name: firstName,
      last_name: lastName,
      company_name: companyName,
      title: designation,
      email,
      phone,
      custom_fields: {
        industry,
        source,
        budget_band: budgetBand,
      },
    };

    if (onSubmit) {
      onSubmit({
        full_name: fullName,
        company_name: companyName,
        designation,
        email,
        phone,
        industry,
        source,
        custom: { budget_band: budgetBand },
      });
    }

    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/v1/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }
    } catch (err) {
      console.error('Failed to create lead backend:', err);
    }

    if (onSaved) onSaved();
    onClose();
    setFullName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: { xs: 320, sm: 460 }, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Create New Lead
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
            Basic Information
          </Typography>
          <TextField
            fullWidth
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="e.g., Sarah Jenkins"
          />
          <TextField
            fullWidth
            label="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Acme Tech Solutions"
          />
          <TextField
            fullWidth
            label="Designation / Title"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="e.g., VP of Sales"
          />

          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mt: 1 }}>
            Contact Details
          </Typography>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@acmetech.com"
          />
          <TextField
            fullWidth
            label="Phone Number (E.164)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 019 2831"
          />

          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mt: 1 }}>
            Custom Fields (JSONB)
          </Typography>
          <TextField
            fullWidth
            select
            label="Industry Category"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <MenuItem value="Technology">Technology & SaaS</MenuItem>
            <MenuItem value="FinTech">FinTech & Banking</MenuItem>
            <MenuItem value="Healthcare">Healthcare & Biotech</MenuItem>
            <MenuItem value="Manufacturing">Manufacturing & Retail</MenuItem>
          </TextField>
          <TextField
            fullWidth
            select
            label="Budget Band (Custom JSONB Field)"
            value={budgetBand}
            onChange={(e) => setBudgetBand(e.target.value)}
          >
            <MenuItem value="5L - 10L">5L - 10L</MenuItem>
            <MenuItem value="10L - 25L">10L - 25L</MenuItem>
            <MenuItem value="25L - 50L">25L - 50L</MenuItem>
            <MenuItem value="50L+">50L+</MenuItem>
          </TextField>
        </Box>

        <Box sx={{ pt: 3, display: 'flex', gap: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button fullWidth variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth type="submit" variant="contained">
            Save Lead
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
