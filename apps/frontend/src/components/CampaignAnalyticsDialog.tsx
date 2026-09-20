import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  LinearProgress,
  Chip,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  Send as SentIcon,
  Drafts as OpenIcon,
  Reply as ReplyIcon,
  Group as MemberIcon,
} from '@mui/icons-material';

interface CampaignAnalyticsDialogProps {
  campaignId: string | null;
  open: boolean;
  onClose: () => void;
}

export const CampaignAnalyticsDialog: React.FC<CampaignAnalyticsDialogProps> = ({
  campaignId,
  open,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (open && campaignId) {
      fetchAnalytics();
    }
  }, [open, campaignId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/campaigns/${campaignId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setData(result.data || null);
    } catch (err) {
      console.error('Failed to load campaign analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Campaign Performance Telemetry
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : data ? (
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {data.name}
              </Typography>
              <Chip label={data.status.toUpperCase()} color="success" size="small" sx={{ fontWeight: 700 }} />
            </Box>

            {/* Funnel Metrics Grid */}
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                  <MemberIcon color="primary" fontSize="small" />
                  <Typography variant="caption" color="text.secondary" display="block">
                    ENROLLED
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {data.total_enrolled}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                  <SentIcon color="info" fontSize="small" />
                  <Typography variant="caption" color="text.secondary" display="block">
                    DELIVERED
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {data.delivered_count}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                  <OpenIcon color="warning" fontSize="small" />
                  <Typography variant="caption" color="text.secondary" display="block">
                    OPENED
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {data.opened_count}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                  <ReplyIcon color="success" fontSize="small" />
                  <Typography variant="caption" color="text.secondary" display="block">
                    REPLIED
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {data.replied_count}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider />

            {/* Rates Progress Bars */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Email Open Rate
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {data.open_rate_percent}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Number(data.open_rate_percent)}
                sx={{ height: 10, borderRadius: 5, mb: 2 }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Reply & Conversion Rate
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {data.reply_rate_percent}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Number(data.reply_rate_percent)}
                color="success"
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          </Stack>
        ) : (
          <Typography color="error">Failed to load analytics.</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
