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
  CircularProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AutoAwesome as GeminiIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

interface BulkImportWizardDialogProps {
  open: boolean;
  onClose: () => void;
  onImportCompleted: () => void;
}

const STEPS = [
  'Upload File',
  'Gemini AI Column Mapping',
  'Validation & Deduplication',
  'Import Preview & Edit',
  'PostgreSQL Commit',
];

const STANDARD_SCHEMA = [
  { label: 'Full Name', value: 'full_name' },
  { label: 'First Name', value: 'first_name' },
  { label: 'Last Name', value: 'last_name' },
  { label: 'Email Address', value: 'email' },
  { label: 'Phone Number', value: 'phone' },
  { label: 'Company Name', value: 'company_name' },
  { label: 'Title / Designation', value: 'title' },
  { label: 'Location / City', value: 'location' },
  { label: 'Industry Category', value: 'industry' },
  { label: 'Status / Stage', value: 'status' },
  { label: 'Ignore Column', value: 'ignore' },
];

interface ParsedLeadRow {
  id: string;
  originalIndex: number;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  title: string;
  location: string;
  industry: string;
  status: string;
  isValid: boolean;
  isDuplicate: boolean;
  validationError?: string;
  isEditing?: boolean;
}

export const BulkImportWizardDialog: React.FC<BulkImportWizardDialogProps> = ({
  open,
  onClose,
  onImportCompleted,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [fileType, setFileType] = useState<'excel' | 'pdf'>('excel');
  const [filename, setFilename] = useState('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [deduplicationMode, setDeduplicationMode] = useState<'skip' | 'overwrite' | 'create'>('skip');
  const [parsedRows, setParsedRows] = useState<ParsedLeadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowState, setEditRowState] = useState<Partial<ParsedLeadRow>>({});
  const [commitResult, setCommitResult] = useState<any>(null);

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

  // Step 1: Handle File Upload (Excel or PDF)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    setLoading(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'pdf' || fileType === 'pdf') {
        // Handle PDF upload via backend parser
        setFileType('pdf');
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/v1/data/imports/pdf-docling', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (res.ok) {
          const resData = await res.json();
          const docData = resData.data;
          if (docData && docData.headers && docData.rows) {
            setRawHeaders(docData.headers);
            setRawRows(docData.rows);
            await runGeminiAutoMap(docData.headers);
            setActiveStep(1);
          }
        }
      } else {
        // Handle Excel / CSV upload via SheetJS
        setFileType('excel');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonRows.length > 0) {
          const headers = jsonRows[0].map((h: any) => String(h || '').trim());
          const dataRows = jsonRows.slice(1).filter((r) => r.some((cell) => cell !== null && cell !== ''));
          setRawHeaders(headers);
          setRawRows(dataRows);
          await runGeminiAutoMap(headers);
          setActiveStep(1);
        }
      }
    } catch (err) {
      console.error('Failed to parse upload file:', err);
      alert('Failed to parse uploaded file. Please check file formatting.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Gemini AI Column Recognition
  const runGeminiAutoMap = async (headers: string[]) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const res = await fetch('/api/v1/data/imports/auto-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ headers }),
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData.data) {
          setColumnMapping(resData.data);
        }
      }
    } catch (err) {
      console.error('Gemini AI column auto-map failed:', err);
    }
  };

  // Step 3: Run Data Validation & Duplicate Detection
  const handleProceedToValidation = async () => {
    setLoading(true);

    const generatedRows: ParsedLeadRow[] = rawRows.map((row, idx) => {
      let fullName = '';
      let firstName = '';
      let lastName = '';
      let email = '';
      let phone = '';
      let company = '';
      let title = '';
      let location = '';
      let industry = '';
      let status = 'New';

      rawHeaders.forEach((h, colIdx) => {
        const targetField = columnMapping[h];
        const cellValue = String(row[colIdx] || '').trim();

        if (targetField === 'full_name') fullName = cellValue;
        else if (targetField === 'first_name') firstName = cellValue;
        else if (targetField === 'last_name') lastName = cellValue;
        else if (targetField === 'email') email = cellValue;
        else if (targetField === 'phone') phone = cellValue;
        else if (targetField === 'company_name') company = cellValue;
        else if (targetField === 'title') title = cellValue;
        else if (targetField === 'location') location = cellValue;
        else if (targetField === 'industry') industry = cellValue;
        else if (targetField === 'status') status = cellValue;
      });

      if (!fullName) {
        fullName = `${firstName} ${lastName}`.trim() || `Lead #${idx + 1}`;
      }
      if (!firstName && fullName) {
        const parts = fullName.split(' ');
        firstName = parts[0] || 'Lead';
        lastName = parts.slice(1).join(' ') || '';
      }

      // Email validation
      const emailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const isValid = Boolean(fullName && emailValid);
      const validationError = !emailValid ? 'Invalid Email Format' : !fullName ? 'Missing Name' : undefined;

      return {
        id: `row_${idx}_${Date.now()}`,
        originalIndex: idx + 1,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        company_name: company,
        title,
        location,
        industry: industry || 'Technology & SaaS',
        status: status || 'New',
        isValid,
        isDuplicate: false,
        validationError,
      };
    });

    // Run backend duplicate detection
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const checkRecords = generatedRows.map((r) => ({ email: r.email, phone: r.phone }));

      const res = await fetch('/api/v1/data/imports/detect-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ records: checkRecords }),
      });

      if (res.ok) {
        const resData = await res.json();
        const dupData = resData.data;
        if (dupData) {
          const dupEmails = new Set(dupData.duplicateEmails || []);
          const dupPhones = new Set(dupData.duplicatePhones || []);

          generatedRows.forEach((r) => {
            if (
              (r.email && dupEmails.has(r.email.toLowerCase().trim())) ||
              (r.phone && dupPhones.has(r.phone.replace(/[^\d+]/g, '')))
            ) {
              r.isDuplicate = true;
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to detect duplicates:', err);
    } finally {
      setParsedRows(generatedRows);
      setLoading(false);
      setActiveStep(2);
    }
  };

  // Inline Row Edit Controls
  const handleStartEditRow = (row: ParsedLeadRow) => {
    setEditingRowId(row.id);
    setEditRowState({ ...row });
  };

  const handleSaveEditRow = (rowId: string) => {
    setParsedRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const updated = { ...r, ...editRowState };
          const emailValid = !updated.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updated.email);
          updated.isValid = Boolean(updated.full_name && emailValid);
          updated.validationError = !emailValid ? 'Invalid Email Format' : undefined;
          return updated;
        }
        return r;
      }),
    );
    setEditingRowId(null);
  };

  const handleDeleteRow = (rowId: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  // Step 5: Confirm & Commit to PostgreSQL
  const handleCommitToPostgreSQL = async () => {
    setLoading(true);
    const validToImport = parsedRows.filter((r) => r.isValid && (!r.isDuplicate || deduplicationMode !== 'skip'));

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token) {
        const res = await fetch('/api/v1/data/imports/commit-bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filename,
            leads: validToImport,
            deduplicationMode,
          }),
        });

        if (res.ok) {
          const resData = await res.json();
          setCommitResult(resData.data);
        }
      }
    } catch (err) {
      console.error('Failed to commit bulk leads to backend:', err);
    }

    // Sync to local storage cache so local state receives imports immediately
    try {
      const key = getStorageKey();
      const existing = localStorage.getItem(key);
      let localList = existing ? JSON.parse(existing) : [];

      const newRecords = validToImport.map((r) => ({
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        full_name: r.full_name,
        first_name: r.first_name,
        last_name: r.last_name,
        company_name: r.company_name,
        title: r.title,
        designation: r.title,
        email: r.email,
        phone: r.phone,
        location: r.location,
        status: r.status || 'New',
        lead_score: 50,
      }));

      localList = [...newRecords, ...localList];
      localStorage.setItem(key, JSON.stringify(localList));
    } catch (e) {
      console.error('Failed to update local storage:', e);
    }

    setLoading(false);
    setActiveStep(4);
    onImportCompleted();
  };

  const handleReset = () => {
    setActiveStep(0);
    setFilename('');
    setRawHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setParsedRows([]);
    setCommitResult(null);
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <Dialog open={open} onClose={handleReset} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justify: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <GeminiIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Bulk Lead Upload Architecture
          </Typography>
        </Box>
        <Chip label="PostgreSQL Pipeline" color="primary" size="small" variant="outlined" />
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* STEP 0: FILE UPLOAD */}
        {activeStep === 0 && (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Tabs
              value={fileType}
              onChange={(_, v) => setFileType(v)}
              centered
              sx={{ mb: 3 }}
            >
              <Tab icon={<ExcelIcon />} label="Excel / CSV (.xlsx, .csv)" value="excel" />
              <Tab icon={<PdfIcon />} label="PDF Document (.pdf)" value="pdf" />
            </Tabs>

            <Paper
              variant="outlined"
              sx={{
                p: 5,
                border: '2px dashed',
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
                borderRadius: 3,
                cursor: 'pointer',
              }}
              component="label"
            >
              <input
                type="file"
                hidden
                accept={fileType === 'pdf' ? '.pdf' : '.xlsx,.xls,.csv'}
                onChange={handleFileUpload}
              />
              <UploadIcon sx={{ fontSize: 54, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Click or Drag & Drop {fileType === 'pdf' ? 'PDF Lead Document' : 'Excel/CSV Spreadsheet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {fileType === 'pdf'
                  ? 'Parses tables, cards, and text using IBM Docling OCR & Gemini PDF parser'
                  : 'Parses .xlsx, .xls, and .csv files via SheetJS'}
              </Typography>
            </Paper>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
                <CircularProgress size={24} />
                <Typography variant="body2">Extracting headers and data structure...</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* STEP 1: GEMINI AI COLUMN MAPPING */}
        {activeStep === 1 && (
          <Box>
            <Alert icon={<GeminiIcon fontSize="inherit" />} severity="info" sx={{ mb: 3 }}>
              <strong>Gemini AI Column Recognition:</strong> Raw columns have been automatically recognized and mapped to the <strong>Standard Lead Schema</strong>. Review or customize mappings below.
            </Alert>

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Uploaded File Column</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Gemini AI Recognized Lead Field</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rawHeaders.map((header) => (
                    <TableRow key={header}>
                      <TableCell sx={{ fontWeight: 600 }}>{header}</TableCell>
                      <TableCell>
                        <Select
                          size="small"
                          fullWidth
                          value={columnMapping[header] || 'ignore'}
                          onChange={(e) =>
                            setColumnMapping({ ...columnMapping, [header]: e.target.value })
                          }
                        >
                          {STANDARD_SCHEMA.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}

        {/* STEP 2: DEDUPLICATION SETTINGS */}
        {activeStep === 2 && (
          <Box sx={{ py: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Deduplication & Matching Rules
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select how LeadSphere should handle records that match existing PostgreSQL leads by Email or Phone number.
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <RadioGroup
                value={deduplicationMode}
                onChange={(e) => setDeduplicationMode(e.target.value as any)}
              >
                <FormControlLabel
                  value="skip"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Skip Duplicate Leads (Recommended)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ignore duplicate leads and import only new unique records.
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  value="overwrite"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Overwrite / Update Existing Leads
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Update existing PostgreSQL lead fields with new imported values.
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  value="create"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Import All (Allow Duplicates)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Create new lead records for all rows regardless of existing matches.
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </Paper>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip label={`Total Parsed: ${parsedRows.length}`} color="default" sx={{ fontWeight: 700 }} />
              <Chip label={`Valid: ${validCount}`} color="success" sx={{ fontWeight: 700 }} />
              <Chip label={`Duplicates Detected: ${duplicateCount}`} color="warning" sx={{ fontWeight: 700 }} />
              {invalidCount > 0 && <Chip label={`Invalid Email/Format: ${invalidCount}`} color="error" sx={{ fontWeight: 700 }} />}
            </Box>
          </Box>
        )}

        {/* STEP 3: INTERACTIVE IMPORT PREVIEW (EDIT & REJECT) */}
        {activeStep === 3 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Import Preview ({parsedRows.length} Records)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Edit cells directly or click 🗑️ to reject individual rows before confirming import.
              </Typography>
            </Box>

            <Paper variant="outlined" sx={{ maxHeight: 420, overflowY: 'auto', borderRadius: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 60 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 110 }}>Validation</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Full Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 90 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedRows.map((row) => {
                    const isEdit = editingRowId === row.id;

                    return (
                      <TableRow key={row.id} hover sx={{ bgcolor: !row.isValid ? 'action.hover' : undefined }}>
                        <TableCell sx={{ color: 'text.secondary' }}>{row.originalIndex}</TableCell>
                        <TableCell>
                          {row.isDuplicate ? (
                            <Chip label="Duplicate" color="warning" size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                          ) : row.isValid ? (
                            <Chip label="Valid" color="success" size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                          ) : (
                            <Chip label="Invalid" color="error" size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                          )}
                        </TableCell>
                        <TableCell>
                          {isEdit ? (
                            <TextField
                              size="small"
                              value={editRowState.full_name || ''}
                              onChange={(e) => setEditRowState({ ...editRowState, full_name: e.target.value })}
                            />
                          ) : (
                            row.full_name
                          )}
                        </TableCell>
                        <TableCell>
                          {isEdit ? (
                            <TextField
                              size="small"
                              value={editRowState.email || ''}
                              onChange={(e) => setEditRowState({ ...editRowState, email: e.target.value })}
                            />
                          ) : (
                            row.email || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {isEdit ? (
                            <TextField
                              size="small"
                              value={editRowState.phone || ''}
                              onChange={(e) => setEditRowState({ ...editRowState, phone: e.target.value })}
                            />
                          ) : (
                            row.phone || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {isEdit ? (
                            <TextField
                              size="small"
                              value={editRowState.company_name || ''}
                              onChange={(e) => setEditRowState({ ...editRowState, company_name: e.target.value })}
                            />
                          ) : (
                            row.company_name || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {isEdit ? (
                            <TextField
                              size="small"
                              value={editRowState.location || ''}
                              onChange={(e) => setEditRowState({ ...editRowState, location: e.target.value })}
                            />
                          ) : (
                            row.location || '-'
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {isEdit ? (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton size="small" color="primary" onClick={() => handleSaveEditRow(row.id)}>
                                <SaveIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => setEditingRowId(null)}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton size="small" onClick={() => handleStartEditRow(row)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => handleDeleteRow(row.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}

        {/* STEP 4: SUMMARY & COMMIT RESULTS */}
        {activeStep === 4 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <SuccessIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Bulk Lead Upload Completed Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your leads have been parsed, validated, and committed to PostgreSQL database.
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, maxWidth: 460, mx: 'auto', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Total Rows Processed:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{parsedRows.length}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Successfully Committed to DB:</Typography>
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                  {commitResult?.successful_rows ?? validCount}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Duplicates Handled:</Typography>
                <Typography variant="body2" color="warning.main" sx={{ fontWeight: 700 }}>
                  {commitResult?.duplicate_rows ?? duplicateCount}
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {activeStep === 0 && (
          <Button onClick={handleReset} variant="outlined">
            Cancel
          </Button>
        )}

        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)}>Back</Button>
            <Button variant="contained" onClick={handleProceedToValidation} disabled={loading}>
              Next: Run Validation & Deduplication
            </Button>
          </>
        )}

        {activeStep === 2 && (
          <>
            <Button onClick={() => setActiveStep(1)}>Back</Button>
            <Button variant="contained" onClick={() => setActiveStep(3)}>
              Next: Review & Edit Preview
            </Button>
          </>
        )}

        {activeStep === 3 && (
          <>
            <Button onClick={() => setActiveStep(2)}>Back</Button>
            <Button variant="contained" color="success" onClick={handleCommitToPostgreSQL} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Confirm & Commit to PostgreSQL'}
            </Button>
          </>
        )}

        {activeStep === 4 && (
          <Button variant="contained" onClick={handleReset}>
            Done & View Leads
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
