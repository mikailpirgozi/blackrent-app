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
import { useCallback, useEffect, useState } from 'react';

import {
  useDownloadProtocolPdf,
  useGenerateProtocolPdf,
  useProtocolPdf,
  useProtocolPdfUrl,
} from '../../lib/react-query/hooks/useProtocolPdf';
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
  // React Query hooks
  const {
    isLoading: protocolLoading,
    error: protocolError,
    refetch: refetchProtocol,
  } = useProtocolPdf(protocolId, protocolType);

  const {
    isLoading: urlLoading,
    error: urlError,
    refetch: refetchUrl,
  } = useProtocolPdfUrl(protocolId, protocolType);

  const generatePdfMutation = useGenerateProtocolPdf();
  const downloadPdfMutation = useDownloadProtocolPdf();

  // Local state for UI
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Generovanie PDF URL (fallback)
  const generatePDFUrl = useCallback(() => {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/protocols/${protocolType}/${protocolId}/pdf`;
  }, [protocolType, protocolId]);

  // Načítanie protokolu a jeho PDF URL pomocou React Query
  const loadProtocolData = useCallback(async () => {
    try {
      // Najprv skús načítať protokol
      const protocolResult = await refetchProtocol();

      if (protocolResult.data) {
        const protocol = protocolResult.data as Record<string, unknown>;
        console.log('📋 Protocol data:', protocol);

        // Ak má protokol pdfUrl, použij ho
        if (protocol.pdfUrl && typeof protocol.pdfUrl === 'string') {
          console.log(
            '✅ Using existing PDF URL from protocol:',
            protocol.pdfUrl
          );
          setPdfUrl(protocol.pdfUrl);
          return;
        } else {
          console.log('⚠️ Protocol has no pdfUrl field');
        }
      }

      // Ak nemá pdfUrl, skús načítať PDF URL
      const urlResult = await refetchUrl();
      if (
        urlResult.data &&
        typeof urlResult.data === 'object' &&
        'url' in urlResult.data
      ) {
        const url = urlResult.data.url as string;
        console.log('✅ Using PDF URL from API:', url);
        setPdfUrl(url);
        return;
      }

      // Ak nemá PDF URL, vygeneruj nové PDF
      console.log('⚠️ No PDF URL found, generating new PDF');
      const generateUrl = generatePDFUrl();
      setPdfUrl(generateUrl);
    } catch (err) {
      console.error('❌ Error loading protocol data:', err);
      // Fallback na generovanie PDF
      const generateUrl = generatePDFUrl();
      setPdfUrl(generateUrl);
    }
  }, [generatePDFUrl, refetchProtocol, refetchUrl]);

  // Download URL - použij existujúce PDF URL ak existuje (používa sa v handleDownload)
  // const getDownloadUrl = (): string => {
  //   // Ak máme pdfUrl z protokolu, použij ho
  //   if (protocolData?.pdfUrl && typeof protocolData.pdfUrl === 'string') {
  //     return protocolData.pdfUrl;
  //   }

  //   // Fallback na generovanie
  //   const baseUrl = getApiBaseUrl();
  //   return `${baseUrl}/protocols/${protocolType}/${protocolId}/download`;
  // };

  // Načítanie PDF
  const handleLoadPDF = useCallback(async () => {
    await loadProtocolData();
  }, [loadProtocolData]);

  // Stiahnutie PDF pomocou React Query mutation
  const handleDownload = useCallback(() => {
    downloadPdfMutation.mutate({
      protocolId,
      type: protocolType,
    });
  }, [downloadPdfMutation, protocolId, protocolType]);

  // Otvorenie v novom okne
  const handleOpenInNewWindow = () => {
    const url = pdfUrl || generatePDFUrl();
    window.open(url, '_blank');
  };

  // Automatické načítanie PDF pri otvorení
  useEffect(() => {
    if (open && !pdfUrl) {
      handleLoadPDF();
    }
  }, [open, pdfUrl, handleLoadPDF]);

  // Kombinované loading a error stavy
  const loading =
    protocolLoading ||
    urlLoading ||
    generatePdfMutation.isPending ||
    downloadPdfMutation.isPending;
  const error =
    protocolError ||
    urlError ||
    generatePdfMutation.error ||
    downloadPdfMutation.error;

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
            <Alert severity="error">
              {error instanceof Error
                ? error.message
                : 'Chyba pri načítaní PDF'}
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
          disabled={loading || downloadPdfMutation.isPending}
        >
          {downloadPdfMutation.isPending ? 'Sťahujem...' : 'Stiahnuť PDF'}
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
