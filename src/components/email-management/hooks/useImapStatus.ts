/**
 * Custom hook pre IMAP Status operácie
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import { useState, useCallback } from 'react';
import { getAPI_BASE_URL } from '../../../services/api';
import { ImapStatus } from '../types/email-types';

export const useImapStatus = () => {
  const [imapStatus, setImapStatus] = useState<ImapStatus | null>(null);
  const [imapLoading, setImapLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper function pre direct fetch
  const directFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
    return fetch(`${getAPI_BASE_URL()}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  }, []);

  const fetchImapStatus = useCallback(async (): Promise<ImapStatus | null> => {
    try {
      const directResponse = await directFetch('/email-imap/status');
      const response = await directResponse.json();
      console.log('📧 IMAP Status:', response);
      
      if (response.success && response.data) {
        setImapStatus(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('❌ IMAP Status error:', err);
      return null;
    }
  }, [directFetch]);

  const testImapConnection = useCallback(async (): Promise<boolean> => {
    try {
      setImapLoading(true);
      
      const directResponse = await directFetch('/email-imap/test');
      const response = await directResponse.json();
      console.log('🧪 IMAP Test result:', response);
      
      if (response.success && response.data && response.data.connected) {
        setSuccess('✅ IMAP pripojenie úspešné!');
        return true;
      } else {
        setError('❌ IMAP pripojenie zlyhalo');
        return false;
      }
    } catch (err) {
      console.error('❌ IMAP Test error:', err);
      setError('❌ Chyba pri teste IMAP pripojenia');
      return false;
    } finally {
      setImapLoading(false);
    }
  }, [directFetch]);

  const startImapMonitoring = useCallback(async (): Promise<boolean> => {
    try {
      setImapLoading(true);
      
      const directResponse = await directFetch('/email-imap/start', {
        method: 'POST',
      });
      
      const response = await directResponse.json();
      console.log('▶️ IMAP Start result:', response);
      
      setSuccess('▶️ IMAP monitoring spustený!');
      await fetchImapStatus(); // Refresh status
      return true;
    } catch (err) {
      console.error('❌ IMAP Start error:', err);
      setError('❌ Chyba pri spúšťaní IMAP monitoringu');
      return false;
    } finally {
      setImapLoading(false);
    }
  }, [directFetch, fetchImapStatus]);

  const stopImapMonitoring = useCallback(async (): Promise<boolean> => {
    try {
      setImapLoading(true);
      
      const directResponse = await directFetch('/email-imap/stop', {
        method: 'POST',
      });
      
      const response = await directResponse.json();
      console.log('⏹️ IMAP Stop result:', response);
      
      setSuccess('⏹️ IMAP monitoring zastavený!');
      await fetchImapStatus(); // Refresh status
      return true;
    } catch (err) {
      console.error('❌ IMAP Stop error:', err);
      setError('❌ Chyba pri zastavovaní IMAP monitoringu');
      return false;
    } finally {
      setImapLoading(false);
    }
  }, [directFetch, fetchImapStatus]);

  return {
    // State
    imapStatus,
    imapLoading,
    error,
    success,
    setError,
    setSuccess,
    
    // Operations
    fetchImapStatus,
    testImapConnection,
    startImapMonitoring,
    stopImapMonitoring,
  };
};
