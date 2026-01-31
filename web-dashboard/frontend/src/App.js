import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { 
  AppBar, Toolbar, Typography, Box, Container, Grid, Card, CardContent,
  Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton,
  Badge, Chip, Avatar
} from '@mui/material';
import {
  Dashboard, SmartToy, AccountBalance, Groups, LocalPolice,
  Menu, Notifications, Security, TrendingUp, People
} from '@mui/icons-material';
import { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';

// Components
import AgentDashboard from './components/AgentDashboard';
import EconomyDashboard from './components/EconomyDashboard';
import FactionDashboard from './components/FactionDashboard';
import BountyBoard from './components/BountyBoard';
import LiveStats from './components/LiveStats';

// Theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff6b35',
    },
    secondary: {
      main: '#4ecdc4',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
  },
  typography: {
    fontFamily: '"Orbitron", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
  },
});

const DRAWER_WIDTH = 240;

function AppContent() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [liveData, setLiveData] = useState({
    agents: [],
    economy: null,
    factions: [],
    bounties: []
  });
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io('http://localhost:8000', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to ClawCraft WebSocket');
      // Subscribe to all updates
      newSocket.emit('subscribe_agents');
      newSocket.emit('subscribe_economy');
      newSocket.emit('subscribe_factions');
    });

    newSocket.on('agents_update', (data) => {
      setLiveData(prev => ({ ...prev, agents: data.agents }));
    });

    newSocket.on('economy_update', (data) => {
      setLiveData(prev => ({ ...prev, economy: data }));
    });

    newSocket.on('factions_update', (data) => {
      setLiveData(prev => ({ ...prev, factions: data.rankings }));
    });

    newSocket.on('bounty_claimed', (data) => {
      setNotifications(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'bounty_claimed',
          message: `${data.killer} claimed bounty on ${data.victim} for ${data.amount} CC`,
          timestamp: data.timestamp
        }
      ]);
    });

    newSocket.on('agent_created', (data) => {
      setNotifications(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'agent_created',
          message: `New AI agent "${data.name}" spawned${data.faction ? ` in ${data.faction}` : ''}`,
          timestamp: data.timestamp
        }
      ]);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/agents': return 'AI Agent Monitoring';
      case '/economy': return 'Economy & Claw Coins';
      case '/factions': return 'Faction Warfare';
      case '/bounties': return 'Bounty Board';
      default: return 'ClawCraft Dashboard';
    }
  };

  const menuItems = [
    { text: 'Overview', path: '/', icon: <Dashboard /> },
    { text: 'AI Agents', path: '/agents', icon: <SmartToy /> },
    { text: 'Economy', path: '/economy', icon: <AccountBalance /> },
    { text: 'Factions', path: '/factions', icon: <Groups /> },
    { text: 'Bounties', path: '/bounties', icon: <LocalPolice /> },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ color: 'primary.main' }}>
          ClawCraft
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={Link} 
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                opacity: 0.1,
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
        elevation={1}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <Menu />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getPageTitle()}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LiveStats data={liveData} />
            
            <Badge badgeContent={notifications.length} color="error">
              <IconButton color="inherit">
                <Notifications />
              </IconButton>
            </Badge>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
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
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />
        
        <Routes>
          <Route path="/" element={<DashboardOverview data={liveData} />} />
          <Route path="/agents" element={<AgentDashboard data={liveData} socket={socket} />} />
          <Route path="/economy" element={<EconomyDashboard data={liveData} socket={socket} />} />
          <Route path="/factions" element={<FactionDashboard data={liveData} socket={socket} />} />
          <Route path="/bounties" element={<BountyBoard data={liveData} socket={socket} />} />
        </Routes>
      </Box>
    </Box>
  );
}

function DashboardOverview({ data }) {
  const activeAgents = data.agents.filter(agent => agent.status === 'active').length;
  const totalAgents = data.agents.length;
  const totalSupply = data.economy?.total_supply || '0';
  const activeFactions = data.factions.length;

  return (
    <Container maxWidth="xl">
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <SmartToy />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    AI Agents
                  </Typography>
                  <Typography variant="h4">
                    {activeAgents}/{totalAgents}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <AccountBalance />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Claw Coins
                  </Typography>
                  <Typography variant="h4">
                    {parseFloat(totalSupply).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Groups />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Factions
                  </Typography>
                  <Typography variant="h4">
                    {activeFactions}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    24h Volume
                  </Typography>
                  <Typography variant="h4">
                    {parseFloat(data.economy?.volume_24h || '0').toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Agent Activity
              </Typography>
              <Box>
                {data.agents.slice(0, 5).map((agent, index) => (
                  <Box key={index} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                        <SmartToy fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{agent.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {agent.current_task} • {agent.faction || 'No faction'}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={agent.status} 
                      color={agent.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Faction Rankings */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Factions
              </Typography>
              <Box>
                {data.factions.slice(0, 5).map((faction, index) => (
                  <Box key={index} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                    <Box>
                      <Typography variant="subtitle2">{faction.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {faction.members} members • {faction.type}
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="primary">
                      {faction.power}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <Router>
        <AppContent />
        <Toaster position="top-right" />
      </Router>
    </ThemeProvider>
  );
}

export default App;