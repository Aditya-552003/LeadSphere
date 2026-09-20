import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack,
  Divider,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Storage as PipelineIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ImportWizardDialog } from '../components/ImportWizardDialog';

interface ImportJobRecord {
  id: string;
  filename: string;
  total_rows: number;
  successful_rows: number;
  duplicate_rows: number;
  failed_rows: number;
  status: string;
  created_at: string;
}

interface ExportJobRecord {
  id: string;
  format: string;
  total_records: number;
  status: string;
  created_at: string;
}

export const DataPipelinesPage: React.FC = () => {
  const [importJobs, setImportJobs] = useState<ImportJobRecord[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch import history
      const importRes = await fetch('/api/v1/data/imports', { headers });
      const importData = await importRes.json();
      setImportJobs(importData.data || []);

      // Fetch export history
      const exportRes = await fetch('/api/v1/data/exports', { headers });
      const exportData = await exportRes.json();
      setExportJobs(exportData.data || []);
    } catch (err) {
      console.error('Failed to fetch data pipeline history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/data/exports', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leadsphere_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();

      fetchJobs();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadErrorReport = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/data/imports/${jobId}/error-report`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import_error_log_${jobId}.csv`;
      a.click();
    } catch (err) {
      console.error('Failed to download error log:', err);
    }
  };

  return (
    <Box>
      {/* Top Header & Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PipelineIcon color="primary" fontSize="large" /> Data Pipelines & Import/Export Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Execute high-performance CSV streaming imports, configure deduplication rules, and export tenant lead datasets with formula injection defense.
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={fetchJobs} title="Refresh jobs history">
            <RefreshIcon />
          </IconButton>

          <Button
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={20} /> : <DownloadIcon />}
            onClick={handleExportCsv}
            disabled={exporting}
            sx={{ py: 1 }}
          >
            Export Leads (CSV)
          </Button>

          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setIsWizardOpen(true)}
            sx={{ py: 1 }}
          >
            Import CSV Leads
          </Button>
        </Stack>
      </Box>

      {/* Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              TOTAL IMPORT JOBS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
              {importJobs.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              TOTAL LEADS IMPORTED
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: 'success.main' }}>
              {importJobs.reduce((acc, j) => acc + (j.successful_rows || 0), 0)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              EXPORT JOBS GENERATED
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: 'primary.main' }}>
              {exportJobs.length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Import History Table */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Recent CSV Import Pipeline History
      </Typography>

      <Paper variant="outlined" sx={{ mb: 5, borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : importJobs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">No CSV import jobs executed yet.</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Filename</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Rows</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Successful</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Duplicates Skipped</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Failed Rows</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Executed At</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {importJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{job.filename}</TableCell>
                  <TableCell>{job.total_rows}</TableCell>
                  <TableCell sx={{ color: 'success.main', fontWeight: 700 }}>{job.successful_rows}</TableCell>
                  <TableCell sx={{ color: 'warning.main', fontWeight: 600 }}>{job.duplicate_rows}</TableCell>
                  <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>{job.failed_rows}</TableCell>
                  <TableCell>
                    <Chip
                      label={job.status.toUpperCase()}
                      size="small"
                      color={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'info'}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell>{new Date(job.created_at).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    {job.failed_rows > 0 || job.duplicate_rows > 0 ? (
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => handleDownloadErrorReport(job.id)}
                      >
                        Error Log (CSV)
                      </Button>
                    ) : (
                      <Typography variant="caption" color="text.secondary">Clean</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Export History Table */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Export Pipeline History
      </Typography>

      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        {exportJobs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">No export jobs generated yet.</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Export ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Format</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Records Exported</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exportJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{job.id.substring(0, 8)}...</TableCell>
                  <TableCell sx={{ textTransform: 'uppercase' }}>{job.format}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{job.total_records}</TableCell>
                  <TableCell>
                    <Chip label={job.status.toUpperCase()} color="success" size="small" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>{new Date(job.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Multi-step Import Wizard */}
      <ImportWizardDialog
        open={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onImportCompleted={fetchJobs}
      />
    </Box>
  );
};
