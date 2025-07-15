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
  ListItemButton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Info,
  Warning,
  CheckCircle,
  Close
} from '@mui/icons-material';
import { Rental, HandoverProtocol, ProtocolDamage } from '../../types';
import { API_BASE_URL } from '../../services/api';

interface HandoverProtocolFormProps {
  rental: Rental;
  onSubmit: (protocol: Partial<HandoverProtocol>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface VehicleCheckItem {
  id: string;
  category: string;
  item: string;
  status: 'ok' | 'damaged' | 'missing';
  notes?: string;
}

const VEHICLE_CHECK_ITEMS = [
  // Exteriér
  { category: 'Exteriér', item: 'Nárazník predný', id: 'front_bumper' },
  { category: 'Exteriér', item: 'Nárazník zadný', id: 'rear_bumper' },
  { category: 'Exteriér', item: 'Dvere ľavé', id: 'left_doors' },
  { category: 'Exteriér', item: 'Dvere pravé', id: 'right_doors' },
  { category: 'Exteriér', item: 'Kapota', id: 'hood' },
  { category: 'Exteriér', item: 'Kuffor', id: 'trunk' },
  { category: 'Exteriér', item: 'Strecha', id: 'roof' },
  { category: 'Exteriér', item: 'Predné svetlá', id: 'front_lights' },
  { category: 'Exteriér', item: 'Zadné svetlá', id: 'rear_lights' },
  { category: 'Exteriér', item: 'Spätné zrkadlá', id: 'mirrors' },
  { category: 'Exteriér', item: 'Pneumatiky', id: 'tires' },
  { category: 'Exteriér', item: 'Ráfiky', id: 'wheels' },
  { category: 'Exteriér', item: 'Čelné sklo', id: 'windshield' },
  { category: 'Exteriér', item: 'Bočné sklá', id: 'side_windows' },
  { category: 'Exteriér', item: 'Zadné sklo', id: 'rear_window' },
  
  // Interiér
  { category: 'Interiér', item: 'Sedadlá', id: 'seats' },
  { category: 'Interiér', item: 'Volant', id: 'steering_wheel' },
  { category: 'Interiér', item: 'Prístrojová doska', id: 'dashboard' },
  { category: 'Interiér', item: 'Podlahy', id: 'floors' },
  { category: 'Interiér', item: 'Stropy', id: 'ceiling' },
  { category: 'Interiér', item: 'Bezpečnostné pásy', id: 'seat_belts' },
  { category: 'Interiér', item: 'Rádio/navigácia', id: 'radio' },
  { category: 'Interiér', item: 'Klimatizácia', id: 'air_conditioning' },
  
  // Technika
  { category: 'Technika', item: 'Motor', id: 'engine' },
  { category: 'Technika', item: 'Brzdy', id: 'brakes' },
  { category: 'Technika', item: 'Svetlá funkčnosť', id: 'lights_function' },
  { category: 'Technika', item: 'Smerovky', id: 'indicators' },
  { category: 'Technika', item: 'Klaksón', id: 'horn' },
  { category: 'Technika', item: 'Stierače', id: 'wipers' },
  
  // Vybavenie
  { category: 'Vybavenie', item: 'Náhradné koleso', id: 'spare_wheel' },
  { category: 'Vybavenie', item: 'Zdvihák', id: 'jack' },
  { category: 'Vybavenie', item: 'Kľúče', id: 'keys' },
  { category: 'Vybavenie', item: 'Dokumenty', id: 'documents' },
  { category: 'Vybavenie', item: 'Lekárnička', id: 'first_aid' },
  { category: 'Vybavenie', item: 'Výstražný trojuholník', id: 'warning_triangle' },
  { category: 'Vybavenie', item: 'Hasič', id: 'fire_extinguisher' }
];

const HandoverProtocolForm: React.FC<HandoverProtocolFormProps> = ({
  rental,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<HandoverProtocol>>({
    rentalId: rental.id,
    vehicleCondition: 'good',
    fuelLevel: 100,
    kmReading: 0,
    notes: '',
    handoverPlace: '',
    customerSignature: '',
    signedAt: new Date(),
    signedLocation: '',
    createdBy: '', // will be set from auth context
    images: [],
    videos: [],
    damages: [],
    pdfGenerated: false,
    emailSent: false
  });

  // Lokálne state pre doplnkové informácie
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeSignature, setEmployeeSignature] = useState('');
  const [keysCounted, setKeysCounted] = useState(0);
  const [documentsSigned, setDocumentsSigned] = useState(false);

  const [checkItems, setCheckItems] = useState<VehicleCheckItem[]>(
    VEHICLE_CHECK_ITEMS.map(item => ({
      ...item,
      status: 'ok'
    }))
  );

  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [documentFiles, setDocumentFiles] = useState<any[]>([]);
  const [damages, setDamages] = useState<ProtocolDamage[]>([]);
  const [selectedDamage, setSelectedDamage] = useState<ProtocolDamage | null>(null);
  const [damageDialogOpen, setDamageDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [currentSignatureType, setCurrentSignatureType] = useState<'employee' | 'customer'>('employee');

  // Načítanie dát z prenájmu
  useEffect(() => {
    setCustomerName(rental.customerName || '');
    setCustomerPhone(rental.customer?.phone || '');
    setCustomerEmail(rental.customer?.email || '');
  }, [rental]);

  const handleInputChange = (field: keyof HandoverProtocol, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckItemChange = (itemId: string, status: 'ok' | 'damaged' | 'missing', notes?: string) => {
    setCheckItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, status, notes }
        : item
    ));
  };

  const handleAddDamage = () => {
    setSelectedDamage({
      id: Date.now().toString(),
      location: '',
      description: '',
      severity: 'minor',
      images: []
    });
    setDamageDialogOpen(true);
  };

  const handleEditDamage = (damage: ProtocolDamage) => {
    setSelectedDamage(damage);
    setDamageDialogOpen(true);
  };

  const handleSaveDamage = (damage: ProtocolDamage) => {
    setDamages(prev => {
      const existingIndex = prev.findIndex(d => d.id === damage.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = damage;
        return updated;
      } else {
        return [...prev, damage];
      }
    });
    setDamageDialogOpen(false);
    setSelectedDamage(null);
  };

  const handleDeleteDamage = (damageId: string) => {
    setDamages(prev => prev.filter(d => d.id !== damageId));
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
    const protocolData: Partial<HandoverProtocol> = {
      ...formData,
      damages,
      notes: formData.notes + `\n\nDoplnkové informácie:\nZákazník: ${customerName}\nTelefón: ${customerPhone}\nEmail: ${customerEmail}\nZamestnanec: ${employeeName}\nKľúče: ${keysCounted}\nDokumenty podpísané: ${documentsSigned ? 'Áno' : 'Nie'}\n\nKontrolný zoznam:\n${checkItems.map(item => `${item.category} - ${item.item}: ${item.status}${item.notes ? ` (${item.notes})` : ''}`).join('\n')}`
    };

    onSubmit(protocolData);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'warning';
      case 'major': return 'error';
      case 'critical': return 'error';
      default: return 'info';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'success';
      case 'damaged': return 'error';
      case 'missing': return 'warning';
      default: return 'default';
    }
  };

  const groupedCheckItems = checkItems.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {} as { [key: string]: VehicleCheckItem[] });

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      {isLoading && <LinearProgress sx={{ mb: 2 }} />}
      
      <Typography variant="h4" color="white" gutterBottom>
        Odovzdávací protokol
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
              label="Miesto odovzdania"
              value={formData.handoverPlace}
              onChange={(e) => handleInputChange('handoverPlace', e.target.value)}
              InputProps={{ style: { color: 'white' } }}
              InputLabelProps={{ style: { color: 'white' } }}
            />
            
            <TextField
              label="Najazdené km"
              type="number"
              value={formData.kmReading}
              onChange={(e) => handleInputChange('kmReading', parseInt(e.target.value))}
              InputProps={{ style: { color: 'white' } }}
              InputLabelProps={{ style: { color: 'white' } }}
            />
          </Box>
        </Box>

        {/* Stav vozidla */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" color="white" gutterBottom>
            Stav vozidla
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
                label="Hladina paliva (%)"
                type="number"
                value={formData.fuelLevel}
                onChange={(e) => handleInputChange('fuelLevel', parseInt(e.target.value))}
                inputProps={{ min: 0, max: 100 }}
                InputProps={{ style: { color: 'white' } }}
                InputLabelProps={{ style: { color: 'white' } }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Počet kľúčov"
                type="number"
                value={keysCounted}
                onChange={(e) => setKeysCounted(parseInt(e.target.value))}
                inputProps={{ min: 0 }}
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

export default HandoverProtocolForm; 