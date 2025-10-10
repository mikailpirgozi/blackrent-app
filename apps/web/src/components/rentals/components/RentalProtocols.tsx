import React from 'react';
import { FileImage, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type {
  HandoverProtocol,
  ReturnProtocol,
  ProtocolImage,
  ProtocolVideo,
  Rental,
} from '../../../types';
import PDFViewer from '../../common/PDFViewer';
import { ProtocolGallery } from '../../common/ProtocolGallery';
import ReturnProtocolForm from '../../protocols/ReturnProtocolForm';
import RentalForm from '../RentalForm';
import { logger } from '@/utils/smartLogger';

// 🚀 LAZY LOADING: Protocols loaded only when needed
const HandoverProtocolForm = React.lazy(
  () => import('../../protocols/HandoverProtocolForm')
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
  setOpenDialog: (_open: boolean) => void;
  setOpenHandoverDialog: (_open: boolean) => void;
  setOpenReturnDialog: (_open: boolean) => void;
  handleSave: (_rental: Rental) => void;
  handleCancel: () => void;
  handleSaveHandover: (
    _protocol: HandoverProtocol | Record<string, unknown>
  ) => void;
  handleSaveReturn: (
    _protocol: ReturnProtocol | Record<string, unknown>
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
  // Use standard protocol forms
  const HandoverForm = HandoverProtocolForm;
  const ReturnForm = ReturnProtocolForm;

  return (
    <>
      {/* Rental Form Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRental ? 'Upraviť prenájom' : 'Nový prenájom'}
            </DialogTitle>
            <DialogDescription>
              {editingRental
                ? 'Upravte údaje prenájmu'
                : 'Vytvorte nový prenájom vozidla'}
            </DialogDescription>
          </DialogHeader>
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
        onOpenChange={open => {
          if (!open) {
            logger.debug('🚨 MOBILE DEBUG: Dialog onClose triggered!');
            logger.debug(
              '🚨 MOBILE DEBUG: Modal closing via backdrop click or ESC'
            );
            logger.debug(
              '🚨 MOBILE DEBUG: timestamp:',
              new Date().toISOString()
            );

            // logMobile('WARN', 'RentalList', 'Handover modal closing via Dialog onClose', {
            //   timestamp: Date.now(),
            //   selectedRentalId: selectedRentalForProtocol?.id,
            //   reason: 'dialog_onClose'
            // });
            setOpenHandoverDialog(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0 border-b p-4 sm:p-6">
            <DialogTitle>Odovzdávací protokol (V1)</DialogTitle>
            <DialogDescription>
              Vytvorte odovzdávací protokol pre vozidlo
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-2 sm:p-4">
            {selectedRentalForProtocol && (
              <React.Suspense
                fallback={
                  <div className="flex justify-center items-center p-8 gap-4">
                    <Spinner />
                    <p className="text-sm text-muted-foreground">
                      Načítavam protokol...
                    </p>
                  </div>
                }
              >
                <HandoverForm
                  open={openHandoverDialog}
                  rental={
                    selectedRentalForProtocol as Rental &
                      Record<string, unknown>
                  }
                  onSave={handleSaveHandover}
                  onClose={() => {
                    logger.debug(
                      '🚨 MOBILE DEBUG: HandoverProtocolForm onClose triggered!'
                    );
                    logger.debug(
                      '🚨 MOBILE DEBUG: Modal closing via form close button'
                    );
                    logger.debug(
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Protocol Dialog */}
      <Dialog open={openReturnDialog} onOpenChange={setOpenReturnDialog}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0 border-b p-4 sm:p-6">
            <DialogTitle>Preberací protokol (V1)</DialogTitle>
            <DialogDescription>
              Vytvorte preberací protokol pre vozidlo
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-2 sm:p-4">
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
                  <div className="flex flex-col items-center p-8">
                    <Spinner className="mb-4" />
                    <p className="text-base text-muted-foreground mb-2">
                      Načítavam odovzdávací protokol...
                    </p>
                    <p className="text-sm text-muted-foreground text-center">
                      Pre vytvorenie preberacieho protokolu je potrebný
                      odovzdávací protokol.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const handoverProtocol =
                      protocols[selectedRentalForProtocol.id]?.handover;

                    if (!handoverProtocol) {
                      return (
                        <div className="flex flex-col items-center p-8">
                          <Alert className="mb-4">
                            <AlertDescription>
                              Odovzdávací protokol nebol nájdený
                            </AlertDescription>
                          </Alert>
                          <p className="text-sm text-muted-foreground text-center">
                            Pre vytvorenie preberacieho protokolu je potrebný
                            odovzdávací protokol.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <React.Suspense
                        fallback={
                          <div className="flex justify-center items-center p-8 gap-4">
                            <Spinner />
                            <p className="text-sm text-muted-foreground">
                              Načítavam protokol...
                            </p>
                          </div>
                        }
                      >
                        <ReturnForm
                          open={openReturnDialog}
                          rental={
                            selectedRentalForProtocol as Rental &
                              Record<string, unknown>
                          }
                          handoverProtocol={
                            handoverProtocol as unknown as HandoverProtocol
                          }
                          onSave={handleSaveReturn}
                          onClose={() => setOpenReturnDialog(false)}
                        />
                      </React.Suspense>
                    );
                  })()
                )}
              </>
            )}
          </div>
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
        onOpenChange={open => !open && handleCloseProtocolMenu()}
      >
        <DialogContent className="max-w-md border-0 shadow-2xl p-0 gap-0 overflow-hidden">
          {/* Gradient Header */}
          <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 pb-8">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />

            <DialogHeader className="relative space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl">
                  {selectedProtocolType === 'handover' ? (
                    <FileText className="h-6 w-6 text-white" />
                  ) : (
                    <FileImage className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-xl font-bold text-white mb-1">
                    {selectedProtocolType === 'handover'
                      ? 'Odovzdávací protokol'
                      : 'Preberací protokol'}
                  </DialogTitle>
                  <DialogDescription className="text-white/80 text-sm">
                    Vyberte akciu ktorú chcete vykonať
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-3">
            {/* PDF Download Button */}
            <Button
              onClick={handleDownloadPDF}
              className="w-full h-auto p-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-base">Stiahnuť PDF</div>
                  <div className="text-xs text-white/80">
                    Protokol v PDF formáte
                  </div>
                </div>
              </div>
            </Button>

            {/* Gallery Button */}
            <Button
              onClick={handleViewGallery}
              className="w-full h-auto p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                  <FileImage className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-base">Zobraziť fotky</div>
                  <div className="text-xs text-white/80">Galéria protokolu</div>
                </div>
              </div>
            </Button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
            </div>

            {/* Close Button */}
            <Button
              onClick={handleCloseProtocolMenu}
              variant="ghost"
              className="w-full h-11 font-medium hover:bg-muted/80 transition-colors"
            >
              Zavrieť
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
