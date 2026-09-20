import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Group as TeamIcon,
  ViewKanban as KanbanIcon,
  Assignment as TaskIcon,
  Send as CampaignIcon,
  Inbox as InboxIcon,
  Psychology as AiIcon,
  BarChart as AnalyticsIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  AdminPanelSettings as SuperAdminIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Business as BusinessIcon,
  CreditCard as CreditCardIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { UserProfileDialog } from '../components/UserProfileDialog';

const DRAWER_WIDTH = 260;

const NAV_ITEMS = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Leads', icon: <PeopleIcon />, path: '/leads' },
  { text: 'Team Members', icon: <TeamIcon />, path: '/team' },
  { text: 'Pipeline', icon: <KanbanIcon />, path: '/pipeline' },
  { text: 'Follow-ups', icon: <TaskIcon />, path: '/followups' },
  { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' },
  { text: 'Unified Inbox', icon: <InboxIcon />, path: '/inbox' },
  { text: 'AI Assistant', icon: <AiIcon />, path: '/ai' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Document Vault', icon: <FolderIcon />, path: '/documents' },
  { text: 'Data Pipelines', icon: <FolderIcon />, path: '/data-pipelines' },
  { text: 'Security Audit', icon: <ShieldIcon />, path: '/audit' },
  { text: 'Super Admin', icon: <SuperAdminIcon />, path: '/super-admin' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const SUPER_ADMIN_NAV = [
  { text: 'Platform Overview', icon: <SuperAdminIcon />, path: '/super-admin?tab=overview' },
  { text: 'Company Tenants', icon: <BusinessIcon />, path: '/super-admin?tab=tenants' },
  { text: 'Plans & Subscriptions', icon: <CreditCardIcon />, path: '/super-admin?tab=plans' },
  { text: 'System Health & Storage', icon: <SpeedIcon />, path: '/super-admin?tab=health' },
  { text: 'Global Security Audit', icon: <ShieldIcon />, path: '/super-admin?tab=audit' },
  { text: 'System Configuration', icon: <SettingsIcon />, path: '/super-admin?tab=settings' },
];

export const WorkspaceLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userObj = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
  const tenantObj = localStorage.getItem('tenant') ? JSON.parse(localStorage.getItem('tenant')!) : null;

  const userName = userObj?.name || 'Alex Vance';
  const userAvatar = userObj?.avatar || null;
  const userInitial = userName.trim()[0]?.toUpperCase() || 'A';
  const userRole = userObj?.role || 'Company Admin';
  const tenantName = tenantObj?.name || 'Apex Digital';

  useEffect(() => {
    if (userRole === 'Super Admin' && (location.pathname === '/dashboard' || location.pathname === '/')) {
      navigate('/super-admin?tab=overview', { replace: true });
    }
  }, [userRole, location.pathname, navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        onClick={() => navigate('/')}
        sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
      >
        <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontWeight: 700 }}>
          LS
        </Avatar>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
          LeadSphere
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, py: 1.5, flexGrow: 1 }}>
        {(() => {
          if (userRole === 'Super Admin') {
            const currentTab = new URLSearchParams(location.search).get('tab') || 'overview';
            return SUPER_ADMIN_NAV.map((item) => {
              const active = location.pathname.startsWith('/super-admin') && item.path.includes(`tab=${currentTab}`);
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={active}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                        '&:hover': { bgcolor: 'primary.dark' },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: active ? 'inherit' : 'text.secondary' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 600 : 400 }} />
                  </ListItemButton>
                </ListItem>
              );
            });
          }

          const normalizedRole = userRole.toLowerCase();
          const filteredNav = NAV_ITEMS.filter((item) => {
            if (item.path === '/super-admin') {
              return false;
            }
            if (normalizedRole.includes('member')) {
              return !['/audit', '/settings'].includes(item.path);
            }
            if (normalizedRole.includes('visitor')) {
              return ['/dashboard', '/leads', '/team', '/analytics', '/documents'].includes(item.path);
            }
            return true;
          });

          return filteredNav.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={active}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: active ? 'inherit' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 600 : 400 }} />
                </ListItemButton>
              </ListItem>
            );
          });
        })()}
      </List>
      <Divider />
      <Box
        onClick={() => setProfileOpen(true)}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          borderRadius: 2,
          transition: 'all 0.2s ease',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Avatar src={userAvatar || undefined} sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontWeight: 700 }}>
          {userInitial}
        </Avatar>
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
            {userName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
            <Typography variant="caption" color="text.secondary" noWrap>
              {userRole === 'Super Admin' ? 'Platform Owner' : tenantName}
            </Typography>
            <Chip
              label={userRole}
              size="small"
              color={userRole === 'Super Admin' ? 'secondary' : 'primary'}
              sx={{ height: 16, fontSize: '0.62rem', fontWeight: 700 }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Notifications">
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <IconButton onClick={handleMenuOpen} size="small">
            <Avatar src={userAvatar || undefined} sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontWeight: 700 }}>
              {userInitial}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem
              onClick={() => {
                handleMenuClose();
                setProfileOpen(true);
              }}
            >
              <ListItemIcon><AccountCircleIcon fontSize="small" color="primary" /></ListItemIcon>
              View User Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid', borderColor: 'divider' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>

      <UserProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onNavigateSettings={() => navigate('/settings')}
        onLogout={handleLogout}
      />
    </Box>
  );
};
