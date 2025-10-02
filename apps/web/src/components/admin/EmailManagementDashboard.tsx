import {
  CheckCircle as ApproveIcon,
  Archive as ArchiveIcon,
  Calendar as CalendarIcon,
  Car as CarIcon,
  CheckCircle,
  Trash2 as DeleteIcon,
  Mail as EmailIcon,
  Euro as EuroIcon,
  ChevronUp as ExpandLessIcon,
  ChevronDown as ExpandMoreIcon,
  MapPin as LocationIcon,
  // Edit as EditIcon,
  Clock as PendingIcon,
  User as PersonIcon,
  RefreshCw as RefreshIcon,
  X as RejectIcon,
  Play as StartIcon,
  Square as StopIcon,
  // Settings as SettingsIcon,
  CheckCircle as TestIcon,
  Eye as ViewIcon,
} from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Typography } from '../ui/typography';
import { Spinner } from '../ui/spinner';
import { useEffect, useState } from 'react';

import {
  useArchiveEmail,
  useArchivedEmails,
  useEmailManagement,
  useEmailStats,
  useImapStatus,
  usePendingAutomaticRentals,
  useRejectEmail,
  type EmailFilters,
} from '../../lib/react-query/hooks/useEmailManagement';
import { apiService, getAPI_BASE_URL } from '../../services/api';

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

// interface EmailStats {
//   today: {
//     total: number;
//     processed: number;
//     rejected: number;
//     pending: number;
//   };
//   weeklyTrend: Array<{
//     date: string;
//     total: number;
//     processed: number;
//     rejected: number;
//   }>;
//   topSenders: Array<{
//     sender: string;
//     count: number;
//     processed_count: number;
//   }>;
// }

interface EmailDetail {
  email: EmailEntry & {
    email_content?: string;
    email_html?: string;
    parsed_data?: Record<string, unknown>;
  };
  actions: Array<{
    id: string;
    action: string;
    username: string;
    notes?: string;
    created_at: string;
  }>;
}

const EmailManagementDashboard: React.FC = () => {
  // Responsive design will be handled with Tailwind CSS classes
  // md: breakpoint for mobile, sm: for small mobile, lg: for tablet
  
  // Responsive breakpoints
  const isExtraSmall = false; // sm: breakpoint
  const isSmallMobile = false; // xs: breakpoint  
  const isMobile = false; // md: breakpoint

  // Tabs state
  const [activeTab, setActiveTab] = useState(0);

  // React Query hooks - emailFilters will be defined after state variables

  const {
    data: stats,
    // isLoading: statsLoading,
    error: statsError,
  } = useEmailStats();

  // React Query mutations
  const archiveEmailMutation = useArchiveEmail();
  const rejectEmailMutation = useRejectEmail();
  // const processEmailMutation = useProcessEmail();
  // const bulkArchiveMutation = useBulkArchiveEmails();
  // const bulkRejectMutation = useBulkRejectEmails();
  // const bulkProcessMutation = useBulkProcessEmails();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // IMAP State - React Query
  const {
    data: imapStatus,
    isLoading: imapLoading,
    refetch: refetchImapStatus,
  } = useImapStatus();

  // Filters and pagination
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [senderFilter, setSenderFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [totalPages] = useState(1);
  const pageSize = 20;
  
  // Email filters for React Query
  const emailFilters: EmailFilters = {
    ...(statusFilter && statusFilter !== 'all-statuses' && { status: statusFilter }),
    ...(senderFilter && { sender: senderFilter }),
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  };
  
  // Main emails query
  const {
    data: emails = [],
    isLoading: loading,
    error: emailsError,
    refetch: refetchEmails,
  } = useEmailManagement(emailFilters);

  const typedEmails = emails as unknown as EmailEntry[];

  // Calculated values
  const totalEmails = typedEmails?.length || 0;

  // Pending Rentals State - React Query
  const {
    data: pendingRentals = [],
    isLoading: pendingLoading,
    refetch: refetchPendingRentals,
  } = usePendingAutomaticRentals();
  const [expandedRentals, setExpandedRentals] = useState<Set<string>>(
    new Set()
  );

  // Archive State - React Query
  const [archivePagination, setArchivePagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  const {
    data: archivedEmailsData,
    isLoading: archiveLoading,
    refetch: refetchArchivedEmails,
  } = useArchivedEmails({
    limit: archivePagination.limit,
    offset: archivePagination.offset,
  });

  const archivedEmails = (archivedEmailsData?.emails as EmailEntry[]) || [];
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  // Dialogs
  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    email: EmailDetail | null;
  }>({
    open: false,
    email: null,
  });
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    emailId: string | null;
    isRental?: boolean;
  }>({
    open: false,
    emailId: null,
    isRental: false,
  });
  const [rejectReason, setRejectReason] = useState('');

  // Handle React Query errors
  useEffect(() => {
    if (emailsError) {
      setError(`Chyba pri načítaní emailov: ${emailsError.message}`);
    }
  }, [emailsError]);

  useEffect(() => {
    if (statsError) {
      console.error('Stats error:', statsError);
    }
  }, [statsError]);

  // Refresh function for manual refresh
  // const refreshData = useCallback(() => {
  //   refetchEmails();
  // }, [refetchEmails]);

  // View email detail
  const viewEmailDetail = async (emailId: string) => {
    try {
      console.log('🔍 Loading email detail for:', emailId);
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');

      const directResponse = await fetch(
        `${getAPI_BASE_URL()}/email-management/${emailId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = await directResponse.json();
      console.log('📧 Email detail response:', response);

      if (response.success && response.data) {
        setViewDialog({ open: true, email: response.data });
      } else {
        setError('Chyba pri načítaní detailu emailu');
      }
    } catch (error: unknown) {
      console.error('❌ View email error:', error);
      setError('Chyba pri načítaní detailu emailu');
    }
  };

  // Email actions
  const approveEmail = async (emailId: string) => {
    try {
      setActionLoading(emailId);
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');

      const directResponse = await fetch(
        `${getAPI_BASE_URL()}/email-management/${emailId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = await directResponse.json();

      if (response.success) {
        setSuccess('Email schválený!');
        refetchEmails();
      } else {
        setError(response.error || 'Chyba pri schvaľovaní emailu');
      }
    } catch (error: unknown) {
      console.error('Approve email error:', error);
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
        await rejectEmailMutation.mutateAsync(rejectDialog.emailId);
        setSuccess('Email zamietnutý!');
        setRejectDialog({ open: false, emailId: null, isRental: false });
        setRejectReason('');
      } catch (error: unknown) {
        console.error('Reject email error:', error);
        setError('Chyba pri zamietaní emailu');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const archiveEmail = async (emailId: string) => {
    try {
      setActionLoading(emailId);
      await archiveEmailMutation.mutateAsync(emailId);
      setSuccess('Email archivovaný!');
      window.setTimeout(() => setSuccess(null), 3000);
    } catch (error: unknown) {
      console.error('Archive email error:', error);
      setError('Chyba pri archivovaní emailu');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteEmail = async (emailId: string) => {
    if (
      !window.confirm(
        'Naozaj chcete zmazať tento email? Táto akcia sa nedá vrátiť.'
      )
    ) {
      return;
    }

    try {
      setActionLoading(emailId);
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');

      const directResponse = await fetch(
        `${getAPI_BASE_URL()}/email-management/${emailId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = await directResponse.json();

      if (response.success) {
        setSuccess('Email zmazaný!');
        refetchEmails();
      } else {
        setError(response.error || 'Chyba pri mazaní emailu');
      }
    } catch (error: unknown) {
      console.error('Delete email error:', error);
      setError('Chyba pri mazaní emailu');
    } finally {
      setActionLoading(null);
    }
  };

  const clearHistoricalEmails = async () => {
    if (
      !window.confirm(
        'Naozaj chcete zmazať všetky historické emaily pred dnešným dátumom? Táto akcia sa nedá vrátiť.'
      )
    ) {
      return;
    }

    try {
      setActionLoading('clear-historical');
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');

      const directResponse = await fetch(
        `${getAPI_BASE_URL()}/email-management/clear-historical`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = await directResponse.json();

      if (response.success) {
        setSuccess(`✅ ${response.data.message}`);
        refetchEmails();
        refetchArchivedEmails();
      } else {
        setError(response.error || 'Chyba pri mazaní historických emailov');
      }
    } catch (error: unknown) {
      console.error('Clear historical typedEmails error:', error);
      setError('Chyba pri mazaní historických emailov');
    } finally {
      setActionLoading(null);
    }
  };

  // IMAP API Functions - React Query handles this now

  const testImapConnection = async () => {
    try {
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch(
        `${getAPI_BASE_URL()}/email-imap/test`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = await directResponse.json();
      console.log('🧪 IMAP Test result:', response);

      if (response.success && response.data && response.data.connected) {
        setSuccess('✅ IMAP pripojenie úspešné!');
      } else {
        setError('❌ IMAP pripojenie zlyhalo');
      }
    } catch (error: unknown) {
      console.error('❌ IMAP Test error:', error);
      setError('❌ Chyba pri teste IMAP pripojenia');
    } finally {
      // IMAP loading is handled by React Query
    }
  };

  const startImapMonitoring = async () => {
    try {
      // IMAP loading is handled by React Query
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch(
        `${getAPI_BASE_URL()}/email-imap/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = await directResponse.json();
      console.log('▶️ IMAP Start result:', response);

      setSuccess('▶️ IMAP monitoring spustený!');
      refetchImapStatus(); // Refresh status
    } catch (error: unknown) {
      console.error('❌ IMAP Start error:', error);
      setError('❌ Chyba pri spúšťaní IMAP monitoringu');
    } finally {
      // IMAP loading is handled by React Query
    }
  };

  const stopImapMonitoring = async () => {
    try {
      // IMAP loading is handled by React Query
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch(
        `${getAPI_BASE_URL()}/email-imap/stop`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = await directResponse.json();
      console.log('⏹️ IMAP Stop result:', response);

      setSuccess('⏹️ IMAP monitoring zastavený!');
      refetchImapStatus(); // Refresh status
    } catch (error: unknown) {
      console.error('❌ IMAP Stop error:', error);
      setError('❌ Chyba pri zastavovaní IMAP monitoringu');
    } finally {
      // IMAP loading is handled by React Query
    }
  };

  // ============================================
  // PENDING RENTALS FUNCTIONS
  // ============================================

  // fetchPendingRentals - React Query handles this now

  const handleApproveRental = async (rentalId: string) => {
    try {
      setActionLoading(rentalId);
      await apiService.approveAutomaticRental(rentalId);
      // Refresh pending rentals list
      refetchPendingRentals();
      setSuccess('Prenájom bol úspešne schválený');
    } catch (error: unknown) {
      console.error('Error approving rental:', error);
      setError('Nepodarilo sa schváliť prenájom');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRental = async (rentalId: string, reason: string) => {
    try {
      setActionLoading(rentalId);
      await apiService.rejectAutomaticRental(rentalId, reason);
      // Refresh pending rentals list
      refetchPendingRentals();
      setSuccess('Prenájom bol zamietnutý');
    } catch (error: unknown) {
      console.error('Error rejecting rental:', error);
      setError('Nepodarilo sa zamietnuť prenájom');
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================
  // ARCHIVE FUNCTIONS
  // ============================================

  // Fetch archived typedEmails
  // Fetch archived typedEmails - React Query handles this now
  const fetchArchivedEmails = async (offset = 0) => {
    setArchivePagination(prev => ({ ...prev, offset }));
    refetchArchivedEmails();
  };

  // Bulk archive selected typedEmails
  const bulkArchiveEmails = async () => {
    if (selectedEmails.size === 0) {
      setError('Nie sú vybrané žiadne emaily na archiváciu');
      return;
    }

    try {
      setActionLoading('bulk-archive');

      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch(
        `${getAPI_BASE_URL()}/email-management/bulk-archive`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            emailIds: Array.from(selectedEmails),
            archiveType: 'manual',
          }),
        }
      );

      if (!directResponse.ok) {
        throw new Error(`HTTP error! status: ${directResponse.status}`);
      }

      const response = await directResponse.json();

      if (response.success) {
        setSuccess(
          `${response.data.archivedCount} emailov úspešne archivovaných`
        );
        setSelectedEmails(new Set());
        refetchEmails(); // Refresh main list
        refetchArchivedEmails(); // Refresh archive
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

  // Auto-archive old typedEmails
  const autoArchiveOldEmails = async () => {
    try {
      setActionLoading('auto-archive');

      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch(
        `${getAPI_BASE_URL()}/email-management/auto-archive`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            daysOld: 30,
            statuses: ['processed', 'rejected'],
          }),
        }
      );

      if (!directResponse.ok) {
        throw new Error(`HTTP error! status: ${directResponse.status}`);
      }

      const response = await directResponse.json();

      if (response.success) {
        setSuccess(
          `${response.data.archivedCount} starých emailov automaticky archivovaných`
        );
        refetchEmails(); // Refresh main list
        refetchArchivedEmails(); // Refresh archive
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

      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');
      const directResponse = await fetch(
        `${getAPI_BASE_URL()}/email-management/${emailId}/unarchive`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!directResponse.ok) {
        throw new Error(`HTTP error! status: ${directResponse.status}`);
      }

      const response = await directResponse.json();

      if (response.success) {
        setSuccess('Email úspešne obnovený z archívu');
        refetchEmails(); // Refresh main list
        refetchArchivedEmails(); // Refresh archive
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
      senderFilter,
    });

    refetchEmails();
    refetchImapStatus(); // Load IMAP status
    refetchPendingRentals(); // Load pending rentals
  }, [
    currentPage,
    statusFilter,
    senderFilter,
    refetchEmails,
    refetchImapStatus,
    refetchPendingRentals,
  ]);

  // Status chip styling
  const getStatusChip = (status: string, actionTaken?: string) => {
    const getColor = () => {
      if (status === 'processed' && actionTaken === 'approved')
        return 'default';
      if (status === 'rejected') return 'destructive';
      if (status === 'archived') return 'secondary';
      if (status === 'new') return 'outline';
      return 'default';
    };

    const getLabel = () => {
      if (status === 'processed' && actionTaken === 'approved')
        return 'Schválený';
      if (status === 'rejected') return 'Zamietnutý';
      if (status === 'archived') return 'Archivovaný';
      if (status === 'new') return 'Nový';
      return status;
    };

    return <Badge variant={getColor()} className="text-sm">{getLabel()}</Badge>;
  };

  return (
    <div className={`p-${isExtraSmall ? '1' : isSmallMobile ? '2' : '3'} min-h-screen bg-background`}>
      <div className={`flex justify-between items-${isMobile ? 'start' : 'center'} mb-3 flex-${isSmallMobile ? 'col' : 'row'} gap-${isSmallMobile ? '2' : '0'}`}>
        <Typography
          variant={isExtraSmall ? 'h5' : isSmallMobile ? 'h4' : 'h4'}
          className={`${!isSmallMobile ? 'mb-4' : ''} text-${isExtraSmall ? 'xl' : isSmallMobile ? '2xl' : '2xl'} text-${isSmallMobile ? 'center' : 'left'} ${isSmallMobile ? 'w-full' : 'w-auto'}`}
        >
          📧 Email Management Dashboard
        </Typography>
        <div className={`flex gap-${isExtraSmall ? '0.5' : '1'} items-center flex-${isMobile ? 'wrap' : 'nowrap'} justify-${isSmallMobile ? 'center' : 'end'} ${isSmallMobile ? 'w-full' : 'w-auto'}`}>
          {/* IMAP Status Chip */}
          {imapStatus && (
            <Badge
              variant={
                imapStatus.enabled
                  ? imapStatus.running
                    ? 'default'
                    : 'secondary'
                  : 'outline'
              }
              className="mr-1"
            >
              <EmailIcon className="w-4 h-4 mr-1" />
              {imapStatus.enabled
                ? imapStatus.running
                  ? 'IMAP Beží'
                  : 'IMAP Zastavený'
                : 'IMAP Vypnutý'}
            </Badge>
          )}

          {/* IMAP Control Buttons */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size={isExtraSmall ? 'sm' : 'sm'}
                  onClick={testImapConnection}
                  disabled={imapLoading || !imapStatus?.enabled}
                  className={`min-w-auto px-${isExtraSmall ? '0.5' : '1'} text-${isExtraSmall ? 'xs' : 'sm'}`}
                >
                  {!isExtraSmall && <TestIcon className="w-4 h-4 mr-1" />}
                  {isExtraSmall ? 'T' : 'Test'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Test IMAP pripojenia</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {imapStatus?.enabled && (
            <>
              {!imapStatus.running ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={startImapMonitoring}
                        disabled={imapLoading}
                        className={`min-w-auto px-${isExtraSmall ? '0.5' : '1'} text-${isExtraSmall ? 'xs' : 'sm'} bg-green-50 border-green-200 text-green-700 hover:bg-green-100`}
                      >
                        {!isExtraSmall && <StartIcon className="w-4 h-4 mr-1" />}
                        {isExtraSmall ? 'S' : 'Spusiť'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Spustiť IMAP monitoring</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={stopImapMonitoring}
                        disabled={imapLoading}
                        className={`min-w-auto px-${isExtraSmall ? '0.5' : '1'} text-${isExtraSmall ? 'xs' : 'sm'} bg-red-50 border-red-200 text-red-700 hover:bg-red-100`}
                      >
                        {!isExtraSmall && <StopIcon className="w-4 h-4 mr-1" />}
                        {isExtraSmall ? 'Z' : 'Zastaviť'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zastaviť IMAP monitoring</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          )}

          <Button
            variant="outline"
            onClick={() => {
              refetchEmails();
              refetchImapStatus();
              refetchPendingRentals();
            }}
            disabled={loading}
            size={isSmallMobile ? 'sm' : 'default'}
            className={`text-${isExtraSmall ? 'xs' : 'sm'} px-${isExtraSmall ? '1' : 'default'}`}
          >
            {!isExtraSmall && <RefreshIcon className="w-4 h-4 mr-1" />}
            {isExtraSmall ? 'R' : 'Obnoviť'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-sm underline"
            >
              Zavrieť
            </button>
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-2">
          <AlertDescription>
            {success}
            <button 
              onClick={() => setSuccess(null)}
              className="ml-2 text-sm underline"
            >
              Zavrieť
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-${isExtraSmall ? '1' : isMobile ? '2' : '3'} mb-3`}>
          <div className="col-span-1">
            <Card className={`h-full min-h-${isExtraSmall ? '20' : '25'} transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md`}>
              <CardContent className={`p-${isExtraSmall ? '1' : isMobile ? '1.5' : '2'} flex flex-col justify-center items-center text-center`}>
                <Typography
                  variant={isExtraSmall ? 'caption' : isMobile ? 'body2' : 'h6'}
                  className={`text-primary text-${isExtraSmall ? 'xs' : isMobile ? 'sm' : 'base'} mb-0.5 font-medium`}
                >
                  {isExtraSmall ? '📬' : '📬 Celkom'}
                </Typography>
                <Typography
                  variant={isExtraSmall ? 'h6' : isMobile ? 'h5' : 'h4'}
                  className={`font-bold text-${isExtraSmall ? 'xl' : '2xl'} leading-none`}
                >
                  {(stats as { today?: { total?: number } })?.today?.total || 0}
                </Typography>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-1">
            <Card className={`h-full min-h-${isExtraSmall ? '20' : '25'} transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md`}>
              <CardContent className={`p-${isExtraSmall ? '1' : isMobile ? '1.5' : '2'} flex flex-col justify-center items-center text-center`}>
                <Typography
                  variant={isExtraSmall ? 'caption' : isMobile ? 'body2' : 'h6'}
                  className={`text-green-600 text-${isExtraSmall ? 'xs' : isMobile ? 'sm' : 'base'} mb-0.5 font-medium`}
                >
                  {isExtraSmall ? '✅' : '✅ Schválené'}
                </Typography>
                <Typography
                  variant={isExtraSmall ? 'h6' : isMobile ? 'h5' : 'h4'}
                  className={`font-bold text-${isExtraSmall ? 'xl' : '2xl'} leading-none`}
                >
                  {(stats as { today?: { processed?: number } })?.today
                    ?.processed || 0}
                </Typography>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-1">
            <Card className={`h-full min-h-${isExtraSmall ? '20' : '25'} transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md`}>
              <CardContent className={`p-${isExtraSmall ? '1' : isMobile ? '1.5' : '2'} flex flex-col justify-center items-center text-center`}>
                <Typography
                  variant={isExtraSmall ? 'caption' : isMobile ? 'body2' : 'h6'}
                  className={`text-red-600 text-${isExtraSmall ? 'xs' : isMobile ? 'sm' : 'base'} mb-0.5 font-medium`}
                >
                  {isExtraSmall ? '❌' : '❌ Zamietnuté'}
                </Typography>
                <Typography
                  variant={isExtraSmall ? 'h6' : isMobile ? 'h5' : 'h4'}
                  className={`font-bold text-${isExtraSmall ? 'xl' : '2xl'} leading-none`}
                >
                  {(stats as { today?: { rejected?: number } })?.today
                    ?.rejected || 0}
                </Typography>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-1">
            <Card className={`h-full min-h-${isExtraSmall ? '20' : '25'} transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md`}>
              <CardContent className={`p-${isExtraSmall ? '1' : isMobile ? '1.5' : '2'} flex flex-col justify-center items-center text-center`}>
                <Typography
                  variant={isExtraSmall ? 'caption' : isMobile ? 'body2' : 'h6'}
                  className={`text-yellow-600 text-${isExtraSmall ? 'xs' : isMobile ? 'sm' : 'base'} mb-0.5 font-medium`}
                >
                  {isExtraSmall ? '⏳' : '⏳ Čakajúce'}
                </Typography>
                <Typography
                  variant={isExtraSmall ? 'h6' : isMobile ? 'h5' : 'h4'}
                  className={`font-bold text-${isExtraSmall ? 'xl' : '2xl'} leading-none`}
                >
                  {(stats as { today?: { pending?: number } })?.today
                    ?.pending || 0}
                </Typography>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* IMAP Configuration Info */}
      {imapStatus && (
        <Card className="mb-6">
          <CardContent className={isExtraSmall ? "p-4" : "p-6"}>
                <h3 className={`${isSmallMobile ? 'text-lg' : 'text-xl'} font-semibold mb-4 ${isExtraSmall ? 'text-base' : ''} ${isSmallMobile ? 'text-center' : 'text-left'}`}>
                  📧 IMAP Konfigurácia
                </h3>
            <div className={`grid grid-cols-1 gap-${isSmallMobile ? '4' : '4'}`}>
              <div className="col-span-1">
                <div
                  className={`flex items-center gap-2 ${isSmallMobile ? 'justify-center' : 'justify-start'} ${isExtraSmall ? 'flex-col' : 'flex-row'}`}
                >
                  <p className={`text-sm text-muted-foreground ${isExtraSmall ? 'text-sm' : ''}`}>
                    Status:
                  </p>
                  <Badge
                    variant={
                      imapStatus.enabled
                        ? imapStatus.running
                          ? 'default'
                          : 'secondary'
                        : 'destructive'
                    }
                    className={isExtraSmall ? 'text-xs' : ''}
                  >
                    {imapStatus.enabled
                      ? imapStatus.running
                        ? 'Beží'
                        : 'Zastavený'
                      : 'Vypnutý'}
                  </Badge>
                </div>
              </div>
              <div className="col-span-1">
                <div className={isSmallMobile ? 'text-center' : 'text-left'}>
                  <p className={`text-sm text-muted-foreground ${isExtraSmall ? 'text-sm' : ''} break-words`}>
                    Server:{' '}
                    <strong>
                      {imapStatus.config?.host || 'Nekonfigurovaný'}
                    </strong>
                  </p>
                </div>
              </div>
              <div className="col-span-12 md:col-span-4">
                <div className={isSmallMobile ? 'text-center' : 'text-left'}>
                  <p className={`text-sm text-muted-foreground ${isExtraSmall ? 'text-sm' : ''} break-words`}>
                    Používateľ:{' '}
                    <strong>
                      {imapStatus.config?.user || 'Nekonfigurovaný'}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
            {!imapStatus.enabled && (
              <Alert className={`mt-4 ${isExtraSmall ? 'text-sm' : ''}`}>
                IMAP monitoring je vypnutý. Skontrolujte konfiguráciu v
                backend/.env súbore.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-3">
        <CardContent className={`p-${isExtraSmall ? '2' : isMobile ? '2' : '3'}`}>
          <h3 className={`mb-4 text-${isExtraSmall ? 'base' : 'lg'} text-${isSmallMobile ? 'center' : 'left'} font-semibold`}>
            🔍 Filtre
          </h3>
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-${isExtraSmall ? '1.5' : isMobile ? '2' : '2'}`}>
            <div className="col-span-1">
              <div className="space-y-2">
                <Label className={`text-${isExtraSmall ? 'sm' : 'base'}`}>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={`text-${isExtraSmall ? 'sm' : 'base'}`}>
                    <SelectValue placeholder="Vyberte status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-statuses">Všetky</SelectItem>
                    <SelectItem value="new">Nové</SelectItem>
                    <SelectItem value="processed">Spracované</SelectItem>
                    <SelectItem value="rejected">Zamietnuté</SelectItem>
                    <SelectItem value="archived">Archivované</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="col-span-1">
              <div className="space-y-2">
                <Label className={`text-${isExtraSmall ? 'sm' : 'base'}`}>Odosielateľ</Label>
                <Input
                  value={senderFilter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSenderFilter(e.target.value)}
                  placeholder={
                    isExtraSmall ? 'Hľadať...' : 'Hľadať podľa odosielateľa...'
                  }
                  className={`text-${isExtraSmall ? 'sm' : 'base'}`}
                />
              </div>
            </div>
            <div className="col-span-1 md:col-span-1">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('');
                  setSenderFilter('');
                  setCurrentPage(1);
                }}
                className={`w-full text-${isExtraSmall ? 'sm' : 'base'} py-${isExtraSmall ? '1' : 'default'}`}
              >
                {isExtraSmall ? 'Vyčistiť' : 'Vyčistiť filtre'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <div className="border-b border-border mb-3 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300">
        <Tabs value={activeTab.toString()} onValueChange={(value) => setActiveTab(parseInt(value))} className="w-full">
          <TabsList className={`grid w-full grid-cols-3 min-h-${isExtraSmall ? '10' : '12'}`}>
            <TabsTrigger value="0" className={`text-${isExtraSmall ? 'xs' : isSmallMobile ? 'sm' : 'base'}`}>
              {!isExtraSmall && <EmailIcon className="w-4 h-4 mr-1" />}
              {isExtraSmall
                ? 'Emaily'
                : isSmallMobile
                  ? 'História'
                  : 'História Emailov'}
            </TabsTrigger>
            <TabsTrigger value="1" className={`text-${isExtraSmall ? 'xs' : isSmallMobile ? 'sm' : 'base'}`}>
              <div className="flex items-center gap-1">
                {!isExtraSmall && <PendingIcon className="w-4 h-4 mr-1" />}
                <span>
                  {isExtraSmall
                    ? 'Prenájmy'
                    : isSmallMobile
                      ? 'Čakajúce'
                      : 'Čakajúce Prenájmy'}
                </span>
                {pendingRentals.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingRentals.length}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="2" className={`text-${isExtraSmall ? 'xs' : isSmallMobile ? 'sm' : 'base'}`}>
              <div className="flex items-center gap-1">
                {!isExtraSmall && <ArchiveIcon className="w-4 h-4 mr-1" />}
                <span>
                  {isExtraSmall
                    ? 'Archív'
                    : isSmallMobile
                      ? 'Archív'
                      : 'Archív Emailov'}
                </span>
                {archivePagination.total > 0 && (
                  <Badge variant="outline" className="ml-1">
                    {archivePagination.total}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <TabsContent value="0">
        {/* Email Table */}
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold mb-4">
              📋 Emaily ({totalEmails} celkom)
            </h3>

            {loading ? (
              <div className="flex justify-center p-6">
                <Spinner />
              </div>
            ) : (
              <>
                {/* Mobile View - Card List */}
                {isMobile ? (
                  <div className="space-y-2">
                    {typedEmails.map(email => (
                      <Card
                        key={email.id}
                        className="border border-border hover:border-primary hover:shadow-md"
                      >
                        <CardContent className="p-4 last:pb-4">
                          {/* Header - Subject and Status */}
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold flex-1 mr-2 overflow-hidden text-ellipsis line-clamp-2">
                              {email.subject}
                            </h4>
                            {getStatusChip(email.status, email.action_taken)}
                          </div>

                          {/* Sender and Date */}
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                              <Avatar
                                className="w-6 h-6 text-xs bg-primary text-primary-foreground"
                              >
                                {email.sender.charAt(0).toUpperCase()}
                              </Avatar>
                              <p className="text-sm text-muted-foreground">
                                {email.sender.length > 25
                                  ? `${email.sender.substring(0, 25)}...`
                                  : email.sender}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(email.received_at).toLocaleDateString(
                                'sk'
                              )}
                            </span>
                          </div>

                          {/* Order Number */}
                          {email.order_number && (
                            <div className="mb-4">
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                📋 {email.order_number}
                              </Badge>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              onClick={() => viewEmailDetail(email.id)}
                              variant="outline"
                              className="min-w-0 text-xs flex items-center gap-2"
                            >
                              Detail
                            </Button>

                            {email.status === 'new' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => approveEmail(email.id)}
                                  disabled={actionLoading === email.id}
                                  variant="outline"
                                  className="min-w-0 text-xs text-green-600 hover:text-green-700 flex items-center gap-2"
                                >
                                  Schváliť
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    setRejectDialog({
                                      open: true,
                                      emailId: email.id,
                                    })
                                  }
                                  variant="outline"
                                  className="min-w-0 text-xs text-red-600 hover:text-red-700 flex items-center gap-2"
                                >
                                  Zamietnuť
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              onClick={() => archiveEmail(email.id)}
                              disabled={actionLoading === email.id}
                              variant="outline"
                              className="min-w-0 text-xs flex items-center gap-2"
                            >
                              Archív
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* Desktop View - Table */
                  <div className="overflow-x-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableCell className="min-w-[200px]">Predmet</TableCell>
                          <TableCell className="min-w-[150px]">
                            Odosielateľ
                          </TableCell>
                          <TableCell className="min-w-[120px]">Prijaté</TableCell>
                          <TableCell className="min-w-[100px]">Status</TableCell>
                          <TableCell className="min-w-[120px]">
                            Objednávka
                          </TableCell>
                          <TableCell className="min-w-[200px]">Akcie</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {typedEmails.map(email => (
                          <TableRow key={email.id} className="hover:bg-muted/50">
                            <TableCell>
                              <p className="max-w-[250px] overflow-hidden text-ellipsis line-clamp-2">
                                {email.subject}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="max-w-[150px] whitespace-nowrap">
                                {email.sender}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">
                                {new Date(email.received_at).toLocaleString(
                                  'sk'
                                )}
                              </p>
                            </TableCell>
                            <TableCell>
                              {getStatusChip(email.status, email.action_taken)}
                            </TableCell>
                            <TableCell>
                              {email.order_number ? (
                                <Badge
                                  variant="outline"
                                >
                                  {email.order_number}
                                </Badge>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  -
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 flex-wrap">
                                <Tooltip>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewEmailDetail(email.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <ViewIcon className="h-4 w-4" />
                                  </Button>
                                </Tooltip>

                                {email.status === 'new' && (
                                  <Tooltip>
                                    <span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => approveEmail(email.id)}
                                        disabled={actionLoading === email.id}
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                      >
                                        {actionLoading === email.id ? (
                                          <Spinner className="w-5 h-5" />
                                        ) : (
                                          <ApproveIcon className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </span>
                                  </Tooltip>
                                )}

                                {email.status === 'new' && (
                                  <Tooltip>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setRejectDialog({
                                          open: true,
                                          emailId: email.id,
                                        })
                                      }
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <RejectIcon className="h-4 w-4" />
                                    </Button>
                                  </Tooltip>
                                )}

                                <Tooltip>
                                  <span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => archiveEmail(email.id)}
                                      disabled={actionLoading === email.id}
                                      className="h-8 w-8 p-0"
                                    >
                                      {actionLoading === email.id ? (
                                        <Spinner className="w-5 h-5" />
                                      ) : (
                                        <ArchiveIcon className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </span>
                                </Tooltip>

                                <Tooltip>
                                  <span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteEmail(email.id)}
                                      disabled={actionLoading === email.id}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                      {actionLoading === email.id ? (
                                        <Spinner className="w-5 h-5" />
                                      ) : (
                                        <DeleteIcon className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </span>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="flex justify-center items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Predchádzajúca
                      </Button>
                      <span className="text-sm">
                        Strana {currentPage} z {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Ďalšia
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Pending Rentals Tab */}
      <TabsContent value="1">
        <Card>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold mb-4">
                ⏳ Čakajúce automatické prenájmy ({pendingRentals.length})
              </h3>
              <Button
                variant="outline"
                onClick={() => refetchPendingRentals()}
                disabled={pendingLoading}
                className="flex items-center gap-2"
              >
                Obnoviť
              </Button>
            </div>

            {pendingLoading ? (
              <div className="flex justify-center p-8">
                <Spinner />
              </div>
            ) : pendingRentals.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
                <h4 className="text-lg font-semibold mb-4">
                  Žiadne čakajúce prenájmy
                </h4>
                <p className="text-sm text-muted-foreground">
                  Všetky automatické prenájmy boli spracované alebo žiadne ešte
                  nepriišli.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingRentals.map(rental => (
                  <div className="col-span-12" key={rental.id}>
                    <Card className="mb-4 border border-border">
                      <CardContent>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {/* Rental Header */}
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="flex items-center gap-2">
                                    <CarIcon className="text-primary" />
                                    <span className="text-lg font-semibold">
                                      {rental.vehicleName || 'Neznáme vozidlo'}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {rental.vehicleCode}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <PersonIcon className="w-4 h-4" />
                                  <span className="text-sm text-muted-foreground">
                                    {rental.customerName}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                    variant="ghost"
                                    onClick={() =>
                                      handleApproveRental(rental.id)
                                    }
                                    disabled={actionLoading === rental.id}
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                  >
                                    {actionLoading === rental.id ? (
                                      <Spinner className="w-5 h-5" />
                                    ) : (
                                      <ApproveIcon className="h-4 w-4" />
                                    )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Schváliť</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                    variant="ghost"
                                    onClick={() =>
                                      setRejectDialog({
                                        open: true,
                                        emailId: rental.id,
                                        isRental: true,
                                      })
                                    }
                                    disabled={actionLoading === rental.id}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <RejectIcon className="h-4 w-4" />
                                  </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Zamietnuť</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <Button
                                    variant="ghost"
                                    onClick={() =>
                                      toggleRentalExpansion(rental.id)
                                    }
                                    className="h-8 w-8 p-0"
                                  >
                                    {expandedRentals.has(rental.id) ? (
                                      <ExpandLessIcon className="h-4 w-4" />
                                    ) : (
                                      <ExpandMoreIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                </Tooltip>
                              </div>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 gap-4 mb-4">
                              <div className="col-span-12 sm:col-span-6 md:col-span-3">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                  <p className="text-sm">
                                    <strong>Od:</strong>{' '}
                                    {formatDate(rental.startDate)}
                                  </p>
                                </div>
                              </div>
                              <div className="col-span-12 sm:col-span-6 md:col-span-3">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                  <p className="text-sm">
                                    <strong>Do:</strong>{' '}
                                    {formatDate(rental.endDate)}
                                  </p>
                                </div>
                              </div>
                              <div className="col-span-12 sm:col-span-6 md:col-span-3">
                                <div className="flex items-center gap-2">
                                  <EuroIcon className="w-4 h-4 text-muted-foreground" />
                                  <p className="text-sm">
                                    <strong>Cena:</strong>{' '}
                                    {formatCurrency(rental.totalPrice)}
                                  </p>
                                </div>
                              </div>
                              <div className="col-span-12 sm:col-span-6 md:col-span-3">
                                <div className="flex items-center gap-2">
                                  <LocationIcon className="w-4 h-4 text-muted-foreground" />
                                  <p className="text-sm">
                                    <strong>Miesto:</strong>{' '}
                                    {rental.handoverPlace}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            <div className={`transition-all duration-300 ${expandedRentals.has(rental.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                              <Separator className="mb-2" />
                              <div className="grid grid-cols-1 gap-4">
                                <div className="col-span-12 sm:col-span-6">
                                  <p className="text-sm">
                                    <strong>Objednávka:</strong>{' '}
                                    {rental.orderNumber}
                                  </p>
                                  <p className="text-sm">
                                    <strong>Email:</strong>{' '}
                                    {rental.customerEmail}
                                  </p>
                                  <p className="text-sm">
                                    <strong>Telefón:</strong>{' '}
                                    {rental.customerPhone}
                                  </p>
                                </div>
                                <div className="col-span-12 sm:col-span-6">
                                  <p className="text-sm">
                                    <strong>Denné km:</strong>{' '}
                                    {rental.dailyKilometers}
                                  </p>
                                  <p className="text-sm">
                                    <strong>Záloha:</strong>{' '}
                                    {formatCurrency(rental.deposit || 0)}
                                  </p>
                                  <p className="text-sm">
                                    <strong>Platba:</strong>{' '}
                                    {rental.paymentMethod}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Archive Tab */}
      <TabsContent value="2">
        <Card>
          <CardContent>
            <div className={`flex justify-between items-${isMobile ? 'start' : 'center'} mb-6 flex-${isMobile ? 'col' : 'row'} gap-${isMobile ? '2' : '0'}`}>
              <h3 className={`text-lg font-semibold ${isMobile ? 'mb-4' : 'mb-0'}`}>
                📁 Archív emailov ({archivePagination.total})
              </h3>
              <div className={`flex gap-2 flex-wrap justify-${isMobile ? 'center' : 'end'}`}>
                <Button
                  variant="outline"
                  onClick={() => fetchArchivedEmails(0)}
                  disabled={archiveLoading}
                  className="flex items-center gap-2"
                  size={isSmallMobile ? 'sm' : 'default'}
                >
                  {isExtraSmall ? 'Obnoviť' : 'Obnoviť'}
                </Button>
                <Button
                  variant="outline"
                  onClick={autoArchiveOldEmails}
                  disabled={actionLoading === 'auto-archive'}
                  className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                  size={isSmallMobile ? 'sm' : 'default'}
                >
                  {isExtraSmall ? 'Auto' : 'Auto-archív'}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearHistoricalEmails}
                  disabled={actionLoading === 'clear-historical'}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  size={isSmallMobile ? 'sm' : 'default'}
                >
                  {isExtraSmall ? 'Vymazať' : 'Vymazať historické'}
                </Button>
                {selectedEmails.size > 0 && (
                  <Button
                    variant="default"
                    onClick={bulkArchiveEmails}
                    disabled={actionLoading === 'bulk-archive'}
                    size={isSmallMobile ? 'sm' : 'default'}
                    className="flex items-center gap-2"
                  >
                    {isExtraSmall
                      ? `Archív (${selectedEmails.size})`
                      : `Archivovať (${selectedEmails.size})`}
                  </Button>
                )}
              </div>
            </div>

            {archiveLoading ? (
              <div className="flex justify-center p-8">
                <Spinner />
              </div>
            ) : archivedEmails.length === 0 ? (
              <div className="text-center py-12">
                <ArchiveIcon className="w-12 h-12 text-gray-400 mb-4" />
                <h4 className="text-lg font-semibold mb-4">
                  Archív je prázdny
                </h4>
                <p className="text-sm text-muted-foreground">
                  Žiadne emaily nie sú archivované. Schválené a zamietnuté
                  emaily sa automaticky archivujú po 30 dňoch.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile View - Card List */}
                {isMobile ? (
                  <div className="space-y-2">
                    {archivedEmails.map(email => (
                      <Card
                        key={email.id}
                        className="border border-border hover:border-primary hover:shadow-md"
                      >
                        <CardContent className="p-4 last:pb-4">
                          {/* Header - Subject and Status */}
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold flex-1 mr-2 overflow-hidden text-ellipsis line-clamp-2">
                              {email.subject}
                            </h4>
                            {getStatusChip(email.status, email.action_taken)}
                          </div>

                          {/* Sender and Date */}
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6 text-xs bg-gray-500 text-white">
                                {email.sender.charAt(0).toUpperCase()}
                              </Avatar>
                              <p className="text-sm text-muted-foreground">
                                {email.sender.length > 25
                                  ? `${email.sender.substring(0, 25)}...`
                                  : email.sender}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(email.received_at).toLocaleDateString(
                                'sk'
                              )}
                            </span>
                          </div>

                          {/* Order Number */}
                          {email.order_number && (
                            <div className="mb-4">
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                📋 {email.order_number}
                              </Badge>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              onClick={() => viewEmailDetail(email.id)}
                              variant="outline"
                              className="min-w-0 text-xs flex items-center gap-2"
                            >
                              Detail
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => unarchiveEmail(email.id)}
                              disabled={actionLoading === email.id}
                              variant="outline"
                              className="min-w-0 text-xs text-green-600 hover:text-green-700 flex items-center gap-2"
                            >
                              Obnoviť
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* Desktop View - Table */
                  <div className="overflow-x-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableCell className="min-w-[200px]">Predmet</TableCell>
                          <TableCell className="min-w-[150px]">
                            Odosielateľ
                          </TableCell>
                          <TableCell className="min-w-[120px]">
                            Archivované
                          </TableCell>
                          <TableCell className="min-w-[100px]">Status</TableCell>
                          <TableCell className="min-w-[120px]">
                            Objednávka
                          </TableCell>
                          <TableCell className="min-w-[150px]">Akcie</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archivedEmails.map(email => (
                          <TableRow key={email.id} className="hover:bg-muted/50">
                            <TableCell>
                              <p className="max-w-[250px] overflow-hidden text-ellipsis line-clamp-2">
                                {email.subject}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="max-w-[150px] whitespace-nowrap">
                                {email.sender}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">
                                {new Date(email.received_at).toLocaleString(
                                  'sk'
                                )}
                              </p>
                            </TableCell>
                            <TableCell>
                              {getStatusChip(email.status, email.action_taken)}
                            </TableCell>
                            <TableCell>
                              {email.order_number ? (
                                <Badge
                                  variant="outline"
                                >
                                  {email.order_number}
                                </Badge>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  -
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 flex-wrap">
                                <Tooltip>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewEmailDetail(email.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <ViewIcon className="h-4 w-4" />
                                  </Button>
                                </Tooltip>

                                <Tooltip>
                                  <span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => unarchiveEmail(email.id)}
                                      disabled={actionLoading === email.id}
                                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                    >
                                      {actionLoading === email.id ? (
                                        <Spinner className="w-5 h-5" />
                                      ) : (
                                        <RefreshIcon className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </span>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {archivePagination.total > archivePagination.limit && (
                  <div className="flex justify-center mt-4">
                    <div className="flex justify-center items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOffset = Math.max(0, archivePagination.offset - archivePagination.limit);
                          fetchArchivedEmails(newOffset);
                        }}
                        disabled={archivePagination.offset === 0}
                      >
                        Predchádzajúca
                      </Button>
                      <span className="text-sm">
                        Strana {Math.floor(archivePagination.offset / archivePagination.limit) + 1} z {Math.ceil(archivePagination.total / archivePagination.limit)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOffset = archivePagination.offset + archivePagination.limit;
                          fetchArchivedEmails(newOffset);
                        }}
                        disabled={archivePagination.offset + archivePagination.limit >= archivePagination.total}
                      >
                        Ďalšia
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* View Email Dialog */}
      <Dialog
        open={viewDialog.open}
        onOpenChange={(open) => !open && setViewDialog({ open: false, email: null })}
      >
        <DialogTitle className={isExtraSmall ? 'text-lg p-4' : 'p-6'}>
          <div className="flex items-center gap-2">
            <EmailIcon className={isExtraSmall ? "w-5 h-5" : "w-6 h-6"} />
            <span className={isExtraSmall ? "text-lg font-semibold" : "text-xl font-semibold"}>
              {isExtraSmall ? 'Detail' : 'Email Detail'}
            </span>
          </div>
        </DialogTitle>
        <DialogContent className={isExtraSmall ? 'p-4' : 'p-6'}>
          {viewDialog.email && (
            <div>
              <h4 className={`${isExtraSmall ? 'text-base' : 'text-lg'} font-semibold mb-4 break-words`}>
                {viewDialog.email.email.subject}
              </h4>
              <p className={`text-sm text-muted-foreground mb-4 break-words ${isExtraSmall ? 'text-xs' : ''}`}>
                Od: {viewDialog.email.email.sender} |{' '}
                {new Date(viewDialog.email.email.received_at).toLocaleString(
                  'sk'
                )}
              </p>

              {getStatusChip(
                viewDialog.email.email.status,
                viewDialog.email.email.action_taken
              )}

              {viewDialog.email.email.email_content && (
                <div className="mt-2">
                  <h5 className="text-sm font-semibold mb-2">
                    Obsah emailu:
                  </h5>
                  <div className="p-2 max-h-48 overflow-auto border rounded-lg bg-card">
                    <p className="text-sm whitespace-pre-wrap">
                      {viewDialog.email.email.email_content.substring(0, 1000)}
                      {viewDialog.email.email.email_content.length > 1000 &&
                        '...'}
                    </p>
                  </div>
                </div>
              )}

              {viewDialog.email.email.parsed_data && (
                <div className="mt-2">
                  <h5 className="text-sm font-semibold mb-2">
                    Parsované údaje:
                  </h5>
                  <div className="p-2 border rounded-lg bg-card">
                    <pre className="text-xs m-0 whitespace-pre-wrap">
                      {JSON.stringify(
                        viewDialog.email.email.parsed_data,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {viewDialog.email.actions &&
                viewDialog.email.actions.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-sm font-semibold mb-2">
                      História akcií:
                    </h5>
                    {viewDialog.email.actions.map(action => (
                      <div key={action.id} className="flex justify-between py-1">
                        <p className="text-sm">
                          {action.action} - {action.username}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(action.created_at).toLocaleString('sk')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button onClick={() => setViewDialog({ open: false, email: null })}>
            Zatvoriť
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => !open && setRejectDialog({ open: false, emailId: null, isRental: false })}
      >
        <DialogTitle className={isExtraSmall ? 'text-lg p-4' : 'p-6'}>
          <span className={isExtraSmall ? 'text-lg font-semibold' : 'text-xl font-semibold'}>
            {rejectDialog.isRental
              ? isExtraSmall
                ? 'Zamietnuť'
                : 'Zamietnuť prenájom'
              : isExtraSmall
                ? 'Zamietnuť'
                : 'Zamietnuť email'}
          </span>
        </DialogTitle>
        <DialogContent className={isExtraSmall ? 'p-4' : 'p-6'}>
          <div className="space-y-2">
            <Label className={isExtraSmall ? 'text-sm' : 'text-base'}>
              {isExtraSmall ? 'Dôvod' : 'Dôvod zamietnutia'}
            </Label>
            <textarea
              value={rejectReason}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRejectReason(e.target.value)}
              rows={isExtraSmall ? 2 : 3}
              className={`w-full px-3 py-2 border border-input bg-background rounded-md resize-none ${isExtraSmall ? 'text-sm' : 'text-base'} focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent`}
            />
          </div>
        </DialogContent>
        <DialogFooter className={`${isExtraSmall ? 'p-4 gap-2' : 'p-6 gap-4'} flex justify-end`}>
          <Button
            onClick={() =>
              setRejectDialog({ open: false, emailId: null, isRental: false })
            }
            size={isExtraSmall ? 'sm' : 'default'}
            className={isExtraSmall ? 'text-sm' : 'text-base'}
          >
            {isExtraSmall ? 'Zrušiť' : 'Zrušiť'}
          </Button>
          <Button
            onClick={rejectItem}
            variant="destructive"
            size={isExtraSmall ? 'sm' : 'default'}
            className={isExtraSmall ? 'text-sm' : 'text-base'}
          >
            {isExtraSmall ? 'Zamietnuť' : 'Zamietnuť'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default EmailManagementDashboard;
