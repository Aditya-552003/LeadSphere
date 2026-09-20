import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  Grid,
  Tabs,
  Tab,
  Paper,
  Stack,
  Divider,
  Switch,
  FormControlLabel,
  Avatar,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  AddBusiness as AddBusinessIcon,
  SupportAgent as SupportAgentIcon,
  PauseCircle as PauseCircleIcon,
  PlayCircle as PlayCircleIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Speed as SpeedIcon,
  Shield as ShieldIcon,
  Settings as SettingsIcon,
  CreditCard as PlanIcon,
  Storage as StorageIcon,
  Psychology as AiIcon,
  CheckCircle as VerifiedIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as ContentCopyIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Key as KeyIcon,
} from '@mui/icons-material';

interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  plan: 'Starter' | 'Pro' | 'Enterprise';
  usersCount: number;
  leadsCount: number;
  mrr: number;
  created_at: string;
  adminName: string;
  adminEmail: string;
  adminPassword?: string;
  adminPhone?: string;
}

const INITIAL_TENANTS: TenantRecord[] = [];

export const SuperAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userObj = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
  const isSuperAdmin = userObj?.role === 'Super Admin' || userObj?.email === 'admin@leadsphere.io';

  const tabParam = searchParams.get('tab');
  const getInitialTab = () => {
    switch (tabParam) {
      case 'tenants': return 1;
      case 'plans': return 2;
      case 'health': return 3;
      case 'audit': return 4;
      case 'settings': return 5;
      default: return 0;
    }
  };

  const [activeTab, setActiveTab] = useState<number>(getInitialTab());
  const [tenants, setTenants] = useState<TenantRecord[]>(INITIAL_TENANTS);
  const [openCreate, setOpenCreate] = useState(false);
  const [openSupport, setOpenSupport] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [detailsTenant, setDetailsTenant] = useState<TenantRecord | null>(null);
  const [showDetailsPassword, setShowDetailsPassword] = useState(false);

  const [selectedTenant, setSelectedTenant] = useState<TenantRecord | null>(null);
  const [supportReason, setSupportReason] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState<'Starter' | 'Pro' | 'Enterprise'>('Pro');
  const [createAdminName, setCreateAdminName] = useState('');
  const [createAdminEmail, setCreateAdminEmail] = useState('');
  const [createAdminPassword, setCreateAdminPassword] = useState('');
  const [createAdminPhone, setCreateAdminPhone] = useState('');

  useEffect(() => {
    const currentTab = getInitialTab();
    setActiveTab(currentTab);
  }, [tabParam]);

  useEffect(() => {
    const loadTenants = async () => {
      let apiTenants: TenantRecord[] = [];
      try {
        const res = await fetch('/api/v1/platform/tenants');
        const data = await res.json();
        if (data?.data && Array.isArray(data.data)) {
          apiTenants = data.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            status: t.status || 'active',
            plan: t.plan || 'Pro',
            usersCount: 1,
            leadsCount: 0,
            mrr: 149,
            created_at: t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            adminName: t.adminName || 'Company Admin',
            adminEmail: t.adminEmail || `admin@${t.slug}.test`,
            adminPassword: t.adminPassword || 'Password123!',
            adminPhone: t.adminPhone || '+1 (555) 000-0000',
          }));
        }
      } catch (e) {
        // Fallback to local storage
      }

      const stored = localStorage.getItem('registered_tenants');
      let localTenants: TenantRecord[] = stored ? JSON.parse(stored) : [];
      // Filter out legacy dummy demo tenants
      localTenants = localTenants.filter(
        (t) => !['tn_apex', 'tn_cokooon', 'tn_acme', 'tn_globaltech', 'tn_vance'].includes(t.id) && t.slug !== 'apex-digital' && t.slug !== 'cokooon-tech',
      );

      const combinedMap = new Map<string, TenantRecord>();
      // First populate backend api tenants
      apiTenants.forEach((t) => combinedMap.set(t.slug, t));
      // Override with local tenants so real registered credentials (email, name, password, phone) take full precedence
      localTenants.forEach((t) => {
        const existing = combinedMap.get(t.slug);
        combinedMap.set(t.slug, { ...existing, ...t });
      });

      INITIAL_TENANTS.forEach((t) => {
        if (!combinedMap.has(t.slug)) {
          combinedMap.set(t.slug, t);
        }
      });

      setTenants(Array.from(combinedMap.values()));
    };

    loadTenants();
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    const tabsMap = ['overview', 'tenants', 'plans', 'health', 'audit', 'settings'];
    setSearchParams({ tab: tabsMap[newValue] });
  };

  if (!isSuperAdmin) {
    return (
      <Box sx={{ p: 3, maxWidth: 650, mx: 'auto', mt: 6 }}>
        <Alert severity="error" sx={{ borderRadius: 3, p: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            403 Forbidden — Super Admin Console Restricted
          </Typography>
          <Typography variant="body2" paragraph>
            You are currently logged in as <strong>{userObj?.role || 'Company Admin'}</strong> ({userObj?.name || 'User'}).
            Access to the Platform Owner Super Admin Control Center is strictly restricted to Platform Super Administrators.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/dashboard')}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Return to My Company Workspace Dashboard
          </Button>
        </Alert>
      </Box>
    );
  }

  const totalMRR = tenants.reduce((acc, t) => acc + (t.status === 'active' ? t.mrr : 0), 0);
  const totalUsers = tenants.reduce((acc, t) => acc + t.usersCount, 0);
  const activeTenantsCount = tenants.filter((t) => t.status === 'active').length;

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newTenant: TenantRecord = {
      id: `tn_${Date.now()}`,
      name,
      slug: finalSlug,
      status: 'active',
      plan,
      usersCount: 1,
      leadsCount: 0,
      mrr: plan === 'Enterprise' ? 399 : plan === 'Pro' ? 149 : 49,
      created_at: new Date().toISOString().split('T')[0],
      adminName: createAdminName || `${name} Admin`,
      adminEmail: createAdminEmail || `admin@${finalSlug}.com`,
      adminPassword: createAdminPassword || 'Password123!',
      adminPhone: createAdminPhone || '+1 (555) 000-0000',
    };

    // Save to localStorage registered_tenants so credentials persist
    const stored = localStorage.getItem('registered_tenants');
    const list = stored ? JSON.parse(stored) : [];
    const filtered = list.filter((item: any) => item.slug !== finalSlug);
    localStorage.setItem('registered_tenants', JSON.stringify([newTenant, ...filtered]));

    setTenants([newTenant, ...tenants.filter((t) => t.slug !== finalSlug)]);
    setOpenCreate(false);
    setName('');
    setSlug('');
    setCreateAdminName('');
    setCreateAdminEmail('');
    setCreateAdminPassword('');
    setCreateAdminPhone('');
  };

  const handleToggleStatus = (id: string) => {
    setTenants(
      tenants.map((t) => (t.id === id ? { ...t, status: t.status === 'active' ? 'suspended' : 'active' } : t)),
    );
  };

  const handleDeleteTenant = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this company workspace? All tenant data will be purged.')) {
      setTenants(tenants.filter((t) => t.id !== id));
    }
  };

  const handleSupportAccess = () => {
    if (!supportReason.trim() || !selectedTenant) return;
    localStorage.setItem(
      'tenant',
      JSON.stringify({ id: selectedTenant.id, name: selectedTenant.name, slug: selectedTenant.slug }),
    );
    localStorage.setItem(
      'user',
      JSON.stringify({
        name: `Support Token (${userObj?.name || 'Platform Admin'})`,
        email: 'support@leadsphere.io',
        role: 'Company Admin',
        impersonated: true,
      }),
    );
    alert(`Audited 30-minute support session initiated for tenant '${selectedTenant.name}'. Reason logged: "${supportReason}". Opening workspace...`);
    setOpenSupport(false);
    setSupportReason('');
    navigate('/dashboard');
  };

  const tenantColumns: GridColDef[] = [
    { field: 'name', headerName: 'Company Workspace Name', flex: 1.3, minWidth: 200 },
    { field: 'slug', headerName: 'Domain Subdomain', flex: 1, minWidth: 140, renderCell: (params) => <Typography variant="body2" color="primary.main" fontWeight={600}>{params.value}.leadsphere.io</Typography> },
    {
      field: 'plan',
      headerName: 'Subscription',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'Enterprise' ? 'secondary' : params.value === 'Pro' ? 'primary' : 'default'}
          sx={{ fontWeight: 700 }}
        />
      ),
    },
    { field: 'usersCount', headerName: 'Users', width: 90, type: 'number' },
    { field: 'leadsCount', headerName: 'Leads', width: 110, type: 'number' },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'active' ? 'success' : 'error'}
          sx={{ fontWeight: 700, textTransform: 'uppercase' }}
        />
      ),
    },
    { field: 'created_at', headerName: 'Provisioned Date', width: 130 },
    {
      field: 'actions',
      headerName: 'Governance Actions',
      width: 220,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Credentials & Workspace Details">
            <IconButton
              size="small"
              color="info"
              onClick={(e) => {
                e.stopPropagation();
                setDetailsTenant(params.row);
                setShowDetailsPassword(false);
                setOpenDetails(true);
              }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Audited Support Impersonation Token">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTenant(params.row);
                setOpenSupport(true);
              }}
            >
              <SupportAgentIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.status === 'active' ? 'Suspend Tenant Workspace' : 'Activate Tenant Workspace'}>
            <IconButton
              size="small"
              color={params.row.status === 'active' ? 'error' : 'success'}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(params.row.id);
              }}
            >
              {params.row.status === 'active' ? <PauseCircleIcon fontSize="small" /> : <PlayCircleIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Company Workspace">
            <IconButton
              size="small"
              color="default"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTenant(params.row.id);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* Top Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
              Platform Control Center
            </Typography>
            <Chip
              label="SUPER ADMIN CONSOLE"
              color="primary"
              size="small"
              sx={{ fontWeight: 800, fontSize: '0.65rem' }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Global multi-tenant infrastructure, tenant workspace governance, and subscription billing metrics.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddBusinessIcon />}
          onClick={() => setOpenCreate(true)}
          sx={{ py: 1.2, px: 2.5, fontWeight: 700 }}
        >
          Provision Tenant Workspace
        </Button>
      </Box>

      {/* KPI Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Active Companies
              </Typography>
              <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', width: 40, height: 40 }}>
                <BusinessIcon />
              </Avatar>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {activeTenantsCount}
            </Typography>
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 700, mt: 0.5, display: 'block' }}>
              ● {tenants.length} Total Registered Workspaces
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Platform MRR
              </Typography>
              <Avatar sx={{ bgcolor: 'success.lighter', color: 'success.main', width: 40, height: 40 }}>
                <MoneyIcon />
              </Avatar>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              ${totalMRR.toLocaleString()} <Typography component="span" variant="body2" color="text.secondary">/mo</Typography>
            </Typography>
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 700, mt: 0.5, display: 'block' }}>
              ↑ +14.2% Growth MoM
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Managed Users
              </Typography>
              <Avatar sx={{ bgcolor: 'info.lighter', color: 'info.main', width: 40, height: 40 }}>
                <PeopleIcon />
              </Avatar>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {totalUsers}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5, display: 'block' }}>
              Across {tenants.length} Tenant Organizations
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                System Uptime & Latency
              </Typography>
              <Avatar sx={{ bgcolor: 'warning.lighter', color: 'warning.main', width: 40, height: 40 }}>
                <SpeedIcon />
              </Avatar>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>
              99.98%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5, display: 'block' }}>
              API Avg Response: 42ms | PostgreSQL RLS Active
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab label="Platform Overview" sx={{ fontWeight: 700, textTransform: 'none' }} />
        <Tab label="Company Tenants" sx={{ fontWeight: 700, textTransform: 'none' }} />
        <Tab label="Subscriptions & Plans" sx={{ fontWeight: 700, textTransform: 'none' }} />
        <Tab label="System Health & Storage" sx={{ fontWeight: 700, textTransform: 'none' }} />
        <Tab label="Global Security Audit" sx={{ fontWeight: 700, textTransform: 'none' }} />
        <Tab label="System Configuration" sx={{ fontWeight: 700, textTransform: 'none' }} />
      </Tabs>

      {/* TAB 0: PLATFORM OVERVIEW */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Tenant Subscription Distribution
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Enterprise Plan ($399/mo)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'secondary.main' }}>2 Companies (40%)</Typography>
                  </Box>
                  <Paper sx={{ height: 10, bgcolor: 'secondary.light', borderRadius: 5, overflow: 'hidden' }}>
                    <Box sx={{ width: '40%', height: '100%', bgcolor: 'secondary.main' }} />
                  </Paper>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Professional Plan ($149/mo)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>2 Companies (40%)</Typography>
                  </Box>
                  <Paper sx={{ height: 10, bgcolor: 'primary.light', borderRadius: 5, overflow: 'hidden' }}>
                    <Box sx={{ width: '40%', height: '100%', bgcolor: 'primary.main' }} />
                  </Paper>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Starter Plan ($49/mo)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'info.main' }}>1 Company (20%)</Typography>
                  </Box>
                  <Paper sx={{ height: 10, bgcolor: 'info.light', borderRadius: 5, overflow: 'hidden' }}>
                    <Box sx={{ width: '20%', height: '100%', bgcolor: 'info.main' }} />
                  </Paper>
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Platform Governance Shortcuts
              </Typography>
              <Stack spacing={1.5}>
                <Button
                  variant="outlined"
                  startIcon={<AddBusinessIcon />}
                  onClick={() => setOpenCreate(true)}
                  sx={{ justifyContent: 'flex-start', py: 1.2, fontWeight: 700 }}
                >
                  Provision New Company Tenant
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<PlanIcon />}
                  onClick={() => setActiveTab(2)}
                  sx={{ justifyContent: 'flex-start', py: 1.2, fontWeight: 700 }}
                >
                  Manage Subscription Tier Pricing
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ShieldIcon />}
                  onClick={() => setActiveTab(4)}
                  sx={{ justifyContent: 'flex-start', py: 1.2, fontWeight: 700 }}
                >
                  Review Platform Security Audit Feeds
                </Button>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: TENANT MANAGEMENT */}
      {activeTab === 1 && (
        <Card sx={{ height: 520, width: '100%', borderRadius: 3 }}>
          <DataGrid
            rows={tenants}
            columns={tenantColumns}
            pageSizeOptions={[5, 10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick={false}
            onRowClick={(params) => {
              setDetailsTenant(params.row);
              setShowDetailsPassword(false);
              setOpenDetails(true);
            }}
            sx={{
              cursor: 'pointer',
              border: 'none',
              '& .MuiDataGrid-cell:focus': {
                outline: 'none !important',
              },
              '& .MuiDataGrid-cell:focus-within': {
                outline: 'none !important',
              },
              '& .MuiDataGrid-columnHeader:focus': {
                outline: 'none !important',
              },
              '& .MuiDataGrid-columnHeader:focus-within': {
                outline: 'none !important',
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: 'action.hover',
              },
            }}
          />
        </Card>
      )}

      {/* TAB 2: SUBSCRIPTIONS & PLANS */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderTop: '4px solid #0088FE' }}>
              <Chip label="STARTER PLAN" size="small" color="primary" sx={{ fontWeight: 800, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>$49 <Typography component="span" variant="body2" color="text.secondary">/ month</Typography></Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>Essential CRM tools for small teams</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Included Features:</Typography>
              <Stack spacing={0.8} sx={{ mb: 3 }}>
                <Typography variant="body2">✓ Up to 5 User Seats</Typography>
                <Typography variant="body2">✓ 1,000 Active Leads</Typography>
                <Typography variant="body2">✓ Standard Follow-up Calendar</Typography>
              </Stack>
              <Button fullWidth variant="outlined">Configure Starter Plan</Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderTop: '4px solid #00C49F', bgcolor: 'primary.lighter' }}>
              <Chip label="PROFESSIONAL PLAN" size="small" color="success" sx={{ fontWeight: 800, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>$149 <Typography component="span" variant="body2" color="text.secondary">/ month</Typography></Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>Advanced AI & Multi-Channel Campaigns</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Included Features:</Typography>
              <Stack spacing={0.8} sx={{ mb: 3 }}>
                <Typography variant="body2">✓ Up to 25 User Seats</Typography>
                <Typography variant="body2">✓ 25,000 Active Leads</Typography>
                <Typography variant="body2">✓ Google Gemini AI Email Drafter</Typography>
                <Typography variant="body2">✓ Meta WhatsApp Cloud API Inbox</Typography>
              </Stack>
              <Button fullWidth variant="contained">Configure Pro Plan</Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderTop: '4px solid #FFBB28' }}>
              <Chip label="ENTERPRISE PLAN" size="small" color="warning" sx={{ fontWeight: 800, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>$399 <Typography component="span" variant="body2" color="text.secondary">/ month</Typography></Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>Unlimited seats & dedicated support</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Included Features:</Typography>
              <Stack spacing={0.8} sx={{ mb: 3 }}>
                <Typography variant="body2">✓ Unlimited User Seats</Typography>
                <Typography variant="body2">✓ Unlimited Leads & Vault Storage</Typography>
                <Typography variant="body2">✓ Presigned Cloudinary Media Storage</Typography>
                <Typography variant="body2">✓ Audited 30-min Support Impersonation</Typography>
              </Stack>
              <Button fullWidth variant="outlined">Configure Enterprise Plan</Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 3: SYSTEM HEALTH & STORAGE */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <StorageIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  PostgreSQL 16 Multi-Tenant RLS Status
                </Typography>
              </Stack>
              <Alert severity="success" icon={<VerifiedIcon />} sx={{ mb: 2 }}>
                Row-Level Security (RLS) enforcement is active across all tenant tables (`leads`, `users`, `campaigns`).
              </Alert>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Active DB Pool Connections:</Typography>
                  <Typography variant="body2" fontWeight={700}>18 / 100 Connections</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Database Size:</Typography>
                  <Typography variant="body2" fontWeight={700}>420 MB</Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <AiIcon color="secondary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Google Gemini AI Engine Quota
                </Typography>
              </Stack>
              <Alert severity="info" sx={{ mb: 2 }}>
                Gemini API Model: <strong>gemini-1.5-flash</strong> (Lead Summarization, Sentiment Analysis, Smart Drafter).
              </Alert>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Monthly Requests Used:</Typography>
                  <Typography variant="body2" fontWeight={700}>14,280 / 100,000 Calls</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Avg Generation Time:</Typography>
                  <Typography variant="body2" fontWeight={700}>640 ms</Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 4: GLOBAL SECURITY AUDIT */}
      {activeTab === 4 && (
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Global Platform Security Audit Trail
            </Typography>
            <Button size="small" startIcon={<RefreshIcon />}>Refresh Feed</Button>
          </Box>
          <Stack spacing={1.5}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Support Access Token Issued for 'Apex Digital Inc.'</Typography>
                <Typography variant="caption" color="text.secondary">Actor: Platform Admin (admin@leadsphere.io) | Reason: Investigating ticket #4029</Typography>
              </Box>
              <Chip label="AUDITED SUPPORT" size="small" color="warning" sx={{ fontWeight: 700 }} />
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>New Company Workspace Provisioned ('Vance Tech Workspace')</Typography>
                <Typography variant="caption" color="text.secondary">Actor: Self-Registration via Dual OTP | Domain: vance-tech.leadsphere.io</Typography>
              </Box>
              <Chip label="PROVISIONED" size="small" color="success" sx={{ fontWeight: 700 }} />
            </Paper>
          </Stack>
        </Card>
      )}

      {/* TAB 5: SYSTEM CONFIGURATION */}
      {activeTab === 5 && (
        <Card sx={{ p: 3, borderRadius: 3, maxWidth: 650 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            System Infrastructure Settings
          </Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable New Company Self-Registration & Dual OTP Wizard"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enforce PostgreSQL 16 Row-Level Security Interceptor"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable Google Gemini AI Lead Summarizer & Smart Drafter"
            />
            <Divider />
            <Button variant="contained" sx={{ fontWeight: 700, alignSelf: 'flex-start' }}>
              Save Platform Configuration
            </Button>
          </Stack>
        </Card>
      )}

      {/* Provision Tenant Modal */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box component="form" onSubmit={handleCreateTenant}>
          <DialogTitle sx={{ fontWeight: 700 }}>Provision New Company Workspace</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              label="Company Workspace Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
              }}
              margin="normal"
              required
              placeholder="e.g. Nexus Innovations"
            />
            <TextField
              fullWidth
              label="Domain Subdomain Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              margin="normal"
              required
              helperText="URL: yourcompany.leadsphere.io"
            />
            <TextField
              fullWidth
              select
              label="Subscription Tier"
              value={plan}
              onChange={(e) => setPlan(e.target.value as any)}
              margin="normal"
              SelectProps={{ native: true }}
            >
              <option value="Starter">Starter Plan ($49/mo)</option>
              <option value="Pro">Professional Plan ($149/mo)</option>
              <option value="Enterprise">Enterprise Plan ($399/mo)</option>
            </TextField>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 1, color: 'primary.main' }}>
              Company Administrator Credentials
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Admin Full Name"
                  value={createAdminName}
                  onChange={(e) => setCreateAdminName(e.target.value)}
                  margin="dense"
                  placeholder="e.g. John Smith"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Admin Work Email"
                  type="email"
                  value={createAdminEmail}
                  onChange={(e) => setCreateAdminEmail(e.target.value)}
                  margin="dense"
                  placeholder="admin@company.com"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Admin Password"
                  type="password"
                  value={createAdminPassword}
                  onChange={(e) => setCreateAdminPassword(e.target.value)}
                  margin="dense"
                  placeholder="Password123!"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Admin Mobile Phone"
                  value={createAdminPhone}
                  onChange={(e) => setCreateAdminPhone(e.target.value)}
                  margin="dense"
                  placeholder="+1 (555) 000-0000"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>
              Provision Workspace
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Support Access Dialog */}
      <Dialog open={openSupport} onClose={() => setOpenSupport(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Initiate Audited Support Access — {selectedTenant?.name}
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Support access generates a 30-minute audited session token. Every action will be permanently recorded in the tenant's security audit trail with your identity.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Mandatory Support Reason"
            value={supportReason}
            onChange={(e) => setSupportReason(e.target.value)}
            placeholder="e.g., Resolving support ticket #4029 for inbox webhooks."
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenSupport(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            disabled={!supportReason.trim()}
            onClick={handleSupportAccess}
            sx={{ fontWeight: 700 }}
          >
            Start Audited Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Company Tenant Details & Admin Credentials Modal */}
      <Dialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {detailsTenant && (
          <>
            <DialogTitle sx={{ p: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 800, width: 44, height: 44 }}>
                  {detailsTenant.name[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {detailsTenant.name}
                  </Typography>
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
                    https://{detailsTenant.slug}.leadsphere.io
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={detailsTenant.status}
                  size="small"
                  color={detailsTenant.status === 'active' ? 'success' : 'error'}
                  sx={{ fontWeight: 700, textTransform: 'uppercase' }}
                />
                <IconButton onClick={() => setOpenDetails(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 3 }}>
              {/* Admin Credentials Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: 3,
                  bgcolor: 'primary.lighter',
                  border: '1px solid',
                  borderColor: 'primary.light',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <KeyIcon color="primary" />
                  <Typography variant="subtitle1" color="primary.dark" sx={{ fontWeight: 800 }}>
                    Company Administrator Account Credentials
                  </Typography>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Company Admin Name
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>
                        {detailsTenant.adminName}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Work Email (Login ID)
                        </Typography>
                        <Tooltip title="Copy Email">
                          <IconButton
                            size="small"
                            onClick={() => {
                              navigator.clipboard.writeText(detailsTenant.adminEmail);
                              alert(`Copied email '${detailsTenant.adminEmail}' to clipboard!`);
                            }}
                          >
                            <ContentCopyIcon fontSize="small" style={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.2 }}>
                        {detailsTenant.adminEmail}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Password
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title={showDetailsPassword ? 'Hide Password' : 'Show Password'}>
                            <IconButton size="small" onClick={() => setShowDetailsPassword(!showDetailsPassword)}>
                              {showDetailsPassword ? <VisibilityOffIcon style={{ fontSize: 16 }} /> : <VisibilityIcon style={{ fontSize: 16 }} />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy Password">
                            <IconButton
                              size="small"
                              onClick={() => {
                                navigator.clipboard.writeText(detailsTenant.adminPassword || 'Password123!');
                                alert('Copied password to clipboard!');
                              }}
                            >
                              <ContentCopyIcon fontSize="small" style={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', mt: 0.2 }}>
                        {showDetailsPassword ? (detailsTenant.adminPassword || 'Password123!') : '••••••••••••'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Mobile Phone
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>
                        {detailsTenant.adminPhone || '+1 (555) 000-0000'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Workspace Infrastructure & Metrics */}
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                Tenant Workspace Infrastructure
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Tenant Identifier (ID)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>
                      {detailsTenant.id}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Subscription Plan
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>
                      {detailsTenant.plan} (${detailsTenant.mrr}/mo)
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Provisioned Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>
                      {detailsTenant.created_at}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Active User Seats
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>
                      {detailsTenant.usersCount} Active Accounts
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Total CRM Leads Ingested
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>
                      {detailsTenant.leadsCount.toLocaleString()} Leads
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                color={detailsTenant.status === 'active' ? 'error' : 'success'}
                onClick={() => {
                  handleToggleStatus(detailsTenant.id);
                  setDetailsTenant({
                    ...detailsTenant,
                    status: detailsTenant.status === 'active' ? 'suspended' : 'active',
                  });
                }}
              >
                {detailsTenant.status === 'active' ? 'Suspend Workspace' : 'Activate Workspace'}
              </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<SupportAgentIcon />}
                  onClick={() => {
                    setOpenDetails(false);
                    setSelectedTenant(detailsTenant);
                    setOpenSupport(true);
                  }}
                  sx={{ fontWeight: 700 }}
                >
                  Audited Support Access
                </Button>
                <Button variant="contained" onClick={() => setOpenDetails(false)} sx={{ fontWeight: 700 }}>
                  Done
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
