import { UnifiedIcon } from '../ui/UnifiedIcon';
import { UnifiedButton } from '../ui/UnifiedButton';
import { UnifiedDialog } from '../ui/UnifiedDialog';
import { UnifiedTypography } from '../ui/UnifiedTypography';
import { Alert, AlertTitle } from '../ui/alert';
import { Spinner } from '../ui/spinner';
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
    <UnifiedDialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      className="h-[90vh] max-h-[90vh]"
      title={`${title} - ${protocolType === 'handover' ? 'Prevzatie' : 'Vrátenie'} vozidla`}
      subtitle="Náhľad PDF dokumentu"
    >
      <div className="flex justify-between items-center bg-primary text-white p-6">
        <div className="flex items-center gap-2">
          <UnifiedIcon name="fileText" size={24} className="text-white" />
          <UnifiedTypography variant="h6" className="text-white">
            {title} - {protocolType === 'handover' ? 'Prevzatie' : 'Vrátenie'}{' '}
            vozidla
          </UnifiedTypography>
        </div>
        <UnifiedButton
          variant="ghost"
          onClick={onClose}
          className="text-white p-2"
        >
          <UnifiedIcon name="close" size={20} />
        </UnifiedButton>
      </div>

      <div className="p-0 relative flex-1">
        {loading && (
          <div className="flex justify-center items-center h-full flex-col gap-4">
            <Spinner size={32} />
            <UnifiedTypography>Načítavam PDF...</UnifiedTypography>
          </div>
        )}

        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTitle>
                {error instanceof Error
                  ? error.message
                  : 'Chyba pri načítaní PDF'}
              </AlertTitle>
            </Alert>
          </div>
        )}

        {pdfUrl && !loading && (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0 min-h-[500px]"
            title="PDF Viewer"
          />
        )}
      </div>

      <div className="p-4 bg-background flex gap-2 justify-end">
        <UnifiedButton
          variant="outline"
          startIcon={<UnifiedIcon name="download" size={20} />}
          onClick={handleDownload}
          disabled={loading || downloadPdfMutation.isPending}
        >
          {downloadPdfMutation.isPending ? 'Sťahujem...' : 'Stiahnuť PDF'}
        </UnifiedButton>
        <UnifiedButton
          variant="outline"
          startIcon={<UnifiedIcon name="externalLink" size={20} />}
          onClick={handleOpenInNewWindow}
          disabled={loading}
        >
          Otvoriť v novom okne
        </UnifiedButton>
        <UnifiedButton variant="default" onClick={onClose}>
          Zavrieť
        </UnifiedButton>
      </div>
    </UnifiedDialog>
  );
}
