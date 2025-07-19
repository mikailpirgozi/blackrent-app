import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  PictureAsPdf as PDFIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';

interface PDFViewerProps {
  open: boolean;
  onClose: () => void;
  protocolId: string;
  protocolType: 'handover' | 'return';
  title?: string;
}

export default function PDFViewer({ 
  open, 
  onClose, 
  protocolId, 
  protocolType, 
  title = 'Zobraziť protokol' 
}: PDFViewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Generovanie PDF URL
  const generatePDFUrl = () => {
    // Použi rovnakú logiku ako v api.ts
    let baseUrl = 'https://blackrent-app-production-4d6f.up.railway.app';
    
    if (process.env.REACT_APP_API_URL) {
      baseUrl = process.env.REACT_APP_API_URL;
    } else if (window.location.hostname.includes('railway.app')) {
      baseUrl = `${window.location.origin}/api`;
    } else if (window.location.hostname === 'mikailpirgozi.github.io') {
      baseUrl = 'https://blackrent-app-production-4d6f.up.railway.app/api';
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      baseUrl = 'http://localhost:5001/api';
    } else {
      baseUrl = 'https://blackrent-app-production-4d6f.up.railway.app/api';
    }
    
    // Ak baseUrl už obsahuje /api, nepridávaj ho
    const apiPath = baseUrl.includes('/api') ? '' : '/api';
    return `${baseUrl}${apiPath}/protocols/${protocolType}/${protocolId}/pdf`;
  };

  // Download URL
  const getDownloadUrl = () => {
    // Použi rovnakú logiku ako v api.ts
    let baseUrl = 'https://blackrent-app-production-4d6f.up.railway.app';
    
    if (process.env.REACT_APP_API_URL) {
      baseUrl = process.env.REACT_APP_API_URL;
    } else if (window.location.hostname.includes('railway.app')) {
      baseUrl = `${window.location.origin}/api`;
    } else if (window.location.hostname === 'mikailpirgozi.github.io') {
      baseUrl = 'https://blackrent-app-production-4d6f.up.railway.app/api';
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      baseUrl = 'http://localhost:5001/api';
    } else {
      baseUrl = 'https://blackrent-app-production-4d6f.up.railway.app/api';
    }
    
    // Ak baseUrl už obsahuje /api, nepridávaj ho
    const apiPath = baseUrl.includes('/api') ? '' : '/api';
    return `${baseUrl}${apiPath}/protocols/${protocolType}/${protocolId}/download`;
  };

  // Načítanie PDF
  const handleLoadPDF = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = generatePDFUrl();
      setPdfUrl(url);
    } catch (err) {
      setError('Chyba pri načítaní PDF');
      console.error('PDF loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Stiahnutie PDF
  const handleDownload = () => {
    const downloadUrl = getDownloadUrl();
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${protocolType}_protocol_${protocolId.slice(-8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Otvorenie v novom okne
  const handleOpenInNewWindow = () => {
    const url = generatePDFUrl();
    window.open(url, '_blank');
  };

  // Automatické načítanie PDF pri otvorení
  React.useEffect(() => {
    if (open && !pdfUrl) {
      handleLoadPDF();
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: 'primary.main',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PDFIcon />
          <Typography variant="h6">
            {title} - {protocolType === 'handover' ? 'Prevzatie' : 'Vrátenie'} vozidla
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress />
            <Typography>Načítavam PDF...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">
              {error}
            </Alert>
          </Box>
        )}

        {pdfUrl && !loading && (
          <iframe
            src={pdfUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              minHeight: '500px'
            }}
            title="PDF Viewer"
          />
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, backgroundColor: 'background.default' }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={loading}
        >
          Stiahnuť PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<OpenInNewIcon />}
          onClick={handleOpenInNewWindow}
          disabled={loading}
        >
          Otvoriť v novom okne
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
        >
          Zavrieť
        </Button>
      </DialogActions>
    </Dialog>
  );
} 