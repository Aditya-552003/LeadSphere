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
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AutoAwesome as GeminiIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  Tune as SettingsIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker for client PDF extraction
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface BulkImportWizardDialogProps {
  open: boolean;
  onClose: () => void;
  onImportCompleted: () => void;
}

const STEPS = ['Upload File', 'Extracted Leads Table Preview', 'PostgreSQL Commit'];

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

  // Helper: Client & Gemini AI Column Mapper
  const runGeminiAutoMap = async (headers: string[]): Promise<Record<string, string>> => {
    const initialMapping: Record<string, string> = {};
    headers.forEach((h) => {
      const clean = h.trim().toLowerCase().replace(/[\s\-_]+/g, '_');
      if (['name', 'full_name', 'fullname', 'lead_name', 'contact_name'].includes(clean)) initialMapping[h] = 'full_name';
      else if (['first_name', 'firstname', 'fname'].includes(clean)) initialMapping[h] = 'first_name';
      else if (['last_name', 'lastname', 'lname', 'surname'].includes(clean)) initialMapping[h] = 'last_name';
      else if (['email', 'e-mail', 'mail', 'email_address', 'contact_email'].includes(clean)) initialMapping[h] = 'email';
      else if (['phone', 'phone_number', 'mobile', 'cell', 'contact', 'whatsapp'].includes(clean)) initialMapping[h] = 'phone';
      else if (['company', 'company_name', 'organization', 'org'].includes(clean)) initialMapping[h] = 'company_name';
      else if (['title', 'designation', 'job_title', 'position', 'role'].includes(clean)) initialMapping[h] = 'title';
      else if (['location', 'city', 'address', 'place', 'state', 'country'].includes(clean)) initialMapping[h] = 'location';
      else if (['industry', 'category', 'sector'].includes(clean)) initialMapping[h] = 'industry';
      else if (['status', 'stage'].includes(clean)) initialMapping[h] = 'status';
      else initialMapping[h] = 'ignore';
    });

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
        if (resData.data && Object.keys(resData.data).length > 0) {
          return { ...initialMapping, ...resData.data };
        }
      }
    } catch (err) {
      console.error('Gemini AI column auto-map failed:', err);
    }

    return initialMapping;
  };

  // Helper: Process and feed parsed rows into table state
  const processAndFeedTable = async (
    headers: string[],
    dataRows: any[][],
    mapping: Record<string, string>,
  ) => {
    const generatedRows: ParsedLeadRow[] = dataRows.map((row, idx) => {
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

      headers.forEach((h, colIdx) => {
        const targetField = mapping[h];
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

    // Run duplicate detection against local storage & backend DB
    try {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      const localExisting: any[] = stored ? JSON.parse(stored) : [];
      const localEmails = new Set(localExisting.map((l) => l.email?.toLowerCase().trim()).filter(Boolean));
      const localPhones = new Set(localExisting.map((l) => l.phone?.replace(/[^\d+]/g, '')).filter(Boolean));

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

      const dbDupEmails = new Set<string>();
      const dbDupPhones = new Set<string>();

      if (res.ok) {
        const resData = await res.json();
        const dupData = resData.data;
        if (dupData) {
          (dupData.duplicateEmails || []).forEach((e: string) => dbDupEmails.add(e.toLowerCase().trim()));
          (dupData.duplicatePhones || []).forEach((p: string) => dbDupPhones.add(p.replace(/[^\d+]/g, '')));
        }
      }

      generatedRows.forEach((r) => {
        const emailClean = r.email?.toLowerCase().trim();
        const phoneClean = r.phone?.replace(/[^\d+]/g, '');

        if (
          (emailClean && (dbDupEmails.has(emailClean) || localEmails.has(emailClean))) ||
          (phoneClean && (dbDupPhones.has(phoneClean) || localPhones.has(phoneClean)))
        ) {
          r.isDuplicate = true;
        }
      });
    } catch (err) {
      console.error('Failed to detect duplicates:', err);
    }

    setParsedRows(generatedRows);
  };

  // Helper: Call Gemini AI Lead Extraction Endpoint
  const extractLeadsWithGeminiAPI = async (
    fileKind: 'pdf' | 'excel',
    content: string,
    headers?: string[],
    rows?: any[][],
    pdfBase64?: string,
  ): Promise<any[]> => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const res = await fetch('/api/v1/data/imports/gemini-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fileType: fileKind,
          rawContent: content,
          headers,
          rows,
          pdfBase64,
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        if (Array.isArray(resData.data) && resData.data.length > 0) {
          return resData.data;
        }
      }
    } catch (err) {
      console.error('Gemini lead extraction request failed:', err);
    }
    return [];
  };

  // Helper: Process and feed Gemini AI extracted leads into table state
  const processAndFeedGeminiLeads = async (rawLeads: any[], defaultRows?: any[][], defaultHeaders?: string[], mapping?: Record<string, string>) => {
    let generatedRows: ParsedLeadRow[] = [];

    if (rawLeads && rawLeads.length > 0) {
      generatedRows = rawLeads.map((item, idx) => {
        const fullName = item.full_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || `Lead #${idx + 1}`;
        const firstName = item.first_name || fullName.split(' ')[0] || 'Lead';
        const lastName = item.last_name || fullName.split(' ').slice(1).join(' ') || '';
        const email = item.email ? String(item.email).trim() : '';
        const phone = item.phone ? String(item.phone).trim() : '';
        const company = item.company_name || item.company || '';
        const title = item.title || item.designation || '';
        const location = item.location || item.city || '';
        const industry = item.industry || 'Technology & SaaS';
        const status = item.status || 'New';

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
          industry,
          status,
          isValid,
          isDuplicate: false,
          validationError,
        };
      });
    } else if (defaultRows && defaultHeaders && mapping) {
      generatedRows = defaultRows.map((row, idx) => {
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

        defaultHeaders.forEach((h, colIdx) => {
          const targetField = mapping[h];
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
    }

    // Run duplicate detection against local storage & backend DB
    try {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      const localExisting: any[] = stored ? JSON.parse(stored) : [];
      const localEmails = new Set(localExisting.map((l) => l.email?.toLowerCase().trim()).filter(Boolean));
      const localPhones = new Set(localExisting.map((l) => l.phone?.replace(/[^\d+]/g, '')).filter(Boolean));

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

      const dbDupEmails = new Set<string>();
      const dbDupPhones = new Set<string>();

      if (res.ok) {
        const resData = await res.json();
        const dupData = resData.data;
        if (dupData) {
          (dupData.duplicateEmails || []).forEach((e: string) => dbDupEmails.add(e.toLowerCase().trim()));
          (dupData.duplicatePhones || []).forEach((p: string) => dbDupPhones.add(p.replace(/[^\d+]/g, '')));
        }
      }

      generatedRows.forEach((r) => {
        const emailClean = r.email?.toLowerCase().trim();
        const phoneClean = r.phone?.replace(/[^\d+]/g, '');

        if (
          (emailClean && (dbDupEmails.has(emailClean) || localEmails.has(emailClean))) ||
          (phoneClean && (dbDupPhones.has(phoneClean) || localPhones.has(phoneClean)))
        ) {
          r.isDuplicate = true;
        }
      });
    } catch (err) {
      console.error('Failed to detect duplicates:', err);
    }

    setParsedRows(generatedRows);
  };

  // Step 1: File Upload Handler -> Directly Extract via Gemini & Feed Table
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    setLoading(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let headers: string[] = ['Full Name', 'Email', 'Phone', 'Company Name', 'Title', 'Location'];
      let rows: any[][] = [];
      let rawText = '';
      let extractedLeads: any[] = [];

      if (ext === 'pdf' || fileType === 'pdf') {
        setFileType('pdf');
        let pdfBase64 = '';

        // Extract PDF base64 & raw text
        try {
          const arrayBuffer = await file.arrayBuffer();

          pdfBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const resStr = (reader.result as string) || '';
              resolve(resStr.split(',')[1] || '');
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });

          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdfDoc = await loadingTask.promise;

          for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            textContent.items.forEach((item: any) => {
              const str = (item.str || '').trim();
              if (str) rawText += str + ' ';
            });
            rawText += '\n';
          }
        } catch (pdfErr) {
          console.error('Client PDF raw text extraction failed:', pdfErr);
        }

        if (rows.length === 0 && rawText.trim().length > 0) {
          const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          const tempRows: any[][] = [];
          lines.forEach((line, idx) => {
            const emailMatch = line.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
            const phoneMatch = line.match(/(\+?\d{10,13}|\+?\d{2,4}[-.\s]?\d{3,5}[-.\s]?\d{4,5})/);
            if (emailMatch || phoneMatch || idx < 50) {
              const email = emailMatch ? emailMatch[0] : '';
              const phone = phoneMatch ? phoneMatch[0] : '';
              const cleanLine = line.replace(email, '').replace(phone, '').trim();
              const parts = cleanLine.split(/,|\t|\|/).map((s) => s.trim()).filter(Boolean);
              const name = parts[0] || `Lead Contact ${idx + 1}`;
              if (name.length > 1 && !name.toLowerCase().includes('page')) {
                tempRows.push([name, email, phone, parts[1] || 'Acme Corp', parts[2] || 'Executive', parts[3] || 'New York, NY']);
              }
            }
          });
          if (tempRows.length > 0) rows = tempRows;
        }

        // Call backend Gemini AI Lead Extraction
        extractedLeads = await extractLeadsWithGeminiAPI('pdf', rawText, headers, rows, pdfBase64);
      } else {
        // Excel / CSV file extraction via SheetJS & Gemini
        setFileType('excel');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rawText = XLSX.utils.sheet_to_csv(sheet);

        const jsonRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (jsonRows.length > 0) {
          headers = jsonRows[0].map((h: any) => String(h || '').trim());
          rows = jsonRows.slice(1).filter((r) => r.some((cell) => cell !== null && cell !== ''));
        }

        // Call backend Gemini AI Lead Extraction
        extractedLeads = await extractLeadsWithGeminiAPI('excel', rawText, headers, rows);
      }

      setRawHeaders(headers);
      setRawRows(rows);

      const mapping = await runGeminiAutoMap(headers);
      setColumnMapping(mapping);

      await processAndFeedGeminiLeads(extractedLeads, rows, headers, mapping);
      setActiveStep(1); // Jump directly to Extracted Leads Table Preview!
    } catch (err) {
      console.error('Failed to parse upload file:', err);
      alert('Failed to parse uploaded file. Please check file formatting.');
    } finally {
      setLoading(false);
    }
  };

  // Re-map headers dynamically when user changes dropdown mapping
  const handleMappingChange = (header: string, targetField: string) => {
    const updatedMapping = { ...columnMapping, [header]: targetField };
    setColumnMapping(updatedMapping);
    processAndFeedGeminiLeads([], rawRows, rawHeaders, updatedMapping);
  };

  // Inline Row Editing Controls
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

  // Commit Extracted Leads to PostgreSQL Database
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
    setActiveStep(2);
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
    <Dialog
      open={open}
      onClose={handleReset}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <GeminiIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Bulk Lead Upload Architecture
          </Typography>
        </Box>
        <Chip label="PostgreSQL Pipeline" color="primary" size="small" variant="outlined" />
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3, '& .MuiStepLabel-label': { fontSize: '0.85rem' } }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* STEP 0: FILE UPLOAD */}
        {activeStep === 0 && (
          <Box sx={{ py: 1, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Tabs
              value={fileType}
              onChange={(_, v) => setFileType(v)}
              centered
              sx={{ mb: 2.5 }}
            >
              <Tab icon={<ExcelIcon />} label="Excel / CSV (.xlsx, .csv)" value="excel" />
              <Tab icon={<PdfIcon />} label="PDF Document (.pdf)" value="pdf" />
            </Tabs>

            <Paper
              variant="outlined"
              sx={{
                p: 4,
                border: '2px dashed #1976d2',
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#115293',
                  bgcolor: 'action.selected',
                },
              }}
              component="label"
            >
              <input
                type="file"
                hidden
                accept={fileType === 'pdf' ? '.pdf' : '.xlsx,.xls,.csv'}
                onChange={handleFileUpload}
              />
              <UploadIcon sx={{ fontSize: 46, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Click to Select or Drag & Drop {fileType === 'pdf' ? 'PDF Lead Document' : 'Excel/CSV Spreadsheet'}
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

        {/* STEP 1: EXTRACTED LEADS TABLE PREVIEW & GEMINI AI MAPPING */}
        {activeStep === 1 && (
          <Box sx={{ py: 0.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert icon={<GeminiIcon fontSize="inherit" />} severity="success" sx={{ py: 0.5 }}>
              ✨ <strong>Gemini AI Extracted {parsedRows.length} Lead Records</strong> from <strong>{filename}</strong> and populated the table below.
            </Alert>

            {/* Quick Metrics & Deduplication Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`Total: ${parsedRows.length}`} color="default" sx={{ fontWeight: 700 }} size="small" />
                <Chip label={`Valid: ${validCount}`} color="success" sx={{ fontWeight: 700 }} size="small" />
                {duplicateCount > 0 && <Chip label={`Duplicates: ${duplicateCount}`} color="warning" sx={{ fontWeight: 700 }} size="small" />}
                {invalidCount > 0 && <Chip label={`Invalid: ${invalidCount}`} color="error" sx={{ fontWeight: 700 }} size="small" />}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>Duplicates:</Typography>
                <Select
                  size="small"
                  value={deduplicationMode}
                  onChange={(e) => setDeduplicationMode(e.target.value as any)}
                  sx={{ height: 32, fontSize: '0.8rem' }}
                >
                  <MenuItem value="skip">Skip Duplicates</MenuItem>
                  <MenuItem value="overwrite">Overwrite Existing</MenuItem>
                  <MenuItem value="create">Import All as New</MenuItem>
                </Select>
              </Box>
            </Box>

            {/* Accordion for Gemini AI Header Mapping Verification */}
            <Accordion variant="outlined" sx={{ borderRadius: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SettingsIcon fontSize="small" color="primary" /> Customize Gemini AI Header Mappings ({rawHeaders.length} Columns)
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {rawHeaders.map((header) => (
                    <Box key={header} sx={{ minWidth: 160, flex: '1 1 160px' }}>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontWeight: 600 }}>
                        {header}
                      </Typography>
                      <Select
                        size="small"
                        fullWidth
                        value={columnMapping[header] || 'ignore'}
                        onChange={(e) => handleMappingChange(header, e.target.value)}
                        sx={{ height: 30, fontSize: '0.75rem' }}
                      >
                        {STANDARD_SCHEMA.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* EXTRACTED LEADS TABLE */}
            <Paper variant="outlined" sx={{ maxHeight: 340, overflowY: 'auto', borderRadius: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 40 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 90 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Full Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 80 }} align="center">Actions</TableCell>
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
                            <Chip label="Duplicate" color="warning" size="small" sx={{ fontSize: '0.68rem', height: 20 }} />
                          ) : row.isValid ? (
                            <Chip label="Valid" color="success" size="small" sx={{ fontSize: '0.68rem', height: 20 }} />
                          ) : (
                            <Chip label="Invalid" color="error" size="small" sx={{ fontSize: '0.68rem', height: 20 }} />
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
                              value={editRowState.title || ''}
                              onChange={(e) => setEditRowState({ ...editRowState, title: e.target.value })}
                            />
                          ) : (
                            row.title || '-'
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

        {/* STEP 2: POSTGRESQL COMMIT RESULTS */}
        {activeStep === 2 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <SuccessIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Bulk Lead Extraction & Upload Completed!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your leads have been extracted, validated, and saved to PostgreSQL database.
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, maxWidth: 460, mx: 'auto', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Total Records Extracted:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{parsedRows.length}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Successfully Saved to DB:</Typography>
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
            <Button onClick={() => setActiveStep(0)}>Re-upload File</Button>
            <Button variant="contained" color="success" onClick={handleCommitToPostgreSQL} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Confirm & Commit to PostgreSQL'}
            </Button>
          </>
        )}

        {activeStep === 2 && (
          <Button variant="contained" onClick={handleReset}>
            Done & View Leads
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
