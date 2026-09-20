import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

export const DashboardPage: React.FC = () => {
  const stats = [
    { title: 'Total Leads', value: '16,420', change: '+12% this month', icon: <PeopleIcon color="primary" /> },
    { title: 'Active Pipeline Deals', value: '248', change: '$1.4M estimated value', icon: <TrendingUpIcon color="secondary" /> },
    { title: 'Follow-ups Due Today', value: '18', change: '4 high priority', icon: <ScheduleIcon color="warning" /> },
    { title: 'Conversions This Month', value: '42', change: '+8% vs last month', icon: <CheckCircleIcon color="success" /> },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Workspace Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, Alex. Here is your team's outreach and lead pipeline summary.
          </Typography>
        </Box>
        <Chip label="Tenant: Apex Digital" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
      </Box>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {stat.title}
                  </Typography>
                  <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 2 }}>
                    {stat.icon}
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.change}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
