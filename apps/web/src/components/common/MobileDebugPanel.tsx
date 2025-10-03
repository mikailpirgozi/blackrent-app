import {
  Bug as BugIcon,
  Trash2 as ClearIcon,
  X as CloseIcon,
  Download as DownloadIcon,
  ChevronUp as ExpandLessIcon,
  ChevronDown as ExpandMoreIcon,
  Cpu as MemoryIcon,
  RefreshCw as RefreshIcon,
  Zap as SpeedIcon,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Typography } from '@/components/ui/typography';
import { useEffect, useState } from 'react';
// 🔄 MOBILE CLEANUP: mobileLogger removed
// import { getMobileLogger, LogEntry } from '../../utils/mobileLogger';

// Fallback interface
interface LogEntry {
  timestamp: number; // Changed from Date to number
  level: string;
  message: string;
  data?: Record<string, unknown>;
  category?: string; // Added missing property
  stackTrace?: string; // Added missing property
}

const MobileDebugPanel = () => {
  const [open, setOpen] = useState(false);
  const [logs] = useState<LogEntry[]>([]);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [stats] = useState<Record<string, unknown> | null>(null);
  // 🔄 MOBILE CLEANUP: mobileLogger disabled
  const mobileLogger = null; // getMobileLogger();

  // Detect if mobile
  const isMobile = window.matchMedia('(max-width: 900px)').matches;

  const refreshLogs = () => {
    // 🔄 MOBILE CLEANUP: mobileLogger disabled
    if (!mobileLogger) return;
    // const currentLogs = mobileLogger.getLogs();
    // setLogs(currentLogs.slice(-50)); // Last 50 logs
    // setStats(mobileLogger.getStats());
  };

  useEffect(() => {
    if (open && mobileLogger) {
      refreshLogs();
      // Auto-refresh every 2 seconds when panel is open
      const interval = window.setInterval(refreshLogs, 2000);
      return () => window.clearInterval(interval);
    }
    return undefined;
  }, [open, mobileLogger]);

  // Only show on mobile
  if (!isMobile || !mobileLogger) {
    return null;
  }

  const handleDownloadLogs = () => {
    // 🔄 MOBILE CLEANUP: mobileLogger disabled
    // mobileLogger.downloadLogs();
  };

  const handleClearLogs = () => {
    // 🔄 MOBILE CLEANUP: mobileLogger disabled
    // mobileLogger.clearLogs();
    // refreshLogs();
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'INFO':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'WARN':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLevelEmoji = (level: LogEntry['level']) => {
    switch (level) {
      case 'DEBUG':
        return '🔍';
      case 'INFO':
        return 'ℹ️';
      case 'WARN':
        return '⚠️';
      case 'ERROR':
        return '❌';
      case 'CRITICAL':
        return '🚨';
      default:
        return '📝';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('sk-SK', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  return (
    <>
      {/* Floating Debug Button */}
      <div className="fixed bottom-5 right-5 z-50 opacity-80 hover:opacity-100">
        <Button
          variant="default"
          size="sm"
          onClick={() => setOpen(true)}
          className="rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 text-white font-bold shadow-lg hover:from-pink-600 hover:to-cyan-500"
        >
          <BugIcon size={16} className="mr-2" />
          Debug
        </Button>
      </div>

      {/* Debug Panel Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={`max-w-4xl w-full ${isMobile ? 'h-screen max-h-screen' : 'max-h-[80vh]'} bg-gray-900 text-white border-gray-700`}
        >
          <DialogHeader className="bg-gray-800 border-b border-gray-600">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BugIcon size={20} />
                <Typography variant="h6">📱 Mobile Debug Panel</Typography>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-white hover:bg-gray-700"
              >
                <CloseIcon size={16} />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Diagnostické informácie pre mobilné zariadenia
            </DialogDescription>
          </DialogHeader>

          <div className="p-2 overflow-auto">
            {/* Stats Section */}
            {stats && (
              <div className="mb-6">
                <Typography
                  variant="h6"
                  className="mb-3 flex items-center gap-2"
                >
                  <SpeedIcon size={20} /> Štatistiky
                </Typography>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="text-white border-gray-600"
                  >
                    📝 Celkom: {String(stats.totalLogs)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-orange-400 border-gray-600"
                  >
                    ⚠️ Warnings: {String(stats.warningCount)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-red-400 border-gray-600"
                  >
                    ❌ Errors: {String(stats.errorCount)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-blue-400 border-gray-600"
                  >
                    🕐 Recent: {String(stats.recentLogs)}
                  </Badge>
                </div>
              </div>
            )}

            {/* Memory Info */}
            <div className="mb-6">
              <Typography variant="h6" className="mb-3 flex items-center gap-2">
                <MemoryIcon size={20} /> Pamäť
              </Typography>
              {(
                window.performance as typeof window.performance & {
                  memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
                }
              ).memory ? (
                <Alert className="bg-blue-900/50 border-blue-700">
                  <AlertDescription className="text-white">
                    Použitá:{' '}
                    {Math.round(
                      (
                        window.performance as typeof window.performance & {
                          memory: {
                            usedJSHeapSize: number;
                            jsHeapSizeLimit: number;
                          };
                        }
                      ).memory.usedJSHeapSize /
                        1024 /
                        1024
                    )}{' '}
                    MB / Limit:{' '}
                    {Math.round(
                      (
                        window.performance as typeof window.performance & {
                          memory: {
                            usedJSHeapSize: number;
                            jsHeapSizeLimit: number;
                          };
                        }
                      ).memory.jsHeapSizeLimit /
                        1024 /
                        1024
                    )}{' '}
                    MB
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-yellow-900/50 border-yellow-700">
                  <AlertDescription className="text-white">
                    Memory API nie je dostupné
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator className="my-4 border-gray-600" />

            {/* Logs Section */}
            <Typography variant="h6" className="mb-3">
              📋 Posledné logy ({logs.length})
            </Typography>

            {logs.length === 0 ? (
              <Alert className="bg-blue-900/50 border-blue-700">
                <AlertDescription className="text-white">
                  Žiadne logy k dispozícii
                </AlertDescription>
              </Alert>
            ) : (
              <div className="max-h-96 overflow-auto">
                {logs.map((log, index) => (
                  <div key={index} className="mb-2">
                    <div
                      className={`p-3 rounded cursor-pointer ${
                        log.level === 'ERROR' || log.level === 'CRITICAL'
                          ? 'bg-red-900/50 border border-red-700'
                          : 'bg-gray-800 border border-gray-600'
                      }`}
                      onClick={() =>
                        setExpandedLog(expandedLog === index ? null : index)
                      }
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Typography variant="caption" className="text-gray-400">
                          {formatTime(log.timestamp)}
                        </Typography>
                        <Badge
                          className={`${getLevelColor(log.level)} text-white font-bold`}
                        >
                          {getLevelEmoji(log.level)} {log.level}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-gray-300 border-gray-600"
                        >
                          {log.category}
                        </Badge>
                        {expandedLog === index ? (
                          <ExpandLessIcon size={16} />
                        ) : (
                          <ExpandMoreIcon size={16} />
                        )}
                      </div>
                      <Typography variant="body2" className="font-medium">
                        {log.message}
                      </Typography>
                    </div>

                    <Collapsible open={expandedLog === index}>
                      <CollapsibleContent>
                        <div className="mt-2 p-4 bg-gray-900 rounded">
                          {log.data && (
                            <div className="mb-3">
                              <Typography
                                variant="caption"
                                className="text-gray-400 font-bold"
                              >
                                Data:
                              </Typography>
                              <pre className="text-xs text-blue-300 bg-gray-800 p-2 rounded overflow-auto max-h-48">
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            </div>
                          )}

                          {log.stackTrace && (
                            <div>
                              <Typography
                                variant="caption"
                                className="text-gray-400 font-bold"
                              >
                                Stack Trace:
                              </Typography>
                              <pre className="text-xs text-orange-400 bg-gray-800 p-2 rounded overflow-auto max-h-36">
                                {log.stackTrace}
                              </pre>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>

        <DialogFooter className="bg-gray-800 border-t border-gray-600 p-4 flex gap-2">
          <Button
            onClick={refreshLogs}
            variant="outline"
            size="sm"
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <RefreshIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleDownloadLogs}
            variant="outline"
            size="sm"
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={handleClearLogs}
            variant="outline"
            size="sm"
            className="text-orange-400 border-orange-600 hover:bg-orange-900"
          >
            <ClearIcon className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};

export default MobileDebugPanel;
