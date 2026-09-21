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
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('Technology & SaaS');
  const [source, setSource] = useState('Website');
  const [budgetBand, setBudgetBand] = useState('10L - 25L');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedFullName = fullName.trim() || 'Unnamed Lead';
    const nameParts = trimmedFullName.split(' ');
    const firstName = nameParts[0] || 'Lead';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload = {
      full_name: trimmedFullName,
      first_name: firstName,
      last_name: lastName,
      company_name: companyName.trim() || undefined,
      title: designation.trim() || undefined,
      designation: designation.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      location: location.trim() || undefined,
      city: location.trim() || undefined,
      industry: industry,
      source: source,
      custom: {
        industry,
        source,
        budget_band: budgetBand,
        location: location.trim(),
      },
    };

    let newLeadRecord: any = {
      id: `lead_${Date.now()}`,
      full_name: trimmedFullName,
      first_name: firstName,
      last_name: lastName,
      company_name: companyName,
      title: designation,
      designation,
      email,
      phone,
      location,
      city: location,
      status: 'New',
      lead_score: 50,
      custom: payload.custom,
    };

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token) {
        const res = await fetch('/api/v1/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.data) {
            newLeadRecord = {
              ...resData.data,
              full_name: resData.data.full_name || trimmedFullName,
              designation: resData.data.title || resData.data.designation || designation,
              location: resData.data.location || resData.data.city || location,
              lead_score: resData.data.score || resData.data.lead_score || 50,
            };
          }
        }
      }
    } catch (err) {
      console.error('Failed to create lead backend:', err);
    }

    // Update local cache key so local state receives the new lead instantly
    try {
      const key = getStorageKey();
      const existing = localStorage.getItem(key);
      let list = existing ? JSON.parse(existing) : [];
      list = [newLeadRecord, ...list];
      localStorage.setItem(key, JSON.stringify(list));
    } catch (err) {
      console.error('Failed to save lead to local cache:', err);
    }

    if (onSubmit) {
      onSubmit(newLeadRecord);
    }

    if (onSaved) onSaved();
    onClose();

    // Reset form fields
    setFullName('');
    setCompanyName('');
    setDesignation('');
    setEmail('');
    setPhone('');
    setLocation('');
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
          <TextField
            fullWidth
            label="Location / City"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., New York, NY"
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
            <MenuItem value="Technology & SaaS">Technology & SaaS</MenuItem>
            <MenuItem value="FinTech & Banking">FinTech & Banking</MenuItem>
            <MenuItem value="Healthcare & Biotech">Healthcare & Biotech</MenuItem>
            <MenuItem value="Manufacturing & Retail">Manufacturing & Retail</MenuItem>
            <MenuItem value="Real Estate & Construction">Real Estate & Construction</MenuItem>
            <MenuItem value="E-Commerce & Retail">E-Commerce & Retail</MenuItem>
            <MenuItem value="Consulting & Services">Consulting & Services</MenuItem>
            <MenuItem value="Education & EdTech">Education & EdTech</MenuItem>
          </TextField>
          <TextField
            fullWidth
            select
            label="Budget Band (Custom JSONB Field)"
            value={budgetBand}
            onChange={(e) => setBudgetBand(e.target.value)}
          >
            <MenuItem value="< 5L">&lt; 5L</MenuItem>
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
