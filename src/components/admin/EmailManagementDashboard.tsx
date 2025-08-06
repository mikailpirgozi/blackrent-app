import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Pagination,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Collapse,
  Divider,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  CheckCircle as TestIcon,
  Schedule as PendingIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  NotificationsNone as NotificationIcon,
  CheckCircle,
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { Rental } from '../../types';

interface EmailEntry {
  id: string;
  email_id: string;
  subject: string;
  sender: string;
  received_at: string;
  processed_at?: string;
  status: 'new' | 'processing' | 'processed' | 'rejected' | 'archived';
  action_taken?: string;
  confidence_score: number;
  error_message?: string;
  notes?: string;
  rental_id?: number;
  customer_name?: string;
  order_number?: string;
  processed_by_username?: string;
}

interface EmailStats {
  today: {
    total: number;
    processed: number;
    rejected: number;
    pending: number;
  };
  weeklyTrend: Array<{
    date: string;
    total: number;
    processed: number;
    rejected: number;
  }>;
  topSenders: Array<{
    sender: string;
    count: number;
    processed_count: number;
  }>;
}

interface EmailDetail {
  email: EmailEntry & {
    email_content?: string;
    email_html?: string;
    parsed_data?: any;
  };
  actions: Array<{
    id: string;
    action: string;
    username: string;
    notes?: string;
    created_at: string;
  }>;
}

interface ImapStatus {
  running: boolean;
  enabled: boolean;
  timestamp: string;
  config: {
    host: string;
    user: string;
    enabled: boolean;
  };
}

const EmailManagementDashboard: React.FC = () => {
  // Tabs state
  const [activeTab, setActiveTab] = useState(0);

  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // IMAP State
  const [imapStatus, setImapStatus] = useState<ImapStatus | null>(null);
  const [imapLoading, setImapLoading] = useState(false);
  
  // Filters and pagination
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [senderFilter, setSenderFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmails, setTotalEmails] = useState(0);
  const pageSize = 20;

  // Pending Rentals State
  const [pendingRentals, setPendingRentals] = useState<Rental[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [expandedRentals, setExpandedRentals] = useState<Set<string>>(new Set());

  // Dialogs
  const [viewDialog, setViewDialog] = useState<{ open: boolean; email: EmailDetail | null }>({
    open: false,
    email: null
  });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; emailId: string | null; isRental?: boolean }>({
    open: false,
    emailId: null,
    isRental: false
  });
  const [rejectReason, setRejectReason] = useState('');

  // Fetch emails with filters
  const fetchEmails = async () => {
    try {
      setLoading(true);
      
      // DEBUG: Check authentication
      console.log('🔍 EMAIL DASHBOARD DEBUG:');
      console.log('- Token:', localStorage.getItem('blackrent_token') ? 'EXISTS' : 'MISSING');
      console.log('- Session token:', sessionStorage.getItem('blackrent_token') ? 'EXISTS' : 'MISSING');
      console.log('- API Base URL:', 'http://localhost:3001/api');
      
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      });

      if (statusFilter) params.append('status', statusFilter);
      if (senderFilter) params.append('sender', senderFilter);

      console.log('🌐 About to call API:', `/email-management?${params}`);
      
      // TEMPORARY: Direct fetch bypass apiService
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch(`http://localhost:3001/api/email-management?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🚀 Direct fetch response:', directResponse.status, directResponse.statusText);
      const response = await directResponse.json();
      console.log('📦 Direct fetch data:', response);

      if (response.success) {
        setEmails(response.data.emails);
        setTotalEmails(response.data.pagination.total);
        setTotalPages(Math.ceil(response.data.pagination.total / pageSize));
      } else {
        setError('Chyba pri načítaní emailov');
      }
    } catch (err: any) {
      console.error('❌ EMAIL DASHBOARD - Fetch emails error:', err);
      console.error('❌ ERROR Details:', {
        message: err.message,
        status: err.status,
        stack: err.stack
      });
      setError(`Chyba pri načítaní emailov: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      console.log('📊 Fetching stats with direct fetch...');
      
      // TEMPORARY: Direct fetch bypass apiService
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch('http://localhost:3001/api/email-management/stats/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📊 Stats fetch response:', directResponse.status, directResponse.statusText);
      const response = await directResponse.json();
      console.log('📊 Stats data:', response);

      if (response.success) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Fetch stats error:', err);
    }
  };

  // View email detail
  const viewEmailDetail = async (emailId: string) => {
    try {
      console.log('🔍 Loading email detail for:', emailId);
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      
      const directResponse = await fetch(`http://localhost:3001/api/email-management/${emailId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const response = await directResponse.json();
      console.log('📧 Email detail response:', response);

      if (response.success && response.data) {
        setViewDialog({ open: true, email: response.data });
      } else {
        setError('Chyba pri načítaní detailu emailu');
      }
    } catch (err: any) {
      console.error('❌ View email error:', err);
      setError('Chyba pri načítaní detailu emailu');
    }
  };

  // Email actions
  const approveEmail = async (emailId: string) => {
    try {
      setActionLoading(emailId);
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      
      const directResponse = await fetch(`http://localhost:3001/api/email-management/${emailId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const response = await directResponse.json();

      if (response.success) {
        setSuccess('Email schválený!');
        await fetchEmails();
        await fetchStats();
      } else {
        setError(response.error || 'Chyba pri schvaľovaní emailu');
      }
    } catch (err: any) {
      console.error('Approve email error:', err);
      setError('Chyba pri schvaľovaní emailu');
    } finally {
      setActionLoading(null);
    }
  };

  const rejectItem = async () => {
    if (!rejectDialog.emailId) return;

    if (rejectDialog.isRental) {
      // Handle rental rejection
      await handleRejectRental(rejectDialog.emailId, rejectReason);
      setRejectDialog({ open: false, emailId: null, isRental: false });
      setRejectReason('');
    } else {
      // Handle email rejection
      try {
        setActionLoading(rejectDialog.emailId);
        const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
        
        const directResponse = await fetch(`http://localhost:3001/api/email-management/${rejectDialog.emailId}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason: rejectReason })
        });
        
        const response = await directResponse.json();

        if (response.success) {
          setSuccess('Email zamietnutý!');
          await fetchEmails();
          await fetchStats();
          setRejectDialog({ open: false, emailId: null, isRental: false });
          setRejectReason('');
        } else {
          setError(response.error || 'Chyba pri zamietaní emailu');
        }
      } catch (err: any) {
        console.error('Reject email error:', err);
        setError('Chyba pri zamietaní emailu');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const archiveEmail = async (emailId: string) => {
    try {
      setActionLoading(emailId);
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      
      const directResponse = await fetch(`http://localhost:3001/api/email-management/${emailId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const response = await directResponse.json();

      if (response.success) {
        setSuccess('Email archivovaný!');
        await fetchEmails();
        await fetchStats();
      } else {
        setError(response.error || 'Chyba pri archivovaní emailu');
      }
    } catch (err: any) {
      console.error('Archive email error:', err);
      setError('Chyba pri archivovaní emailu');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteEmail = async (emailId: string) => {
    if (!window.confirm('Naozaj chcete zmazať tento email? Táto akcia sa nedá vrátiť.')) {
      return;
    }

    try {
      setActionLoading(emailId);
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      
      const directResponse = await fetch(`http://localhost:3001/api/email-management/${emailId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const response = await directResponse.json();

      if (response.success) {
        setSuccess('Email zmazaný!');
        await fetchEmails();
        await fetchStats();
      } else {
        setError(response.error || 'Chyba pri mazaní emailu');
      }
    } catch (err: any) {
      console.error('Delete email error:', err);
      setError('Chyba pri mazaní emailu');
    } finally {
      setActionLoading(null);
    }
  };

  // IMAP API Functions
  const fetchImapStatus = async () => {
    try {
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch('http://localhost:3001/api/email-imap/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const response = await directResponse.json();
      console.log('📧 IMAP Status:', response);
      if (response.success && response.data) {
        setImapStatus(response.data);
      }
    } catch (err) {
      console.error('❌ IMAP Status error:', err);
    }
  };

  const testImapConnection = async () => {
    try {
      setImapLoading(true);
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch('http://localhost:3001/api/email-imap/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const response = await directResponse.json();
      console.log('🧪 IMAP Test result:', response);
      
      if (response.success && response.data && response.data.connected) {
        setSuccess('✅ IMAP pripojenie úspešné!');
      } else {
        setError('❌ IMAP pripojenie zlyhalo');
      }
    } catch (err) {
      console.error('❌ IMAP Test error:', err);
      setError('❌ Chyba pri teste IMAP pripojenia');
    } finally {
      setImapLoading(false);
    }
  };

  const startImapMonitoring = async () => {
    try {
      setImapLoading(true);
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch('http://localhost:3001/api/email-imap/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const response = await directResponse.json();
      console.log('▶️ IMAP Start result:', response);
      
      setSuccess('▶️ IMAP monitoring spustený!');
      await fetchImapStatus(); // Refresh status
    } catch (err) {
      console.error('❌ IMAP Start error:', err);
      setError('❌ Chyba pri spúšťaní IMAP monitoringu');
    } finally {
      setImapLoading(false);
    }
  };

  const stopImapMonitoring = async () => {
    try {
      setImapLoading(true);
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch('http://localhost:3001/api/email-imap/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const response = await directResponse.json();
      console.log('⏹️ IMAP Stop result:', response);
      
      setSuccess('⏹️ IMAP monitoring zastavený!');
      await fetchImapStatus(); // Refresh status
    } catch (err) {
      console.error('❌ IMAP Stop error:', err);
      setError('❌ Chyba pri zastavovaní IMAP monitoringu');
    } finally {
      setImapLoading(false);
    }
  };

  // ============================================
  // PENDING RENTALS FUNCTIONS
  // ============================================

  const fetchPendingRentals = async () => {
    try {
      setPendingLoading(true);
      setError(null);
      const rentals = await apiService.getPendingAutomaticRentals();
      console.log('✅ Loaded pending rentals:', rentals?.length || 0);
      setPendingRentals(rentals || []);
    } catch (err: any) {
      console.error('❌ Error fetching pending rentals:', err);
      setError('Nepodarilo sa načítať čakajúce prenájmy');
      setPendingRentals([]);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleApproveRental = async (rentalId: string) => {
    try {
      setActionLoading(rentalId);
      await apiService.approveAutomaticRental(rentalId);
      // Remove from pending list
      setPendingRentals(prev => prev.filter(r => r.id !== rentalId));
      setSuccess('Prenájom bol úspešne schválený');
    } catch (err: any) {
      console.error('Error approving rental:', err);
      setError('Nepodarilo sa schváliť prenájom');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRental = async (rentalId: string, reason: string) => {
    try {
      setActionLoading(rentalId);
      await apiService.rejectAutomaticRental(rentalId, reason);
      // Remove from pending list
      setPendingRentals(prev => prev.filter(r => r.id !== rentalId));
      setSuccess('Prenájom bol zamietnutý');
    } catch (err: any) {
      console.error('Error rejecting rental:', err);
      setError('Nepodarilo sa zamietnuť prenájom');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleRentalExpansion = (rentalId: string) => {
    setExpandedRentals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rentalId)) {
        newSet.delete(rentalId);
      } else {
        newSet.add(rentalId);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: 'EUR',
    }).format(numAmount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Initial load
  useEffect(() => {
    console.log('🚀 EMAIL DASHBOARD useEffect triggered', {
      currentPage,
      statusFilter, 
      senderFilter
    });
    
    fetchEmails();
    fetchStats();
    fetchImapStatus(); // Load IMAP status
    fetchPendingRentals(); // Load pending rentals
  }, [currentPage, statusFilter, senderFilter]);

  // Status chip styling
  const getStatusChip = (status: string, actionTaken?: string) => {
    const getColor = () => {
      if (status === 'processed' && actionTaken === 'approved') return 'success';
      if (status === 'rejected') return 'error';
      if (status === 'archived') return 'default';
      if (status === 'new') return 'warning';
      return 'info';
    };

    const getLabel = () => {
      if (status === 'processed' && actionTaken === 'approved') return 'Schválený';
      if (status === 'rejected') return 'Zamietnutý';
      if (status === 'archived') return 'Archivovaný';
      if (status === 'new') return 'Nový';
      return status;
    };

    return <Chip label={getLabel()} color={getColor()} size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          📧 Email Management Dashboard
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          {/* IMAP Status Chip */}
          {imapStatus && (
            <Chip
              icon={<EmailIcon />}
              label={
                imapStatus.enabled 
                  ? (imapStatus.running ? 'IMAP Beží' : 'IMAP Zastavený')
                  : 'IMAP Vypnutý'
              }
              color={
                imapStatus.enabled 
                  ? (imapStatus.running ? 'success' : 'warning')
                  : 'default'
              }
              size="small"
              sx={{ mr: 1 }}
            />
          )}

          {/* IMAP Control Buttons */}
          <Tooltip title="Test IMAP pripojenia">
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={<TestIcon />}
                onClick={testImapConnection}
                disabled={imapLoading || !imapStatus?.enabled}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                Test
              </Button>
            </span>
          </Tooltip>

          {imapStatus?.enabled && (
            <>
              {!imapStatus.running ? (
                <Tooltip title="Spustiť IMAP monitoring">
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<StartIcon />}
                      onClick={startImapMonitoring}
                      disabled={imapLoading}
                      color="success"
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      Spusiť
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title="Zastaviť IMAP monitoring">
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<StopIcon />}
                      onClick={stopImapMonitoring}
                      disabled={imapLoading}
                      color="error"
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      Zastaviť
                    </Button>
                  </span>
                </Tooltip>
              )}
            </>
          )}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchEmails();
              fetchStats();
              fetchImapStatus();
              fetchPendingRentals();
            }}
            disabled={loading}
          >
            Obnoviť
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  📬 Dnes celkom
                </Typography>
                <Typography variant="h4">
                  {stats.today.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  ✅ Schválené
                </Typography>
                <Typography variant="h4">
                  {stats.today.processed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  ❌ Zamietnuté
                </Typography>
                <Typography variant="h4">
                  {stats.today.rejected}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  ⏳ Čakajúce
                </Typography>
                <Typography variant="h4">
                  {stats.today.pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* IMAP Configuration Info */}
      {imapStatus && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📧 IMAP Konfigurácia
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Chip
                    label={
                      imapStatus.enabled 
                        ? (imapStatus.running ? 'Beží' : 'Zastavený')
                        : 'Vypnutý'
                    }
                    color={
                      imapStatus.enabled 
                        ? (imapStatus.running ? 'success' : 'warning')
                        : 'default'
                    }
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Server: <strong>{imapStatus.config?.host || 'Nekonfigurovaný'}</strong>
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Používateľ: <strong>{imapStatus.config?.user || 'Nekonfigurovaný'}</strong>
                </Typography>
              </Grid>
            </Grid>
            {!imapStatus.enabled && (
              <Alert severity="info" sx={{ mt: 2 }}>
                IMAP monitoring je vypnutý. Skontrolujte konfiguráciu v backend/.env súbore.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔍 Filtre
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="">Všetky</MenuItem>
                <MenuItem value="new">Nové</MenuItem>
                <MenuItem value="processed">Spracované</MenuItem>
                <MenuItem value="rejected">Zamietnuté</MenuItem>
                <MenuItem value="archived">Archivované</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Odosielateľ"
                value={senderFilter}
                onChange={(e) => setSenderFilter(e.target.value)}
                fullWidth
                size="small"
                placeholder="Hľadať podľa odosielateľa..."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                onClick={() => {
                  setStatusFilter('');
                  setSenderFilter('');
                  setCurrentPage(1);
                }}
                fullWidth
              >
                Vyčistiť filtre
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(event, newValue) => setActiveTab(newValue)}
          aria-label="Email management tabs"
        >
          <Tab 
            label="História Emailov" 
            icon={<EmailIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <span>Čakajúce Prenájmy</span>
                {pendingRentals.length > 0 && (
                  <Badge badgeContent={pendingRentals.length} color="warning">
                    <NotificationIcon />
                  </Badge>
                )}
              </Box>
            } 
            icon={<PendingIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        /* Email Table */
        <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Emaily ({totalEmails} celkom)
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Predmet</TableCell>
                      <TableCell>Odosielateľ</TableCell>
                      <TableCell>Prijaté</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Objednávka</TableCell>
                      <TableCell>Akcie</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {emails.map((email) => (
                      <TableRow key={email.id} hover>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {email.subject}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {email.sender}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(email.received_at).toLocaleString('sk')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(email.status, email.action_taken)}
                        </TableCell>
                        <TableCell>
                          {email.order_number ? (
                            <Chip
                              label={email.order_number}
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="Zobraziť detail">
                              <IconButton
                                size="small"
                                onClick={() => viewEmailDetail(email.id)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            
                            {email.status === 'new' && (
                              <Tooltip title="Schváliť">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => approveEmail(email.id)}
                                    disabled={actionLoading === email.id}
                                    color="success"
                                  >
                                    {actionLoading === email.id ? (
                                      <CircularProgress size={20} />
                                    ) : (
                                      <ApproveIcon />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}

                            {email.status === 'new' && (
                              <Tooltip title="Zamietnuť">
                                <IconButton
                                  size="small"
                                  onClick={() => setRejectDialog({ open: true, emailId: email.id })}
                                  color="error"
                                >
                                  <RejectIcon />
                                </IconButton>
                              </Tooltip>
                            )}

                            <Tooltip title="Archivovať">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => archiveEmail(email.id)}
                                  disabled={actionLoading === email.id}
                                >
                                  {actionLoading === email.id ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <ArchiveIcon />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Zmazať">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => deleteEmail(email.id)}
                                  disabled={actionLoading === email.id}
                                  color="error"
                                >
                                  {actionLoading === email.id ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <DeleteIcon />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(_, page) => setCurrentPage(page)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
      )}

      {/* Pending Rentals Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" gutterBottom>
                ⏳ Čakajúce automatické prenájmy ({pendingRentals.length})
              </Typography>
              <Button 
                variant="outlined" 
                onClick={fetchPendingRentals}
                disabled={pendingLoading}
                startIcon={<RefreshIcon />}
              >
                Obnoviť
              </Button>
            </Box>

            {pendingLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : pendingRentals.length === 0 ? (
              <Box textAlign="center" py={6}>
                <CheckCircle fontSize="large" color="success" sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Žiadne čakajúce prenájmy
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Všetky automatické prenájmy boli spracované alebo žiadne ešte nepriišli.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {pendingRentals.map((rental) => (
                  <Grid item xs={12} key={rental.id}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box display="flex" justifyContent="between" alignItems="start">
                          <Box flex={1}>
                            {/* Rental Header */}
                            <Box display="flex" justifyContent="between" alignItems="start" mb={2}>
                              <Box>
                                <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                                  <CarIcon color="primary" />
                                  {rental.vehicleName || 'Neznáme vozidlo'}
                                  <Chip label={rental.vehicleCode} size="small" variant="outlined" />
                                </Typography>
                                <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
                                  <PersonIcon fontSize="small" />
                                  {rental.customerName}
                                </Typography>
                              </Box>
                              <Box display="flex" gap={1}>
                                <Tooltip title="Schváliť">
                                  <IconButton
                                    color="success"
                                    onClick={() => handleApproveRental(rental.id)}
                                    disabled={actionLoading === rental.id}
                                  >
                                    {actionLoading === rental.id ? (
                                      <CircularProgress size={20} />
                                    ) : (
                                      <ApproveIcon />
                                    )}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Zamietnuť">
                                  <IconButton
                                    color="error"
                                    onClick={() => setRejectDialog({ open: true, emailId: rental.id, isRental: true })}
                                    disabled={actionLoading === rental.id}
                                  >
                                    <RejectIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Rozbaliť detaily">
                                  <IconButton
                                    onClick={() => toggleRentalExpansion(rental.id)}
                                  >
                                    {expandedRentals.has(rental.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>

                            {/* Basic Info */}
                            <Grid container spacing={2} mb={2}>
                              <Grid item xs={12} sm={6} md={3}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <CalendarIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    <strong>Od:</strong> {formatDate(rental.startDate)}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <CalendarIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    <strong>Do:</strong> {formatDate(rental.endDate)}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <EuroIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    <strong>Cena:</strong> {formatCurrency(rental.totalPrice)}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <LocationIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    <strong>Miesto:</strong> {rental.handoverPlace}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>

                            {/* Expanded Details */}
                            <Collapse in={expandedRentals.has(rental.id)}>
                              <Divider sx={{ mb: 2 }} />
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2"><strong>Objednávka:</strong> {rental.orderNumber}</Typography>
                                  <Typography variant="body2"><strong>Email:</strong> {rental.customerEmail}</Typography>
                                  <Typography variant="body2"><strong>Telefón:</strong> {rental.customerPhone}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2"><strong>Denné km:</strong> {rental.dailyKilometers}</Typography>
                                  <Typography variant="body2"><strong>Záloha:</strong> {formatCurrency(rental.deposit || 0)}</Typography>
                                  <Typography variant="body2"><strong>Platba:</strong> {rental.paymentMethod}</Typography>
                                </Grid>
                              </Grid>
                            </Collapse>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Email Dialog */}
      <Dialog 
        open={viewDialog.open} 
        onClose={() => setViewDialog({ open: false, email: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <EmailIcon />
            Email Detail
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewDialog.email && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {viewDialog.email.email.subject}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Od: {viewDialog.email.email.sender} | {new Date(viewDialog.email.email.received_at).toLocaleString('sk')}
              </Typography>
              
              {getStatusChip(viewDialog.email.email.status, viewDialog.email.email.action_taken)}
              
              {viewDialog.email.email.email_content && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Obsah emailu:
                  </Typography>
                  <Paper elevation={1} sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {viewDialog.email.email.email_content.substring(0, 1000)}
                      {viewDialog.email.email.email_content.length > 1000 && '...'}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {viewDialog.email.email.parsed_data && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Parsované údaje:
                  </Typography>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(viewDialog.email.email.parsed_data, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}

              {viewDialog.email.actions && viewDialog.email.actions.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    História akcií:
                  </Typography>
                  {viewDialog.email.actions.map((action) => (
                    <Box key={action.id} display="flex" justifyContent="space-between" py={1}>
                      <Typography variant="body2">
                        {action.action} - {action.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(action.created_at).toLocaleString('sk')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog({ open: false, email: null })}>
            Zatvoriť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, emailId: null, isRental: false })}>
        <DialogTitle>{rejectDialog.isRental ? 'Zamietnuť prenájom' : 'Zamietnuť email'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Dôvod zamietnutia"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, emailId: null, isRental: false })}>
            Zrušiť
          </Button>
                                        <Button onClick={rejectItem} color="error" variant="contained">
                                Zamietnuť
                              </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailManagementDashboard;