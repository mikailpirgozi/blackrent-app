import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  useMediaQuery,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as HandoverIcon,
  AssignmentReturn as ReturnIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import ResponsiveTable, { ResponsiveTableColumn } from '../common/ResponsiveTable';
import { useApp } from '../../context/AppContext';
import { Rental, HandoverProtocol, ReturnProtocol } from '../../types';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import RentalForm from './RentalForm';
import HandoverProtocolForm from '../protocols/HandoverProtocolForm';
import ReturnProtocolForm from '../protocols/ReturnProtocolForm';

export default function RentalList() {
  const { state, createRental, updateRental, deleteRental } = useApp();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [protocols, setProtocols] = useState<{
    [rentalId: string]: {
      handover?: HandoverProtocol;
      return?: ReturnProtocol;
    };
  }>({});
  const [openHandoverDialog, setOpenHandoverDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [selectedRentalForProtocol, setSelectedRentalForProtocol] = useState<Rental | null>(null);
  const [loadingProtocols, setLoadingProtocols] = useState<string[]>([]);
  const isMobile = useMediaQuery('(max-width:600px)');

  // Načítanie protokolov pre prenájom
  const loadProtocolsForRental = async (rentalId: string) => {
    if (loadingProtocols.includes(rentalId)) return;
    
    setLoadingProtocols(prev => [...prev, rentalId]);
    try {
      const response = await fetch(`/api/protocols/rental/${rentalId}`);
      const data = await response.json();
      const { handoverProtocols, returnProtocols } = data;
      
      setProtocols(prev => ({
        ...prev,
        [rentalId]: {
          handover: handoverProtocols?.[0] || undefined,
          return: returnProtocols?.[0] || undefined,
        }
      }));
    } catch (error) {
      console.error('Chyba pri načítaní protokolov:', error);
    } finally {
      setLoadingProtocols(prev => prev.filter(id => id !== rentalId));
    }
  };

  // Funkcia pre získanie stavu protokolov
  const getProtocolStatus = (rentalId: string) => {
    const rentalProtocols = protocols[rentalId];
    if (!rentalProtocols) return 'none';
    
    const hasHandover = !!rentalProtocols.handover;
    const hasReturn = !!rentalProtocols.return;
    
    if (hasReturn) return 'completed';
    if (hasHandover) return 'handover-only';
    return 'none';
  };

  // Funkcia pre zobrazenie stavu protokolov
  const renderProtocolStatus = (rentalId: string) => {
    const status = getProtocolStatus(rentalId);
    
    switch (status) {
      case 'completed':
        return (
          <Chip
            icon={<CompletedIcon />}
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
      const response = await fetch('/api/protocols/handover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(protocolData),
      });
      const data = await response.json() as any;
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
      const response = await fetch('/api/protocols/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(protocolData),
      });
      const data = await response.json() as any;
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
          {renderProtocolStatus(rental.id)}
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
            <Tooltip title="Prevzatie vozidla">
              <IconButton
                size="small"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  loadProtocolsForRental(rental.id);
                  handleCreateHandover(rental); 
                }}
                color={getProtocolStatus(rental.id) === 'none' ? 'primary' : 'default'}
                disabled={getProtocolStatus(rental.id) !== 'none'}
              >
                <HandoverIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Vrátenie vozidla">
              <IconButton
                size="small"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  loadProtocolsForRental(rental.id);
                  handleCreateReturn(rental); 
                }}
                color={getProtocolStatus(rental.id) === 'handover-only' ? 'primary' : 'default'}
                disabled={getProtocolStatus(rental.id) !== 'handover-only'}
              >
                <ReturnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
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
          <strong>Workflow protokolov:</strong> Najprv vytvorte protokol prevzatia vozidla (🔄), potom protokol vrátenia (↩️)
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
          {selectedRentalForProtocol && protocols[selectedRentalForProtocol.id]?.handover && (
            <ReturnProtocolForm
              open={openReturnDialog}
              rental={selectedRentalForProtocol}
              handoverProtocol={protocols[selectedRentalForProtocol.id].handover!}
              onSave={handleSaveReturn}
              onClose={() => setOpenReturnDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
} 