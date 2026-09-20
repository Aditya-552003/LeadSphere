import React, { useState } from 'react';
import { Box, Typography, Card, Chip, TextField, InputAdornment } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Search as SearchIcon, Shield as ShieldIcon } from '@mui/icons-material';

interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  ip_address: string;
  created_at: string;
}

const INITIAL_LOGS: AuditLogEntry[] = [
  { id: '1', actor: 'Alex Vance (Admin)', action: 'USER_INVITED', entity_type: 'membership', ip_address: '192.168.1.45', created_at: '2026-09-20 00:15:32' },
  { id: '2', actor: 'Alex Vance (Admin)', action: 'ROLE_CHANGED', entity_type: 'membership', ip_address: '192.168.1.45', created_at: '2026-09-19 22:10:04' },
  { id: '3', actor: 'Super Admin (Support)', action: 'SUPPORT_ACCESS_STARTED', entity_type: 'tenant', ip_address: '10.0.0.12', created_at: '2026-09-19 18:45:12' },
  { id: '4', actor: 'Sarah Connor', action: 'LEAD_CREATED', entity_type: 'lead', ip_address: '172.16.0.8', created_at: '2026-09-19 14:20:00' },
];

export const AuditLogPage: React.FC = () => {
  const [logs] = useState<AuditLogEntry[]>(INITIAL_LOGS);
  const [filter, setFilter] = useState('');

  const filteredLogs = logs.filter(
    (l) =>
      l.actor.toLowerCase().includes(filter.toLowerCase()) ||
      l.action.toLowerCase().includes(filter.toLowerCase()) ||
      l.entity_type.toLowerCase().includes(filter.toLowerCase()),
  );

  const columns: GridColDef[] = [
    { field: 'created_at', headerName: 'Timestamp (UTC)', width: 170 },
    { field: 'actor', headerName: 'Actor Identity', flex: 1.2, minWidth: 180 },
    {
      field: 'action',
      headerName: 'Event Action',
      flex: 1.2,
      minWidth: 180,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value.includes('SUPPORT') ? 'warning' : 'primary'}
          variant="outlined"
          sx={{ fontWeight: 600, fontFamily: 'monospace' }}
        />
      ),
    },
    { field: 'entity_type', headerName: 'Entity Scope', width: 140 },
    { field: 'ip_address', headerName: 'IP Address', width: 140 },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldIcon color="primary" fontSize="large" /> Security Audit Log
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Immutable, non-deletable record of all workspace authentication and data governance actions.
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Filter audit events..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 280 }}
        />
      </Box>

      <Card sx={{ height: 520, width: '100%' }}>
        <DataGrid
          rows={filteredLogs}
          columns={columns}
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
        />
      </Card>
    </Box>
  );
};
