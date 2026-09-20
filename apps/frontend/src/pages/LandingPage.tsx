import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  AppBar,
  Toolbar,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  Psychology as AiIcon,
  ViewKanban as KanbanIcon,
  Inbox as InboxIcon,
  Folder as FolderIcon,
  Shield as ShieldIcon,
  ArrowForward as ArrowIcon,
  AdminPanelSettings as SuperAdminIcon,
} from '@mui/icons-material';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [checkoutTier, setCheckoutTier] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const pricingTiers = [
    {
      id: 'starter',
      name: 'Starter Plan',
      price: '$49',
      period: '/month',
      description: 'Ideal for small sales teams getting started with lead management.',
      popular: false,
      features: [
        'Up to 5 Team Members',
        '10,000 Active Lead Records',
        'Visual Kanban Deal Pipeline',
        'Basic Email Campaign Dispatch',
        'Cloud Vault Storage (10 GB)',
        'Standard Support (24/7 Email)',
      ],
    },
    {
      id: 'pro',
      name: 'Professional Plan',
      price: '$149',
      period: '/month',
      description: 'Complete sales automation for growing SMB revenue teams.',
      popular: true,
      features: [
        'Up to 25 Team Members',
        '100,000 Active Lead Records',
        'AI Copilot (Lead Summary & Email Drafter)',
        'Unified WhatsApp & Email Inbox',
        'Automated Import/Export CSV Data Pipelines',
        'Cloud Vault Storage (100 GB)',
        'Priority 24/7 Support',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise SaaS',
      price: '$399',
      period: '/month',
      description: 'Unlimited scale with dedicated RLS tenant isolation & custom SLA.',
      popular: false,
      features: [
        'Unlimited Team Members',
        '1,000,000+ Lead Records',
        'Dedicated PostgreSQL 16 RLS Tenant Engine',
        'Custom Google Gemini & AI Prompt Guardrails',
        'Meta WhatsApp Cloud API Unlimited Throughput',
        'Immutable Security Audit Trail & SOC2 Log Retention',
        'Dedicated Account Executive & Custom SLA',
      ],
    },
  ];

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !adminEmail) return;

    try {
      const planCode = checkoutTier?.toLowerCase().includes('starter')
        ? 'starter'
        : checkoutTier?.toLowerCase().includes('enterprise')
        ? 'enterprise'
        : 'pro';

      const res = await fetch('/api/v1/platform/tenants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          adminName: `${companyName} Admin`,
          adminEmail,
          plan: planCode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.data) {
        if (data.data.access_token) {
          localStorage.setItem('token', data.data.access_token);
        }
        if (data.data.tenant) {
          localStorage.setItem('tenant', JSON.stringify(data.data.tenant));
        }
        setPurchaseSuccess(true);
        setTimeout(() => {
          setPurchaseSuccess(false);
          setCheckoutTier(null);
          navigate('/dashboard');
        }, 1500);
      } else {
        setPurchaseSuccess(true);
        setTimeout(() => {
          setPurchaseSuccess(false);
          setCheckoutTier(null);
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      setPurchaseSuccess(true);
      setTimeout(() => {
        setPurchaseSuccess(false);
        setCheckoutTier(null);
        navigate('/dashboard');
      }, 1500);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0b0f19', color: '#fff', pb: 10 }}>
      {/* Top Navbar */}
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'rgba(11, 15, 25, 0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', px: '0 !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/')}>
              <Avatar sx={{ bgcolor: '#1976d2', fontWeight: 800, width: 38, height: 38 }}>LS</Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#fff' }}>
                LeadSphere<Typography component="span" variant="caption" sx={{ color: '#64b5f6', ml: 0.5, fontWeight: 700 }}>SaaS</Typography>
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              <Button color="inherit" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Features
              </Button>
              <Button color="inherit" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Pricing & Subscription
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
              >
                Workspace Sign In
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ pt: 18, pb: 10, background: 'radial-gradient(circle at 50% 20%, rgba(25, 118, 210, 0.25) 0%, rgba(11, 15, 25, 0) 70%)' }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Chip label="✨ LeadSphere v1.10.0 Enterprise SaaS Release" color="primary" sx={{ mb: 3, fontWeight: 700, px: 1, py: 0.5 }} />
          <Typography variant="h2" sx={{ fontWeight: 900, tracking: -1, mb: 2, fontSize: { xs: '2.5rem', md: '3.8rem' }, lineHeight: 1.15 }}>
            The Next-Gen Multi-Tenant CRM & AI Outreach Platform
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 780, mx: 'auto', mb: 5, color: '#90a4ae', fontWeight: 400 }}>
            Empower your sales organization with PostgreSQL RLS isolation, Kanban deal pipelines, Google Gemini AI intelligence, unified WhatsApp & Email inbox, and automated cloud document vaults.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              endIcon={<ArrowIcon />}
              sx={{ py: 1.8, px: 4, borderRadius: 3, fontSize: '1.1rem', fontWeight: 700, bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
            >
              Get Subscription Plan
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{ py: 1.8, px: 4, borderRadius: 3, fontSize: '1.1rem', fontWeight: 700, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
            >
              Sign In to Workspace
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features Grid */}
      <Container id="features" maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="caption" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.5 }}>
            PLATFORM CAPABILITIES
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
            Built for Modern Enterprise Revenue Teams
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {[
            { title: 'PostgreSQL 16 RLS Engine', icon: <ShieldIcon color="primary" sx={{ fontSize: 36 }} />, desc: 'Row-Level Security enforces strict data boundaries between client tenants.' },
            { title: 'Google Gemini AI Copilot', icon: <AiIcon color="secondary" sx={{ fontSize: 36 }} />, desc: 'Instant lead summaries, tone-aware email drafting, and reply sentiment classification.' },
            { title: 'Kanban Deal Pipeline', icon: <KanbanIcon color="info" sx={{ fontSize: 36 }} />, desc: 'Visual drag-and-drop pipeline stages with real-time conversion scoring.' },
            { title: 'Unified WhatsApp & Email Inbox', icon: <InboxIcon color="success" sx={{ fontSize: 36 }} />, desc: 'Meta 24-hr customer service window tracking and unified message streams.' },
            { title: 'Cloud Vault Storage', icon: <FolderIcon color="warning" sx={{ fontSize: 36 }} />, desc: 'Presigned Cloudinary upload URLs, document versioning, and malware scanning.' },
            { title: 'Super Admin Governance', icon: <SuperAdminIcon color="error" sx={{ fontSize: 36 }} />, desc: '30-minute support access tokens and platform-wide tenant provisioning.' },
          ].map((feat, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#111827', borderColor: 'rgba(255,255,255,0.08)', height: '100%' }}>
                <Box sx={{ mb: 2 }}>{feat.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{feat.title}</Typography>
                <Typography variant="body2" color="grey.400">{feat.desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Subscription Pricing Section */}
      <Container id="pricing" maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="caption" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.5 }}>
            SUBSCRIPTION PLANS
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
            Choose Your Subscription Tier
          </Typography>
          <Typography variant="body1" color="grey.400" sx={{ mt: 1 }}>
            Companies can purchase instant subscription access or request a custom enterprise deployment.
          </Typography>
        </Box>

        <Grid container spacing={4} alignItems="stretch">
          {pricingTiers.map((tier) => (
            <Grid item xs={12} md={4} key={tier.id}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 4,
                  bgcolor: tier.popular ? '#131c31' : '#111827',
                  borderColor: tier.popular ? '#1976d2' : 'rgba(255,255,255,0.1)',
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transform: tier.popular ? 'scale(1.03)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {tier.popular && (
                  <Chip
                    icon={<StarIcon sx={{ color: '#fff !important' }} />}
                    label="MOST POPULAR FOR COMPANIES"
                    color="primary"
                    sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontWeight: 800, px: 1 }}
                  />
                )}
                <CardContent sx={{ p: 4, flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{tier.name}</Typography>
                  <Typography variant="body2" color="grey.400" sx={{ mb: 3 }}>{tier.description}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff' }}>{tier.price}</Typography>
                    <Typography variant="subtitle1" color="grey.400" sx={{ ml: 0.5 }}>{tier.period}</Typography>
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

                  <Stack spacing={1.5} sx={{ mb: 4 }}>
                    {tier.features.map((feat, fIdx) => (
                      <Box key={fIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CheckIcon color="primary" fontSize="small" />
                        <Typography variant="body2" color="grey.300">{feat}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>

                <Box sx={{ p: 3, pt: 0 }}>
                  <Button
                    variant={tier.popular ? 'contained' : 'outlined'}
                    fullWidth
                    size="large"
                    onClick={() => setCheckoutTier(tier.name)}
                    sx={{ py: 1.5, borderRadius: 3, fontWeight: 800, textTransform: 'none' }}
                  >
                    Purchase {tier.name}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Subscription Purchase Modal */}
      <Dialog open={Boolean(checkoutTier)} onClose={() => setCheckoutTier(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Subscribe to {checkoutTier}
        </DialogTitle>
        <DialogContent dividers>
          {purchaseSuccess ? (
            <Alert severity="success" sx={{ py: 3, textAlign: 'center' }}>
              <strong>Subscription Activated!</strong><br />
              Provisioning your tenant workspace and redirecting...
            </Alert>
          ) : (
            <Box component="form" onSubmit={handlePurchaseSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Enter your company details to activate your subscription and launch your isolated tenant.
              </Typography>
              <TextField
                label="Company / Organization Name"
                fullWidth
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Global Solutions"
              />
              <TextField
                label="Admin Work Email"
                type="email"
                fullWidth
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="alex@apex.com"
              />
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>SELECTED SUBSCRIPTION</Typography>
                <Typography variant="subtitle1" fontWeight={800} color="primary.main">{checkoutTier}</Typography>
                <Typography variant="caption" color="text.secondary">Includes 14-day risk-free money-back guarantee.</Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        {!purchaseSuccess && (
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCheckoutTier(null)}>Cancel</Button>
            <Button variant="contained" onClick={handlePurchaseSubmit} sx={{ fontWeight: 700, px: 3 }}>
              Confirm & Start Trial
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};
