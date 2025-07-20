import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Assignment as HandoverIcon,
  AssignmentReturn as ReturnIcon,
  PictureAsPdf as PDFIcon,
  PhotoLibrary as GalleryIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import ResponsiveTable, { ResponsiveTableColumn } from '../common/ResponsiveTable';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Rental } from '../../types';
import { apiService } from '../../services/api';
import RentalForm from './RentalForm';
import HandoverProtocolForm from '../protocols/HandoverProtocolForm';
import ReturnProtocolForm from '../protocols/ReturnProtocolForm';
import PDFViewer from '../common/PDFViewer';
import ImageGalleryModal from '../common/ImageGalleryModal';

export default function RentalList() {
  const { state, createRental, updateRental, deleteRental } = useApp();
  const { state: authState } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [protocols, setProtocols] = useState<Record<string, { handover?: any; return?: any }>>({});
  const [loadingProtocols, setLoadingProtocols] = useState<string[]>([]);
  
  // Protocol dialogs
  const [openHandoverDialog, setOpenHandoverDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [selectedRentalForProtocol, setSelectedRentalForProtocol] = useState<Rental | null>(null);
  
  // PDF viewer
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string; type: 'handover' | 'return' } | null>(null);
  
  // Image gallery
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedProtocolImages, setSelectedProtocolImages] = useState<any[]>([]);
  const [galleryTitle, setGalleryTitle] = useState('');

  // Optimalizovaná funkcia pre načítanie protokolov na požiadanie
  const loadProtocolsForRental = useCallback(async (rentalId: string) => {
    // Kontrola či už načítavame
    if (loadingProtocols.includes(rentalId)) return;
    
    // Kontrola či už máme dáta
    if (protocols[rentalId]) {
      console.log('✅ Protokoly už načítané pre:', rentalId);
      return;
    }
    
    console.log('🔍 Načítavam protokoly pre:', rentalId);
    setLoadingProtocols(prev => [...prev, rentalId]);
    
    try {
      const data = await apiService.getProtocolsByRental(rentalId);
      
      setProtocols(prev => ({
        ...prev,
        [rentalId]: {
          handover: data?.handoverProtocols?.[0] || undefined,
          return: data?.returnProtocols?.[0] || undefined,
        }
      }));
    } catch (error) {
      console.error('❌ Chyba pri načítaní protokolov:', error);
    } finally {
      setLoadingProtocols(prev => prev.filter(id => id !== rentalId));
    }
  }, [protocols, loadingProtocols]);

  // Funkcia pre zobrazenie protokolov na požiadanie
  const handleViewProtocols = async (rental: Rental) => {
    // Ak už sú protokoly načítané, nechaj ich zobrazené
    if (protocols[rental.id]) {
      return;
    }
    
    console.log('🔍 Načítavam protokoly pre prenájom:', rental.id);
    await loadProtocolsForRental(rental.id);
  };

  // Funkcia pre skrytie protokolov
  const handleHideProtocols = (rentalId: string) => {
    setProtocols(prev => {
      const newProtocols = { ...prev };
      delete newProtocols[rentalId];
      return newProtocols;
    });
  };

  // 🚀 PERFORMANCE OPTIMIZATION: Memoized protocol status
  const getProtocolStatus = useMemo(() => {
    return (rentalId: string) => {
      const rentalProtocols = protocols[rentalId];
      if (!rentalProtocols) return 'none';
      
      const hasHandover = !!rentalProtocols.handover;
      const hasReturn = !!rentalProtocols.return;
      
      if (hasReturn) return 'completed';
      if (hasHandover) return 'handover-only';
      return 'none';
    };
  }, [protocols]);

  // Funkcia pre zobrazenie stavu protokolov
  const renderProtocolStatus = (rentalId: string) => {
    const status = getProtocolStatus(rentalId);
    
    switch (status) {
      case 'completed':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Dokončené"
            color="success"
            size="small"
            variant="outlined"
          />
        );
      case 'handover-only':
        return (
          <Chip
            icon={<PendingIcon />}
            label="Čaká na vrátenie"
            color="warning"
            size="small"
            variant="outlined"
          />
        );
      case 'none':
        return (
          <Chip
            icon={<ErrorIcon />}
            label="Bez protokolu"
            color="error"
            size="small"
            variant="outlined"
          />
        );
      default:
        return null;
    }
  };

  const handleAdd = () => {
    setEditingRental(null);
    setOpenDialog(true);
  };

  const handleEdit = (rental: Rental) => {
    setEditingRental(rental);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Naozaj chcete vymazať tento prenájom?')) {
      try {
        await deleteRental(id);
        console.log('Prenájom úspešne vymazaný');
      } catch (error) {
        console.error('Chyba pri mazaní prenájmu:', error);
        alert('Chyba pri mazaní prenájmu. Skúste to znovu.');
      }
    }
  };

  const handleSave = async (rental: Rental) => {
    try {
      if (editingRental) {
        await updateRental(rental);
        alert('Prenájom bol úspešne aktualizovaný!');
      } else {
        await createRental(rental);
        alert('Prenájom bol úspešne pridaný!');
      }
      setOpenDialog(false);
      setEditingRental(null);
    } catch (error) {
      console.error('Chyba pri ukladaní prenájmu:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznáma chyba';
      alert(`Chyba pri ukladaní prenájmu: ${errorMessage}`);
    }
  };

  // Handover Protocol handlers
  const handleCreateHandover = (rental: Rental) => {
    setSelectedRentalForProtocol(rental);
    setOpenHandoverDialog(true);
  };

  const handleSaveHandover = async (protocolData: any) => {
    try {
      // Debug log
      console.log('handleSaveHandover - protocolData:', protocolData);
      const data = await apiService.createHandoverProtocol(protocolData);
      console.log('Handover protocol created:', data);
      
      // Aktualizácia protokolov
      if (selectedRentalForProtocol) {
        await loadProtocolsForRental(selectedRentalForProtocol.id);
      }
      
      alert('Prevzatie vozidla úspešne dokončené!');
      setOpenHandoverDialog(false);
      setSelectedRentalForProtocol(null);
    } catch (error) {
      console.error('Chyba pri ukladaní handover protokolu:', error);
      alert('Chyba pri ukladaní protokolu. Skúste to znovu.');
    }
  };

  // Return Protocol handlers
  const handleCreateReturn = (rental: Rental) => {
    const rentalProtocols = protocols[rental.id];
    if (!rentalProtocols?.handover) {
      alert('Najprv musíte vytvoriť protokol prevzatia vozidla!');
      return;
    }
    
    setSelectedRentalForProtocol(rental);
    setOpenReturnDialog(true);
  };

  const handleSaveReturn = async (protocolData: any) => {
    try {
      const data = await apiService.createReturnProtocol(protocolData);
      console.log('Return protocol created:', data);
      
      // Aktualizácia protokolov
      if (selectedRentalForProtocol) {
        await loadProtocolsForRental(selectedRentalForProtocol.id);
      }
      
      alert('Vrátenie vozidla úspešne dokončené!');
      setOpenReturnDialog(false);
      setSelectedRentalForProtocol(null);
    } catch (error) {
      console.error('Chyba pri ukladaní return protokolu:', error);
      alert('Chyba pri ukladaní protokolu. Skúste to znovu.');
    }
  };

  const handleViewPDF = (protocolId: string, type: 'handover' | 'return', title: string) => {
    setSelectedPdf({ url: protocolId, title, type });
    setPdfViewerOpen(true);
  };

  const handleClosePDF = () => {
    setPdfViewerOpen(false);
    setSelectedPdf(null);
  };

  // Image gallery handlers
  const handleOpenGallery = (rental: Rental, protocolType: 'handover' | 'return') => {
    const protocol = protocols[rental.id]?.[protocolType];
    if (!protocol) {
      alert('Protokol nebol nájdený!');
      return;
    }

    // Zber všetkých obrázkov z protokolu
    const allImages: any[] = [];
    
    // Vehicle images
    if (protocol.vehicleImages && protocol.vehicleImages.length > 0) {
      allImages.push(...protocol.vehicleImages.map((img: any) => ({
        ...img,
        type: 'vehicle'
      })));
    }
    
    // Document images
    if (protocol.documentImages && protocol.documentImages.length > 0) {
      allImages.push(...protocol.documentImages.map((img: any) => ({
        ...img,
        type: 'document'
      })));
    }
    
    // Damage images
    if (protocol.damageImages && protocol.damageImages.length > 0) {
      allImages.push(...protocol.damageImages.map((img: any) => ({
        ...img,
        type: 'damage'
      })));
    }

    if (allImages.length === 0) {
      alert('Protokol neobsahuje žiadne obrázky!');
      return;
    }

    setSelectedProtocolImages(allImages);
    setGalleryTitle(`${protocolType === 'handover' ? 'Prevzatie' : 'Vrátenie'} vozidla - ${rental.customerName}`);
    setGalleryOpen(true);
  };

  const handleCloseGallery = () => {
    setGalleryOpen(false);
    setSelectedProtocolImages([]);
    setGalleryTitle('');
  };

  const handleDeleteProtocol = async (rentalId: string, type: 'handover' | 'return') => {
    if (!window.confirm(`Naozaj chcete vymazať protokol ${type === 'handover' ? 'prevzatia' : 'vrátenia'}?`)) {
      return;
    }

    try {
      const protocol = protocols[rentalId]?.[type];
      if (!protocol?.id) {
        alert('Protokol sa nenašiel!');
        return;
      }

      // TODO: Implementovať deleteProtocol v apiService
      console.log('Deleting protocol:', protocol.id, type);
      console.log(`Protokol ${type} pre prenájom ${rentalId} bol vymazaný`);
      
      // Aktualizácia protokolov
      await loadProtocolsForRental(rentalId);
    } catch (error) {
      console.error('Chyba pri mazaní protokolu:', error);
      alert('Chyba pri mazaní protokolu. Skúste to znovu.');
    }
  };

  // Column definitions for ResponsiveTable
  const columns: ResponsiveTableColumn[] = useMemo(() => [
    {
      id: 'vehicle',
      label: 'Vozidlo',
      width: { xs: '120px', md: '150px' },
      render: (value, rental: Rental) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'Bez vozidla'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {rental.vehicle?.licensePlate || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'customerName',
      label: 'Zákazník',
      width: { xs: '100px', md: '130px' }
    },
    {
      id: 'startDate',
      label: 'Od',
      width: { xs: '80px', md: '100px' },
      render: (value) => {
        const date = value instanceof Date ? value : new Date(value);
        return !isNaN(date.getTime()) ? format(date, 'dd.MM.yyyy', { locale: sk }) : 'N/A';
      }
    },
    {
      id: 'endDate',
      label: 'Do',
      width: { xs: '80px', md: '100px' },
      render: (value) => {
        const date = value instanceof Date ? value : new Date(value);
        return !isNaN(date.getTime()) ? format(date, 'dd.MM.yyyy', { locale: sk }) : 'N/A';
      }
    },
    {
      id: 'totalPrice',
      label: 'Cena (€)',
      width: { xs: '80px', md: '100px' },
      render: (value) => (
        <Typography variant="body2" fontWeight="bold">
          {typeof value === 'number' ? value.toFixed(2) : '0.00'} €
        </Typography>
      )
    },
    {
      id: 'protocols',
      label: 'Protokoly',
      width: { xs: '120px', md: '150px' },
      render: (value, rental: Rental) => (
        <Box>
          {/* Tlačidlá pre vytvorenie protokolov */}
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
            <Tooltip title="Prevzatie vozidla">
              <IconButton
                size="small"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleCreateHandover(rental); 
                }}
                color="primary"
              >
                <HandoverIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Vrátenie vozidla">
              <IconButton
                size="small"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleCreateReturn(rental); 
                }}
                color="primary"
              >
                <ReturnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Tlačidlo na zobrazenie protokolov */}
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              handleViewProtocols(rental);
            }}
            startIcon={<VisibilityIcon />}
            disabled={loadingProtocols.includes(rental.id)}
            sx={{ width: '100%', fontSize: '0.75rem' }}
          >
            {loadingProtocols.includes(rental.id) ? 'Načítavam...' : 'Zobraziť protokoly'}
          </Button>

          {/* Zobrazenie protokolov ak sú načítané */}
          {protocols[rental.id] && (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              {protocols[rental.id]?.handover && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="caption">Prevzatie</Typography>
                  <IconButton
                    size="small"
                    component="a"
                    href={protocols[rental.id]?.handover?.pdfUrl}
                    target="_blank"
                    download
                    color="success"
                  >
                    <PDFIcon fontSize="small" />
                  </IconButton>
                  <Tooltip title="Galerie obrázkov">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenGallery(rental, 'handover');
                      }}
                      color="primary"
                    >
                      <GalleryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              {protocols[rental.id]?.return && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="caption">Vrátenie</Typography>
                  <IconButton
                    size="small"
                    component="a"
                    href={protocols[rental.id]?.return?.pdfUrl}
                    target="_blank"
                    download
                    color="success"
                  >
                    <PDFIcon fontSize="small" />
                  </IconButton>
                  <Tooltip title="Galerie obrázkov">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenGallery(rental, 'return');
                      }}
                      color="primary"
                    >
                      <GalleryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              
              {/* Tlačidlo na skrytie protokolov */}
              <Button
                size="small"
                variant="text"
                onClick={(e) => {
                  e.stopPropagation();
                  handleHideProtocols(rental.id);
                }}
                sx={{ mt: 1, fontSize: '0.7rem' }}
              >
                Skryť protokoly
              </Button>
            </Box>
          )}
        </Box>
      )
    },
    {
      id: 'actions',
      label: 'Akcie',
      width: { xs: '120px', md: '150px' },
      render: (value, rental: Rental) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={e => { e.stopPropagation(); handleEdit(rental); }}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={e => { e.stopPropagation(); handleDelete(rental.id); }}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      )
    }
  ], [protocols, loadingProtocols]);

  const rentals = state.rentals || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Prenájmy</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ 
            minWidth: isMobile ? 'auto' : 'auto',
            px: isMobile ? 2 : 3
          }}
        >
          {isMobile ? 'Pridať' : 'Nový prenájom'}
        </Button>
      </Box>

      {/* Workflow Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Workflow protokolov:</strong> Najprv vytvorte protokol prevzatia vozidla (🔄), potom protokol vrátenia (↩️). Kliknite "Zobraziť protokoly" pre zobrazenie existujúcich protokolov.
        </Typography>
      </Alert>

      <ResponsiveTable
        columns={columns}
        data={rentals}
        selectable={true}
        selected={selected}
        onSelectionChange={setSelected}
        emptyMessage="Žiadne prenájmy"
      />

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
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Handover Protocol Dialog */}
      <Dialog
        open={openHandoverDialog}
        onClose={() => setOpenHandoverDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Protokol prevzatia vozidla</DialogTitle>
        <DialogContent>
          {selectedRentalForProtocol && (
            <HandoverProtocolForm
              open={openHandoverDialog}
              rental={selectedRentalForProtocol}
              onSave={handleSaveHandover}
              onClose={() => setOpenHandoverDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Return Protocol Dialog */}
      <Dialog
        open={openReturnDialog}
        onClose={() => setOpenReturnDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Protokol vrátenia vozidla</DialogTitle>
        <DialogContent>
          {selectedRentalForProtocol && (
            <ReturnProtocolForm
              open={openReturnDialog}
              onClose={() => setOpenReturnDialog(false)}
              rental={selectedRentalForProtocol}
              handoverProtocol={protocols[selectedRentalForProtocol.id]?.handover}
              onSave={handleSaveReturn}
            />
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

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        open={galleryOpen}
        onClose={handleCloseGallery}
        images={selectedProtocolImages}
        title={galleryTitle}
      />
    </Box>
  );
} 