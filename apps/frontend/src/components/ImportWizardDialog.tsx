import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Select,
  MenuItem,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

interface ImportWizardDialogProps {
  open: boolean;
  onClose: () => void;
  onImportCompleted: () => void;
}

const STEPS = ['Upload CSV Data', 'Map CSV Columns', 'Deduplication Settings', 'Import Summary'];

const TARGET_FIELDS = [
  { label: 'First Name', value: 'first_name' },
  { label: 'Last Name', value: 'last_name' },
  { label: 'Email Address', value: 'email' },
  { label: 'Phone Number', value: 'phone' },
  { label: 'Company Name', value: 'company_name' },
  { label: 'Title / Designation', value: 'title' },
  { label: 'Estimated Deal Value ($)', value: 'estimated_value' },
  { label: 'Status / Stage', value: 'status' },
  { label: 'Ignore Column', value: 'ignore' },
];

const SAMPLE_CSV_DEFAULT = `First Name,Last Name,Company,Title,Email,Phone,Estimated Value
Sarah,Jenkins,Acme Tech,VP of Sales,sarah@acmetech.test,+1 555 019 2831,45000
Michael,Chen,Quantum Systems,CTO,michael@quantumsys.test,+1 555 042 9988,85000
David,Miller,Vanguard Retail,Director of Procurement,david@vanguard.test,+1 555 077 1234,30000`;

export const ImportWizardDialog: React.FC<ImportWizardDialogProps> = ({
  open,
  onClose,
  onImportCompleted,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [filename, setFilename] = useState('leads_import.csv');
  const [csvContent, setCsvContent] = useState(SAMPLE_CSV_DEFAULT);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [deduplicationMode, setDeduplicationMode] = useState<'skip' | 'overwrite' | 'create'>('skip');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleNextStep1 = async () => {
    if (!csvContent.trim()) return;

    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      alert('CSV must contain at least a header row and one data row.');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    setCsvHeaders(headers);

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/data/imports/auto-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ headers }),
      });
      const data = await res.json();
      setColumnMapping(data.data || {});
      setActiveStep(1);
    } catch (err) {
      console.error('Failed to auto-map columns:', err);
      // Fallback
      const map: Record<string, string> = {};
      headers.forEach((h) => (map[h] = 'ignore'));
      setColumnMapping(map);
      setActiveStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleRunImport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/data/imports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename,
          csvContent,
          columnMapping,
          deduplicationMode,
        }),
      });
      const data = await res.json();
      setImportResult(data.data || null);
      setActiveStep(3);
      onImportCompleted();
    } catch (err) {
      console.error('Import processing failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadErrorLog = async () => {
    if (!importResult?.id) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/data/imports/${importResult.id}/error-report`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_error_log_${importResult.id}.csv`;
    a.click();
  };

  const handleReset = () => {
    setActiveStep(0);
    setImportResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleReset} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Multi-Tenant Lead Data Import Wizard
      </DialogTitle>

      <Box sx={{ px: 3, pt: 1, pb: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Divider />

      <DialogContent sx={{ minHeight: 340, py: 3 }}>
        {/* Step 0: Upload / Paste CSV */}
        {activeStep === 0 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Paste your raw CSV text below or upload a file. The first line must contain column names.
            </Alert>
            <TextField
              fullWidth
              label="CSV File Name"
              size="small"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={8}
              label="CSV Data Content"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Header1,Header2..."
              variant="outlined"
            />
          </Box>
        )}

        {/* Step 1: Map Columns */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Map your CSV columns to LeadSphere schema fields. Unmapped columns will be ignored.
            </Typography>

            <Paper variant="outlined" sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>CSV Header Column</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Lead Property Target</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {csvHeaders.map((header) => (
                    <TableRow key={header}>
                      <TableCell sx={{ fontWeight: 600 }}>{header}</TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={columnMapping[header] || 'ignore'}
                            onChange={(e) =>
                              setColumnMapping({
                                ...columnMapping,
                                [header]: e.target.value,
                              })
                            }
                          >
                            {TARGET_FIELDS.map((field) => (
                              <MenuItem key={field.value} value={field.value}>
                                {field.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}

        {/* Step 2: Deduplication Settings */}
        {activeStep === 2 && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Duplicate Detection & Resolution Strategy
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select how LeadSphere should handle leads with matching Email Addresses or Phone Numbers.
            </Typography>

            <FormControl component="fieldset">
              <RadioGroup
                value={deduplicationMode}
                onChange={(e) => setDeduplicationMode(e.target.value as any)}
              >
                <Paper variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
                  <FormControlLabel
                    value="skip"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Skip Duplicate Leads (Recommended)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          If an existing lead matches by email or phone, skip importing that row and log it in the error report.
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
                  <FormControlLabel
                    value="overwrite"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Overwrite Existing Leads
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Update existing lead fields with newly imported CSV values.
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <FormControlLabel
                    value="create"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Import All as New Leads
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Bypass deduplication and create new lead records for every CSV row.
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </RadioGroup>
            </FormControl>
          </Box>
        )}

        {/* Step 3: Import Results */}
        {activeStep === 3 && importResult && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <SuccessIcon color="success" sx={{ fontSize: 60, mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Import Pipeline Execution Complete
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Processed file: <strong>{importResult.filename}</strong>
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 4 }}>
              <Paper variant="outlined" sx={{ p: 2, minWidth: 140, borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  TOTAL ROWS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {importResult.total_rows}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, minWidth: 140, borderRadius: 2, borderColor: 'success.main' }}>
                <Typography variant="caption" color="success.main" display="block">
                  SUCCESSFUL
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {importResult.successful_rows}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, minWidth: 140, borderRadius: 2, borderColor: 'warning.main' }}>
                <Typography variant="caption" color="warning.main" display="block">
                  SKIPPED DUPES
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {importResult.duplicate_rows}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, minWidth: 140, borderRadius: 2, borderColor: 'error.main' }}>
                <Typography variant="caption" color="error.main" display="block">
                  FAILED ROWS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {importResult.failed_rows}
                </Typography>
              </Paper>
            </Box>

            {importResult.failed_rows > 0 || importResult.duplicate_rows > 0 ? (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadErrorLog}
              >
                Download Error Log (CSV)
              </Button>
            ) : (
              <Chip label="All rows processed cleanly with zero errors" color="success" />
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {activeStep < 3 && (
          <Button onClick={handleReset} variant="outlined">
            Cancel
          </Button>
        )}

        {activeStep === 0 && (
          <Button variant="contained" onClick={handleNextStep1} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Continue to Mapping'}
          </Button>
        )}

        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)}>Back</Button>
            <Button variant="contained" onClick={() => setActiveStep(2)}>
              Configure Deduplication
            </Button>
          </>
        )}

        {activeStep === 2 && (
          <>
            <Button onClick={() => setActiveStep(1)}>Back</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRunImport}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              Start Async Import
            </Button>
          </>
        )}

        {activeStep === 3 && (
          <Button variant="contained" onClick={handleReset}>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
