import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Compare,
  Warning,
  CheckCircle,
  ExpandMore,
  Euro,
  LocalGasStation,
  Speed,
  Build
} from '@mui/icons-material';
import { Rental, ReturnProtocol, HandoverProtocol, ProtocolDamage } from '../../types';
import { API_BASE_URL } from '../../services/api';

interface ReturnProtocolFormProps {
  rental: Rental;
  handoverProtocol: HandoverProtocol;
  onSubmit: (protocol: Partial<ReturnProtocol>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface VehicleComparison {
  item: string;
  handoverStatus: string;
  returnStatus: string;
  changed: boolean;
  notes?: string;
}

interface AdditionalCharge {
  id: string;
  type: 'fuel' | 'damages' | 'cleaning' | 'other';
  description: string;
  amount: number;
  approved: boolean;
}

const ReturnProtocolForm: React.FC<ReturnProtocolFormProps> = ({
  rental,
  handoverProtocol,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<ReturnProtocol>>({
    rentalId: rental.id,
    handoverProtocolId: handoverProtocol.id,
    vehicleCondition: 'good',
    fuelLevel: 100,
    kmReading: handoverProtocol.kmReading || 0,
    kmOverage: 0,
    kmSurchargeAmount: 0,
    notes: '',
    returnPlace: '',
    customerSignature: '',
    signedAt: new Date(),
    signedLocation: '',
    createdBy: '', // will be set from auth context
    images: [],
    videos: [],
    damages: [],
    newDamages: [],
    additionalCharges: {
      fuel: 0,
      damages: 0,
      cleaning: 0,
      other: 0
    },
    depositRefunded: false,
    depositRefundAmount: 0,
    pdfGenerated: false,
    emailSent: false
  });

  // Lokálne state pre doplnkové informácie
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeSignature, setEmployeeSignature] = useState('');
  const [documentsSigned, setDocumentsSigned] = useState(false);

  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [damages, setDamages] = useState<ProtocolDamage[]>([]);
  const [newDamages, setNewDamages] = useState<ProtocolDamage[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
  const [selectedDamage, setSelectedDamage] = useState<ProtocolDamage | null>(null);
  const [damageDialogOpen, setDamageDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [currentSignatureType, setCurrentSignatureType] = useState<'employee' | 'customer'>('employee');

  // Načítanie dát z prenájmu
  useEffect(() => {
    setCustomerName(rental.customerName || '');
    setCustomerPhone(rental.customer?.phone || '');
    setCustomerEmail(rental.customer?.email || '');
    
    // Načítanie poškodení z handover protokolu
    if (handoverProtocol.damages) {
      setDamages(handoverProtocol.damages);
    }
  }, [rental, handoverProtocol]);

  const handleInputChange = (field: keyof ReturnProtocol, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validácia
    if (!customerName || !employeeName) {
      alert('Vyplňte všetky povinné polia');
      return;
    }
    
    if (!formData.customerSignature || !employeeSignature) {
      alert('Chýbajú podpisy');
      return;
    }

    // Príprava dát
    const protocolData: Partial<ReturnProtocol> = {
      ...formData,
      damages,
      newDamages,
      notes: formData.notes + `\n\nDoplnkové informácie:\nZákazník: ${customerName}\nTelefón: ${customerPhone}\nEmail: ${customerEmail}\nZamestnanec: ${employeeName}\nDokumenty podpísané: ${documentsSigned ? 'Áno' : 'Nie'}`
    };

    onSubmit(protocolData);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      {isLoading && <LinearProgress sx={{ mb: 2 }} />}
      
      <Typography variant="h4" color="white" gutterBottom>
        Preberací protokol
      </Typography>
      
      <Typography variant="body1" color="white" sx={{ mb: 3 }}>
        Prenájom: {rental.customerName} | Vozidlo: {rental.vehicle?.licensePlate || 'N/A'}
      </Typography>

      <form onSubmit={handleSubmit}>
        {/* Základné informácie */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" color="white" gutterBottom>
            Základné informácie
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label="Meno zákazníka"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              InputProps={{ style: { color: 'white' } }}
              InputLabelProps={{ style: { color: 'white' } }}
            />
            
            <TextField
              label="Telefón zákazníka"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              InputProps={{ style: { color: 'white' } }}
              InputLabelProps={{ style: { color: 'white' } }}
            />
            
            <TextField
              label="Email zákazníka"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              InputProps={{ style: { color: 'white' } }}
              InputLabelProps={{ style: { color: 'white' } }}
            />
            
            <TextField
              label="Meno zamestnanca"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              required
              InputProps={{ style: { color: 'white' } }}
              InputLabelProps={{ style: { color: 'white' } }}
            />
            
            <TextField
              label="Miesto vrátenia"
              value={formData.returnPlace}
              onChange={(e) => handleInputChange('returnPlace', e.target.value)}
              InputProps={{ style: { color: 'white' } }}
              InputLabelProps={{ style: { color: 'white' } }}
            />
          </Box>
        </Box>

        {/* Stav vozidla */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" color="white" gutterBottom>
            Stav vozidla pri vrátení
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
            <FormControl>
              <FormLabel sx={{ color: 'white' }}>Celkový stav vozidla</FormLabel>
              <RadioGroup
                value={formData.vehicleCondition}
                onChange={(e) => handleInputChange('vehicleCondition', e.target.value)}
              >
                <FormControlLabel value="excellent" control={<Radio sx={{ color: 'white' }} />} label="Výborný" />
                <FormControlLabel value="good" control={<Radio sx={{ color: 'white' }} />} label="Dobrý" />
                <FormControlLabel value="fair" control={<Radio sx={{ color: 'white' }} />} label="Priemerný" />
                <FormControlLabel value="poor" control={<Radio sx={{ color: 'white' }} />} label="Zlý" />
              </RadioGroup>
            </FormControl>
            
            <Box>
              <TextField
                label="Aktuálny km stav"
                type="number"
                value={formData.kmReading}
                onChange={(e) => handleInputChange('kmReading', parseInt(e.target.value))}
                InputProps={{ style: { color: 'white' } }}
                InputLabelProps={{ style: { color: 'white' } }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Hladina paliva (%)"
                type="number"
                value={formData.fuelLevel}
                onChange={(e) => handleInputChange('fuelLevel', parseInt(e.target.value))}
                InputProps={{ style: { color: 'white' } }}
                InputLabelProps={{ style: { color: 'white' } }}
              />
            </Box>
          </Box>
        </Box>

        {/* Poznámky */}
        <Box sx={{ mb: 4 }}>
          <TextField
            label="Poznámky"
            multiline
            rows={4}
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            fullWidth
            InputProps={{ style: { color: 'white' } }}
            InputLabelProps={{ style: { color: 'white' } }}
          />
        </Box>

        {/* Tlačidlá */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            type="button"
            variant="outlined"
            onClick={onCancel}
            disabled={isLoading}
            startIcon={<Cancel />}
          >
            Zrušiť
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={<Save />}
          >
            Uložiť protokol
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default ReturnProtocolForm; 