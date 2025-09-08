import {
  PhotoLibrary as GalleryIcon,
  PictureAsPdf as PDFIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import React from 'react';

import type {
  HandoverProtocol,
  ProtocolImage,
  ProtocolVideo,
  Rental,
  ReturnProtocol,
} from '../../../types';
import PDFViewer from '../../common/PDFViewer';
import ProtocolGallery from '../../common/ProtocolGallery';
import ReturnProtocolForm from '../../protocols/ReturnProtocolForm';
import RentalForm from '../RentalForm';

// 🚀 LAZY LOADING: Protocols loaded only when needed
const HandoverProtocolForm = React.lazy(
  () => import('../../protocols/HandoverProtocolForm')
);

// 🚀 V2 PROTOCOL FORMS - loaded when V2 is enabled
const HandoverProtocolFormV2 = React.lazy(
  () => import('../../protocols/v2/HandoverProtocolFormV2Wrapper')
);
const ReturnProtocolFormV2 = React.lazy(
  () => import('../../protocols/v2/ReturnProtocolFormV2Wrapper')
);

interface RentalDialogsProps {
  // Dialog states
  openDialog: boolean;
  openHandoverDialog: boolean;
  openReturnDialog: boolean;
  openProtocolMenu: boolean;
  pdfViewerOpen: boolean;
  galleryOpen: boolean;

  // Selected data
  editingRental: Rental | null;
  selectedRentalForProtocol: Rental | null;
  selectedProtocolType: 'handover' | 'return' | null;
  selectedPdf: {
    url: string;
    type: 'handover' | 'return';
    title: string;
  } | null;
  galleryImages: ProtocolImage[];
  galleryVideos: ProtocolVideo[];
  galleryTitle: string;

  // Protocols data
  protocols: Record<
    string,
    { handover?: Record<string, unknown>; return?: Record<string, unknown> }
  >;
  protocolStatusMap: Record<
    string,
    { hasHandoverProtocol: boolean; hasReturnProtocol: boolean }
  >;

  // Event handlers
  setOpenDialog: (open: boolean) => void;
  setOpenHandoverDialog: (open: boolean) => void;
  setOpenReturnDialog: (open: boolean) => void;
  handleSave: (rental: Rental) => void;
  handleCancel: () => void;
  handleSaveHandover: (
    protocol: HandoverProtocol | Record<string, unknown>
  ) => void;
  handleSaveReturn: (
    protocol: ReturnProtocol | Record<string, unknown>
  ) => void;
  handleClosePDF: () => void;
  handleCloseGallery: () => void;
  handleCloseProtocolMenu: () => void;
  handleDownloadPDF: () => void;
  handleViewGallery: () => void;
}

export const RentalProtocols: React.FC<RentalDialogsProps> = ({
  // Dialog states
  openDialog,
  openHandoverDialog,
  openReturnDialog,
  openProtocolMenu,
  pdfViewerOpen,
  galleryOpen,

  // Selected data
  editingRental,
  selectedRentalForProtocol,
  selectedProtocolType,
  selectedPdf,
  galleryImages,
  galleryVideos,
  galleryTitle,

  // Protocols data
  protocols,
  protocolStatusMap,

  // Event handlers
  setOpenDialog,
  setOpenHandoverDialog,
  setOpenReturnDialog,
  handleSave,
  handleCancel,
  handleSaveHandover,
  handleSaveReturn,
  handleClosePDF,
  handleCloseGallery,
  handleCloseProtocolMenu,
  handleDownloadPDF,
  handleViewGallery,
}) => {
  // 🚀 V2 Feature Flag Check
  const [isV2Enabled, setIsV2Enabled] = React.useState(false);

  React.useEffect(() => {
    const checkV2Feature = async () => {
      const { featureManager } = await import('../../../config/featureFlags');
      const enabled = await featureManager.isEnabled('PROTOCOL_V2_ENABLED');
      setIsV2Enabled(enabled);
    };
    checkV2Feature();
  }, []);

  // Select correct form components based on feature flag
  const HandoverForm = isV2Enabled
    ? HandoverProtocolFormV2
    : HandoverProtocolForm;
  const ReturnForm = isV2Enabled ? ReturnProtocolFormV2 : ReturnProtocolForm;

  return (
    <>
      {/* Rental Form Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingRental ? 'Upraviť prenájom' : 'Nový prenájom'}
        </DialogTitle>
        <DialogContent>
          <RentalForm
            rental={editingRental}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Handover Protocol Dialog */}
      <Dialog
        open={openHandoverDialog}
        onClose={() => {
          console.log('🚨 MOBILE DEBUG: Dialog onClose triggered!');
          console.log(
            '🚨 MOBILE DEBUG: Modal closing via backdrop click or ESC'
          );
          console.log('🚨 MOBILE DEBUG: timestamp:', new Date().toISOString());

          // logMobile('WARN', 'RentalList', 'Handover modal closing via Dialog onClose', {
          //   timestamp: Date.now(),
          //   selectedRentalId: selectedRentalForProtocol?.id,
          //   reason: 'dialog_onClose'
          // });
          setOpenHandoverDialog(false);
        }}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            // Mobile responsive fixes
            margin: { xs: 1, sm: 2 },
            maxHeight: { xs: '95vh', sm: '90vh' },
            width: { xs: 'calc(100vw - 16px)', sm: '100%' },
            // Ensure proper scrolling on mobile
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle
          sx={{
            flexShrink: 0,
            borderBottom: 1,
            borderColor: 'divider',
            padding: { xs: 1, sm: 2 },
          }}
        >
          Odovzdávací protokol (V1)
        </DialogTitle>
        <DialogContent
          sx={{
            flex: 1,
            overflow: 'auto',
            padding: { xs: 1, sm: 2 },
          }}
        >
          {selectedRentalForProtocol && (
            <React.Suspense
              fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>Načítavam protokol...</Typography>
                </Box>
              }
            >
              <HandoverForm
                open={openHandoverDialog}
                rental={
                  selectedRentalForProtocol as Rental & Record<string, unknown>
                }
                onSave={handleSaveHandover}
                onClose={() => {
                  console.log(
                    '🚨 MOBILE DEBUG: HandoverProtocolForm onClose triggered!'
                  );
                  console.log(
                    '🚨 MOBILE DEBUG: Modal closing via form close button'
                  );
                  console.log(
                    '🚨 MOBILE DEBUG: timestamp:',
                    new Date().toISOString()
                  );

                  // logMobile('WARN', 'RentalList', 'Handover modal closing via HandoverProtocolForm onClose', {
                  //   timestamp: Date.now(),
                  //   selectedRentalId: selectedRentalForProtocol?.id,
                  //   reason: 'form_onClose'
                  // });
                  setOpenHandoverDialog(false);
                }}
              />
            </React.Suspense>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Protocol Dialog */}
      <Dialog
        open={openReturnDialog}
        onClose={() => setOpenReturnDialog(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            // Mobile responsive fixes
            margin: { xs: 1, sm: 2 },
            maxHeight: { xs: '95vh', sm: '90vh' },
            width: { xs: 'calc(100vw - 16px)', sm: '100%' },
            // Ensure proper scrolling on mobile
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle
          sx={{
            flexShrink: 0,
            borderBottom: 1,
            borderColor: 'divider',
            padding: { xs: 1, sm: 2 },
          }}
        >
          Preberací protokol (V1)
        </DialogTitle>
        <DialogContent
          sx={{
            flex: 1,
            overflow: 'auto',
            padding: { xs: 1, sm: 2 },
          }}
        >
          {selectedRentalForProtocol && (
            <>
              {/* ✅ LOADING STATE: Zobraz loading kým sa načítajú protokoly */}
              {(() => {
                // ✅ POUŽIŤ PROTOCOL STATUS MAP: Rýchlejšia kontrola existencie protokolu
                const backgroundStatus =
                  protocolStatusMap[selectedRentalForProtocol.id];
                const fallbackProtocols =
                  protocols[selectedRentalForProtocol.id];

                const hasHandover = backgroundStatus
                  ? backgroundStatus.hasHandoverProtocol
                  : !!fallbackProtocols?.handover;

                return !hasHandover;
              })() ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 4,
                  }}
                >
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    Načítavam odovzdávací protokol...
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Pre vytvorenie preberacieho protokolu je potrebný
                    odovzdávací protokol.
                  </Typography>
                </Box>
              ) : (
                (() => {
                  const handoverProtocol =
                    protocols[selectedRentalForProtocol.id]?.handover;

                  if (!handoverProtocol) {
                    return (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          p: 4,
                        }}
                      >
                        <Alert severity="error" sx={{ mb: 2 }}>
                          Odovzdávací protokol nebol nájdený
                        </Alert>
                        <Typography variant="body2" color="text.secondary">
                          Pre vytvorenie preberacieho protokolu je potrebný
                          odovzdávací protokol.
                        </Typography>
                      </Box>
                    );
                  }

                  return (
                    <ReturnForm
                      open={openReturnDialog}
                      onClose={() => setOpenReturnDialog(false)}
                      rental={
                        selectedRentalForProtocol as Rental &
                          Record<string, unknown>
                      }
                      handoverProtocol={
                        handoverProtocol as HandoverProtocol &
                          Record<string, unknown>
                      }
                      onSave={handleSaveReturn}
                    />
                  );
                })()
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Viewer */}
      {selectedPdf && (
        <PDFViewer
          open={pdfViewerOpen}
          onClose={handleClosePDF}
          protocolId={selectedPdf.url}
          protocolType={selectedPdf.type}
          title={selectedPdf.title}
        />
      )}

      {/* New Protocol Gallery */}
      <ProtocolGallery
        open={galleryOpen}
        onClose={handleCloseGallery}
        images={galleryImages}
        videos={galleryVideos}
        title={galleryTitle}
      />

      {/* Protocol Menu Dialog */}
      <Dialog
        open={openProtocolMenu}
        onClose={handleCloseProtocolMenu}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {selectedProtocolType === 'handover' ? '🚗→' : '←🚗'}
          {selectedProtocolType === 'handover'
            ? 'Odovzdávací protokol'
            : 'Preberací protokol'}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            <Button
              fullWidth
              variant="contained"
              startIcon={<PDFIcon />}
              onClick={handleDownloadPDF}
              sx={{
                bgcolor: '#f44336',
                py: { xs: 2, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '0.875rem' },
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(244,67,54,0.3)',
                '&:hover': {
                  bgcolor: '#d32f2f',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(244,67,54,0.4)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              📄 Stiahnuť PDF protokol
            </Button>

            <Button
              fullWidth
              variant="contained"
              startIcon={<GalleryIcon />}
              onClick={handleViewGallery}
              sx={{
                bgcolor: '#2196f3',
                py: { xs: 2, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '0.875rem' },
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(33,150,243,0.3)',
                '&:hover': {
                  bgcolor: '#1976d2',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(33,150,243,0.4)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              🖼️ Zobraziť fotky
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleCloseProtocolMenu}
              sx={{
                py: { xs: 2, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '0.875rem' },
                fontWeight: 500,
                borderRadius: 2,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  bgcolor: 'rgba(0,0,0,0.04)',
                },
              }}
            >
              Zavrieť
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
