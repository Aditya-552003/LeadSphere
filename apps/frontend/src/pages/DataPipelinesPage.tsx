import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  IconButton,
  Stack,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Storage as PipelineIcon,
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  UploadFile as PdfUploadIcon,
} from '@mui/icons-material';
import { ImportWizardDialog } from '../components/ImportWizardDialog';
import { PdfImportDialog } from '../components/PdfImportDialog';
import { BulkImportWizardDialog } from '../components/BulkImportWizardDialog';

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
  const [isPdfWizardOpen, setIsPdfWizardOpen] = useState(false);
  const [isBulkWizardOpen, setIsBulkWizardOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch CSV import history from backend
      let csvImports: ImportJobRecord[] = [];
      try {
        const importRes = await fetch('/api/v1/data/imports', { headers });
        const importData = await importRes.json();
        csvImports = importData.data || [];
      } catch (e) {}

      // Fetch PDF import history from local storage
      let pdfImports: ImportJobRecord[] = [];
      try {
        const p = localStorage.getItem('pdf_import_jobs');
        if (p) pdfImports = JSON.parse(p);
      } catch (e) {}

      setImportJobs([...pdfImports, ...csvImports]);

      // Fetch export history
      let csvExports: ExportJobRecord[] = [];
      try {
        const exportRes = await fetch('/api/v1/data/exports', { headers });
        const exportData = await exportRes.json();
        csvExports = exportData.data || [];
      } catch (e) {}

      let pdfExports: ExportJobRecord[] = [];
      try {
        const p = localStorage.getItem('pdf_export_jobs');
        if (p) pdfExports = JSON.parse(p);
      } catch (e) {}

      setExportJobs([...pdfExports, ...csvExports]);
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

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      let tId = 'default';
      try {
        const storedTenant = localStorage.getItem('tenant');
        if (storedTenant) {
          const parsed = JSON.parse(storedTenant);
          tId = parsed.id || parsed.slug || 'default';
        }
      } catch (e) {}

      const key = `leads_${tId}`;
      let leads: any[] = [];
      try {
        const stored = localStorage.getItem(key);
        if (stored) leads = JSON.parse(stored);
      } catch (e) {}

      // Generate formatted PDF printable report stream
      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        const dateStr = new Date().toLocaleDateString();
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>LeadSphere Workspace Lead Report - ${dateStr}</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 30px; }
                .title { font-size: 24px; font-weight: bold; color: #1e293b; }
                .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
                .badge { background-color: #e0e7ff; color: #3730a3; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #f8fafc; color: #475569; text-align: left; padding: 10px; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
                td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
                .amount { font-weight: 700; color: #16a34a; }
                .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <div class="title">LeadSphere Lead Pipeline Dataset Report</div>
                  <div class="subtitle">Generated on ${dateStr} • Total Leads: ${leads.length}</div>
                </div>
                <div class="badge">CONFIDENTIAL TENANT DATA</div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Lead Name</th>
                    <th>Company</th>
                    <th>Contact Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    leads.length === 0
                      ? '<tr><td colspan="6" style="text-align:center; padding:30px; color:#94a3b8;">No lead records found in active workspace dataset.</td></tr>'
                      : leads
                          .map(
                            (l, i) => `
                        <tr>
                          <td>${i + 1}</td>
                          <td><strong>${l.full_name || `${l.first_name || ''} ${l.last_name || ''}` || 'N/A'}</strong></td>
                          <td>${l.company_name || 'N/A'}</td>
                          <td>${l.email || 'N/A'}</td>
                          <td>${l.phone || 'N/A'}</td>
                          <td>${l.status || 'New'}</td>
                        </tr>
                      `
                          )
                          .join('')
                  }
                </tbody>
              </table>
              <div class="footer">
                LeadSphere Multi-Tenant Enterprise SaaS • Automatic PDF Export Pipeline
              </div>
              <script>
                window.onload = function() { window.print(); };
              </script>
            </body>
          </html>
        `;
        reportWindow.document.write(html);
        reportWindow.document.close();
      }

      // Record PDF export in history
      const historyKey = 'pdf_export_jobs';
      let history: any[] = [];
      try {
        const h = localStorage.getItem(historyKey);
        if (h) history = JSON.parse(h);
      } catch (e) {}

      const jobRecord = {
        id: `pdf_exp_${Date.now()}`,
        format: 'pdf',
        total_records: leads.length,
        status: 'completed',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(historyKey, JSON.stringify([jobRecord, ...history]));

      fetchJobs();
    } catch (err) {
      console.error('PDF Export failed:', err);
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
            Execute high-performance CSV & PDF streaming imports, configure deduplication rules, and export lead datasets in CSV or PDF format.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
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
            Export CSV
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<PdfIcon />}
            onClick={handleExportPdf}
            disabled={exporting}
            sx={{ py: 1 }}
          >
            Export PDF
          </Button>

          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setIsBulkWizardOpen(true)}
            sx={{ py: 1 }}
          >
            Bulk Lead Upload Architecture
          </Button>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<PdfUploadIcon />}
            onClick={() => setIsPdfWizardOpen(true)}
            sx={{ py: 1 }}
          >
            Import PDF Leads
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
        Recent Import Pipeline History (CSV & PDF)
      </Typography>

      <Paper variant="outlined" sx={{ mb: 5, borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : importJobs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">No import jobs executed yet.</Typography>
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
                  <TableCell sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {job.filename.toLowerCase().endsWith('.pdf') ? <PdfIcon color="error" fontSize="small" /> : <UploadIcon color="primary" fontSize="small" />}
                    {job.filename}
                  </TableCell>
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
        Export Pipeline History (CSV & PDF)
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
                  <TableCell sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                    <Chip
                      label={job.format.toUpperCase()}
                      size="small"
                      color={job.format === 'pdf' ? 'error' : 'primary'}
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
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

      {/* Unified Bulk Lead Upload Architecture Wizard */}
      <BulkImportWizardDialog
        open={isBulkWizardOpen}
        onClose={() => setIsBulkWizardOpen(false)}
        onImportCompleted={fetchJobs}
      />

      {/* Multi-step CSV Import Wizard */}
      <ImportWizardDialog
        open={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onImportCompleted={fetchJobs}
      />

      {/* PDF Import Wizard */}
      <PdfImportDialog
        open={isPdfWizardOpen}
        onClose={() => setIsPdfWizardOpen(false)}
        onImportCompleted={fetchJobs}
      />
    </Box>
  );
};

