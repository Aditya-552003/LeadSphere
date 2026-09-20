import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  Snooze as SnoozeIcon,
  CalendarMonth as CalendarIcon,
  PriorityHigh as PriorityIcon,
  Public as TimezoneIcon,
} from '@mui/icons-material';
import { ScheduleFollowupDialog } from '../components/ScheduleFollowupDialog';
import { FollowupCalendarView } from '../components/FollowupCalendarView';

interface FollowupItem {
  id: string;
  title: string;
  notes?: string;
  due_at: string;
  timezone: string;
  priority: string;
  status: string;
  recurrence: string;
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name?: string;
  };
}

export const FollowupsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming' | 'completed' | 'calendar'>('today');
  const [followups, setFollowups] = useState<FollowupItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [counts, setCounts] = useState({
    overdue: 0,
    today: 0,
    upcoming: 0,
    completed: 0,
  });

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'calendar') {
        const calRes = await fetch('/api/v1/followups/calendar', { headers });
        const calData = await calRes.json();
        setCalendarEvents(calData.data || []);
      } else {
        const listRes = await fetch(`/api/v1/followups?filterType=${activeTab}`, { headers });
        const listData = await listRes.json();
        setFollowups(listData.data || []);
      }

      // Fetch summary stats across all tabs
      const [overdueRes, todayRes, upcomingRes, completedRes] = await Promise.all([
        fetch('/api/v1/followups?filterType=overdue', { headers }),
        fetch('/api/v1/followups?filterType=today', { headers }),
        fetch('/api/v1/followups?filterType=upcoming', { headers }),
        fetch('/api/v1/followups?filterType=completed', { headers }),
      ]);

      const overdueData = await overdueRes.json();
      const todayData = await todayRes.json();
      const upcomingData = await upcomingRes.json();
      const completedData = await completedRes.json();

      setCounts({
        overdue: (overdueData.data || []).length,
        today: (todayData.data || []).length,
        upcoming: (upcomingData.data || []).length,
        completed: (completedData.data || []).length,
      });
    } catch (err) {
      console.error('Failed to fetch followups data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/followups/${id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to mark followup completed:', err);
    }
  };

  const handleSnooze = async (id: string, hours = 24) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/followups/${id}/snooze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ snoozeHours: hours }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to snooze followup:', err);
    }
  };

  const getPriorityChip = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Chip label="Urgent" size="small" color="error" sx={{ fontWeight: 700 }} />;
      case 'high':
        return <Chip label="High" size="small" color="warning" sx={{ fontWeight: 700 }} />;
      case 'medium':
        return <Chip label="Medium" size="small" color="info" sx={{ fontWeight: 600 }} />;
      default:
        return <Chip label="Low" size="small" variant="outlined" sx={{ fontWeight: 600 }} />;
    }
  };

  return (
    <Box>
      {/* Header & Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TimeIcon color="primary" fontSize="large" /> Follow-ups & Tasks
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage scheduled follow-ups, timezone localization, task snooze, and automated recurring reminders.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedDate(null);
            setIsDialogOpen(true);
          }}
          sx={{ py: 1 }}
        >
          Schedule Follow-up
        </Button>
      </Box>

      {/* Metric Cards Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Paper
            variant="outlined"
            onClick={() => setActiveTab('overdue')}
            sx={{
              p: 2,
              borderRadius: 2,
              borderColor: counts.overdue > 0 ? 'error.main' : 'divider',
              cursor: 'pointer',
              bgcolor: activeTab === 'overdue' ? 'action.selected' : 'background.paper',
            }}
          >
            <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
              OVERDUE TASKS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main', mt: 0.5 }}>
              {counts.overdue}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Paper
            variant="outlined"
            onClick={() => setActiveTab('today')}
            sx={{
              p: 2,
              borderRadius: 2,
              cursor: 'pointer',
              bgcolor: activeTab === 'today' ? 'action.selected' : 'background.paper',
            }}
          >
            <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700 }}>
              DUE TODAY
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main', mt: 0.5 }}>
              {counts.today}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Paper
            variant="outlined"
            onClick={() => setActiveTab('upcoming')}
            sx={{
              p: 2,
              borderRadius: 2,
              cursor: 'pointer',
              bgcolor: activeTab === 'upcoming' ? 'action.selected' : 'background.paper',
            }}
          >
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
              UPCOMING
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.5 }}>
              {counts.upcoming}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Paper
            variant="outlined"
            onClick={() => setActiveTab('completed')}
            sx={{
              p: 2,
              borderRadius: 2,
              cursor: 'pointer',
              bgcolor: activeTab === 'completed' ? 'action.selected' : 'background.paper',
            }}
          >
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
              COMPLETED
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mt: 0.5 }}>
              {counts.completed}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
        >
          <Tab label={`Due Today (${counts.today})`} value="today" />
          <Tab label={`Overdue (${counts.overdue})`} value="overdue" sx={{ color: counts.overdue > 0 ? 'error.main' : 'inherit' }} />
          <Tab label={`Upcoming (${counts.upcoming})`} value="upcoming" />
          <Tab label={`Completed (${counts.completed})`} value="completed" />
          <Tab label="Calendar Grid View" value="calendar" icon={<CalendarIcon fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content Display */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : activeTab === 'calendar' ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <FollowupCalendarView
            events={calendarEvents}
            onSelectDate={(dStr) => {
              setSelectedDate(dStr);
              setIsDialogOpen(true);
            }}
            onCompleteEvent={handleMarkCompleted}
          />
        </Paper>
      ) : followups.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary">
            No follow-up tasks found for this view.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {followups.map((item) => {
            const dueObj = new Date(item.due_at);
            const isOverdue = dueObj < new Date() && item.status !== 'completed';

            return (
              <Card
                key={item.id}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderColor: isOverdue ? 'error.main' : 'divider',
                  bgcolor: isOverdue ? 'error.lighter' : 'background.paper',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        {getPriorityChip(item.priority)}
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', textDecoration: item.status === 'completed' ? 'line-through' : 'none' }}>
                          {item.title}
                        </Typography>
                        {item.recurrence !== 'none' && (
                          <Chip label={`Repeats ${item.recurrence}`} size="small" variant="outlined" color="primary" />
                        )}
                      </Box>

                      {item.lead && (
                        <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Lead: {item.lead.first_name} {item.lead.last_name} {item.lead.company_name ? `• ${item.lead.company_name}` : ''}
                        </Typography>
                      )}

                      {item.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {item.notes}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary', fontSize: '0.82rem', mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon fontSize="small" color={isOverdue ? 'error' : 'action'} />
                          <Typography variant="caption" sx={{ fontWeight: isOverdue ? 700 : 400, color: isOverdue ? 'error.main' : 'text.secondary' }}>
                            Due: {dueObj.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimezoneIcon fontSize="small" color="action" />
                          <Typography variant="caption">Timezone: {item.timezone}</Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Actions */}
                    {item.status !== 'completed' && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<SnoozeIcon />}
                          onClick={() => handleSnooze(item.id, 24)}
                        >
                          Snooze 1d
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleMarkCompleted(item.id)}
                        >
                          Complete
                        </Button>
                      </Stack>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Schedule Followup Dialog */}
      <ScheduleFollowupDialog
        open={isDialogOpen}
        initialDate={selectedDate}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedDate(null);
        }}
        onSaved={fetchData}
      />
    </Box>
  );
};
