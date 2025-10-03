/**
 * 📊 CACHE MONITORING
 *
 * Admin dashboard pre sledovanie cache performance
 */

import {
  Trash2 as ClearIcon,
  Cpu as MemoryIcon,
  RefreshCw as RefreshIcon,
  Gauge as SpeedIcon,
  Database as StorageIcon,
  BarChart3 as TimelineIcon,
  TrendingUp as TrendingUpIcon,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { memo, useEffect, useState } from 'react';
import { logger } from '@/utils/smartLogger';

// 🔄 PHASE 2: UnifiedCache removed - migrating to React Query

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
  const [stats, setStats] = useState<CacheStatsDisplay | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      // 🔄 PHASE 2: Cache stats removed - React Query handles cache monitoring
      const frontendStats = {
        hits: 0,
        misses: 0,
        hitRate: 0,
        memoryUsage: 'N/A',
        entryCount: 0,
      };

      // Backend cache stats (if available)
      try {
        const response = await fetch('/api/cache/stats');
        if (response.ok) {
          // const data = await response.json();
          // backendStats = data.data; // Currently not used in display
        }
      } catch (error) {
        console.warn('Backend cache stats not available:', error);
      }

      // 🔄 PHASE 4: Map unified cache stats to display format
      const displayStats: CacheStatsDisplay = {
        size: frontendStats.entryCount,
        hits: frontendStats.hits,
        misses: frontendStats.misses,
        hitRate: frontendStats.hitRate,
        totalRequests: frontendStats.hits + frontendStats.misses,
        oldestEntry: new Date().toISOString(),
        newestEntry: new Date().toISOString(),
        topHits: [],
        memoryUsage: frontendStats.memoryUsage || '~calculating~',
      };
      setStats(displayStats);
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
    // 🔄 PHASE 2: Cache clearing removed - React Query handles cache automatically
    logger.debug(
      'Cache clearing disabled - React Query manages cache automatically'
    );
    loadStats();
  };

  const formatHitRate = (rate: number) => {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'warning';
    return 'error';
  };

  const formatMemoryUsage = (usage: string | undefined) => {
    if (!usage) return 'normal';
    const match = usage?.match(/(\d+(?:\.\d+)?)/);
    const value = match && match[1] ? parseFloat(match[1]) : 0;

    if (value > 1000) return 'warning';
    if (value > 2000) return 'error';
    return 'success';
  };

  if (!stats) {
    return (
      <div className="p-6">
        <Progress className="mb-4" />
        <p className="text-sm text-muted-foreground">
          Načítavam cache štatistiky...
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold flex items-center gap-2">
            <MemoryIcon className="h-8 w-8 text-primary" />
            Cache Monitoring
          </h1>

          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadStats}
                  disabled={loading}
                >
                  <RefreshIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Obnoviť štatistiky</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCache}
                  className="text-destructive"
                >
                  <ClearIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vymazať cache</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Last Refresh Info */}
        <Alert className="mb-6">
          <AlertDescription>
            Posledná aktualizácia: {lastRefresh.toLocaleString()}
            {autoRefresh && ' • Auto-refresh je zapnutý (30s interval)'}
          </AlertDescription>
        </Alert>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <StorageIcon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Cache Entries
                  </p>
                  <p className="text-3xl font-semibold">{stats.size}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <SpeedIcon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Hit Rate</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-semibold">
                      {stats.hitRate.toFixed(1)}%
                    </p>
                    <Badge
                      variant={
                        formatHitRate(stats.hitRate) === 'success'
                          ? 'default'
                          : formatHitRate(stats.hitRate) === 'warning'
                            ? 'secondary'
                            : 'destructive'
                      }
                      className="text-xs"
                    >
                      {stats.hitRate >= 80
                        ? 'Excellent'
                        : stats.hitRate >= 60
                          ? 'Good'
                          : 'Poor'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <TrendingUpIcon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Requests
                  </p>
                  <p className="text-3xl font-semibold">
                    {stats.totalRequests}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.hits} hits • {stats.misses} misses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <MemoryIcon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Memory Usage
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-semibold">
                      {stats.memoryUsage}
                    </p>
                    <Badge
                      variant={
                        formatMemoryUsage(stats.memoryUsage) === 'success'
                          ? 'default'
                          : formatMemoryUsage(stats.memoryUsage) === 'warning'
                            ? 'secondary'
                            : 'destructive'
                      }
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hit Rate Progress */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <TimelineIcon className="h-5 w-5" />
              Cache Performance
            </h3>

            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Hit Rate</span>
                <span className="text-sm font-medium">
                  {stats.hitRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={stats.hitRate} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cache Hits</p>
                <p className="text-xl font-semibold text-green-600">
                  {stats.hits}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Cache Misses
                </p>
                <p className="text-xl font-semibold text-red-600">
                  {stats.misses}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Cache Entries */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Most Accessed Cache Entries
            </h3>

            {stats.topHits && stats.topHits.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cache Key</TableHead>
                      <TableHead className="text-right">Hits</TableHead>
                      <TableHead className="text-right">Hit Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.topHits.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <code className="text-sm font-mono">
                            {item.key.length > 50
                              ? `${item.key.substring(0, 50)}...`
                              : item.key}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {item.hits}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {stats.totalRequests > 0 ? (
                            <span className="text-sm">
                              {(
                                (item.hits / stats.totalRequests) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Žiadne cache entries nenájdené. Cache je prázdny alebo ešte
                  nebol použitý.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Cache Age Info */}
        {stats.oldestEntry && stats.newestEntry && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Cache Timeline</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Oldest Entry
                  </p>
                  <p className="text-sm">{stats.oldestEntry}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Newest Entry
                  </p>
                  <p className="text-sm">{stats.newestEntry}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default memo(CacheMonitoring);
