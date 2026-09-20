import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  LinearProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import {
  BarChart as AnalyticsIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as RateIcon,
  Send as OutreachIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';

interface AnalyticsData {
  pipeline_summary: {
    total_leads: number;
    total_pipeline_value: number;
    conversion_rate_percent: string;
    outreach_messages_sent: number;
  };
  funnel: Array<{ stage: string; count: number; conversionPercent: number }>;
  channel_breakdown: {
    email: { count: number; open_rate: string };
    whatsapp: { count: number; open_rate: string };
  };
  leaderboard: Array<{ name: string; deals_closed: number; revenue: string }>;
}

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/analytics/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setData(result.data || null);
    } catch (err) {
      console.error('Failed to fetch executive analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Top Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AnalyticsIcon color="primary" fontSize="large" /> Executive Analytics & Funnel Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pre-aggregated analytics rollups for high-performance pipeline conversion tracking and sales leaderboards.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : data ? (
        <Stack spacing={4}>
          {/* Executive KPI Cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    PIPELINE VALUE
                  </Typography>
                  <MoneyIcon color="success" />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  ${Number(data.pipeline_summary.total_pipeline_value || 0).toLocaleString()}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    CONVERSION RATE
                  </Typography>
                  <RateIcon color="primary" />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {data.pipeline_summary.conversion_rate_percent}%
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    TOTAL LEADS
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {data.pipeline_summary.total_leads}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    OUTREACH SENT
                  </Typography>
                  <OutreachIcon color="info" />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {data.pipeline_summary.outreach_messages_sent}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Funnel & Channel Rows */}
          <Grid container spacing={3}>
            {/* Conversion Funnel */}
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Lead Conversion Funnel Breakdown
                </Typography>

                <Stack spacing={2.5}>
                  {data.funnel.map((item, idx) => (
                    <Box key={idx}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {item.stage} ({item.count})
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          {item.conversionPercent}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={item.conversionPercent}
                        color={idx === 4 ? 'success' : 'primary'}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            {/* Outreach Channel Breakdown */}
            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Outreach Channel Telemetry
                </Typography>

                <Stack spacing={3}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <EmailIcon color="primary" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Email Channel
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Total Sent: {data.channel_breakdown.email.count}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Avg Open: {data.channel_breakdown.email.open_rate}
                      </Typography>
                    </Box>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <WhatsAppIcon sx={{ color: '#25D366' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        WhatsApp Business API
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Total Sent: {data.channel_breakdown.whatsapp.count}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                        Avg Open: {data.channel_breakdown.whatsapp.open_rate}
                      </Typography>
                    </Box>
                  </Paper>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Sales Leaderboard Table */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrophyIcon color="warning" /> Top Performing Sales Representatives
            </Typography>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Team Member</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Deals Closed</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Revenue Generated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.leaderboard.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell>{row.deals_closed}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {row.revenue}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Stack>
      ) : (
        <Typography color="error">Failed to load executive analytics.</Typography>
      )}
    </Box>
  );
};
