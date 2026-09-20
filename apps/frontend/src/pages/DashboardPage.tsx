import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

interface LeadRecord {
  id: string;
  status?: string;
  estimated_value?: number;
}

export const DashboardPage: React.FC = () => {
  const [leadsCount, setLeadsCount] = useState<number>(0);
  const [activeDealsCount, setActiveDealsCount] = useState<number>(0);
  const [totalDealValue, setTotalDealValue] = useState<number>(0);
  const [tenantName, setTenantName] = useState<string>('Workspace');
  const [userName, setUserName] = useState<string>('User');

  useEffect(() => {
    // Load current tenant & user context
    try {
      const storedTenant = localStorage.getItem('tenant');
      if (storedTenant) {
        const parsed = JSON.parse(storedTenant);
        if (parsed.name) setTenantName(parsed.name);
      }
      const storedUser = localStorage.getItem('user') || localStorage.getItem('user_profile');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.name || parsedUser.first_name) {
          setUserName(parsedUser.name || `${parsedUser.first_name || ''} ${parsedUser.last_name || ''}`.trim());
        }
      }
    } catch (e) {}

    // Load dynamic lead statistics
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    let tId = 'default';
    try {
      const storedTenant = localStorage.getItem('tenant');
      if (storedTenant) {
        const parsed = JSON.parse(storedTenant);
        tId = parsed.id || parsed.slug || 'default';
      }
    } catch (e) {}

    const key = `leads_${tId}`;
    let localLeads: LeadRecord[] = [];
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        localLeads = JSON.parse(stored);
      } catch (e) {}
    }

    // Try fetching from backend if token present
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token) {
        const res = await fetch('/api/v1/leads?limit=500', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          localLeads = data.data;
        }
      }
    } catch (err) {}

    setLeadsCount(localLeads.length);
    const activeDeals = localLeads.filter(
      (l) => !['Closed', 'Lost', 'Archived'].includes(l.status || '')
    );
    setActiveDealsCount(activeDeals.length);

    const valSum = localLeads.reduce(
      (sum, l) => sum + (Number(l.estimated_value) || 0),
      0
    );
    setTotalDealValue(valSum);
  };

  const formatCurrency = (val: number) => {
    if (val === 0) return '$0 estimated value';
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M estimated value`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k estimated value`;
    return `$${val.toLocaleString()} estimated value`;
  };

  const stats = [
    {
      title: 'Total Leads',
      value: leadsCount.toLocaleString(),
      change: leadsCount === 0 ? 'No leads recorded' : `${leadsCount} total active records`,
      icon: <PeopleIcon color="primary" />,
    },
    {
      title: 'Active Pipeline Deals',
      value: activeDealsCount.toLocaleString(),
      change: formatCurrency(totalDealValue),
      icon: <TrendingUpIcon color="secondary" />,
    },
    {
      title: 'Follow-ups Due Today',
      value: '0',
      change: '0 high priority',
      icon: <ScheduleIcon color="warning" />,
    },
    {
      title: 'Conversions This Month',
      value: '0',
      change: '0% conversion rate',
      icon: <CheckCircleIcon color="success" />,
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Workspace Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {userName}. Here is your team's outreach and lead pipeline summary.
          </Typography>
        </Box>
        <Chip label={`Tenant: ${tenantName}`} color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
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
