import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface FollowupCalendarViewProps {
  events: any[];
  onSelectDate: (dateStr: string) => void;
  onCompleteEvent: (id: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const FollowupCalendarView: React.FC<FollowupCalendarViewProps> = ({
  events,
  onSelectDate,
  onCompleteEvent,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Map events to date strings YYYY-MM-DD
  const eventsByDate = new Map<string, any[]>();
  events.forEach((ev) => {
    const dStr = new Date(ev.due_at).toISOString().split('T')[0];
    if (!eventsByDate.has(dStr)) eventsByDate.set(dStr, []);
    eventsByDate.get(dStr)?.push(ev);
  });

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const getPriorityColor = (priority: string = 'medium') => {
    if (priority === 'urgent') return 'error';
    if (priority === 'high') return 'warning';
    if (priority === 'medium') return 'info';
    return 'default';
  };

  return (
    <Box>
      {/* Calendar Header Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {monthName}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handlePrevMonth} size="small">
            <PrevIcon />
          </IconButton>
          <Button size="small" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <IconButton onClick={handleNextMonth} size="small">
            <NextIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Weekday Header */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {WEEKDAYS.map((wd) => (
          <Grid item xs={12 / 7} key={wd} sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              {wd}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar Grid Days */}
      <Grid container spacing={1}>
        {calendarDays.map((dayNum, idx) => {
          if (dayNum === null) {
            return (
              <Grid item xs={12 / 7} key={`empty-${idx}`}>
                <Paper variant="outlined" sx={{ height: 110, bgcolor: 'action.hover', opacity: 0.4 }} />
              </Grid>
            );
          }

          const monthStr = String(month + 1).padStart(2, '0');
          const dayStr = String(dayNum).padStart(2, '0');
          const dateIsoStr = `${year}-${monthStr}-${dayStr}`;
          const dayEvents = eventsByDate.get(dateIsoStr) || [];
          const isToday = new Date().toISOString().split('T')[0] === dateIsoStr;

          return (
            <Grid item xs={12 / 7} key={dateIsoStr}>
              <Paper
                variant="outlined"
                onClick={() => onSelectDate(dateIsoStr)}
                sx={{
                  height: 110,
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  borderRadius: 2,
                  borderColor: isToday ? 'primary.main' : 'divider',
                  bgcolor: isToday ? 'action.selected' : 'background.paper',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 1,
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? 'primary.main' : 'text.primary',
                    }}
                  >
                    {dayNum}
                  </Typography>
                  <Tooltip title="Add Task">
                    <AddIcon fontSize="inherit" color="action" />
                  </Tooltip>
                </Box>

                <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {dayEvents.map((ev) => {
                    const isOverdue = new Date(ev.due_at) < new Date() && ev.status !== 'completed';

                    return (
                      <Chip
                        key={ev.id}
                        label={ev.title}
                        size="small"
                        color={isOverdue ? 'error' : getPriorityColor(ev.priority)}
                        variant={ev.status === 'completed' ? 'outlined' : 'filled'}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (ev.status !== 'completed') onCompleteEvent(ev.id);
                        }}
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          textDecoration: ev.status === 'completed' ? 'line-through' : 'none',
                        }}
                      />
                    );
                  })}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
