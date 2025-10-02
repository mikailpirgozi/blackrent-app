/**
 * Email Management Layout - Hlavný refaktorovaný komponent
 * Nahradí pôvodný EmailManagementDashboard.tsx
 */

import {
  Archive,
  Mail,
  Clock,
  RefreshCw,
  Play,
  Square,
  CheckCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// shadcn/ui components
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Typography } from '@/components/ui/typography';

// Hooks
import { EmailArchiveTab } from './components/EmailArchiveTab';
import { EmailFilters } from './components/EmailFilters';
import { EmailHistoryTab } from './components/EmailHistoryTab';
import { EmailStatsCards } from './components/EmailStatsCards';
import { ImapStatusCard } from './components/ImapStatusCard';
import { PendingRentalsTab } from './components/PendingRentalsTab';
import { useEmailApi } from './hooks/useEmailApi';
import { useImapStatus } from './hooks/useImapStatus';
import { usePendingRentals } from './hooks/usePendingRentals';

// Types
import type { EmailStats } from './types/email-types';

const EmailManagementLayout: React.FC = () => {
  // Tabs state
  const [activeTab, setActiveTab] = useState('history');

  // Filters state
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [senderFilter, setSenderFilter] = useState<string>('');

  // Stats state
  const [stats, setStats] = useState<EmailStats | null>(null);

  // API Hooks
  const {
    error: emailError,
    success: emailSuccess,
    // setError: setEmailError,
    // setSuccess: setEmailSuccess,
    fetchStats,
  } = useEmailApi();

  const {
    imapStatus,
    imapLoading,
    error: imapError,
    success: imapSuccess,
    // setError: setImapError,
    // setSuccess: setImapSuccess,
    fetchImapStatus,
    testImapConnection,
    startImapMonitoring,
    stopImapMonitoring,
  } = useImapStatus();

  const { pendingRentals, fetchPendingRentals } = usePendingRentals();

  // Combine errors and success messages
  const error = emailError || imapError;
  const success = emailSuccess || imapSuccess;
  // const setError = (msg: string | null) => {
  //   setEmailError(msg);
  //   setImapError(msg);
  // };
  // const setSuccess = (msg: string | null) => {
  //   setEmailSuccess(msg);
  //   setImapSuccess(msg);
  // };

  // Initial load
  useEffect(() => {
    console.log('🚀 EMAIL MANAGEMENT LAYOUT useEffect triggered');

    const initializeData = async () => {
      try {
        const [statsData] = await Promise.all([
          fetchStats(),
          fetchImapStatus(),
          fetchPendingRentals(),
        ]);

        if (statsData) {
          setStats(statsData);
        }
      } catch (err) {
        console.error('❌ Error initializing email management data:', err);
      }
    };

    initializeData();
  }, [fetchStats, fetchImapStatus, fetchPendingRentals]);

  // Handle filter changes
  const handleClearFilters = () => {
    setStatusFilter('');
    setSenderFilter('');
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      const [statsData] = await Promise.all([
        fetchStats(),
        fetchImapStatus(),
        fetchPendingRentals(),
      ]);

      if (statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.error('❌ Error refreshing data:', err);
    }
  };

  return (
    <div className="p-3 md:p-6 min-h-screen bg-background">
      {/* Header */}
      <div className="flex justify-between items-start md:items-center mb-6 flex-col md:flex-row gap-4">
        <Typography
          variant="h4"
          className="text-xl md:text-2xl lg:text-3xl font-bold text-center md:text-left w-full md:w-auto"
        >
          📧 Email Management Dashboard
        </Typography>
        <div className="flex gap-2 items-center flex-wrap justify-center md:justify-end w-full md:w-auto">
          {/* IMAP Status Badge */}
          {imapStatus && (
            <Badge
              variant={imapStatus.enabled ? (imapStatus.running ? 'default' : 'secondary') : 'outline'}
              className="text-xs"
            >
              <Mail className="w-3 h-3 mr-1" />
              {imapStatus.enabled
                ? imapStatus.running
                  ? 'IMAP Beží'
                  : 'IMAP Zastavený'
                : 'IMAP Vypnutý'}
            </Badge>
          )}

          {/* IMAP Control Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={testImapConnection}
            disabled={imapLoading || !imapStatus?.enabled}
            className="text-xs px-2"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Test
          </Button>

          {imapStatus?.enabled && (
            <>
              {!imapStatus.running ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startImapMonitoring}
                  disabled={imapLoading}
                  className="text-xs px-2 text-green-600 border-green-600 hover:bg-green-50"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Spustiť
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopImapMonitoring}
                  disabled={imapLoading}
                  className="text-xs px-2 text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Square className="w-3 h-3 mr-1" />
                  Zastaviť
                </Button>
              )}
            </>
          )}

          <Button
            variant="outline"
            onClick={handleRefresh}
            size="sm"
            className="text-xs px-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Obnoviť
          </Button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <EmailStatsCards stats={stats} />

      {/* IMAP Configuration Info */}
      <ImapStatusCard imapStatus={imapStatus} />

      {/* Filters */}
      <EmailFilters
        statusFilter={statusFilter}
        senderFilter={senderFilter}
        onStatusFilterChange={setStatusFilter}
        onSenderFilterChange={setSenderFilter}
        onClearFilters={handleClearFilters}
      />

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">História Emailov</span>
            <span className="sm:hidden">Emaily</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Čakajúce Prenájmy</span>
            <span className="sm:hidden">Prenájmy</span>
            {pendingRentals.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {pendingRentals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archive" className="flex items-center gap-2">
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">Archív Emailov</span>
            <span className="sm:hidden">Archív</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="history">
          <EmailHistoryTab
            statusFilter={statusFilter}
            senderFilter={senderFilter}
          />
        </TabsContent>

        <TabsContent value="pending">
          <PendingRentalsTab />
        </TabsContent>

        <TabsContent value="archive">
          <EmailArchiveTab senderFilter={senderFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailManagementLayout;