import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
  Grid,
  Paper,
  Divider,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Shield as ShieldIcon,
  CheckCircle as VerifiedIcon,
  Close as CloseIcon,
  VpnKey as KeyIcon,
  Badge as BadgeIcon,
  Category as PlanIcon,
} from '@mui/icons-material';

interface UserProfileDialogProps {
  open: boolean;
  onClose: () => void;
  onNavigateSettings?: () => void;
  onLogout?: () => void;
}

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  open,
  onClose,
  onNavigateSettings,
  onLogout,
}) => {
  const rawUser = localStorage.getItem('user');
  const rawTenant = localStorage.getItem('tenant');

  const user = rawUser ? JSON.parse(rawUser) : null;
  const tenant = rawTenant ? JSON.parse(rawTenant) : null;

  const userEmail = user?.email || 'user@company.com';
  
  // Resolve correct name from registered_tenants or email prefix
  let resolvedName = user?.name;
  if (!resolvedName || resolvedName === 'Alex Vance') {
    try {
      const storedTenants = localStorage.getItem('registered_tenants');
      if (storedTenants) {
        const list = JSON.parse(storedTenants);
        const match = list.find((t: any) => t.adminEmail?.toLowerCase() === userEmail.toLowerCase());
        if (match?.adminName) resolvedName = match.adminName;
      }
    } catch (e) {}

    if (!resolvedName || resolvedName === 'Alex Vance') {
      const prefix = userEmail.split('@')[0] || 'User';
      resolvedName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }

    // Auto-update local storage user object if it was holding dummy 'Alex Vance'
    if (user && user.name !== resolvedName) {
      localStorage.setItem('user', JSON.stringify({ ...user, name: resolvedName }));
    }
  }

  const userName = resolvedName;
  const userRole = user?.role || 'Company Admin';
  const userPhone = user?.phone || 'Not Provided';
  const userId = user?.id || `usr_${userName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  const isSuperAdmin = userRole === 'Super Admin' || userEmail === 'admin@leadsphere.io';

  const companyName = tenant?.name || 'Company Workspace';
  const companySlug = tenant?.slug || 'workspace';
  const tenantId = tenant?.id || 'tn_workspace_01';
  const planName = tenant?.plan || 'Pro Plan';

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ m: 0, p: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          User Profile Details
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 3 }}>
        {/* Header Profile Banner */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 3,
            background: isSuperAdmin
              ? 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
          }}
        >
          <Avatar
            src={user?.avatar || undefined}
            sx={{
              width: 64,
              height: 64,
              bgcolor: '#fff',
              color: 'primary.main',
              fontWeight: 800,
              fontSize: '1.4rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {getInitials(userName)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {userName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.3, mb: 1 }}>
              {userEmail}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip
                label={userRole}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.25)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  backdropFilter: 'blur(4px)',
                }}
              />
              <Chip
                label={isSuperAdmin ? 'LeadSphere SaaS Platform' : companyName}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            </Stack>
          </Box>
        </Paper>

        {/* Section 1: User Personal Details */}
        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
          Personal Account Information
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Full Name
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {userName}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Work Email
                </Typography>
                <Chip icon={<VerifiedIcon style={{ fontSize: 12, color: '#2e7d32' }} />} label="Verified" size="small" color="success" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', ml: 'auto' }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {userEmail}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Phone Number
                </Typography>
                <Chip icon={<VerifiedIcon style={{ fontSize: 12, color: '#2e7d32' }} />} label="Verified" size="small" color="success" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', ml: 'auto' }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {userPhone}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                <BadgeIcon fontSize="small" color="action" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  System Role
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {userRole}
                </Typography>
                <Chip label="ACTIVE" size="small" color="success" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Section 2: Organization / Scope Details */}
        {!isSuperAdmin ? (
          <>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
              Company Workspace Context
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Company Name
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {companyName}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                    <KeyIcon fontSize="small" color="action" />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Workspace Domain / Slug
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {companySlug}.leadsphere.io
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                    <PlanIcon fontSize="small" color="action" />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Subscription Tier
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {planName}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                    <ShieldIcon fontSize="small" color="action" />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Security Isolation
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    PostgreSQL RLS Protected
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </>
        ) : (
          <>
            <Typography variant="subtitle2" color="secondary" sx={{ fontWeight: 700, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
              Platform Owner Governance Scope
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Organization Scope
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    LeadSphere SaaS Core Platform
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                    <KeyIcon fontSize="small" color="action" />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Governance Scope
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                    Global Multi-Tenant Control Center
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                    <BadgeIcon fontSize="small" color="action" />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      System Authority
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Root Platform Super Administrator
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                    <ShieldIcon fontSize="small" color="action" />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Cross-Tenant Support Access
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                    Audited 30-min Impersonation Token
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2.5, px: 3, justifyContent: 'space-between' }}>
        {onLogout ? (
          <Button color="error" variant="outlined" size="small" onClick={onLogout}>
            Logout Account
          </Button>
        ) : (
          <Box />
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onNavigateSettings && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                onClose();
                onNavigateSettings();
              }}
            >
              Account Settings
            </Button>
          )}
          <Button variant="contained" size="small" onClick={onClose} sx={{ fontWeight: 700 }}>
            Done
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
