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
  useTheme,
  useMediaQuery,
  Stack,
  Avatar,
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
import { apiService, getAPI_BASE_URL } from '../../services/api';
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
  // Theme and responsive hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isExtraSmall = useMediaQuery(theme.breakpoints.down(400));
  
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

  // Archive State
  const [archivedEmails, setArchivedEmails] = useState<EmailEntry[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archivePagination, setArchivePagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

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
      console.log('- API Base URL:', getAPI_BASE_URL());
      
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      });

      if (statusFilter) params.append('status', statusFilter);
      if (senderFilter) params.append('sender', senderFilter);

      console.log('🌐 About to call API:', `/email-management?${params}`);
      
      // TEMPORARY: Direct fetch bypass apiService
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch(`${getAPI_BASE_URL()}/email-management?${params}`, {
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
      const directResponse = await fetch(`${getAPI_BASE_URL()}/email-management/stats/dashboard`, {
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
      
      const directResponse = await fetch(`${getAPI_BASE_URL()}/email-management/${emailId}`, {
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
      
      const directResponse = await fetch(`${getAPI_BASE_URL()}/email-management/${emailId}/approve`, {
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
        
        const directResponse = await fetch(`${getAPI_BASE_URL()}/email-management/${rejectDialog.emailId}/reject`, {
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
      
      const directResponse = await fetch(`${getAPI_BASE_URL()}/email-management/${emailId}/archive`, {
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
      
      const directResponse = await fetch(`${getAPI_BASE_URL()}/email-management/${emailId}`, {
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
      const directResponse = await fetch(`${getAPI_BASE_URL()}/email-imap/status`, {
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
      const directResponse = await fetch(`${getAPI_BASE_URL()}/email-imap/test`, {
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
      const directResponse = await fetch(`${getAPI_BASE_URL()}/email-imap/start`, {
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
      const directResponse = await fetch(`${getAPI_BASE_URL()}/email-imap/stop`, {
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

  // ============================================
  // ARCHIVE FUNCTIONS
  // ============================================

  // Fetch archived emails
  const fetchArchivedEmails = async (offset = 0) => {
    try {
      setArchiveLoading(true);
      
      const params = new URLSearchParams({
        limit: archivePagination.limit.toString(),
        offset: offset.toString(),
      });

      if (senderFilter) params.append('sender', senderFilter);

      // Direct fetch like other functions in this component
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch(`${getAPI_BASE_URL()}/email-management/archive/list?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!directResponse.ok) {
        throw new Error(`HTTP error! status: ${directResponse.status}`);
      }

      const response = await directResponse.json();
      
      if (response.success) {
        setArchivedEmails(response.data.emails || []);
        setArchivePagination({
          total: response.data.pagination.total,
          limit: response.data.pagination.limit,
          offset: response.data.pagination.offset,
          hasMore: response.data.pagination.hasMore
        });
      } else {
        setError('Chyba pri načítaní archívu emailov');
      }
    } catch (error) {
      console.error('❌ ARCHIVE: Chyba pri načítaní archívu:', error);
      setError('Chyba pri načítaní archívu emailov');
    } finally {
      setArchiveLoading(false);
    }
  };

  // Bulk archive selected emails
  const bulkArchiveEmails = async () => {
    if (selectedEmails.size === 0) {
      setError('Nie sú vybrané žiadne emaily na archiváciu');
      return;
    }

    try {
      setActionLoading('bulk-archive');
      
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch(`${getAPI_BASE_URL()}/email-management/bulk-archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emailIds: Array.from(selectedEmails),
          archiveType: 'manual'
        })
      });
      
      if (!directResponse.ok) {
        throw new Error(`HTTP error! status: ${directResponse.status}`);
      }

      const response = await directResponse.json();
      
      if (response.success) {
        setSuccess(`${response.data.archivedCount} emailov úspešne archivovaných`);
        setSelectedEmails(new Set());
        fetchEmails(); // Refresh main list
        fetchArchivedEmails(); // Refresh archive
      } else {
        setError(response.error || 'Chyba pri bulk archivovaní');
      }
    } catch (error) {
      console.error('❌ BULK ARCHIVE: Chyba:', error);
      setError('Chyba pri bulk archivovaní emailov');
    } finally {
      setActionLoading(null);
    }
  };

  // Auto-archive old emails
  const autoArchiveOldEmails = async () => {
    try {
      setActionLoading('auto-archive');
      
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch(`${getAPI_BASE_URL()}/email-management/auto-archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          daysOld: 30,
          statuses: ['processed', 'rejected']
        })
      });
      
      if (!directResponse.ok) {
        throw new Error(`HTTP error! status: ${directResponse.status}`);
      }

      const response = await directResponse.json();
      
      if (response.success) {
        setSuccess(`${response.data.archivedCount} starých emailov automaticky archivovaných`);
        fetchEmails(); // Refresh main list
        fetchArchivedEmails(); // Refresh archive
      } else {
        setError(response.error || 'Chyba pri automatickom archivovaní');
      }
    } catch (error) {
      console.error('❌ AUTO ARCHIVE: Chyba:', error);
      setError('Chyba pri automatickom archivovaní emailov');
    } finally {
      setActionLoading(null);
    }
  };

  // Unarchive email
  const unarchiveEmail = async (emailId: string) => {
    try {
      setActionLoading(emailId);
      
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch(`${getAPI_BASE_URL()}/email-management/${emailId}/unarchive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!directResponse.ok) {
        throw new Error(`HTTP error! status: ${directResponse.status}`);
      }

      const response = await directResponse.json();
      
      if (response.success) {
        setSuccess('Email úspešne obnovený z archívu');
        fetchEmails(); // Refresh main list
        fetchArchivedEmails(); // Refresh archive
      } else {
        setError(response.error || 'Chyba pri obnove z archívu');
      }
    } catch (error) {
      console.error('❌ UNARCHIVE: Chyba:', error);
      setError('Chyba pri obnove emailu z archívu');
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
    fetchArchivedEmails(); // Load archived emails
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
    <Box sx={{ 
      p: isExtraSmall ? 1 : isSmallMobile ? 2 : 3,
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems={isMobile ? "flex-start" : "center"} 
        mb={3}
        flexDirection={isSmallMobile ? "column" : "row"}
        gap={isSmallMobile ? 2 : 0}
      >
        <Typography 
          variant={isExtraSmall ? "h5" : isSmallMobile ? "h4" : "h4"} 
          gutterBottom={!isSmallMobile}
          sx={{ 
            fontSize: isExtraSmall ? '1.25rem' : isSmallMobile ? '1.5rem' : undefined,
            textAlign: isSmallMobile ? 'center' : 'left',
            width: isSmallMobile ? '100%' : 'auto'
          }}
        >
          📧 Email Management Dashboard
        </Typography>
        <Box 
          display="flex" 
          gap={isExtraSmall ? 0.5 : 1} 
          alignItems="center"
          flexWrap={isMobile ? "wrap" : "nowrap"}
          justifyContent={isSmallMobile ? "center" : "flex-end"}
          width={isSmallMobile ? '100%' : 'auto'}
        >
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
                size={isExtraSmall ? "small" : "small"}
                startIcon={!isExtraSmall && <TestIcon />}
                onClick={testImapConnection}
                disabled={imapLoading || !imapStatus?.enabled}
                sx={{ 
                  minWidth: 'auto', 
                  px: isExtraSmall ? 0.5 : 1,
                  fontSize: isExtraSmall ? '0.75rem' : undefined
                }}
              >
                {isExtraSmall ? 'T' : 'Test'}
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
                      startIcon={!isExtraSmall && <StartIcon />}
                      onClick={startImapMonitoring}
                      disabled={imapLoading}
                      color="success"
                      sx={{ 
                        minWidth: 'auto', 
                        px: isExtraSmall ? 0.5 : 1,
                        fontSize: isExtraSmall ? '0.75rem' : undefined
                      }}
                    >
                      {isExtraSmall ? 'S' : 'Spusiť'}
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title="Zastaviť IMAP monitoring">
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={!isExtraSmall && <StopIcon />}
                      onClick={stopImapMonitoring}
                      disabled={imapLoading}
                      color="error"
                      sx={{ 
                        minWidth: 'auto', 
                        px: isExtraSmall ? 0.5 : 1,
                        fontSize: isExtraSmall ? '0.75rem' : undefined
                      }}
                    >
                      {isExtraSmall ? 'Z' : 'Zastaviť'}
                    </Button>
                  </span>
                </Tooltip>
              )}
            </>
          )}

          <Button
            variant="outlined"
            startIcon={!isExtraSmall && <RefreshIcon />}
            onClick={() => {
              fetchEmails();
              fetchStats();
              fetchImapStatus();
              fetchPendingRentals();
            }}
            disabled={loading}
            size={isSmallMobile ? "small" : "medium"}
            sx={{ 
              fontSize: isExtraSmall ? '0.75rem' : undefined,
              px: isExtraSmall ? 1 : undefined
            }}
          >
            {isExtraSmall ? 'R' : 'Obnoviť'}
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
        <Grid container spacing={isExtraSmall ? 1 : isMobile ? 2 : 3} mb={3}>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              minHeight: isExtraSmall ? '80px' : '100px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2
              }
            }}>
              <CardContent sx={{ 
                p: isExtraSmall ? 1 : isMobile ? 1.5 : 2, 
                '&:last-child': { pb: isExtraSmall ? 1 : isMobile ? 1.5 : 2 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <Typography 
                  variant={isExtraSmall ? "caption" : isMobile ? "body2" : "h6"} 
                  color="primary" 
                  sx={{ 
                    fontSize: isExtraSmall ? '0.75rem' : isMobile ? '0.875rem' : undefined,
                    mb: 0.5,
                    fontWeight: 500
                  }}
                >
                  {isExtraSmall ? '📬' : '📬 Celkom'}
                </Typography>
                <Typography 
                  variant={isExtraSmall ? "h6" : isMobile ? "h5" : "h4"} 
                  fontWeight="bold"
                  sx={{ 
                    fontSize: isExtraSmall ? '1.25rem' : undefined,
                    lineHeight: 1
                  }}
                >
                  {stats.today.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              minHeight: isExtraSmall ? '80px' : '100px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2
              }
            }}>
              <CardContent sx={{ 
                p: isExtraSmall ? 1 : isMobile ? 1.5 : 2, 
                '&:last-child': { pb: isExtraSmall ? 1 : isMobile ? 1.5 : 2 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <Typography 
                  variant={isExtraSmall ? "caption" : isMobile ? "body2" : "h6"} 
                  color="success.main" 
                  sx={{ 
                    fontSize: isExtraSmall ? '0.75rem' : isMobile ? '0.875rem' : undefined,
                    mb: 0.5,
                    fontWeight: 500
                  }}
                >
                  {isExtraSmall ? '✅' : '✅ Schválené'}
                </Typography>
                <Typography 
                  variant={isExtraSmall ? "h6" : isMobile ? "h5" : "h4"} 
                  fontWeight="bold"
                  sx={{ 
                    fontSize: isExtraSmall ? '1.25rem' : undefined,
                    lineHeight: 1
                  }}
                >
                  {stats.today.processed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              minHeight: isExtraSmall ? '80px' : '100px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2
              }
            }}>
              <CardContent sx={{ 
                p: isExtraSmall ? 1 : isMobile ? 1.5 : 2, 
                '&:last-child': { pb: isExtraSmall ? 1 : isMobile ? 1.5 : 2 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <Typography 
                  variant={isExtraSmall ? "caption" : isMobile ? "body2" : "h6"} 
                  color="error.main" 
                  sx={{ 
                    fontSize: isExtraSmall ? '0.75rem' : isMobile ? '0.875rem' : undefined,
                    mb: 0.5,
                    fontWeight: 500
                  }}
                >
                  {isExtraSmall ? '❌' : '❌ Zamietnuté'}
                </Typography>
                <Typography 
                  variant={isExtraSmall ? "h6" : isMobile ? "h5" : "h4"} 
                  fontWeight="bold"
                  sx={{ 
                    fontSize: isExtraSmall ? '1.25rem' : undefined,
                    lineHeight: 1
                  }}
                >
                  {stats.today.rejected}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              minHeight: isExtraSmall ? '80px' : '100px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2
              }
            }}>
              <CardContent sx={{ 
                p: isExtraSmall ? 1 : isMobile ? 1.5 : 2, 
                '&:last-child': { pb: isExtraSmall ? 1 : isMobile ? 1.5 : 2 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <Typography 
                  variant={isExtraSmall ? "caption" : isMobile ? "body2" : "h6"} 
                  color="warning.main" 
                  sx={{ 
                    fontSize: isExtraSmall ? '0.75rem' : isMobile ? '0.875rem' : undefined,
                    mb: 0.5,
                    fontWeight: 500
                  }}
                >
                  {isExtraSmall ? '⏳' : '⏳ Čakajúce'}
                </Typography>
                <Typography 
                  variant={isExtraSmall ? "h6" : isMobile ? "h5" : "h4"} 
                  fontWeight="bold"
                  sx={{ 
                    fontSize: isExtraSmall ? '1.25rem' : undefined,
                    lineHeight: 1
                  }}
                >
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
          <CardContent sx={{ p: isExtraSmall ? 2 : 3 }}>
            <Typography 
              variant={isSmallMobile ? "subtitle1" : "h6"} 
              gutterBottom
              sx={{ 
                fontSize: isExtraSmall ? '1rem' : undefined,
                textAlign: isSmallMobile ? 'center' : 'left'
              }}
            >
              📧 IMAP Konfigurácia
            </Typography>
            <Grid container spacing={isSmallMobile ? 2 : 2}>
              <Grid item xs={12} sm={6} md={4}>
                <Box 
                  display="flex" 
                  alignItems="center" 
                  gap={1}
                  justifyContent={isSmallMobile ? "center" : "flex-start"}
                  flexDirection={isExtraSmall ? "column" : "row"}
                >
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: isExtraSmall ? '0.875rem' : undefined }}
                  >
                    Status:
                  </Typography>
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
                    size={isExtraSmall ? "small" : "small"}
                    sx={{ fontSize: isExtraSmall ? '0.75rem' : undefined }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box textAlign={isSmallMobile ? "center" : "left"}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: isExtraSmall ? '0.875rem' : undefined,
                      wordBreak: 'break-word'
                    }}
                  >
                    Server: <strong>{imapStatus.config?.host || 'Nekonfigurovaný'}</strong>
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={12} md={4}>
                <Box textAlign={isSmallMobile ? "center" : "left"}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: isExtraSmall ? '0.875rem' : undefined,
                      wordBreak: 'break-word'
                    }}
                  >
                    Používateľ: <strong>{imapStatus.config?.user || 'Nekonfigurovaný'}</strong>
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            {!imapStatus.enabled && (
              <Alert 
                severity="info" 
                sx={{ 
                  mt: 2,
                  fontSize: isExtraSmall ? '0.875rem' : undefined,
                  '& .MuiAlert-message': {
                    fontSize: isExtraSmall ? '0.875rem' : undefined
                  }
                }}
              >
                IMAP monitoring je vypnutý. Skontrolujte konfiguráciu v backend/.env súbore.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: isExtraSmall ? 2 : isMobile ? 2 : 3 }}>
          <Typography 
            variant={isExtraSmall ? "body1" : isMobile ? "subtitle1" : "h6"} 
            gutterBottom
            sx={{ 
              fontSize: isExtraSmall ? '1rem' : undefined,
              textAlign: isSmallMobile ? 'center' : 'left',
              fontWeight: 600
            }}
          >
            🔍 Filtre
          </Typography>
          <Grid container spacing={isExtraSmall ? 1.5 : isMobile ? 2 : 2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                fullWidth
                size={isExtraSmall ? "small" : isMobile ? "medium" : "small"}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: isExtraSmall ? '0.875rem' : undefined
                  },
                  '& .MuiInputBase-input': {
                    fontSize: isExtraSmall ? '0.875rem' : undefined
                  }
                }}
              >
                <MenuItem value="" sx={{ fontSize: isExtraSmall ? '0.875rem' : undefined }}>
                  Všetky
                </MenuItem>
                <MenuItem value="new" sx={{ fontSize: isExtraSmall ? '0.875rem' : undefined }}>
                  Nové
                </MenuItem>
                <MenuItem value="processed" sx={{ fontSize: isExtraSmall ? '0.875rem' : undefined }}>
                  Spracované
                </MenuItem>
                <MenuItem value="rejected" sx={{ fontSize: isExtraSmall ? '0.875rem' : undefined }}>
                  Zamietnuté
                </MenuItem>
                <MenuItem value="archived" sx={{ fontSize: isExtraSmall ? '0.875rem' : undefined }}>
                  Archivované
                </MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Odosielateľ"
                value={senderFilter}
                onChange={(e) => setSenderFilter(e.target.value)}
                fullWidth
                size={isExtraSmall ? "small" : isMobile ? "medium" : "small"}
                placeholder={isExtraSmall ? "Hľadať..." : "Hľadať podľa odosielateľa..."}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: isExtraSmall ? '0.875rem' : undefined
                  },
                  '& .MuiInputBase-input': {
                    fontSize: isExtraSmall ? '0.875rem' : undefined
                  }
                }}
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
                size={isExtraSmall ? "small" : "medium"}
                sx={{ 
                  fontSize: isExtraSmall ? '0.875rem' : undefined,
                  py: isExtraSmall ? 1 : undefined
                }}
              >
                {isExtraSmall ? 'Vyčistiť' : 'Vyčistiť filtre'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: 3,
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: 4,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 2,
        }
      }}>
        <Tabs 
          value={activeTab} 
          onChange={(event, newValue) => setActiveTab(newValue)}
          aria-label="Email management tabs"
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            minHeight: isExtraSmall ? 40 : 48,
            '& .MuiTab-root': {
              minHeight: isExtraSmall ? 40 : 48,
              fontSize: isExtraSmall ? '0.75rem' : isSmallMobile ? '0.875rem' : undefined,
              padding: isExtraSmall ? '6px 8px' : isSmallMobile ? '8px 12px' : undefined,
              minWidth: isExtraSmall ? 'auto' : undefined
            },
            '& .MuiTabs-flexContainer': {
              gap: isExtraSmall ? 0.5 : 1
            }
          }}
        >
          <Tab 
            label={isExtraSmall ? "Emaily" : isSmallMobile ? "História" : "História Emailov"}
            icon={!isExtraSmall && <EmailIcon />} 
            iconPosition={isSmallMobile ? "top" : "start"}
            sx={{
              '& .MuiTab-iconWrapper': {
                marginBottom: isSmallMobile ? 0.5 : undefined,
                marginRight: isSmallMobile ? 0 : undefined
              }
            }}
          />
          <Tab 
            label={
              <Box 
                display="flex" 
                alignItems="center" 
                gap={isExtraSmall ? 0.5 : 1}
                flexDirection={isSmallMobile ? "column" : "row"}
              >
                <span>{isExtraSmall ? "Prenájmy" : isSmallMobile ? "Čakajúce" : "Čakajúce Prenájmy"}</span>
                {pendingRentals.length > 0 && (
                  <Badge 
                    badgeContent={pendingRentals.length} 
                    color="warning"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: isExtraSmall ? '0.625rem' : '0.75rem',
                        minWidth: isExtraSmall ? 16 : 20,
                        height: isExtraSmall ? 16 : 20
                      }
                    }}
                  >
                    <NotificationIcon sx={{ fontSize: isExtraSmall ? 16 : 20 }} />
                  </Badge>
                )}
              </Box>
            } 
            icon={!isExtraSmall && <PendingIcon />} 
            iconPosition={isSmallMobile ? "top" : "start"}
            sx={{
              '& .MuiTab-iconWrapper': {
                marginBottom: isSmallMobile ? 0.5 : undefined,
                marginRight: isSmallMobile ? 0 : undefined
              }
            }}
          />
          <Tab 
            label={
              <Box 
                display="flex" 
                alignItems="center" 
                gap={isExtraSmall ? 0.5 : 1}
                flexDirection={isSmallMobile ? "column" : "row"}
              >
                <span>{isExtraSmall ? "Archív" : isSmallMobile ? "Archív" : "Archív Emailov"}</span>
                {archivePagination.total > 0 && (
                  <Badge 
                    badgeContent={archivePagination.total} 
                    color="default"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: isExtraSmall ? '0.625rem' : '0.75rem',
                        minWidth: isExtraSmall ? 16 : 20,
                        height: isExtraSmall ? 16 : 20
                      }
                    }}
                  >
                    <ArchiveIcon sx={{ fontSize: isExtraSmall ? 16 : 20 }} />
                  </Badge>
                )}
              </Box>
            } 
            icon={!isExtraSmall && <ArchiveIcon />} 
            iconPosition={isSmallMobile ? "top" : "start"}
            sx={{
              '& .MuiTab-iconWrapper': {
                marginBottom: isSmallMobile ? 0.5 : undefined,
                marginRight: isSmallMobile ? 0 : undefined
              }
            }}
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
              {/* Mobile View - Card List */}
              {isMobile ? (
                <Stack spacing={2}>
                  {emails.map((email) => (
                    <Card key={email.id} variant="outlined" sx={{ 
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 1
                      }
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        {/* Header - Subject and Status */}
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 600,
                              flex: 1,
                              mr: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {email.subject}
                          </Typography>
                          {getStatusChip(email.status, email.action_taken)}
                        </Box>

                        {/* Sender and Date */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                              {email.sender.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                              {email.sender.length > 25 ? `${email.sender.substring(0, 25)}...` : email.sender}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(email.received_at).toLocaleDateString('sk')}
                          </Typography>
                        </Box>

                        {/* Order Number */}
                        {email.order_number && (
                          <Box mb={2}>
                            <Chip
                              label={`📋 ${email.order_number}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          </Box>
                        )}

                        {/* Actions */}
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Button
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => viewEmailDetail(email.id)}
                            variant="outlined"
                            sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                          >
                            Detail
                          </Button>
                          
                          {email.status === 'new' && (
                            <>
                              <Button
                                size="small"
                                startIcon={actionLoading === email.id ? <CircularProgress size={16} /> : <ApproveIcon />}
                                onClick={() => approveEmail(email.id)}
                                disabled={actionLoading === email.id}
                                color="success"
                                variant="outlined"
                                sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                              >
                                Schváliť
                              </Button>
                              <Button
                                size="small"
                                startIcon={<RejectIcon />}
                                onClick={() => setRejectDialog({ open: true, emailId: email.id })}
                                color="error"
                                variant="outlined"
                                sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                              >
                                Zamietnuť
                              </Button>
                            </>
                          )}

                          <Button
                            size="small"
                            startIcon={actionLoading === email.id ? <CircularProgress size={16} /> : <ArchiveIcon />}
                            onClick={() => archiveEmail(email.id)}
                            disabled={actionLoading === email.id}
                            variant="outlined"
                            sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                          >
                            Archív
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                /* Desktop View - Table */
                <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 200 }}>Predmet</TableCell>
                        <TableCell sx={{ minWidth: 150 }}>Odosielateľ</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>Prijaté</TableCell>
                        <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>Objednávka</TableCell>
                        <TableCell sx={{ minWidth: 200 }}>Akcie</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {emails.map((email) => (
                        <TableRow key={email.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ 
                              maxWidth: 250,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}>
                              {email.subject}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 150 }} noWrap>
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
                            <Box display="flex" gap={1} flexWrap="wrap">
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
              )}

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

      {/* Archive Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems={isMobile ? "flex-start" : "center"} mb={3} flexDirection={isMobile ? "column" : "row"} gap={isMobile ? 2 : 0}>
              <Typography variant="h6" gutterBottom={isMobile}>
                📁 Archív emailov ({archivePagination.total})
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" justifyContent={isMobile ? "center" : "flex-end"}>
                <Button 
                  variant="outlined" 
                  onClick={() => fetchArchivedEmails(0)}
                  disabled={archiveLoading}
                  startIcon={<RefreshIcon />}
                  size={isSmallMobile ? "small" : "medium"}
                >
                  {isExtraSmall ? 'Obnoviť' : 'Obnoviť'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={autoArchiveOldEmails}
                  disabled={actionLoading === 'auto-archive'}
                  startIcon={actionLoading === 'auto-archive' ? <CircularProgress size={16} /> : <ArchiveIcon />}
                  color="warning"
                  size={isSmallMobile ? "small" : "medium"}
                >
                  {isExtraSmall ? 'Auto' : 'Auto-archív'}
                </Button>
                {selectedEmails.size > 0 && (
                  <Button 
                    variant="contained" 
                    onClick={bulkArchiveEmails}
                    disabled={actionLoading === 'bulk-archive'}
                    startIcon={actionLoading === 'bulk-archive' ? <CircularProgress size={16} /> : <ArchiveIcon />}
                    color="primary"
                    size={isSmallMobile ? "small" : "medium"}
                  >
                    {isExtraSmall ? `Archív (${selectedEmails.size})` : `Archivovať (${selectedEmails.size})`}
                  </Button>
                )}
              </Box>
            </Box>

            {archiveLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : archivedEmails.length === 0 ? (
              <Box textAlign="center" py={6}>
                <ArchiveIcon fontSize="large" color="disabled" sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Archív je prázdny
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Žiadne emaily nie sú archivované. Schválené a zamietnuté emaily sa automaticky archivujú po 30 dňoch.
                </Typography>
              </Box>
            ) : (
              <>
                {/* Mobile View - Card List */}
                {isMobile ? (
                  <Stack spacing={2}>
                    {archivedEmails.map((email) => (
                      <Card key={email.id} variant="outlined" sx={{ 
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 1
                        }
                      }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          {/* Header - Subject and Status */}
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 600,
                                flex: 1,
                                mr: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {email.subject}
                            </Typography>
                            {getStatusChip(email.status, email.action_taken)}
                          </Box>

                          {/* Sender and Date */}
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'grey.500' }}>
                                {email.sender.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                {email.sender.length > 25 ? `${email.sender.substring(0, 25)}...` : email.sender}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(email.received_at).toLocaleDateString('sk')}
                            </Typography>
                          </Box>

                          {/* Order Number */}
                          {email.order_number && (
                            <Box mb={2}>
                              <Chip
                                label={`📋 ${email.order_number}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            </Box>
                          )}

                          {/* Actions */}
                          <Box display="flex" gap={1} flexWrap="wrap">
                            <Button
                              size="small"
                              startIcon={<ViewIcon />}
                              onClick={() => viewEmailDetail(email.id)}
                              variant="outlined"
                              sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                            >
                              Detail
                            </Button>
                            
                            <Button
                              size="small"
                              startIcon={actionLoading === email.id ? <CircularProgress size={16} /> : <RefreshIcon />}
                              onClick={() => unarchiveEmail(email.id)}
                              disabled={actionLoading === email.id}
                              color="success"
                              variant="outlined"
                              sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                            >
                              Obnoviť
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  /* Desktop View - Table */
                  <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ minWidth: 200 }}>Predmet</TableCell>
                          <TableCell sx={{ minWidth: 150 }}>Odosielateľ</TableCell>
                          <TableCell sx={{ minWidth: 120 }}>Archivované</TableCell>
                          <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                          <TableCell sx={{ minWidth: 120 }}>Objednávka</TableCell>
                          <TableCell sx={{ minWidth: 150 }}>Akcie</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {archivedEmails.map((email) => (
                          <TableRow key={email.id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ 
                                maxWidth: 250,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}>
                                {email.subject}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 150 }} noWrap>
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
                              <Box display="flex" gap={1} flexWrap="wrap">
                                <Tooltip title="Zobraziť detail">
                                  <IconButton
                                    size="small"
                                    onClick={() => viewEmailDetail(email.id)}
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Obnoviť z archívu">
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => unarchiveEmail(email.id)}
                                      disabled={actionLoading === email.id}
                                      color="success"
                                    >
                                      {actionLoading === email.id ? (
                                        <CircularProgress size={20} />
                                      ) : (
                                        <RefreshIcon />
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
                )}

                {/* Pagination */}
                {archivePagination.total > archivePagination.limit && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                      count={Math.ceil(archivePagination.total / archivePagination.limit)}
                      page={Math.floor(archivePagination.offset / archivePagination.limit) + 1}
                      onChange={(_, page) => fetchArchivedEmails((page - 1) * archivePagination.limit)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
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
        fullScreen={isSmallMobile}
        PaperProps={{
          sx: {
            margin: isSmallMobile ? 0 : isTablet ? 1 : 2,
            maxHeight: isSmallMobile ? '100vh' : 'calc(100vh - 64px)',
            borderRadius: isSmallMobile ? 0 : undefined,
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: isExtraSmall ? '1.1rem' : undefined,
          p: isExtraSmall ? 2 : undefined
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <EmailIcon sx={{ fontSize: isExtraSmall ? 20 : undefined }} />
            <Typography variant={isExtraSmall ? "h6" : "h5"} component="span">
              {isExtraSmall ? 'Detail' : 'Email Detail'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: isExtraSmall ? 2 : undefined }}>
          {viewDialog.email && (
            <Box>
              <Typography 
                variant={isExtraSmall ? "subtitle1" : "h6"} 
                gutterBottom
                sx={{ 
                  fontSize: isExtraSmall ? '1rem' : undefined,
                  wordBreak: 'break-word'
                }}
              >
                {viewDialog.email.email.subject}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                gutterBottom
                sx={{ 
                  fontSize: isExtraSmall ? '0.875rem' : undefined,
                  wordBreak: 'break-word'
                }}
              >
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
      <Dialog 
        open={rejectDialog.open} 
        onClose={() => setRejectDialog({ open: false, emailId: null, isRental: false })}
        fullScreen={isExtraSmall}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            margin: isExtraSmall ? 0 : isSmallMobile ? 1 : 2,
            borderRadius: isExtraSmall ? 0 : undefined,
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: isExtraSmall ? '1.1rem' : undefined,
          p: isExtraSmall ? 2 : undefined
        }}>
          <Typography variant={isExtraSmall ? "h6" : "h5"} component="span">
            {rejectDialog.isRental ? 
              (isExtraSmall ? 'Zamietnuť' : 'Zamietnuť prenájom') : 
              (isExtraSmall ? 'Zamietnuť' : 'Zamietnuť email')
            }
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: isExtraSmall ? 2 : undefined }}>
          <TextField
            fullWidth
            multiline
            rows={isExtraSmall ? 2 : 3}
            label={isExtraSmall ? "Dôvod" : "Dôvod zamietnutia"}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            margin="normal"
            size={isExtraSmall ? "small" : "medium"}
            sx={{
              '& .MuiInputLabel-root': {
                fontSize: isExtraSmall ? '0.875rem' : undefined
              },
              '& .MuiInputBase-input': {
                fontSize: isExtraSmall ? '0.875rem' : undefined
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ 
          p: isExtraSmall ? 2 : undefined,
          gap: isExtraSmall ? 1 : undefined
        }}>
          <Button 
            onClick={() => setRejectDialog({ open: false, emailId: null, isRental: false })}
            size={isExtraSmall ? "small" : "medium"}
            sx={{ fontSize: isExtraSmall ? '0.875rem' : undefined }}
          >
            {isExtraSmall ? 'Zrušiť' : 'Zrušiť'}
          </Button>
          <Button 
            onClick={rejectItem} 
            color="error" 
            variant="contained"
            size={isExtraSmall ? "small" : "medium"}
            sx={{ fontSize: isExtraSmall ? '0.875rem' : undefined }}
          >
            {isExtraSmall ? 'Zamietnuť' : 'Zamietnuť'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailManagementDashboard;