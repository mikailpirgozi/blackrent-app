/**
 * 📊 CACHE MONITORING
 * 
 * Admin dashboard pre sledovanie cache performance
 */

import React, { useState, useEffect, memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Stack,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { cacheDebug, apiCache } from '../../utils/apiCache';

interface CacheStatsDisplay {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  memoryUsage: string;
  oldestEntry: string;
  newestEntry: string;
  topHits: Array<{ key: string; hits: number }>;
}

const CacheMonitoring: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<CacheStatsDisplay | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Frontend cache stats
      const frontendStats = cacheDebug.getStats();
      
      // Backend cache stats (if available)
      let backendStats = null;
      try {
        const response = await fetch('/api/cache/stats');
        if (response.ok) {
          const data = await response.json();
          backendStats = data.data;
        }
      } catch (error) {
        console.warn('Backend cache stats not available:', error);
      }

      setStats(frontendStats);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleClearCache = () => {
    cacheDebug.clear();
    loadStats();
  };

  const formatHitRate = (rate: number) => {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'warning';
    return 'error';
  };

  const formatMemoryUsage = (usage: string) => {
    const match = usage.match(/(\d+(?:\.\d+)?)/);
    const value = match ? parseFloat(match[1]) : 0;
    
    if (value > 1000) return 'warning';
    if (value > 2000) return 'error';
    return 'success';
  };

  if (!stats) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Načítavam cache štatistiky...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <MemoryIcon color="primary" />
          Cache Monitoring
        </Typography>
        
        <Stack direction="row" spacing={1}>
          <Button
            variant={autoRefresh ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Tooltip title="Obnoviť štatistiky">
            <IconButton onClick={loadStats} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Vymazať cache">
            <IconButton onClick={handleClearCache} color="error">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Last Refresh Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Posledná aktualizácia: {lastRefresh.toLocaleString()}
          {autoRefresh && ' • Auto-refresh je zapnutý (30s interval)'}
        </Typography>
      </Alert>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <StorageIcon color="primary" />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Cache Entries
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.size}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <SpeedIcon color="primary" />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Hit Rate
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats.hitRate.toFixed(1)}%
                    </Typography>
                    <Chip 
                      size="small" 
                      color={formatHitRate(stats.hitRate)} 
                      label={stats.hitRate >= 80 ? 'Excellent' : stats.hitRate >= 60 ? 'Good' : 'Poor'} 
                    />
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TrendingUpIcon color="primary" />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Requests
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.totalRequests}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats.hits} hits • {stats.misses} misses
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <MemoryIcon color="primary" />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Memory Usage
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats.memoryUsage}
                    </Typography>
                    <Chip 
                      size="small" 
                      color={formatMemoryUsage(stats.memoryUsage)} 
                    />
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Hit Rate Progress */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon />
            Cache Performance
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2">Hit Rate</Typography>
              <Typography variant="body2">{stats.hitRate.toFixed(1)}%</Typography>
            </Stack>
            <LinearProgress 
              variant="determinate" 
              value={stats.hitRate} 
              color={formatHitRate(stats.hitRate)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Cache Hits
              </Typography>
              <Typography variant="h6" color="success.main">
                {stats.hits}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Cache Misses
              </Typography>
              <Typography variant="h6" color="error.main">
                {stats.misses}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Top Cache Entries */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Most Accessed Cache Entries
          </Typography>
          
          {stats.topHits && stats.topHits.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Cache Key</TableCell>
                    <TableCell align="right">Hits</TableCell>
                    <TableCell align="right">Hit Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.topHits.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {item.key.length > 50 ? `${item.key.substring(0, 50)}...` : item.key}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip size="small" label={item.hits} color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        {stats.totalRequests > 0 ? (
                          <Typography variant="body2">
                            {((item.hits / stats.totalRequests) * 100).toFixed(1)}%
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              Žiadne cache entries nenájdené. Cache je prázdny alebo ešte nebol použitý.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cache Age Info */}
      {stats.oldestEntry && stats.newestEntry && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Cache Timeline
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Oldest Entry
                </Typography>
                <Typography variant="body1">
                  {stats.oldestEntry}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Newest Entry
                </Typography>
                <Typography variant="body1">
                  {stats.newestEntry}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default memo(CacheMonitoring);