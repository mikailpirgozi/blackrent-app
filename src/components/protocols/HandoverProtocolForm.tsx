import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Assignment,
  CarRental,
  LocationOn,
  AccessTime,
  CheckCircle,
  RadioButtonUnchecked,
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Photo as PhotoIcon,
  Description as DescriptionIcon,
  PhotoCamera,
  Draw as DrawIcon,
  PictureAsPdf as PdfIcon,
  Visibility,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Rental, HandoverProtocol, VehicleCondition, ProtocolDamage, ProtocolSignature, ProtocolImage, ProtocolVideo } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import SerialPhotoCapture from '../common/SerialPhotoCapture';
import SignaturePad from '../common/SignaturePad';
import R2FileUpload from '../common/R2FileUpload';
import MobileFileUpload from '../common/MobileFileUpload';
import PDFGenerator from '../../utils/pdfGenerator';
import ImageProcessor from '../../utils/imageProcessor';
import EnhancedPDFGenerator from '../../utils/enhancedPdfGenerator';

interface HandoverProtocolFormProps {
  open: boolean;
  rental: Rental;
  onSave: (protocolData: any) => Promise<void>;
  onClose: () => void;
}

const HandoverProtocolForm: React.FC<HandoverProtocolFormProps> = ({ open, rental, onSave, onClose }) => {
  const { state } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [activePhotoCapture, setActivePhotoCapture] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Generuj UUID len raz pri vytvorení komponentu
  const [protocolId] = useState(() => uuidv4());
  
  const [protocol, setProtocol] = useState<Partial<HandoverProtocol>>({
    id: protocolId,
    rentalId: rental.id,
    rental,
    type: 'handover',
    status: 'draft',
    createdAt: new Date(),
    location: '',
    vehicleCondition: {
      odometer: 0,
      fuelLevel: 100,
      fuelType: 'gasoline',
      exteriorCondition: 'Dobrý',
      interiorCondition: 'Dobrý',
      notes: '',
    },
    vehicleImages: [],
    vehicleVideos: [],
    documentImages: [],
    damageImages: [],
    damages: [],
    signatures: [],
    rentalData: {
      orderNumber: rental.orderNumber || '',
      vehicle: rental.vehicle || {} as any,
      customer: rental.customer || {} as any,
      startDate: rental.startDate,
      endDate: rental.endDate,
      totalPrice: rental.totalPrice,
      deposit: rental.deposit || 0,
      currency: 'EUR',
      allowedKilometers: rental.allowedKilometers || 0,
      extraKilometerRate: rental.extraKilometerRate || 0.50,
    },
    emailSent: false,
    createdBy: state.user?.username || '',
  });

  const steps = [
    { label: 'Základné informácie', description: 'Automaticky načítané údaje o prenájme' },
    { label: 'Stav vozidla', description: 'Zadajte kilometre a stav paliva' },
    { label: 'Fotodokumentácia', description: 'Nafotite vozidlo a doklady' },
    { label: 'Škody a poznámky', description: 'Zdokumentujte poškodenia' },
    { label: 'Podpisy', description: 'Elektronický podpis s časovou pečiatkou' },
  ];

  // Načítanie údajov o prenájme a konceptu
  useEffect(() => {
    // Skús načítať koncept
    const hasDraft = loadDraft();
    
    if (!hasDraft) {
      // Ak nie je koncept, nastav základné údaje
      setProtocol(prev => ({ 
        ...prev, 
        location: rental.handoverPlace || rental.pickupLocation || 'Miesto prevzatia', // Automatické miesto
        rentalData: {
          orderNumber: rental.orderNumber || '',
          vehicle: rental.vehicle || {} as any,
          customer: rental.customer || {} as any,
          startDate: rental.startDate,
          endDate: rental.endDate,
          totalPrice: rental.totalPrice,
          deposit: rental.deposit || 0,
          currency: 'EUR',
          allowedKilometers: rental.allowedKilometers || 0,
          extraKilometerRate: rental.extraKilometerRate || 0.50,
        }
      }));
    }
  }, [rental]);

  // Automatické ukladanie pri zmene protokolu
  useEffect(() => {
    if (protocol.location && protocol.vehicleCondition) {
      triggerAutoSave();
    }
  }, [protocol.location, protocol.vehicleCondition, protocol.notes, protocol.damages, protocol.vehicleImages, protocol.documentImages]);

  // Cleanup timer pri unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };

  const handleClose = () => {
    // Skontroluj či sú nejaké zmeny
    const hasChanges = protocol.location || protocol.vehicleCondition?.odometer || protocol.notes || 
                      (protocol.damages && protocol.damages.length > 0) ||
                      (protocol.vehicleImages && protocol.vehicleImages.length > 0) ||
                      (protocol.documentImages && protocol.documentImages.length > 0);

    if (hasChanges) {
      setShowSaveDialog(true);
    } else {
      clearDraft();
      onClose();
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Generating PDF for protocol:', protocol.id);
      
      const pdfGenerator = new PDFGenerator();
      const pdfBlob = await pdfGenerator.generateProtocolPDF({
        id: protocol.id || protocolId,
        type: 'handover',
        rental: protocol.rental || rental,
        location: protocol.location || '',
        vehicleCondition: protocol.vehicleCondition || {},
        vehicleImages: protocol.vehicleImages || [],
        documentImages: protocol.documentImages || [],
        damageImages: protocol.damageImages || [],
        damages: protocol.damages || [],
        signatures: protocol.signatures || [],
        notes: protocol.notes || '',
        createdAt: protocol.createdAt || new Date(),
        completedAt: protocol.completedAt || new Date(),
      }, {
        includeImages: true,
        includeSignatures: true,
        imageQuality: 0.8,
        maxImageWidth: 80,
        maxImageHeight: 60
      });

      // Vytvorenie download linku
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `protokol_prevzatie_${protocol.id || protocolId}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ PDF generated and downloaded successfully');
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      console.log('🚀 Začínam ukladanie protokolu s novým systémom...');
      
      // 🚀 KROK 1: Spracovanie obrázkov cez ImageProcessor
      const imageProcessor = new ImageProcessor();
      
      // Konverzia ProtocolImage na File objekty pre vehicleImages
      const vehicleImageFiles = protocol.vehicleImages?.map(img => {
        // Vytvorenie File z URL alebo base64
        const imageData = img.url.startsWith('data:') ? img.url : `data:image/jpeg;base64,${img.url}`;
        return new File([imageData], `vehicle_${Date.now()}.jpg`, { type: 'image/jpeg' });
      }) || [];
      
      const processedVehicleImages = await imageProcessor.processImages(
        vehicleImageFiles,
        protocol.id || protocolId
      );
      
      // Konverzia ProtocolImage na File objekty pre documentImages
      const documentImageFiles = protocol.documentImages?.map(img => {
        // Vytvorenie File z URL alebo base64
        const imageData = img.url.startsWith('data:') ? img.url : `data:image/jpeg;base64,${img.url}`;
        return new File([imageData], `document_${Date.now()}.jpg`, { type: 'image/jpeg' });
      }) || [];
      
      const processedDocumentImages = await imageProcessor.processImages(
        documentImageFiles,
        protocol.id || protocolId
      );
      
      console.log('✅ Obrázky spracované:', {
        vehicle: processedVehicleImages.length,
        documents: processedDocumentImages.length
      });
      
      // 🚀 KROK 2: Generovanie PDF s vloženými obrázkami
      const enhancedPdfGenerator = new EnhancedPDFGenerator();
      const pdfBlob = await enhancedPdfGenerator.generateCustomerProtocol({
        id: protocol.id || protocolId,
        type: 'handover',
        rental: protocol.rental || rental,
        location: protocol.location || '',
        vehicleCondition: protocol.vehicleCondition || {},
        vehicleImages: processedVehicleImages,
        documentImages: processedDocumentImages,
        damageImages: [],
        damages: protocol.damages || [],
        signatures: protocol.signatures || [],
        notes: protocol.notes || '',
        createdAt: protocol.createdAt || new Date(),
        completedAt: protocol.completedAt || new Date(),
      });
      
      console.log('✅ PDF vygenerované s vloženými obrázkami');
      
      // 🚀 KROK 3: Upload PDF do R2
      const pdfFile = new File([pdfBlob], 'customer-protocol.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('protocolId', protocol.id || protocolId);
      
      const pdfResponse = await fetch('/api/files/protocol-pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (!pdfResponse.ok) {
        throw new Error('Nepodarilo sa uploadovať PDF');
      }
      
      const pdfResult = await pdfResponse.json();
      console.log('✅ PDF uploadované do R2:', pdfResult.url);
      
      // 🚀 KROK 4: Mapovanie na backend format s novými obrázkami
      const protocolData = {
        id: protocol.id || protocolId,
        rentalId: protocol.rentalId,
        location: protocol.location || '',
        vehicleCondition: protocol.vehicleCondition || {
          odometer: 0,
          fuelLevel: 100,
          fuelType: 'Benzín',
          exteriorCondition: 'Dobrý',
          interiorCondition: 'Dobrý',
          notes: ''
        },
        vehicleImages: processedVehicleImages, // 🚀 Nové spracované obrázky
        vehicleVideos: protocol.vehicleVideos || [],
        documentImages: processedDocumentImages, // 🚀 Nové spracované obrázky
        damageImages: protocol.damageImages || [],
        damages: protocol.damages || [],
        signatures: protocol.signatures || [],
        rentalData: protocol.rentalData || {},
        notes: protocol.notes || '',
        createdBy: protocol.createdBy || '',
        status: 'completed',
        completedAt: protocol.completedAt || new Date(),
        pdfUrl: pdfResult.url, // 🚀 URL na PDF v R2
      };
      
      console.log('✅ Protokol pripravený na uloženie:', protocolData);
      
      await onSave(protocolData);
      clearDraft(); // Vymaž koncept po úspešnom uložení
      onClose();
      
      console.log('🎉 Protokol úspešne uložený s novým systémom!');
    } catch (error) {
      console.error('❌ Chyba pri ukladaní protokolu:', error);
      alert('Nepodarilo sa uložiť protokol: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    } finally {
      setLoading(false);
    }
  };

  const addDamage = () => {
    const newDamage: ProtocolDamage = {
      id: uuidv4(),
      description: '',
      severity: 'low',
      location: '',
      images: [],
      timestamp: new Date(),
    };
    setProtocol(prev => ({
      ...prev,
      damages: [...(prev.damages || []), newDamage],
    }));
    triggerAutoSave();
  };

  const removeDamage = (id: string) => {
    setProtocol(prev => ({
      ...prev,
      damages: (prev.damages || []).filter(damage => damage.id !== id),
    }));
    triggerAutoSave();
  };

  const updateDamage = (id: string, field: keyof ProtocolDamage, value: any) => {
    setProtocol(prev => ({
      ...prev,
      damages: (prev.damages || []).map(damage =>
        damage.id === id ? { ...damage, [field]: value } : damage
      ),
    }));
    triggerAutoSave();
  };

  const handleVehicleConditionChange = (field: keyof VehicleCondition, value: any) => {
    setProtocol(prev => ({
      ...prev,
      vehicleCondition: {
        ...prev.vehicleCondition!,
        [field]: value,
      },
    }));
    triggerAutoSave();
  };

  // Funkcie pre fotky
  const handleMediaSave = (type: 'vehicle' | 'document' | 'damage' | 'odometer' | 'fuel', images: ProtocolImage[], videos: ProtocolVideo[]) => {
    if (type === 'odometer' || type === 'fuel') {
      // Pre odometer a fuel pridaj do vehicleImages s správnym typom
      setProtocol(prev => ({
        ...prev,
        vehicleImages: [...(prev.vehicleImages || []), ...images],
        vehicleVideos: [...(prev.vehicleVideos || []), ...videos],
      }));
    } else {
      setProtocol(prev => ({
        ...prev,
        [`${type}Images`]: images,
        [`${type}Videos`]: videos,
      }));
    }
    setActivePhotoCapture(null);
    triggerAutoSave();
  };

  // Funkcia pre elektronický podpis
  const handleSignatureSave = (signature: string, signerName: string) => {
    const now = new Date();
    const newSignature: ProtocolSignature = {
      id: uuidv4(),
      signature,
      signerName,
      signerRole: 'employee',
      timestamp: now,
      location: protocol.location || 'Miesto prevzatia',
      ipAddress: 'N/A', // V browseri nemôžeme získať IP
    };

    setProtocol(prev => ({
      ...prev,
      signatures: [...(prev.signatures || []), newSignature],
      // Nastav čas prevzatia na čas podpisu
      completedAt: now,
    }));
    setShowSignaturePad(false);
    triggerAutoSave();
  };

  // Automatické ukladanie
  const triggerAutoSave = () => {
    // Zruš predchádzajúci timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // Nastav nový timer na 3 sekundy
    const timer = setTimeout(() => {
      saveDraft();
    }, 3000);

    setAutoSaveTimer(timer);
  };

  // Uloženie konceptu
  const saveDraft = async () => {
    try {
      const draftData = {
        ...protocol,
        status: 'draft',
        lastSaved: new Date(),
      };
      
      // Ulož do localStorage ako koncept
      localStorage.setItem(`protocol_draft_${protocolId}`, JSON.stringify(draftData));
      console.log('💾 Koncept protokolu uložený:', draftData.id);
    } catch (error) {
      console.error('Chyba pri ukladaní konceptu:', error);
    }
  };

  // Načítanie konceptu
  const loadDraft = () => {
    try {
      const savedDraft = localStorage.getItem(`protocol_draft_${protocolId}`);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        setProtocol(draftData);
        console.log('📂 Koncept protokolu načítaný:', draftData.id);
        return true;
      }
    } catch (error) {
      console.error('Chyba pri načítaní konceptu:', error);
    }
    return false;
  };

  // Vymazanie konceptu
  const clearDraft = () => {
    localStorage.removeItem(`protocol_draft_${protocolId}`);
    console.log('🗑️ Koncept protokolu vymazaný');
  };



  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box display="flex" gap={3} flexWrap="wrap">
            <Box flex="1" minWidth="300px">
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Informácie o prenájme
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Číslo objednávky"
                      value={protocol.rentalData?.orderNumber || `RENT-${rental.id.slice(-8).toUpperCase()}`}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      fullWidth
                      helperText="Automaticky generované z prenájmu"
                    />
                    <TextField
                      label="Miesto prevzatia"
                      value={protocol.location || ''}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      fullWidth
                      helperText="Automaticky načítané z prenájmu"
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Box>
            <Box flex="1" minWidth="300px">
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <CarRental sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Informácie o vozidle
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Značka a model"
                      value={`${protocol.rentalData?.vehicle?.brand || ''} ${protocol.rentalData?.vehicle?.model || ''}`}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      fullWidth
                    />
                    <TextField
                      label="ŠPZ"
                      value={protocol.rentalData?.vehicle?.licensePlate || ''}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      fullWidth
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box display="flex" gap={3} flexWrap="wrap">
            <Box flex="1" minWidth="300px">
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Stav vozidla
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Kilometre"
                      type="number"
                      value={protocol.vehicleCondition?.odometer || 0}
                      onChange={(e) => handleVehicleConditionChange('odometer', parseInt(e.target.value) || 0)}
                      variant="outlined"
                      fullWidth
                    />
                    <TextField
                      label="Stav paliva (%)"
                      type="number"
                      value={protocol.vehicleCondition?.fuelLevel || 100}
                      onChange={(e) => handleVehicleConditionChange('fuelLevel', parseInt(e.target.value) || 0)}
                      variant="outlined"
                      fullWidth
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Box>
            
            <Box flex="1" minWidth="300px">
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <PhotoCamera sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Fotodokumentácia stavu
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCamera />}
                      onClick={() => setActivePhotoCapture('odometer')}
                    >
                      Foto tachometra ({protocol.vehicleImages?.filter(img => img.type === 'odometer').length || 0})
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCamera />}
                      onClick={() => setActivePhotoCapture('fuel')}
                    >
                      Foto paliva ({protocol.vehicleImages?.filter(img => img.type === 'fuel').length || 0})
                    </Button>
                  </Box>
                  
                  {/* Zobrazenie fotiek */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Nahrané fotky:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                          {protocol.vehicleImages?.filter(img => img.type === 'odometer').map((img, index) => (
                      <Box key={img.id} sx={{ position: 'relative' }}>
                        <img 
                          src={img.url} 
                          alt={`Tachometer ${index + 1}`}
                          style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }}
                          onError={(e) => {
                            console.error('Chyba načítania obrázka:', img.url);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <Chip 
                          label="Tachometer" 
                          size="small" 
                          sx={{ position: 'absolute', top: -8, left: -8, fontSize: '0.6rem' }}
                        />
                      </Box>
                    ))}
                    {protocol.vehicleImages?.filter(img => img.type === 'fuel').map((img, index) => (
                      <Box key={img.id} sx={{ position: 'relative' }}>
                        <img 
                          src={img.url} 
                          alt={`Palivo ${index + 1}`}
                          style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }}
                          onError={(e) => {
                            console.error('Chyba načítania obrázka:', img.url);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <Chip 
                          label="Palivo" 
                          size="small" 
                          sx={{ position: 'absolute', top: -8, left: -8, fontSize: '0.6rem' }}
                        />
                      </Box>
                    ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PhotoCamera sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Fotodokumentácia
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCamera />}
                    onClick={() => setActivePhotoCapture('vehicle')}
                  >
                    Fotky vozidla ({protocol.vehicleImages?.length || 0})
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCamera />}
                    onClick={() => setActivePhotoCapture('document')}
                  >
                    Fotky dokladov ({protocol.documentImages?.length || 0})
                  </Button>
                </Box>

                                {/* R2 Upload sekcia */}
                <Box sx={{ mt: 2, p: 2, border: '1px dashed rgba(255, 255, 255, 0.3)', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, color: 'white' }}>
                    ☁️ Cloud Upload (R2 Storage)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Súbory sa nahrávajú do Cloudflare R2 cloud storage. Dostupné online, zálohované, lacné.
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <R2FileUpload
                        type="protocol"
                        entityId={rental.id}
                        onUploadSuccess={(fileData) => {
                          console.log('📁 Vehicle image uploaded:', fileData);
                          setProtocol(prev => ({
                            ...prev,
                            vehicleImages: [...(prev.vehicleImages || []), {
                              id: uuidv4(),
                              url: fileData.url,
                              type: 'vehicle',
                              filename: fileData.filename,
                              timestamp: new Date(),
                              uploadedAt: new Date()
                            }]
                          }));
                        }}
                        acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                        maxSize={10}
                        multiple={true}
                        label="☁️ Nahrať fotky vozidla do R2"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <R2FileUpload
                        type="document"
                        entityId={rental.id}
                        onUploadSuccess={(fileData) => {
                          console.log('📁 Document uploaded:', fileData);
                          setProtocol(prev => ({
                            ...prev,
                            documentImages: [...(prev.documentImages || []), {
                              id: uuidv4(),
                              url: fileData.url,
                              type: 'document',
                              filename: fileData.filename,
                              timestamp: new Date(),
                              uploadedAt: new Date()
                            }]
                          }));
                        }}
                        acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']}
                        maxSize={50}
                        multiple={true}
                        label="☁️ Nahrať dokumenty do R2"
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Mobilný Upload sekcia */}
                <Box sx={{ mt: 2, p: 2, border: '1px dashed rgba(255, 255, 255, 0.3)', borderRadius: 1, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, color: 'white' }}>
                    📱 Mobilný Upload (Kamera + Galéria)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Fotografovanie priamo v aplikácii alebo výber z galérie. Súbory sa nahrávajú do R2.
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <MobileFileUpload
                        type="protocol"
                        entityId={rental.id}
                        onUploadSuccess={(fileData) => {
                          console.log('📱 Mobile vehicle image uploaded:', fileData);
                          setProtocol(prev => ({
                            ...prev,
                            vehicleImages: [...(prev.vehicleImages || []), {
                              id: uuidv4(),
                              url: fileData.url,
                              type: 'vehicle',
                              filename: fileData.filename,
                              timestamp: new Date(),
                              uploadedAt: new Date()
                            }]
                          }));
                        }}
                        acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                        maxSize={10}
                        multiple={true}
                        label="📱 Mobilné fotky vozidla"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <MobileFileUpload
                        type="document"
                        entityId={rental.id}
                        onUploadSuccess={(fileData) => {
                          console.log('📱 Mobile document uploaded:', fileData);
                          setProtocol(prev => ({
                            ...prev,
                            documentImages: [...(prev.documentImages || []), {
                              id: uuidv4(),
                              url: fileData.url,
                              type: 'document',
                              filename: fileData.filename,
                              timestamp: new Date(),
                              uploadedAt: new Date()
                            }]
                          }));
                        }}
                        acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']}
                        maxSize={50}
                        multiple={true}
                        label="📱 Mobilné dokumenty"
                      />
                    </Grid>
                  </Grid>
                </Box>
                
                {/* Media summary */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip 
                    label={`${(protocol.vehicleImages?.length || 0) + (protocol.documentImages?.length || 0)} fotiek`}
                    color="primary"
                    size="small"
                  />
                  <Chip 
                    label={`${(protocol.vehicleVideos?.length || 0)} videí`}
                    color="secondary"
                    size="small"
                  />
                </Box>

                {/* Zobrazenie fotiek */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                    Nahrané fotky ({((protocol.vehicleImages?.length || 0) + (protocol.documentImages?.length || 0))}):
                  </Typography>
                  <Grid container spacing={1}>
                    {protocol.vehicleImages?.map((img, index) => (
                      <Grid item xs={6} sm={4} md={3} key={img.id}>
                        <Card sx={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                            transform: 'scale(1.02)',
                            transition: 'all 0.2s'
                          }
                        }}
                        onClick={() => window.open(img.url, '_blank')}
                      >
                        <CardContent sx={{ p: 1 }}>
                          <img 
                            src={img.url} 
                            alt={`Vozidlo ${index + 1}`}
                            style={{ 
                              width: '100%', 
                              height: 120, 
                              objectFit: 'cover', 
                              borderRadius: 4,
                              display: 'block'
                            }}
                            onError={(e) => {
                              console.error('Chyba načítania obrázka:', img.url);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip 
                              label={img.type === 'odometer' ? 'Tachometer' : img.type === 'fuel' ? 'Palivo' : 'Vozidlo'} 
                              size="small" 
                              sx={{ fontSize: '0.7rem' }}
                            />
                            <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    ))}
                    {protocol.documentImages?.map((img, index) => (
                      <Grid item xs={6} sm={4} md={3} key={img.id}>
                        <Card sx={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                            transform: 'scale(1.02)',
                            transition: 'all 0.2s'
                          }
                        }}
                        onClick={() => window.open(img.url, '_blank')}
                      >
                        <CardContent sx={{ p: 1 }}>
                          <img 
                            src={img.url} 
                            alt={`Doklad ${index + 1}`}
                            style={{ 
                              width: '100%', 
                              height: 120, 
                              objectFit: 'cover', 
                              borderRadius: 4,
                              display: 'block'
                            }}
                            onError={(e) => {
                              console.error('Chyba načítania obrázka:', img.url);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip 
                              label="Doklad" 
                              size="small" 
                              sx={{ fontSize: '0.7rem' }}
                            />
                            <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    ))}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );



      case 3:
        return (
          <Box>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Škody a poškodenia
                  </Typography>
                  <Button startIcon={<AddIcon />} onClick={addDamage}>
                    Pridať škodu
                  </Button>
                </Box>
                
                {(protocol.damages || []).length === 0 ? (
                  <Alert severity="info">Žiadne škody neboli zaznamenané</Alert>
                ) : (
                  <List>
                    {(protocol.damages || []).map((damage, index) => (
                      <ListItem key={damage.id} divider>
                        <ListItemAvatar>
                          <Avatar>
                            <DescriptionIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <TextField
                              label="Popis škody"
                              value={damage.description}
                              onChange={(e) => updateDamage(damage.id, 'description', e.target.value)}
                              variant="outlined"
                              fullWidth
                              size="small"
                            />
                          }
                          secondary={
                            <Box display="flex" gap={1} mt={1}>
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Závažnosť</InputLabel>
                                <Select
                                  value={damage.severity}
                                  label="Závažnosť"
                                  onChange={(e) => updateDamage(damage.id, 'severity', e.target.value)}
                                >
                                  <MenuItem value="low">Nízka</MenuItem>
                                  <MenuItem value="medium">Stredná</MenuItem>
                                  <MenuItem value="high">Vysoká</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                label="Lokalizácia"
                                value={damage.location}
                                onChange={(e) => updateDamage(damage.id, 'location', e.target.value)}
                                variant="outlined"
                                size="small"
                                sx={{ flex: 1 }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => removeDamage(damage.id)}
                                color="error"
                              >
                                <RemoveIcon />
                              </IconButton>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <DrawIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Elektronický podpis
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Poznámky"
                    multiline
                    rows={3}
                    value={protocol.notes || ''}
                    onChange={(e) => {
                      setProtocol(prev => ({ ...prev, notes: e.target.value }));
                      triggerAutoSave();
                    }}
                    variant="outlined"
                    fullWidth
                  />
                  
                  {(protocol.signatures || []).length === 0 ? (
                    <Alert severity="info">
                      Kliknite na tlačidlo nižšie pre pridanie elektronického podpisu s časovou pečiatkou.
                    </Alert>
                  ) : (
                    <Alert severity="success">
                      <Typography variant="body2">
                        <strong>Podpis úspešne pridaný:</strong><br />
                        Podpisujúci: {protocol.signatures?.[0]?.signerName}<br />
                        Časová pečiatka: {protocol.signatures?.[0]?.timestamp.toLocaleString('sk-SK', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}<br />
                        Miesto: {protocol.signatures?.[0]?.location}
                      </Typography>
                    </Alert>
                  )}
                  
                  <Button
                    variant="outlined"
                    startIcon={<DrawIcon />}
                    onClick={() => setShowSignaturePad(true)}
                    disabled={(protocol.signatures || []).length > 0}
                  >
                    Pridať elektronický podpis
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Protokol o prevzatí vozidla
      </Typography>
      
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel 
              onClick={() => handleStepClick(index)}
              sx={{ 
                cursor: 'pointer',
                '&:hover': { 
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  px: 1
                }
              }}
            >
              {step.label}
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {step.description}
              </Typography>
              {renderStepContent(index)}
              <Box sx={{ mb: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={index === steps.length - 1 ? handleSave : handleNext}
                  sx={{ mr: 1 }}
                >
                  {index === steps.length - 1 ? 'Uložiť protokol' : 'Ďalej'}
                </Button>
                {index === steps.length - 1 && (
                  <Button
                    variant="outlined"
                    onClick={handleGeneratePDF}
                    disabled={loading}
                    startIcon={<PdfIcon />}
                    sx={{ mr: 1, color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                  >
                    Generovať PDF
                  </Button>
                )}
                <Button
                  disabled={index === 0}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Späť
                </Button>
                <Button onClick={handleClose}>
                  Zrušiť
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Photo capture dialog */}
      {activePhotoCapture && (
        <SerialPhotoCapture
          open={!!activePhotoCapture}
          onClose={() => setActivePhotoCapture(null)}
          onSave={(images, videos) => handleMediaSave(activePhotoCapture as any, images, videos)}
          title={
            activePhotoCapture === 'vehicle' ? 'Fotky vozidla' :
            activePhotoCapture === 'document' ? 'Fotky dokladov' :
            'Fotky poškodení'
          }
          allowedTypes={
            activePhotoCapture === 'vehicle' ? ['vehicle'] :
            activePhotoCapture === 'document' ? ['document'] :
            activePhotoCapture === 'odometer' ? ['odometer'] :
            activePhotoCapture === 'fuel' ? ['fuel'] :
            ['damage']
          }
        />
      )}

      {/* Save draft dialog */}
      {showSaveDialog && (
        <Dialog
          open={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Uložiť koncept protokolu?
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Máte neuložené zmeny. Chcete ich uložiť a pokračovať neskôr?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Koncept sa automaticky načíta pri ďalšom otvorení protokolu.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              clearDraft();
              setShowSaveDialog(false);
              onClose();
            }}>
              Zrušiť bez uloženia
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                saveDraft();
                setShowSaveDialog(false);
                onClose();
              }}
            >
              Uložiť koncept
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Signature pad dialog */}
      {showSignaturePad && (
        <Dialog
          open={showSignaturePad}
          onClose={() => setShowSignaturePad(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <DrawIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Elektronický podpis
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Podpíšte sa nižšie. Podpis bude uložený s časovou a dátumovou pečiatkou.
            </Typography>
            <TextField
              label="Meno podpisujúceho"
              value={state.user?.username || ''}
              InputProps={{ readOnly: true }}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Časová pečiatka"
              value={new Date().toLocaleString('sk-SK', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
              InputProps={{ readOnly: true }}
              fullWidth
              sx={{ mb: 2 }}
            />
            <SignaturePad
              onSave={handleSignatureSave}
              onCancel={() => setShowSignaturePad(false)}
              signerName={state.user?.username || 'admin'}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default HandoverProtocolForm; 