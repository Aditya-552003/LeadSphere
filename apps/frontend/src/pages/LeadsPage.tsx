import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Chip,
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Star as StarIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { LeadFormDrawer } from '../components/LeadFormDrawer';
import { LeadDetailDialog } from '../components/LeadDetailDialog';

interface LeadRecord {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  company_name?: string;
  title?: string;
  designation?: string;
  email?: string;
  phone?: string;
  location?: string;
  city?: string;
  score?: number;
  lead_score?: number;
  status?: string;
}

const INITIAL_LEADS: LeadRecord[] = [];

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const key = getStorageKey();
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

    if (token) {
      try {
        const res = await fetch('/api/v1/leads?limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data && Array.isArray(data.data)) {
            const backendLeads: LeadRecord[] = data.data.map((l: any) => ({
              ...l,
              full_name: l.full_name || `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unnamed Lead',
              designation: l.title || l.designation || 'N/A',
              lead_score: l.score || l.lead_score || 0,
              location: l.location || l.city || 'N/A',
            }));

            // Read local storage to preserve any locally created leads
            const stored = localStorage.getItem(key);
            let localLeads: LeadRecord[] = stored ? JSON.parse(stored) : [];

            // Merge localLeads not in backendLeads
            const backendIds = new Set(backendLeads.map((b) => b.id));
            const extraLocal = localLeads.filter((l) => !backendIds.has(l.id));

            const combined = [...extraLocal, ...backendLeads].filter(
              (l) =>
                !['alex@apexdigital.com', 'sophia@starlight.test', 'marcus@nexus.test', 'elena@vanguard.test'].includes(l.email || '') &&
                !['Alexander Vance', 'Sophia Reynolds', 'Marcus Brody', 'Elena Rostova'].includes(l.full_name || ''),
            );

            setLeads(combined);
            localStorage.setItem(key, JSON.stringify(combined));
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch leads from backend:', err);
      }
    }

    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        let parsed: LeadRecord[] = JSON.parse(stored);
        parsed = parsed.filter(
          (l) =>
            !['alex@apexdigital.com', 'sophia@starlight.test', 'marcus@nexus.test', 'elena@vanguard.test'].includes(l.email || '') &&
            !['Alexander Vance', 'Sophia Reynolds', 'Marcus Brody', 'Elena Rostova'].includes(l.full_name || ''),
        );
        setLeads(parsed);
        return;
      } catch (e) {}
    }

    setLeads([]);
  };

  const filteredLeads = leads.filter(
    (l) =>
      (l.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const columns: GridColDef[] = [
    {
      field: 'full_name',
      headerName: 'Lead Name',
      flex: 1.2,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32, fontSize: '0.85rem' }}>
            {(params.value || 'L').charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.designation}
            </Typography>
          </Box>
        </Box>
      ),
    },
    { field: 'company_name', headerName: 'Company', flex: 1, minWidth: 140 },
    {
      field: 'email',
      headerName: 'Contact Email',
      flex: 1.2,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <EmailIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value || 'N/A'}</Typography>
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone Number',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PhoneIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value || 'N/A'}</Typography>
        </Box>
      ),
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2">{params.value || params.row.city || 'N/A'}</Typography>
      ),
    },
    {
      field: 'lead_score',
      headerName: 'Lead Score',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={<StarIcon style={{ fontSize: 14, color: '#f59e0b' }} />}
          label={`${params.value || 0}/100`}
          size="small"
          sx={{ fontWeight: 700, bgcolor: 'action.hover' }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Stage / Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value || 'New'}
          size="small"
          color={
            params.value === 'Interested'
              ? 'success'
              : params.value === 'Proposal'
              ? 'warning'
              : params.value === 'Contacted'
              ? 'info'
              : 'default'
          }
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLeadId(params.row.id);
            setDetailOpen(true);
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Leads Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your lead repository, dynamic attributes, score tracking, and 360° timelines.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDrawerOpen(true)}
          sx={{ py: 1 }}
        >
          Add New Lead
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          size="small"
          placeholder="Search leads by name, company, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 380 }}
        />
      </Box>

      <Card sx={{ height: 520, width: '100%' }}>
        <DataGrid
          rows={filteredLeads}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          onRowClick={(params) => {
            setSelectedLeadId(String(params.id));
            setDetailOpen(true);
          }}
          sx={{ cursor: 'pointer' }}
        />
      </Card>

      <LeadFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          fetchLeads();
        }}
      />

      <LeadDetailDialog
        leadId={selectedLeadId}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedLeadId(null);
        }}
        onUpdated={fetchLeads}
      />
    </Box>
  );
};
