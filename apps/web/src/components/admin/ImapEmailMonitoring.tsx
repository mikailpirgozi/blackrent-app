import React, { useCallback, useEffect, useState } from 'react';
import { 
  Mail, 
  Info, 
  Play, 
  RefreshCw, 
  Square, 
  CheckCircle, 
  Loader2 
} from 'lucide-react';

import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

import { apiService } from '../../services/api';

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

interface ImapTestResult {
  connected: boolean;
  timestamp: string;
  config: {
    host: string;
    port: string;
    user: string;
  };
}

const ImapEmailMonitoring: React.FC = () => {
  const [status, setStatus] = useState<ImapStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<ImapTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Definujeme fetchStatus PRED useEffect hooks
  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiService.getImapStatus();
      setStatus(data);
    } catch (error: unknown) {
      console.error('Error fetching IMAP status:', error);
      setError('Nepodarilo sa načítať status IMAP monitoringu');
    }
  }, []);

  useEffect(() => {
    const initializeStatus = async () => {
      setInitialLoading(true);
      await fetchStatus();
      setInitialLoading(false);
    };

    initializeStatus();
  }, [fetchStatus]);

  // Separátny useEffect pre interval - spúšťa sa len ak je IMAP povolené
  useEffect(() => {
    if (!status || status.enabled === false) {
      return; // Nespúšťaj interval ak je IMAP vypnuté
    }

    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [status, fetchStatus]);

  // Ak sa IMAP ešte načítava, zobraz loading
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="ml-2">Načítavam IMAP konfiguráciu...</p>
      </div>
    );
  }

  // Ak je IMAP vypnuté, zobraz info hlásenie
  if (status && status.enabled === false) {
    return (
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                📧 IMAP Email Monitoring je vypnuté
              </h3>
              <p>
                IMAP služba je momentálne vypnutá v konfigurácii servera. Pre
                aktiváciu kontaktujte administrátora systému.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>⚙️ Konfigurácia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Host:</strong> {status.config.host}</p>
              <p><strong>Používateľ:</strong> {status.config.user}</p>
              <p><strong>Stav:</strong> Vypnuté</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      setTestResult(null);

      const data = await apiService.testImapConnection();
      setTestResult(data);
      setSuccess(
        data.connected
          ? 'Test pripojenia úspešný!'
          : 'Test pripojenia neúspešný'
      );
    } catch (error: unknown) {
      setError('Nepodarilo sa otestovať IMAP pripojenie');
      console.error('IMAP test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = async () => {
    try {
      setLoading(true);
      setError(null);

      await apiService.startImapMonitoring();

      setSuccess('IMAP monitoring spustený!');
      await fetchStatus();
    } catch (error: unknown) {
      setError('Nepodarilo sa spustiť IMAP monitoring');
      console.error('IMAP start error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopMonitoring = async () => {
    try {
      setLoading(true);
      setError(null);

      await apiService.stopImapMonitoring();

      setSuccess('IMAP monitoring zastavený!');
      await fetchStatus();
    } catch (error: unknown) {
      setError('Nepodarilo sa zastaviť IMAP monitoring');
      console.error('IMAP stop error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNow = async () => {
    try {
      setLoading(true);
      setError(null);

      await apiService.checkImapNow();

      setSuccess('Kontrola emailov dokončená!');
    } catch (error: unknown) {
      setError('Nepodarilo sa skontrolovať emaily');
      console.error('IMAP check error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">📧 IMAP Email Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Automatické sledovanie schránky <strong>info@blackrent.sk</strong> pre
            nové objednávky od <strong>objednavky@blackrent.sk</strong>
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              {success}
              <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>📊 Status monitoringu</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={fetchStatus}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Obnoviť status</TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              {status ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={status.running ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {status.running ? (
                        <Play className="h-3 w-3" />
                      ) : (
                        <Square className="h-3 w-3" />
                      )}
                      {status.running ? 'BEŽÍ' : 'ZASTAVENÝ'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(status.timestamp).toLocaleString('sk')}
                    </span>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">Konfigurácia:</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Server:</strong> {status.config.host}</p>
                      <p><strong>Používateľ:</strong> {status.config.user}</p>
                      <p>
                        <strong>Heslo:</strong>{' '}
                        {status.config.enabled ? '✅ Nastavené' : '❌ Chýba'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Controls Card */}
          <Card>
            <CardHeader>
              <CardTitle>🎛️ Ovládanie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={testConnection}
                  disabled={loading}
                  className="w-full"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Test pripojenia
                </Button>

                <Button
                  onClick={startMonitoring}
                  disabled={loading || status?.running}
                  className="w-full"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Spustiť monitoring
                </Button>

                <Button
                  variant="destructive"
                  onClick={stopMonitoring}
                  disabled={loading || !status?.running}
                  className="w-full"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Zastaviť monitoring
                </Button>

                <Button
                  variant="outline"
                  onClick={checkNow}
                  disabled={loading}
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Skontrolovať teraz
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Test Results */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle>🧪 Výsledok testu pripojenia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Badge
                  variant={testResult.connected ? 'default' : 'destructive'}
                >
                  {testResult.connected ? 'PRIPOJENÉ' : 'NEPRIPOJENÉ'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(testResult.timestamp).toLocaleString('sk')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-sm">
                  <strong>Server:</strong> {testResult.config.host}
                </div>
                <div className="text-sm">
                  <strong>Port:</strong> {testResult.config.port}
                </div>
                <div className="text-sm">
                  <strong>Používateľ:</strong> {testResult.config.user}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <h4 className="font-semibold">ℹ️ Ako to funguje:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  Monitoring kontroluje schránku{' '}
                  <strong>info@blackrent.sk</strong> každých 30 sekúnd
                </li>
                <li>
                  Filtrovanie iba emailov od{' '}
                  <strong>objednavky@blackrent.sk</strong>
                </li>
                <li>
                  Automatické parsovanie obsahu a vytvorenie pending prenájmu
                </li>
                <li>Spracované emaily sa označia ako prečítané</li>
                <li>
                  Nové prenájmy sa zobrazia v <strong>Čakajúce prenájmy</strong>
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {loading && (
          <div className="flex justify-center mt-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ImapEmailMonitoring;
