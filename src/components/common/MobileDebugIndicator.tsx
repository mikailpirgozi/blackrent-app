// 📱🔍 Mobile Debug Indicator
// Zobrazuje debug informácie pre mobile refresh problémy

import React, { useState, useEffect } from 'react';
import {
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Button,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  BugReport as BugIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { mobileRefreshDebugger } from '../../utils/mobileRefreshDebugger';

const MobileDebugIndicator: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Zobraz len na mobile alebo v development
  useEffect(() => {
    const shouldShow = isMobile || process.env.NODE_ENV === 'development';
    setIsVisible(shouldShow);
  }, [isMobile]);

  // Refresh events when dialog opens
  useEffect(() => {
    if (open) {
      setEvents(mobileRefreshDebugger.getAllEvents());
    }
  }, [open]);

  // Auto-refresh events every 5 seconds when dialog is open
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setEvents(mobileRefreshDebugger.getAllEvents());
    }, 5000);

    return () => clearInterval(interval);
  }, [open]);

  const handleExportDebugData = () => {
    const data = mobileRefreshDebugger.exportDebugData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile-refresh-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getEventTypeColor = (trigger: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    if (trigger.includes('reload')) return 'error';
    if (trigger.includes('Error')) return 'warning';
    if (trigger.includes('Service Worker')) return 'info';
    if (trigger.includes('Initialized')) return 'success';
    return 'default';
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Debug Button */}
      <Fab
        color="secondary"
        size="small"
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 1000,
          bgcolor: events.length > 0 ? '#ff9800' : '#9c27b0',
          '&:hover': {
            bgcolor: events.length > 0 ? '#f57c00' : '#7b1fa2',
          },
        }}
        onClick={() => setOpen(true)}
      >
        <BugIcon />
      </Fab>

      {/* Debug Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugIcon />
          Mobile Refresh Debugger
          {events.length > 0 && (
            <Chip 
              label={`${events.length} events`} 
              color="warning" 
              size="small" 
            />
          )}
        </DialogTitle>
        
        <DialogContent>
          {/* Summary */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Tento nástroj monitoruje automatické refreshy stránky na mobilných zariadeniach.
              Každý refresh je zalogovaný s detailnými informáciami.
            </Typography>
          </Alert>

          {/* Current Status */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Aktuálny stav
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={isMobile ? 'Mobile' : 'Desktop'} 
                color={isMobile ? 'warning' : 'default'} 
                size="small" 
              />
              <Chip 
                label={`${window.innerWidth}x${window.innerHeight}`} 
                color="info" 
                size="small" 
              />
              <Chip 
                label={process.env.NODE_ENV} 
                color="secondary" 
                size="small" 
              />
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportDebugData}
              size="small"
            >
              Export Debug Data
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => setEvents(mobileRefreshDebugger.getAllEvents())}
              size="small"
            >
              Refresh Events
            </Button>
          </Box>

          {/* Events List */}
          {events.length === 0 ? (
            <Alert severity="success">
              Žiadne refresh events neboli zaznamenané. To je dobré!
            </Alert>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Zaznamenané udalosti ({events.length})
              </Typography>
              
              {events.slice(-10).reverse().map((event, index) => (
                <Accordion key={event.timestamp} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Chip
                        label={event.trigger.split(':')[0]}
                        color={getEventTypeColor(event.trigger)}
                        size="small"
                      />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.viewport.width}x{event.viewport.height}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Trigger:</strong> {event.trigger}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Location:</strong> {event.location}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Time:</strong> {new Date(event.timestamp).toLocaleString()}
                      </Typography>
                      
                      {event.memoryInfo && (
                        <Typography variant="body2">
                          <strong>Memory:</strong> {event.memoryInfo.used} / {event.memoryInfo.limit}
                        </Typography>
                      )}
                      
                      {event.networkInfo && (
                        <Typography variant="body2">
                          <strong>Network:</strong> {event.networkInfo.effectiveType} 
                          ({event.networkInfo.downlink}Mbps, {event.networkInfo.rtt}ms RTT)
                        </Typography>
                      )}
                      
                      {event.stackTrace && (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Stack Trace:
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              fontSize: '0.7rem',
                              overflow: 'auto',
                              maxHeight: 200,
                              bgcolor: 'grey.100',
                              p: 1,
                              borderRadius: 1,
                              fontFamily: 'monospace',
                            }}
                          >
                            {event.stackTrace}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
              
              {events.length > 10 && (
                <Alert severity="info">
                  Zobrazených je posledných 10 z {events.length} udalostí.
                  Pre všetky údaje použite "Export Debug Data".
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobileDebugIndicator;
