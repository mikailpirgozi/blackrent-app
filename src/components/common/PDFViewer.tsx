import {
  Close as CloseIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  PictureAsPdf as PDFIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import React, { useCallback, useState } from 'react';

import { getApiBaseUrl } from '../../utils/apiUrl';

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
  title = 'Zobraziť protokol',
}: PDFViewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [protocolData, setProtocolData] = useState<Record<
    string,
    unknown
  > | null>(null);

  // Generovanie PDF URL (fallback)
  const generatePDFUrl = useCallback(() => {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/protocols/${protocolType}/${protocolId}/pdf`;
  }, [protocolType, protocolId]);

  // Načítanie protokolu a jeho PDF URL
  const loadProtocolData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Najprv skús načítať protokol aby získal pdfUrl
      const apiBaseUrl = getApiBaseUrl();
      const protocolUrl = `${apiBaseUrl}/protocols/${protocolType}/${protocolId}`;
      console.log('🔍 Loading protocol from:', protocolUrl);

      const protocolResponse = await fetch(protocolUrl);
      console.log('📋 Protocol response status:', protocolResponse.status);

      if (protocolResponse.ok) {
        const protocol = await protocolResponse.json();
        console.log('📋 Protocol data:', protocol);
        setProtocolData(protocol);

        // Ak má protokol pdfUrl, použij ho
        if (protocol.pdfUrl) {
          console.log(
            '✅ Using existing PDF URL from protocol:',
            protocol.pdfUrl
          );
          setPdfUrl(protocol.pdfUrl);
          return;
        } else {
          console.log('⚠️ Protocol has no pdfUrl field');
        }
      } else {
        console.log(
          '❌ Protocol response not ok:',
          protocolResponse.status,
          protocolResponse.statusText
        );
        const errorText = await protocolResponse.text();
        console.log('❌ Error response:', errorText);
      }

      // Ak nemá pdfUrl, vygeneruj nové PDF
      console.log('⚠️ No PDF URL found, generating new PDF');
      const generateUrl = generatePDFUrl();
      setPdfUrl(generateUrl);
    } catch (err) {
      console.error('❌ Error loading protocol data:', err);
      // Fallback na generovanie PDF
      const generateUrl = generatePDFUrl();
      setPdfUrl(generateUrl);
    } finally {
      setLoading(false);
    }
  }, [protocolType, protocolId, generatePDFUrl]);

  // Download URL - použij existujúce PDF URL ak existuje
  const getDownloadUrl = (): string => {
    // Ak máme pdfUrl z protokolu, použij ho
    if (protocolData?.pdfUrl && typeof protocolData.pdfUrl === 'string') {
      return protocolData.pdfUrl;
    }

    // Fallback na generovanie
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/protocols/${protocolType}/${protocolId}/download`;
  };

  // Načítanie PDF
  const handleLoadPDF = useCallback(async () => {
    await loadProtocolData();
  }, [loadProtocolData]);

  // Stiahnutie PDF
  const handleDownload = () => {
    const downloadUrl: string = getDownloadUrl();
    const link = document.createElement('a') as HTMLAnchorElement;
    link.href = downloadUrl;
    link.download = `${protocolType}_protocol_${protocolId.slice(-8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Otvorenie v novom okne
  const handleOpenInNewWindow = () => {
    const url = pdfUrl || generatePDFUrl();
    window.open(url, '_blank');
  };

  // Automatické načítanie PDF pri otvorení
  React.useEffect(() => {
    if (open && !pdfUrl) {
      handleLoadPDF();
    }
  }, [open, pdfUrl, handleLoadPDF]);

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
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'primary.main',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PDFIcon />
          <Typography variant="h6">
            {title} - {protocolType === 'handover' ? 'Prevzatie' : 'Vrátenie'}{' '}
            vozidla
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography>Načítavam PDF...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {pdfUrl && !loading && (
          <iframe
            src={pdfUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              minHeight: '500px',
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
        <Button variant="contained" onClick={onClose}>
          Zavrieť
        </Button>
      </DialogActions>
    </Dialog>
  );
}
