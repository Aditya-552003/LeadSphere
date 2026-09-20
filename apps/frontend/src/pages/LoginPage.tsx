import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Avatar,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
  Paper,
  Stack,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  AdminPanelSettings as SuperAdminIcon,
  Business as CompanyIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  MarkEmailRead as OtpIcon,
  CheckCircle as VerifiedIcon,
} from '@mui/icons-material';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const navigate = useNavigate();

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Registration & OTP Wizard State
  const [regStep, setRegStep] = useState<number>(1);
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [adminName, setAdminName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // OTP Verification State
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (email === 'admin@leadsphere.io') {
        localStorage.setItem(
          'user',
          JSON.stringify({ name: 'Platform Admin', email: 'admin@leadsphere.io', role: 'Super Admin' }),
        );
        localStorage.removeItem('tenant');
        navigate('/super-admin');
      } else if (email.includes('cokooon')) {
        localStorage.setItem(
          'tenant',
          JSON.stringify({ id: 'tn_cokooon', name: 'Cokooon Technologies', slug: 'cokooon-tech' }),
        );
        localStorage.setItem(
          'user',
          JSON.stringify({ name: 'Rahul Sharma', email, role: 'Company Admin' }),
        );
        navigate('/dashboard');
      } else {
        // Look up registered tenant details from localStorage
        let foundAdminName = '';
        let foundTenantName = '';
        try {
          const storedTenants = localStorage.getItem('registered_tenants');
          if (storedTenants) {
            const list = JSON.parse(storedTenants);
            const match = list.find((t: any) => t.adminEmail?.toLowerCase() === email.toLowerCase());
            if (match) {
              foundAdminName = match.adminName;
              foundTenantName = match.name;
            }
          }
        } catch (e) {}

        const emailPrefix = email.split('@')[0] || 'User';
        const computedName = foundAdminName || (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1));
        const companyDomain = email.split('@')[1]?.split('.')[0]?.toUpperCase() || 'WORKSPACE';
        const computedTenantName = foundTenantName || `${companyDomain} Corp`;

        localStorage.setItem(
          'tenant',
          JSON.stringify({ id: `tn_${companyDomain.toLowerCase()}`, name: computedTenantName, slug: companyDomain.toLowerCase() }),
        );
        localStorage.setItem(
          'user',
          JSON.stringify({ name: computedName, email, role: 'Company Admin' }),
        );
        navigate('/dashboard');
      }
    }, 600);
  };

  const handleSendOtps = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !registerEmail || !phone || !adminName) {
      setOtpError('Please fill in all company and user details.');
      return;
    }
    setOtpError('');
    setRegStep(2);
  };

  const handleVerifyOtpsAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    // OTP Bypass Logic: Accept 123456 for Email & Phone OTP
    const isEmailValid = emailOtp.trim() === '123456' || emailOtp.trim().length === 6;
    const isPhoneValid = phoneOtp.trim() === '123456' || phoneOtp.trim().length === 6;

    const saveRegisteredTenant = (tId: string, tName: string, tSlug: string) => {
      const record = {
        id: tId,
        name: tName,
        slug: tSlug,
        status: 'active',
        plan: 'Pro',
        usersCount: 1,
        leadsCount: 0,
        mrr: 149,
        created_at: new Date().toISOString().split('T')[0],
        adminName,
        adminEmail: registerEmail,
        adminPassword: registerPassword || 'Password123!',
        adminPhone: phone || '+1 (555) 000-0000',
      };
      const stored = localStorage.getItem('registered_tenants');
      const list = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((item: any) => item.slug !== tSlug);
      localStorage.setItem('registered_tenants', JSON.stringify([record, ...filtered]));
    };

    setLoading(true);
    try {
      const slugVal = companyDomain || companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const res = await fetch('/api/v1/platform/tenants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          domain: slugVal,
          adminName,
          adminEmail: registerEmail,
          password: registerPassword || 'Password123!',
          plan: 'pro',
        }),
      });

      const data = await res.json();
      if (res.ok && data.data) {
        if (data.data.access_token) {
          localStorage.setItem('token', data.data.access_token);
        }
        localStorage.setItem('tenant', JSON.stringify(data.data.tenant));
        localStorage.setItem('user', JSON.stringify(data.data.user));
        saveRegisteredTenant(data.data.tenant.id, data.data.tenant.name, data.data.tenant.slug);
        navigate('/dashboard');
      } else {
        // Fallback registration
        const fallbackTenant = { id: `tn_${Date.now()}`, name: companyName, slug: companyName.toLowerCase().replace(/\s+/g, '-') };
        localStorage.setItem('tenant', JSON.stringify(fallbackTenant));
        localStorage.setItem(
          'user',
          JSON.stringify({ name: adminName, email: registerEmail, role: 'Company Admin', phone }),
        );
        saveRegisteredTenant(fallbackTenant.id, fallbackTenant.name, fallbackTenant.slug);
        navigate('/dashboard');
      }
    } catch (err) {
      const fallbackTenant = { id: `tn_${Date.now()}`, name: companyName, slug: companyName.toLowerCase().replace(/\s+/g, '-') };
      localStorage.setItem('tenant', JSON.stringify(fallbackTenant));
      localStorage.setItem(
        'user',
        JSON.stringify({ name: adminName, email: registerEmail, role: 'Company Admin', phone }),
      );
      saveRegisteredTenant(fallbackTenant.id, fallbackTenant.name, fallbackTenant.slug);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCompanyLogin = (cName: string, aName: string, cEmail: string) => {
    setEmail(cEmail);
    setPassword('Password123!');
    localStorage.setItem(
      'tenant',
      JSON.stringify({ id: `tn_${cName.toLowerCase().replace(/\s+/g, '')}`, name: cName, slug: cName.toLowerCase().replace(/\s+/g, '-') }),
    );
    localStorage.setItem(
      'user',
      JSON.stringify({ name: aName, email: cEmail, role: 'Company Admin' }),
    );
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 500);
  };

  const handleSuperAdminLogin = () => {
    setEmail('admin@leadsphere.io');
    setPassword('LeadSphere2026!');
    localStorage.setItem(
      'user',
      JSON.stringify({ name: 'Platform Admin', email: 'admin@leadsphere.io', role: 'Super Admin' }),
    );
    localStorage.removeItem('tenant');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/super-admin');
    }, 500);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 480, width: '100%', p: 2, borderRadius: 3 }}>
        <CardContent>
          <Box
            onClick={() => navigate('/')}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2, cursor: 'pointer' }}
          >
            <Avatar sx={{ bgcolor: 'primary.main', width: 52, height: 52, mb: 1, fontWeight: 700 }}>
              LS
            </Avatar>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
              LeadSphere Portal
            </Typography>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            centered
            sx={{ mb: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Tab label="Sign In" value="signin" sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label="Register Company" value="register" sx={{ fontWeight: 700, textTransform: 'none' }} />
          </Tabs>

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <Box component="form" onSubmit={handleSignInSubmit}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <TextField
                fullWidth
                label="Work Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                placeholder="name@company.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                placeholder="Enter your password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 2.5, mb: 1.5, py: 1.2, fontWeight: 700 }}
              >
                {loading ? 'Opening Workspace...' : 'Sign In to Workspace'}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch('/api/v1/auth/google', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: 'alex.vance@gmail.com',
                        name: 'Alex Vance (Google)',
                        avatar: 'https://lh3.googleusercontent.com/a/default-user',
                      }),
                    });
                    const data = await res.json();
                    if (data.data?.access_token) {
                      localStorage.setItem('token', data.data.access_token);
                    }
                    localStorage.setItem(
                      'tenant',
                      JSON.stringify({ id: 'tn_google_demo', name: 'Vance Tech (Google Workspace)', slug: 'vance-tech' }),
                    );
                    localStorage.setItem(
                      'user',
                      JSON.stringify({ name: 'Alex Vance', email: 'alex.vance@gmail.com', role: 'Company Admin' }),
                    );
                    navigate('/dashboard');
                  } catch (e) {
                    navigate('/dashboard');
                  } finally {
                    setLoading(false);
                  }
                }}
                startIcon={
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                }
                sx={{
                  py: 1.2,
                  fontWeight: 700,
                  color: '#3c4043',
                  borderColor: '#dadce0',
                  bgcolor: '#fff',
                  '&:hover': { bgcolor: '#f8f9fa', borderColor: '#d2e3fc' },
                  textTransform: 'none',
                }}
              >
                Continue with Google Auth
              </Button>

              <Divider sx={{ my: 2 }}>
                <Chip label="DEMO ACCOUNT QUICK ACCESS" size="small" sx={{ fontSize: '0.7rem', fontWeight: 700 }} />
              </Divider>

              <Stack spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CompanyIcon color="primary" />}
                  onClick={() => handleQuickCompanyLogin('Apex Digital', 'Alex Vance', 'admin@apexdigital.test')}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2 }}
                >
                  Log in as Company Admin — Apex Digital
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CompanyIcon color="secondary" />}
                  onClick={() => handleQuickCompanyLogin('Cokooon Tech', 'Rahul Sharma', 'rahul@cokooon.com')}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2 }}
                >
                  Log in as Company Admin — Cokooon Tech
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  size="small"
                  startIcon={<SuperAdminIcon />}
                  onClick={handleSuperAdminLogin}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                >
                  Log in as Platform Super Admin Console
                </Button>
              </Stack>
            </Box>
          )}

          {/* TAB 2: REGISTER COMPANY & DUAL OTP WIZARD */}
          {activeTab === 'register' && (
            <Box>
              <Stepper activeStep={regStep - 1} alternativeLabel sx={{ mb: 3 }}>
                <Step><StepLabel>Company & User Details</StepLabel></Step>
                <Step><StepLabel>Dual OTP Verification</StepLabel></Step>
              </Stepper>

              {otpError && <Alert severity="error" sx={{ mb: 2 }}>{otpError}</Alert>}

              {/* STEP 1: Details Form */}
              {regStep === 1 && (
                <Box component="form" onSubmit={handleSendOtps}>
                  <TextField
                    fullWidth
                    label="Company / Organization Name"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      setCompanyDomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                    }}
                    margin="dense"
                    required
                    placeholder="e.g. Acme Technologies"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><CompanyIcon color="action" /></InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Company Domain Subdomain"
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    margin="dense"
                    required
                    placeholder="acme-tech"
                    helperText="URL: yourcompany.leadsphere.io"
                  />
                  <TextField
                    fullWidth
                    label="Company Admin Full Name"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    margin="dense"
                    required
                    placeholder="Sarah Connor"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Work Email Address"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    margin="dense"
                    required
                    placeholder="sarah@acme.com"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Mobile Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    margin="dense"
                    required
                    placeholder="+1 555 019 2831"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PhoneIcon color="action" /></InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    margin="dense"
                    required
                    placeholder="Password123!"
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{ mt: 2.5, py: 1.2, fontWeight: 700 }}
                  >
                    Send Email & Phone OTP Codes
                  </Button>
                </Box>
              )}

              {/* STEP 2: Dual OTP Verification */}
              {regStep === 2 && (
                <Box component="form" onSubmit={handleVerifyOtpsAndRegister}>
                  <Alert severity="info" icon={<OtpIcon />} sx={{ mb: 2 }}>
                    OTP sent to <strong>{registerEmail}</strong> and <strong>{phone}</strong>.<br />
                    <strong>Bypass OTP Code: 123456</strong>
                  </Alert>

                  <TextField
                    fullWidth
                    label="Email OTP Verification Code"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    margin="normal"
                    required
                    placeholder="Enter 123456"
                    inputProps={{ maxLength: 6, style: { letterSpacing: 4, fontWeight: 700 } }}
                  />

                  <TextField
                    fullWidth
                    label="Phone Number OTP Verification Code"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    margin="normal"
                    required
                    placeholder="Enter 123456"
                    inputProps={{ maxLength: 6, style: { letterSpacing: 4, fontWeight: 700 } }}
                  />

                  <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
                    <Button variant="outlined" onClick={() => setRegStep(1)}>
                      Back
                    </Button>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      startIcon={<VerifiedIcon />}
                      sx={{ fontWeight: 700 }}
                    >
                      {loading ? 'Provisioning Workspace...' : 'Verify OTPs & Launch Workspace'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
