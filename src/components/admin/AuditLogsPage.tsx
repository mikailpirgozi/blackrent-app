import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Collapse,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { apiService } from '../../services/api';

interface AuditLog {
  id: string;
  userId?: string;
  username?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
  createdAt: Date;
}

interface AuditStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ username: string; count: number }>;
}

interface FilterState {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  action: string;
  username: string;
  resourceType: string;
  success: string;
}

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalRows, setTotalRows] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    startDate: dayjs().subtract(7, 'days'),
    endDate: dayjs(),
    action: '',
    username: '',
    resourceType: '',
    success: ''
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.action) params.append('action', filters.action);
      if (filters.username) params.append('username', filters.username);
      if (filters.resourceType) params.append('resourceType', filters.resourceType);
      if (filters.success) params.append('success', filters.success);
      params.append('page', (page + 1).toString());
      params.append('limit', rowsPerPage.toString());

      const response = await apiService.getAuditLogs(params.toString());
      
      setLogs(response.logs || []);
      setTotalRows(response.total || 0);
    } catch (err: any) {
      setError(`Chyba pri načítavaní audit logov: ${err.message}`);
      console.error('Audit logs error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, rowsPerPage]);

  const fetchStats = useCallback(async () => {
    try {
      const days = filters.endDate && filters.startDate 
        ? filters.endDate.diff(filters.startDate, 'days') 
        : 7;
      const response = await apiService.getAuditStats(Math.max(days, 1));
      setStats(response);
    } catch (err: any) {
      console.error('Stats error:', err);
    }
  }, [filters]);

  const fetchAvailableActions = async () => {
    try {
      const actions = await apiService.getAuditActions();
      console.log('📊 Available actions from backend:', actions);
      // Ensure actions is an array
      if (Array.isArray(actions)) {
        setAvailableActions(actions);
      } else {
        console.warn('⚠️ Actions is not an array:', actions);
        setAvailableActions([]);
      }
    } catch (err: any) {
      console.error('Actions error:', err);
      setAvailableActions([]);
    }
  };

  useEffect(() => {
    fetchAvailableActions();
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0); // Reset to first page when filtering
  };

  const handleExpandRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getActionColor = (action: string): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' => {
    if (action.includes('delete')) return 'error';
    if (action.includes('create')) return 'success';
    if (action.includes('update') || action.includes('edit')) return 'warning';
    if (action.includes('login')) return 'info';
    if (action.includes('approved')) return 'success';
    if (action.includes('rejected')) return 'error';
    return 'primary';
  };

  const formatDate = (date: Date) => {
    return dayjs(date).format('DD.MM.YYYY HH:mm:ss');
  };

  const handleExport = async () => {
    try {
      // Export audit logs - implementovať neskôr
      console.log('Export audit logs');
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            📊 Audit Logs
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Zobraziť/skryť filtre">
              <IconButton onClick={() => setShowFilters(!showFilters)} color="primary">
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Obnoviť">
              <IconButton onClick={() => { fetchLogs(); fetchStats(); }} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Exportovať">
              <IconButton onClick={handleExport} color="primary">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Celkové operácie
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalOperations.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Úspešné
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {stats.successfulOperations.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Chybné
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    {stats.failedOperations.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Úspešnosť
                  </Typography>
                  <Typography variant="h5" color="info.main">
                    {stats.totalOperations > 0 
                      ? Math.round((stats.successfulOperations / stats.totalOperations) * 100)
                      : 0}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Collapse in={showFilters}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Od dátumu"
                    value={filters.startDate}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Do dátumu"
                    value={filters.endDate}
                    onChange={(date) => handleFilterChange('endDate', date)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Akcia</InputLabel>
                    <Select
                      value={filters.action}
                      onChange={(e) => handleFilterChange('action', e.target.value)}
                      label="Akcia"
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      {Array.isArray(availableActions) && availableActions.map(action => (
                        <MenuItem key={action} value={action}>{action}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Používateľ"
                    value={filters.username}
                    onChange={(e) => handleFilterChange('username', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Typ zdroja</InputLabel>
                    <Select
                      value={filters.resourceType}
                      onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                      label="Typ zdroja"
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      <MenuItem value="rental">Prenájom</MenuItem>
                      <MenuItem value="vehicle">Vozidlo</MenuItem>
                      <MenuItem value="customer">Zákazník</MenuItem>
                      <MenuItem value="user">Používateľ</MenuItem>
                      <MenuItem value="email">Email</MenuItem>
                      <MenuItem value="system">Systém</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Stav</InputLabel>
                    <Select
                      value={filters.success}
                      onChange={(e) => handleFilterChange('success', e.target.value)}
                      label="Stav"
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      <MenuItem value="true">Úspešné</MenuItem>
                      <MenuItem value="false">Chybné</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Main Table */}
        <Card>
          <CardHeader
            title="Audit Logs"
            subheader={`Zobrazuje sa ${logs.length} z ${totalRows.toLocaleString()} záznamov`}
          />
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Dátum</TableCell>
                        <TableCell>Používateľ</TableCell>
                        <TableCell>Akcia</TableCell>
                        <TableCell>Zdroj</TableCell>
                        <TableCell>Stav</TableCell>
                        <TableCell>IP adresa</TableCell>
                        <TableCell>Detail</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.map((log) => (
                        <React.Fragment key={log.id}>
                          <TableRow hover>
                            <TableCell>
                              {formatDate(log.createdAt)}
                            </TableCell>
                            <TableCell>
                              {log.username || 'Systém'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={log.action}
                                color={getActionColor(log.action)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {log.resourceType}
                              {log.resourceId && (
                                <Typography variant="caption" display="block" color="textSecondary">
                                  {log.resourceId.substring(0, 8)}...
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={log.success !== false ? 'Úspech' : 'Chyba'}
                                color={log.success !== false ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {log.ipAddress || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleExpandRow(log.id)}
                              >
                                {expandedRows.has(log.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                              <Collapse in={expandedRows.has(log.id)} timeout="auto" unmountOnExit>
                                <Box sx={{ margin: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                  {log.errorMessage && (
                                    <Typography color="error" gutterBottom>
                                      <strong>Chyba:</strong> {log.errorMessage}
                                    </Typography>
                                  )}
                                  {log.details && (
                                    <Box sx={{ mb: 1 }}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        Detaily:
                                      </Typography>
                                      <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                        {JSON.stringify(log.details, null, 2)}
                                      </pre>
                                    </Box>
                                  )}
                                  {log.metadata && (
                                    <Box sx={{ mb: 1 }}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        Metadata:
                                      </Typography>
                                      <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                        {JSON.stringify(log.metadata, null, 2)}
                                      </pre>
                                    </Box>
                                  )}
                                  {log.userAgent && (
                                    <Typography variant="caption" color="textSecondary">
                                      <strong>User Agent:</strong> {log.userAgent}
                                    </Typography>
                                  )}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  component="div"
                  count={totalRows}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Riadkov na stránku:"
                  labelDisplayedRows={({ from, to, count }) => 
                    `${from}–${to} z ${count !== -1 ? count : `viac ako ${to}`}`
                  }
                />
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default AuditLogsPage;