/**
 * Custom hook pre Email API operácie
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import { useState, useCallback } from 'react';

import { apiService, getAPI_BASE_URL } from '../../../services/api';
import type {
  EmailEntry,
  EmailStats,
  EmailDetail,
  ArchivePagination,
} from '../types/email-types';
import {
  PAGE_SIZE,
  AUTO_ARCHIVE_DAYS,
  AUTO_ARCHIVE_STATUSES,
} from '../utils/email-constants';

export const useEmailApi = () => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper function pre direct fetch (zachováva pôvodnú logiku)
  const directFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');
      return fetch(`${getAPI_BASE_URL()}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
    },
    []
  );

  // Fetch emails with filters
  const fetchEmails = useCallback(
    async (
      currentPage: number,
      statusFilter: string,
      senderFilter: string
    ): Promise<{
      emails: EmailEntry[];
      totalEmails: number;
      totalPages: number;
    }> => {
      try {
        setLoading(true);

        // DEBUG: Check authentication (zachováva pôvodné debug logy)
        console.log('🔍 EMAIL DASHBOARD DEBUG:');
        console.log(
          '- Token:',
          localStorage.getItem('blackrent_token') ? 'EXISTS' : 'MISSING'
        );
        console.log(
          '- Session token:',
          sessionStorage.getItem('blackrent_token') ? 'EXISTS' : 'MISSING'
        );
        console.log('- API Base URL:', getAPI_BASE_URL());

        const params = new URLSearchParams({
          limit: PAGE_SIZE.toString(),
          offset: ((currentPage - 1) * PAGE_SIZE).toString(),
        });

        if (statusFilter) params.append('status', statusFilter);
        if (senderFilter) params.append('sender', senderFilter);

        console.log('🌐 About to call API:', `/email-management?${params}`);

        const directResponse = await directFetch(`/email-management?${params}`);

        console.log(
          '🚀 Direct fetch response:',
          directResponse.status,
          directResponse.statusText
        );
        const response = await directResponse.json();
        console.log('📦 Direct fetch data:', response);

        if (response.success) {
          const totalEmails = response.data.pagination.total;
          const totalPages = Math.ceil(totalEmails / PAGE_SIZE);
          return {
            emails: response.data.emails,
            totalEmails,
            totalPages,
          };
        } else {
          throw new Error('Chyba pri načítaní emailov');
        }
      } catch (error: unknown) {
        console.error('❌ EMAIL DASHBOARD - Fetch emails error:', err);
        console.error('❌ ERROR Details:', {
          message: err.message,
          status: err.status,
          stack: err.stack,
        });
        setError(`Chyba pri načítaní emailov: ${err.message}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [directFetch]
  );

  // Fetch statistics
  const fetchStats = useCallback(async (): Promise<EmailStats | null> => {
    try {
      console.log('📊 Fetching stats with direct fetch...');

      const directResponse = await directFetch(
        '/email-management/stats/dashboard'
      );

      console.log(
        '📊 Stats fetch response:',
        directResponse.status,
        directResponse.statusText
      );
      const response = await directResponse.json();
      console.log('📊 Stats data:', response);

      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error: unknown) {
      console.error('Fetch stats error:', err);
      return null;
    }
  }, [directFetch]);

  // View email detail
  const viewEmailDetail = useCallback(
    async (emailId: string): Promise<EmailDetail | null> => {
      try {
        console.log('🔍 Loading email detail for:', emailId);

        const directResponse = await directFetch(
          `/email-management/${emailId}`
        );
        const response = await directResponse.json();
        console.log('📧 Email detail response:', response);

        if (response.success && response.data) {
          return response.data;
        } else {
          setError('Chyba pri načítaní detailu emailu');
          return null;
        }
      } catch (error: unknown) {
        console.error('❌ View email error:', err);
        setError('Chyba pri načítaní detailu emailu');
        return null;
      }
    },
    [directFetch]
  );

  // Email actions
  const approveEmail = useCallback(
    async (emailId: string): Promise<boolean> => {
      try {
        setActionLoading(emailId);

        const directResponse = await directFetch(
          `/email-management/${emailId}/approve`,
          {
            method: 'POST',
          }
        );

        const response = await directResponse.json();

        if (response.success) {
          setSuccess('Email schválený!');
          return true;
        } else {
          setError(response.error || 'Chyba pri schvaľovaní emailu');
          return false;
        }
      } catch (error: unknown) {
        console.error('Approve email error:', err);
        setError('Chyba pri schvaľovaní emailu');
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [directFetch]
  );

  const rejectEmail = useCallback(
    async (emailId: string, reason: string): Promise<boolean> => {
      try {
        setActionLoading(emailId);

        const directResponse = await directFetch(
          `/email-management/${emailId}/reject`,
          {
            method: 'POST',
            body: JSON.stringify({ reason }),
          }
        );

        const response = await directResponse.json();

        if (response.success) {
          setSuccess('Email zamietnutý!');
          return true;
        } else {
          setError(response.error || 'Chyba pri zamietaní emailu');
          return false;
        }
      } catch (error: unknown) {
        console.error('Reject email error:', err);
        setError('Chyba pri zamietaní emailu');
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [directFetch]
  );

  const archiveEmail = useCallback(
    async (emailId: string): Promise<boolean> => {
      try {
        setActionLoading(emailId);

        const directResponse = await directFetch(
          `/email-management/${emailId}/archive`,
          {
            method: 'POST',
          }
        );

        const response = await directResponse.json();

        if (response.success) {
          setSuccess('Email archivovaný!');
          return true;
        } else {
          setError(response.error || 'Chyba pri archivovaní emailu');
          return false;
        }
      } catch (error: unknown) {
        console.error('Archive email error:', err);
        setError('Chyba pri archivovaní emailu');
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [directFetch]
  );

  const deleteEmail = useCallback(
    async (emailId: string): Promise<boolean> => {
      if (
        !window.confirm(
          'Naozaj chcete zmazať tento email? Táto akcia sa nedá vrátiť.'
        )
      ) {
        return false;
      }

      try {
        setActionLoading(emailId);

        const directResponse = await directFetch(
          `/email-management/${emailId}`,
          {
            method: 'DELETE',
          }
        );

        const response = await directResponse.json();

        if (response.success) {
          setSuccess('Email zmazaný!');
          return true;
        } else {
          setError(response.error || 'Chyba pri mazaní emailu');
          return false;
        }
      } catch (error: unknown) {
        console.error('Delete email error:', err);
        setError('Chyba pri mazaní emailu');
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [directFetch]
  );

  const clearHistoricalEmails = useCallback(async (): Promise<boolean> => {
    if (
      !window.confirm(
        'Naozaj chcete zmazať všetky historické emaily pred dnešným dátumom? Táto akcia sa nedá vrátiť.'
      )
    ) {
      return false;
    }

    try {
      setActionLoading('clear-historical');

      const directResponse = await directFetch(
        '/email-management/clear-historical',
        {
          method: 'DELETE',
        }
      );

      const response = await directResponse.json();

      if (response.success) {
        setSuccess(`✅ ${response.data.message}`);
        return true;
      } else {
        setError(response.error || 'Chyba pri mazaní historických emailov');
        return false;
      }
    } catch (error: unknown) {
      console.error('Clear historical emails error:', err);
      setError('Chyba pri mazaní historických emailov');
      return false;
    } finally {
      setActionLoading(null);
    }
  }, [directFetch]);

  // Archive functions
  const fetchArchivedEmails = useCallback(
    async (
      offset = 0,
      senderFilter = ''
    ): Promise<{ emails: EmailEntry[]; pagination: ArchivePagination }> => {
      try {
        const params = new URLSearchParams({
          limit: '20',
          offset: offset.toString(),
        });

        if (senderFilter) params.append('sender', senderFilter);

        const directResponse = await directFetch(
          `/email-management/archive/list?${params}`
        );

        if (!directResponse.ok) {
          throw new Error(`HTTP error! status: ${directResponse.status}`);
        }

        const response = await directResponse.json();

        if (response.success) {
          return {
            emails: response.data.emails || [],
            pagination: {
              total: response.data.pagination.total,
              limit: response.data.pagination.limit,
              offset: response.data.pagination.offset,
              hasMore: response.data.pagination.hasMore,
            },
          };
        } else {
          throw new Error('Chyba pri načítaní archívu emailov');
        }
      } catch (error) {
        console.error('❌ ARCHIVE: Chyba pri načítaní archívu:', error);
        setError('Chyba pri načítaní archívu emailov');
        throw error;
      }
    },
    [directFetch]
  );

  const bulkArchiveEmails = useCallback(
    async (emailIds: string[]): Promise<boolean> => {
      if (emailIds.length === 0) {
        setError('Nie sú vybrané žiadne emaily na archiváciu');
        return false;
      }

      try {
        setActionLoading('bulk-archive');

        const directResponse = await directFetch(
          '/email-management/bulk-archive',
          {
            method: 'POST',
            body: JSON.stringify({
              emailIds,
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
          return true;
        } else {
          setError(response.error || 'Chyba pri bulk archivovaní');
          return false;
        }
      } catch (error) {
        console.error('❌ BULK ARCHIVE: Chyba:', error);
        setError('Chyba pri bulk archivovaní emailov');
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [directFetch]
  );

  const autoArchiveOldEmails = useCallback(async (): Promise<boolean> => {
    try {
      setActionLoading('auto-archive');

      const directResponse = await directFetch(
        '/email-management/auto-archive',
        {
          method: 'POST',
          body: JSON.stringify({
            daysOld: AUTO_ARCHIVE_DAYS,
            statuses: AUTO_ARCHIVE_STATUSES,
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
        return true;
      } else {
        setError(response.error || 'Chyba pri automatickom archivovaní');
        return false;
      }
    } catch (error) {
      console.error('❌ AUTO ARCHIVE: Chyba:', error);
      setError('Chyba pri automatickom archivovaní emailov');
      return false;
    } finally {
      setActionLoading(null);
    }
  }, [directFetch]);

  const unarchiveEmail = useCallback(
    async (emailId: string): Promise<boolean> => {
      try {
        setActionLoading(emailId);

        const directResponse = await directFetch(
          `/email-management/${emailId}/unarchive`,
          {
            method: 'POST',
          }
        );

        if (!directResponse.ok) {
          throw new Error(`HTTP error! status: ${directResponse.status}`);
        }

        const response = await directResponse.json();

        if (response.success) {
          setSuccess('Email úspešne obnovený z archívu');
          return true;
        } else {
          setError(response.error || 'Chyba pri obnove z archívu');
          return false;
        }
      } catch (error) {
        console.error('❌ UNARCHIVE: Chyba:', error);
        setError('Chyba pri obnove emailu z archívu');
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [directFetch]
  );

  return {
    // State
    loading,
    actionLoading,
    error,
    success,
    setError,
    setSuccess,

    // Email operations
    fetchEmails,
    fetchStats,
    viewEmailDetail,
    approveEmail,
    rejectEmail,
    archiveEmail,
    deleteEmail,
    clearHistoricalEmails,

    // Archive operations
    fetchArchivedEmails,
    bulkArchiveEmails,
    autoArchiveOldEmails,
    unarchiveEmail,
  };
};
