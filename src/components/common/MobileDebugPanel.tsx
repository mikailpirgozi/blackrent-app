import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  Divider,
  IconButton,
  Collapse,
  Alert,
  Stack
} from '@mui/material';
import {
  BugReport as BugIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
// 🔄 MOBILE CLEANUP: mobileLogger removed
// import { getMobileLogger, LogEntry } from '../../utils/mobileLogger';

// Fallback interface
interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  data?: any;
}

const MobileDebugPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null);
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
      const interval = setInterval(refreshLogs, 2000);
      return () => clearInterval(interval);
    }
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
      case 'DEBUG': return 'default';
      case 'INFO': return 'info';
      case 'WARN': return 'warning';
      case 'ERROR': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getLevelEmoji = (level: LogEntry['level']) => {
    switch (level) {
      case 'DEBUG': return '🔍';
      case 'INFO': return 'ℹ️';
      case 'WARN': return '⚠️';
      case 'ERROR': return '❌';
      case 'CRITICAL': return '🚨';
      default: return '📝';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('sk-SK', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <>
      {/* Floating Debug Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
          opacity: 0.8,
          '&:hover': { opacity: 1 }
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          size="small"
          onClick={() => setOpen(true)}
          startIcon={<BugIcon />}
          sx={{
            borderRadius: '20px',
            background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
            color: 'white',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #FF5252, #26C6DA)',
            }
          }}
        >
          Debug
        </Button>
      </Box>

      {/* Debug Panel Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            height: isMobile ? '100vh' : '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: '#2d2d2d',
          borderBottom: '1px solid #444'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugIcon />
            <Typography variant="h6">📱 Mobile Debug Panel</Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2, overflow: 'auto' }}>
          {/* Stats Section */}
          {stats && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon /> Štatistiky
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip 
                  label={`📝 Celkom: ${stats.totalLogs}`} 
                  size="small" 
                  variant="outlined" 
                  sx={{ color: 'white', borderColor: '#666' }}
                />
                <Chip 
                  label={`⚠️ Warnings: ${stats.warningCount}`} 
                  size="small" 
                  variant="outlined" 
                  color="warning"
                />
                <Chip 
                  label={`❌ Errors: ${stats.errorCount}`} 
                  size="small" 
                  variant="outlined" 
                  color="error"
                />
                <Chip 
                  label={`🕐 Recent: ${stats.recentLogs}`} 
                  size="small" 
                  variant="outlined" 
                  color="info"
                />
              </Stack>
            </Box>
          )}

          {/* Memory Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MemoryIcon /> Pamäť
            </Typography>
            {(performance as any).memory ? (
              <Alert severity="info" sx={{ backgroundColor: '#1e3a5f', color: 'white' }}>
                <Typography variant="body2">
                  Použitá: {Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)} MB / 
                  Limit: {Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)} MB
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ backgroundColor: '#5f4e1e', color: 'white' }}>
                Memory API nie je dostupné
              </Alert>
            )}
          </Box>

          <Divider sx={{ my: 2, borderColor: '#444' }} />

          {/* Logs Section */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            📋 Posledné logy ({logs.length})
          </Typography>

          {logs.length === 0 ? (
            <Alert severity="info" sx={{ backgroundColor: '#1e3a5f', color: 'white' }}>
              Žiadne logy k dispozícii
            </Alert>
          ) : (
            <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {logs.map((log, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      p: 1,
                      backgroundColor: '#2d2d2d',
                      borderRadius: 1,
                      border: log.level === 'ERROR' || log.level === 'CRITICAL' ? '1px solid #f44336' : '1px solid #444',
                      cursor: 'pointer'
                    }}
                    onClick={() => setExpandedLog(expandedLog === index ? null : index)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        {formatTime(log.timestamp)}
                      </Typography>
                      <Chip
                        label={`${getLevelEmoji(log.level)} ${log.level}`}
                        size="small"
                        color={getLevelColor(log.level)}
                        sx={{ minWidth: 'auto' }}
                      />
                      <Chip
                        label={log.category}
                        size="small"
                        variant="outlined"
                        sx={{ color: '#ccc', borderColor: '#666' }}
                      />
                      {expandedLog === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {log.message}
                    </Typography>
                  </Box>
                  
                  <Collapse in={expandedLog === index}>
                    <Box sx={{ mt: 1, p: 2, backgroundColor: '#1a1a1a', borderRadius: 1 }}>
                      {log.data && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: '#888', fontWeight: 'bold' }}>
                            Data:
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              fontSize: '0.75rem',
                              color: '#4fc3f7',
                              backgroundColor: '#0d1421',
                              p: 1,
                              borderRadius: 1,
                              overflow: 'auto',
                              maxHeight: '200px'
                            }}
                          >
                            {JSON.stringify(log.data, null, 2)}
                          </Box>
                        </Box>
                      )}
                      
                      {log.stackTrace && (
                        <Box>
                          <Typography variant="caption" sx={{ color: '#888', fontWeight: 'bold' }}>
                            Stack Trace:
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              fontSize: '0.7rem',
                              color: '#ff9800',
                              backgroundColor: '#0d1421',
                              p: 1,
                              borderRadius: 1,
                              overflow: 'auto',
                              maxHeight: '150px'
                            }}
                          >
                            {log.stackTrace}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ 
          backgroundColor: '#2d2d2d', 
          borderTop: '1px solid #444',
          gap: 1
        }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={refreshLogs}
            variant="outlined"
            size="small"
            sx={{ color: 'white', borderColor: '#666' }}
          >
            Refresh
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownloadLogs}
            variant="outlined"
            size="small"
            sx={{ color: 'white', borderColor: '#666' }}
          >
            Download
          </Button>
          <Button
            startIcon={<ClearIcon />}
            onClick={handleClearLogs}
            variant="outlined"
            color="warning"
            size="small"
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MobileDebugPanel;
