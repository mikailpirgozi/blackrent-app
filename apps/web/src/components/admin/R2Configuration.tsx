import {
  CheckCircle as CheckCircleIcon,
  Cloud as CloudIcon,
  Download as DownloadIcon,
  AlertCircle as ErrorIcon,
  Settings as SettingsIcon,
  Database as StorageIcon,
  Upload as UploadIcon,
  AlertTriangle as WarningIcon,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useEffect, useState } from 'react';

import { getAPI_BASE_URL } from '../../services/api';

interface R2Status {
  configured: boolean;
  message: string;
  missingVariables: string[];
}

export default function R2Configuration() {
  const [r2Status, setR2Status] = useState<R2Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Načítanie R2 stavu
  const loadR2Status = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getAPI_BASE_URL()}/migration/r2-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Chyba pri načítaní R2 stavu');
      }

      const data = await response.json();
      setR2Status(data);
    } catch (err) {
      setError('Chyba pri načítaní R2 stavu');
      console.error('R2 status error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Spustenie migrácie
  const startMigration = async () => {
    setMigrating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${getAPI_BASE_URL()}/migration/migrate-to-r2`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba pri spúšťaní migrácie');
      }

      const data = await response.json();
      setSuccess(data.message);
    } catch (error: unknown) {
      setError((error as Error).message || 'Chyba pri spúšťaní migrácie');
      console.error('Migration error:', error);
    } finally {
      setMigrating(false);
    }
  };

  // Načítanie stavu pri mount
  useEffect(() => {
    loadR2Status();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-semibold flex items-center gap-2">
        <CloudIcon className="h-8 w-8" />
        Cloudflare R2 Storage Konfigurácia
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Aktuálny stav
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-3">
              <Spinner className="h-5 w-5" />
              <span>Načítavam stav...</span>
            </div>
          ) : r2Status ? (
            <div>
              <Alert variant={r2Status.configured ? 'default' : 'destructive'} className="mb-4">
                {r2Status.configured ? (
                  <CheckCircleIcon className="h-4 w-4" />
                ) : (
                  <WarningIcon className="h-4 w-4" />
                )}
                <AlertDescription>{r2Status.message}</AlertDescription>
              </Alert>

              {!r2Status.configured && r2Status.missingVariables.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Chýbajúce environment variables:</h4>
                  <ul className="space-y-2">
                    {r2Status.missingVariables.map(variable => (
                      <li key={variable} className="flex items-center gap-2 text-sm">
                        <ErrorIcon className="h-4 w-4 text-destructive" />
                        {variable}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

          <Button
            variant="outline"
            onClick={loadR2Status}
            disabled={loading}
            className="mt-4"
          >
            Obnoviť stav
          </Button>
        </CardContent>
      </Card>

      {r2Status?.configured && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="h-5 w-5" />
              Migrácia súborov
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Migrujte existujúce base64 fotky a podpisy do Cloudflare R2
              storage pre lepší výkon a úsporu miesta.
            </p>

            <div className="flex gap-2 flex-wrap mb-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <StorageIcon className="h-3 w-3" />
                Base64 → R2 URLs
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <DownloadIcon className="h-3 w-3" />
                Automatické zálohovanie
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <CloudIcon className="h-3 w-3" />
                CDN rýchlosť
              </Badge>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={startMigration}
                disabled={migrating}
                className="flex items-center gap-2"
              >
                {migrating ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <UploadIcon className="h-4 w-4" />
                )}
                {migrating ? 'Migrujem...' : 'Spustiť migráciu'}
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  window.open('https://dash.cloudflare.com', '_blank')
                }
              >
                Cloudflare Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!r2Status?.configured && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WarningIcon className="h-5 w-5" />
              Nastavenie R2 Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Pre použitie R2 storage musíte nastaviť environment variables v
              Railway dashboard.
            </p>

            <div className="bg-muted p-4 rounded-lg mb-4">
              <h4 className="text-sm font-semibold mb-3">Potrebné environment variables:</h4>
              <ul className="space-y-3">
                <li>
                  <div>
                    <span className="font-mono text-sm font-semibold">R2_ENDPOINT</span>
                    <p className="text-xs text-muted-foreground">https://xxx.r2.cloudflarestorage.com</p>
                  </div>
                </li>
                <li>
                  <div>
                    <span className="font-mono text-sm font-semibold">R2_ACCESS_KEY_ID</span>
                    <p className="text-xs text-muted-foreground">Váš Cloudflare API access key</p>
                  </div>
                </li>
                <li>
                  <div>
                    <span className="font-mono text-sm font-semibold">R2_SECRET_ACCESS_KEY</span>
                    <p className="text-xs text-muted-foreground">Váš Cloudflare API secret key</p>
                  </div>
                </li>
                <li>
                  <div>
                    <span className="font-mono text-sm font-semibold">R2_BUCKET_NAME</span>
                    <p className="text-xs text-muted-foreground">blackrent-storage</p>
                  </div>
                </li>
                <li>
                  <div>
                    <span className="font-mono text-sm font-semibold">R2_PUBLIC_URL</span>
                    <p className="text-xs text-muted-foreground">https://blackrent-storage.xxx.r2.dev</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() =>
                  window.open('https://dash.cloudflare.com', '_blank')
                }
                className="flex items-center gap-2"
              >
                <CloudIcon className="h-4 w-4" />
                Vytvoriť R2 Bucket
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open('https://railway.app', '_blank')}
              >
                Railway Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Výhody R2 Storage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5" />
            Výhody Cloudflare R2
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-primary mb-1">
                💰 Nižšie náklady
              </h4>
              <p className="text-xs text-muted-foreground">
                90% lacnejšie ako AWS S3, žiadne egress poplatky
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-primary mb-1">
                ⚡ Rýchlosť
              </h4>
              <p className="text-xs text-muted-foreground">
                Globálny CDN, ultra-rýchle načítanie fotiek
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-primary mb-1">
                🔒 Bezpečnosť
              </h4>
              <p className="text-xs text-muted-foreground">
                Automatické zálohovanie, enterprise-grade bezpečnosť
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-primary mb-1">
                🌍 Dostupnosť
              </h4>
              <p className="text-xs text-muted-foreground">
                99.9% uptime, dostupné z celého sveta
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error/Success messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircleIcon className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
