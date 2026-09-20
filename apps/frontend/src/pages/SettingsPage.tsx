import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Avatar,
  Snackbar,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Psychology as AiIcon,
  Cloud as CloudIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Schedule as UpcomingIcon,
  VpnKey as KeyIcon,
} from '@mui/icons-material';

export const SettingsPage: React.FC = () => {
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);

  const integrations = [
    {
      id: 'whatsapp',
      name: 'Meta WhatsApp Business Cloud API',
      description: 'Send direct template messages and 24-hr customer service window replies.',
      icon: <WhatsAppIcon sx={{ color: '#25D366', fontSize: 32 }} />,
      status: 'Upcoming',
      statusColor: 'warning' as const,
      envKeys: ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_VERIFY_TOKEN'],
      configured: false,
    },
    {
      id: 'email',
      name: 'Email Service Provider (SMTP / SES / Graph)',
      description: 'Multi-provider outbound campaign dispatcher and template merge tags.',
      icon: <EmailIcon sx={{ color: '#1976d2', fontSize: 32 }} />,
      status: 'Upcoming',
      statusColor: 'warning' as const,
      envKeys: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'],
      configured: false,
    },
    {
      id: 'gemini',
      name: 'Google Gemini AI Intelligence Engine',
      description: 'AI Lead Summaries, Tone-aware Email Drafter, and Reply Sentiment Classifier.',
      icon: <AiIcon sx={{ color: '#9c27b0', fontSize: 32 }} />,
      status: 'Active',
      statusColor: 'success' as const,
      envKeys: ['GEMINI_API_KEY', 'GEMINI_MODEL'],
      configured: true,
    },
    {
      id: 'cloudinary',
      name: 'Cloudinary Vault & Media Storage',
      description: 'Secure document repository, presigned upload URLs, and malware quarantine scanning.',
      icon: <CloudIcon sx={{ color: '#00bcd4', fontSize: 32 }} />,
      status: 'Active',
      statusColor: 'success' as const,
      envKeys: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
      configured: true,
    },
  ];

  return (
    <Box sx={{ p: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, tracking: -0.5 }}>
          Workspace & Integration Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure API credentials, channel integrations, security policies, and workspace preferences.
        </Typography>
      </Box>

      {/* Integration Status Notice */}
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <strong>Integrations Status:</strong> Google Gemini AI & Cloudinary Vault are <strong>Active</strong>. Meta WhatsApp Cloud API & Email Providers are marked as <strong>Upcoming</strong> for live API key configuration.
      </Alert>

      {/* Integration Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {integrations.map((item) => (
          <Grid item xs={12} md={6} key={item.id}>
            <Card variant="outlined" sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {item.icon}
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Provider ID: {item.id}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    icon={item.status === 'Active' ? <CheckIcon fontSize="small" /> : <UpcomingIcon fontSize="small" />}
                    label={item.status}
                    color={item.statusColor}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {item.description}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 1 }}>
                  REQUIRED ENVIRONMENT KEYS:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {item.envKeys.map((key) => (
                    <Chip key={key} label={key} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
                  ))}
                </Box>
              </CardContent>

              <Box sx={{ p: 2, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {item.status === 'Upcoming' ? 'Production API Keys Required' : 'Connected & Active'}
                </Typography>
                <Button
                  size="small"
                  variant={item.status === 'Upcoming' ? 'outlined' : 'contained'}
                  color={item.status === 'Upcoming' ? 'warning' : 'primary'}
                  startIcon={<KeyIcon />}
                  onClick={() => setSnackbarMsg(`Integration settings for ${item.name} opened. Update keys in apps/backend/.env.`)}
                >
                  {item.status === 'Upcoming' ? 'Configure Upcoming' : 'Manage Keys'}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Security & System Info */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          Security & Tenant Isolation Safeguards
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          LeadSphere strictly isolates data per tenant using PostgreSQL 16 Row-Level Security (RLS). All credentials, API tokens, and JWT secrets stored in environment variables are encrypted at rest.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>JWT EXPIRATION</Typography>
            <Typography variant="subtitle2" fontWeight={700}>15 Minutes (Access) / 7 Days (Refresh)</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>DATABASE RLS POLICY</Typography>
            <Typography variant="subtitle2" fontWeight={700} color="success.main">ACTIVE (PostgreSQL 16)</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>MFA ENFORCEMENT</Typography>
            <Typography variant="subtitle2" fontWeight={700}>TOTP Supported</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={Boolean(snackbarMsg)}
        autoHideDuration={4000}
        onClose={() => setSnackbarMsg(null)}
        message={snackbarMsg}
      />
    </Box>
  );
};
