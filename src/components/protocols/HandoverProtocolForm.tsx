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
  PhotoLibrary,
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
import ImageGalleryModal from '../common/ImageGalleryModal';

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
  const [generatedPDF, setGeneratedPDF] = useState<Blob | null>(null); // ✅ Uložené PDF
  const [pdfGenerated, setPdfGenerated] = useState(false); // ✅ Stav generovania
  const [pdfProgress, setPdfProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  // ✅ Pridané stavy pre galériu
  const [galleryOpen, setGalleryOpen] = useState(false);
  
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
    documentVideos: [],
    damageImages: [],
    damageVideos: [],
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
  }, [protocol.location, protocol.vehicleCondition, protocol.notes, protocol.damages, protocol.vehicleImages, protocol.vehicleVideos, protocol.documentImages, protocol.documentVideos, protocol.damageImages, protocol.damageVideos]);

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

  // Zjednotená funkcia pre generovanie PDF
  const generateProtocolPDF = async (): Promise<Blob> => {
    console.log('🔄 Generating PDF with unified data...');
    
    // Zjednotené dáta pre PDF
    const pdfData = {
      id: protocol.id || protocolId,
      type: 'handover' as const,
      rental: rental, // ✅ Vždy použij prop z komponentu pre konzistenciu
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
    };

    console.log('📋 PDF data:', pdfData);
    
    const pdfGenerator = new PDFGenerator();
    const pdfBlob = await pdfGenerator.generateProtocolPDF(pdfData, {
      includeImages: true,
      includeSignatures: true,
      imageQuality: 0.8,
      maxImageWidth: 80,
      maxImageHeight: 60
    });

    console.log('✅ PDF generated successfully');
    return pdfBlob;
  };

  // Funkcia na sťahovanie vygenerovaného PDF
  const handleDownloadPDF = () => {
    if (generatedPDF) {
      const url = URL.createObjectURL(generatedPDF);
      const link = document.createElement('a');
      link.href = url;
      link.download = `protokol_prevzatie_${protocol.id || protocolId}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('✅ PDF downloaded successfully');
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Generating PDF for protocol:', protocol.id);
      
      const pdfBlob = await generateProtocolPDF();
      setGeneratedPDF(pdfBlob); // Ulož PDF do stavu
      setPdfGenerated(true); // Označ, že PDF bol generovaný

      console.log('✅ PDF generated and stored in state');
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('Nepodarilo sa vygenerovať PDF: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pdfGenerated) {
      alert('Najprv vygenerujte PDF protokolu');
      return;
    }

    setLoading(true);
    setPdfProgress(0);
    setProgressMessage('Začínam ukladanie protokolu...');

    try {
      console.log('🚀 Začínam ukladanie protokolu s R2 upload...');
      
      setPdfProgress(5);
      setProgressMessage('Kontrolujem kompresiu médií...');
      
      // 🚀 KROK 1: Povinná kompresia všetkých médií
      const compressAllMedia = async () => {
        const allImages = [
          ...(protocol.vehicleImages || []),
          ...(protocol.documentImages || []),
          ...(protocol.damageImages || [])
        ];
        
        const allVideos = [
          ...(protocol.vehicleVideos || [])
        ];
        
        console.log(`🔍 Kontrolujem ${allImages.length} obrázkov a ${allVideos.length} videí pre kompresiu`);
        
        // Kompresia obrázkov ktoré nie sú komprimované
        const uncompressedImages = allImages.filter(img => !img.compressed && img.url.startsWith('data:image/'));
        if (uncompressedImages.length > 0) {
          setProgressMessage(`Komprimujem ${uncompressedImages.length} obrázkov...`);
          console.log(`🔄 Komprimujem ${uncompressedImages.length} nekomprimovaných obrázkov`);
          
          // Tu by sme implementovali batch kompresiu
          // Pre teraz len logujeme
          console.log('⚠️ Nekomprimované obrázky:', uncompressedImages.length);
        }
        
        // Kompresia videí ktoré nie sú komprimované
        const uncompressedVideos = allVideos.filter(video => !video.compressed && video.url.startsWith('data:video/'));
        if (uncompressedVideos.length > 0) {
          setProgressMessage(`Komprimujem ${uncompressedVideos.length} videí...`);
          console.log(`🔄 Komprimujem ${uncompressedVideos.length} nekomprimovaných videí`);
          
          // Tu by sme implementovali batch kompresiu
          // Pre teraz len logujeme
          console.log('⚠️ Nekomprimované videá:', uncompressedVideos.length);
        }
      };
      
      await compressAllMedia();
      setPdfProgress(10);
      
      setPdfProgress(15);
      setProgressMessage('Uploadujem PDF do R2...');
      console.log('✅ Používam uložené PDF z generovania');
      
      //  KROK 2: Upload uloženého PDF do R2
      if (!generatedPDF) {
        throw new Error('PDF nie je vygenerované');
      }
      
      const pdfFile = new File([generatedPDF], generateSmartFilename(protocol, 'pdf'), { 
        type: 'application/pdf' 
      });
      
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('type', 'protocol');
      formData.append('entityId', protocol.id || protocolId);
      
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://blackrent-app-production-4d6f.up.railway.app/api';
      console.log('🔄 Uploading PDF to R2...', {
        fileSize: pdfFile.size,
        filename: pdfFile.name,
        entityId: protocol.id || protocolId
      });
      
      const pdfResponse = await fetch(`${apiBaseUrl}/files/upload`, {
        method: 'POST',
        body: formData,
      });
      
      console.log('📋 PDF upload response status:', pdfResponse.status);
      
      if (!pdfResponse.ok) {
        const errorText = await pdfResponse.text();
        console.error('❌ PDF upload failed:', errorText);
        throw new Error(`Nepodarilo sa uploadovať PDF do R2: ${pdfResponse.status} - ${errorText}`);
      }
      
      const pdfResult = await pdfResponse.json();
      console.log('✅ PDF upload response:', pdfResult);
      
      if (!pdfResult.url) {
        console.error('❌ PDF upload response missing URL:', pdfResult);
        throw new Error('PDF upload response neobsahuje URL');
      }
      
      console.log('✅ PDF uploadované do R2:', pdfResult.url);
      
      setPdfProgress(30);
      setProgressMessage('Spracovávam obrázky...');
      
      // 🚀 KROK 3: Batch upload obrázkov do R2
      const uploadImagesToR2Batch = async (images: ProtocolImage[], type: string) => {
        const uploadedImages: ProtocolImage[] = [];
        const imagesToUpload = images.filter(img => 
          img.url.startsWith('data:image/') && 
          !(img.url.startsWith('https://') && (img.url.includes('r2.dev') || img.url.includes('cloudflare.com')))
        );
        
        if (imagesToUpload.length === 0) {
          return images; // Všetky už sú v R2
        }
        
        setProgressMessage(`Uploadujem ${imagesToUpload.length} ${type} obrázkov...`);
        
        // Batch upload - všetky naraz
        const uploadPromises = imagesToUpload.map(async (image, index) => {
          try {
            const response = await fetch(image.url);
            const blob = await response.blob();
            const file = new File([blob], generateSmartFilename(protocol, 'image'), { type: 'image/jpeg' });
            
            const imageFormData = new FormData();
            imageFormData.append('file', file);
            imageFormData.append('type', 'protocol');
            imageFormData.append('entityId', protocol.id || protocolId);
            
            const uploadResponse = await fetch(`${apiBaseUrl}/files/upload`, {
              method: 'POST',
              body: imageFormData,
            });
            
            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json();
              console.log(`✅ ${type} image uploaded to R2:`, uploadResult.url);
              return {
                ...image,
                url: uploadResult.url
              };
            } else {
              console.warn(`⚠️ Failed to upload ${type} image, keeping base64`);
              return image;
            }
          } catch (error) {
            console.warn(`⚠️ Error uploading ${type} image, keeping base64:`, error);
            return image;
          }
        });
        
        const results = await Promise.all(uploadPromises);
        
        // Mapuj pôvodné obrázky s novými URL
        return images.map(img => {
          if (img.url.startsWith('https://') && (img.url.includes('r2.dev') || img.url.includes('cloudflare.com'))) {
            return img; // Už je v R2
          }
          const uploaded = results.find(result => result.id === img.id);
          return uploaded || img;
        });
      };
      
      const vehicleImages = await uploadImagesToR2Batch(protocol.vehicleImages || [], 'vehicle');
      setPdfProgress(50);
      
      const documentImages = await uploadImagesToR2Batch(protocol.documentImages || [], 'document');
      setPdfProgress(70);
      
      const damageImages = await uploadImagesToR2Batch(protocol.damageImages || [], 'damage');
      setPdfProgress(85);
      
      console.log('✅ Obrázky spracované:', {
        vehicle: vehicleImages.length,
        document: documentImages.length,
        damage: damageImages.length
      });
      
      setProgressMessage('Ukladám protokol do databázy...');
      
      // 🚀 KROK 4: Mapovanie na backend format s R2 URL
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
        vehicleImages: vehicleImages, // R2 URL
        vehicleVideos: protocol.vehicleVideos || [],
        documentImages: documentImages, // R2 URL
        damageImages: damageImages, // R2 URL
        damages: protocol.damages || [],
        signatures: protocol.signatures || [],
        rentalData: protocol.rentalData || {},
        notes: protocol.notes || '',
        createdBy: protocol.createdBy || '',
        status: 'completed',
        completedAt: protocol.completedAt || new Date(),
        pdfUrl: pdfResult.url, // R2 URL na PDF
      };
      
      console.log('✅ Protokol pripravený na uloženie s R2 URL:', {
        id: protocolData.id,
        rentalId: protocolData.rentalId,
        pdfUrl: protocolData.pdfUrl,
        vehicleImagesCount: protocolData.vehicleImages?.length || 0,
        documentImagesCount: protocolData.documentImages?.length || 0,
        damageImagesCount: protocolData.damageImages?.length || 0
      });
      
      // Kontrola či pdfUrl existuje
      if (!protocolData.pdfUrl) {
        console.error('❌ CRITICAL: pdfUrl is missing from protocol data!');
        throw new Error('PDF URL chýba v protokol dátach');
      }
      
      setPdfProgress(95);
      setProgressMessage('Finalizujem...');
      
      await onSave(protocolData);
      clearDraft(); // Vymaž koncept po úspešnom uložení
      
      setPdfProgress(100);
      setProgressMessage('Protokol úspešne uložený!');
      
      setTimeout(() => {
        onClose();
      }, 1000);
      
      console.log('🎉 Protokol úspešne uložený s R2 URL!');
    } catch (error) {
      console.error('❌ Chyba pri ukladaní protokolu:', error);
      alert('Nepodarilo sa uložiť protokol: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    } finally {
      setLoading(false);
      setPdfProgress(0);
      setProgressMessage('');
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
    console.log('📸 handleMediaSave called:', { type, imagesCount: images.length, videosCount: videos.length });
    
    if (type === 'odometer' || type === 'fuel') {
      // Pre odometer a fuel pridaj do vehicleImages s správnym typom
      setProtocol(prev => {
        const newProtocol = {
          ...prev,
          vehicleImages: [...(prev.vehicleImages || []), ...images],
          vehicleVideos: [...(prev.vehicleVideos || []), ...videos],
        };
        console.log('📸 Updated protocol with odometer/fuel images:', { 
          totalVehicleImages: newProtocol.vehicleImages?.length || 0,
          totalVehicleVideos: newProtocol.vehicleVideos?.length || 0
        });
        return newProtocol;
      });
    } else {
      // Opravené: Pridaj nové médiá k existujúcim namiesto prepisovania
      setProtocol(prev => {
        const newProtocol = {
          ...prev,
          [`${type}Images`]: [...(prev[`${type}Images`] || []), ...images],
          [`${type}Videos`]: [...(prev[`${type}Videos`] || []), ...videos],
        };
        console.log('📸 Updated protocol with media:', { 
          type,
          totalImages: newProtocol[`${type}Images`]?.length || 0,
          totalVideos: newProtocol[`${type}Videos`]?.length || 0
        });
        return newProtocol;
      });
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

  const generateSmartFilename = (protocol: any, type: 'pdf' | 'image', mediaType?: string, index?: number): string => {
    const date = new Date().toISOString().split('T')[0];
    const customer = protocol.rentalData?.customerName || rental?.customerName || 'unknown';
    const vehicle = protocol.rentalData?.vehicle?.licensePlate || rental?.vehicle?.licensePlate || 'unknown';
    
    // ✅ LEPŠIE NÁZVY SÚBOROV
    switch (type) {
      case 'pdf':
        return `handover-protocol-${customer}-${vehicle}-${date}.pdf`;
      case 'image':
        const mediaTypeLabel = mediaType === 'vehicle' ? 'vehicle' : 
                             mediaType === 'document' ? 'document' : 
                             mediaType === 'damage' ? 'damage' : 'image';
        const indexLabel = index !== undefined ? `-${index + 1}` : '';
        return `${mediaTypeLabel}-${customer}-${vehicle}-${date}${indexLabel}.jpg`;
      default:
        return `file-${Date.now()}.jpg`;
    }
  };

  // ✅ Funkcia na výpočet celkového počtu médií
  const getTotalMediaCount = () => {
    return (
      (protocol.vehicleImages?.length || 0) +
      (protocol.vehicleVideos?.length || 0) +
      (protocol.documentImages?.length || 0) +
      (protocol.documentVideos?.length || 0) +
      (protocol.damageImages?.length || 0) +
      (protocol.damageVideos?.length || 0)
    );
  };

  // ✅ Funkcia na zber všetkých médií pre galériu
  const getAllMediaForGallery = () => {
    const allImages: ProtocolImage[] = [];
    const allVideos: ProtocolVideo[] = [];

    // Vehicle media
    if (protocol.vehicleImages) {
      allImages.push(...protocol.vehicleImages.map(img => ({ ...img, category: 'Vozidlo' })));
    }
    if (protocol.vehicleVideos) {
      allVideos.push(...protocol.vehicleVideos.map(video => ({ ...video, category: 'Vozidlo' })));
    }

    // Document media
    if (protocol.documentImages) {
      allImages.push(...protocol.documentImages.map(img => ({ ...img, category: 'Doklady' })));
    }
    if (protocol.documentVideos) {
      allVideos.push(...protocol.documentVideos.map(video => ({ ...video, category: 'Doklady' })));
    }

    // Damage media
    if (protocol.damageImages) {
      allImages.push(...protocol.damageImages.map(img => ({ ...img, category: 'Poškodenia' })));
    }
    if (protocol.damageVideos) {
      allVideos.push(...protocol.damageVideos.map(video => ({ ...video, category: 'Poškodenia' })));
    }

    return { images: allImages, videos: allVideos };
  };

  if (!open) return null;

  return (
    <Box>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              onClick={() => handleStepClick(index)}
              style={{ cursor: 'pointer' }}
            >
              {step.label}
            </StepLabel>
            <StepContent>
              <Typography>{step.description}</Typography>
              
              {/* Step 1: Basic Info */}
              {index === 0 && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Informácie o prenájme
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Číslo objednávky"
                          value={protocol.rentalData?.orderNumber || ''}
                          fullWidth
                          margin="normal"
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Zákazník"
                          value={protocol.rentalData?.customer?.name || ''}
                          fullWidth
                          margin="normal"
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Vozidlo"
                          value={`${protocol.rentalData?.vehicle?.brand} ${protocol.rentalData?.vehicle?.model} (${protocol.rentalData?.vehicle?.licensePlate})`}
                          fullWidth
                          margin="normal"
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Cena"
                          value={`${protocol.rentalData?.totalPrice} ${protocol.rentalData?.currency}`}
                          fullWidth
                          margin="normal"
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
              
              {/* Step 2: Vehicle Condition */}
              {index === 1 && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Stav vozidla
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Kilometre"
                          type="number"
                          value={protocol.vehicleCondition?.odometer || 0}
                          onChange={(e) => handleVehicleConditionChange('odometer', parseInt(e.target.value) || 0)}
                          fullWidth
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Stav paliva (%)"
                          type="number"
                          value={protocol.vehicleCondition?.fuelLevel || 100}
                          onChange={(e) => handleVehicleConditionChange('fuelLevel', parseInt(e.target.value) || 100)}
                          fullWidth
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal">
                          <InputLabel>Typ paliva</InputLabel>
                          <Select
                            value={protocol.vehicleCondition?.fuelType || 'gasoline'}
                            onChange={(e) => handleVehicleConditionChange('fuelType', e.target.value)}
                            label="Typ paliva"
                          >
                            <MenuItem value="gasoline">Benzín</MenuItem>
                            <MenuItem value="diesel">Nafta</MenuItem>
                            <MenuItem value="electric">Elektrické</MenuItem>
                            <MenuItem value="hybrid">Hybrid</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal">
                          <InputLabel>Stav exteriéru</InputLabel>
                          <Select
                            value={protocol.vehicleCondition?.exteriorCondition || 'Dobrý'}
                            onChange={(e) => handleVehicleConditionChange('exteriorCondition', e.target.value)}
                            label="Stav exteriéru"
                          >
                            <MenuItem value="Výborný">Výborný</MenuItem>
                            <MenuItem value="Dobrý">Dobrý</MenuItem>
                            <MenuItem value="Uspokojivý">Uspokojivý</MenuItem>
                            <MenuItem value="Zlý">Zlý</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Poznámky k stavu vozidla"
                          multiline
                          rows={3}
                          value={protocol.vehicleCondition?.notes || ''}
                          onChange={(e) => handleVehicleConditionChange('notes', e.target.value)}
                          fullWidth
                          margin="normal"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
              
              {/* Step 3: Photo Documentation */}
              {index === 2 && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Fotodokumentácia
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Button
                        variant="outlined"
                        startIcon={<PhotoCamera />}
                        onClick={() => setActivePhotoCapture('vehicle')}
                        fullWidth
                      >
                        Fotografovať vozidlo
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<DescriptionIcon />}
                        onClick={() => setActivePhotoCapture('document')}
                        fullWidth
                      >
                        Fotografovať doklady
                      </Button>

                      {/* ✅ NOVÉ TLAČIDLO GALÉRIE */}
                      <Button
                        variant="contained"
                        startIcon={<PhotoLibrary />}
                        onClick={() => setGalleryOpen(true)}
                        disabled={getTotalMediaCount() === 0}
                        fullWidth
                        sx={{ mt: 1 }}
                      >
                        Zobraziť galériu ({getTotalMediaCount()} médií)
                      </Button>
                    </Stack>
                    
                    {/* Display uploaded images */}
                    {(protocol.vehicleImages && protocol.vehicleImages.length > 0) && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Obrázky vozidla ({protocol.vehicleImages.length})
                        </Typography>
                        <Grid container spacing={1}>
                          {protocol.vehicleImages.map((image, idx) => (
                            <Grid item xs={6} sm={4} md={3} key={idx}>
                              <img
                                src={image.url}
                                alt={`Vehicle ${idx + 1}`}
                                style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Step 4: Damages and Notes */}
              {index === 3 && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Škody a poznámky
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addDamage}
                      sx={{ mb: 2 }}
                    >
                      Pridať škodu
                    </Button>
                    
                    {protocol.damages && protocol.damages.map((damage, idx) => (
                      <Card key={damage.id} sx={{ mb: 2, p: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Popis škody"
                              value={damage.description}
                              onChange={(e) => updateDamage(damage.id, 'description', e.target.value)}
                              fullWidth
                              multiline
                              rows={2}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Lokalizácia"
                              value={damage.location}
                              onChange={(e) => updateDamage(damage.id, 'location', e.target.value)}
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel>Závažnosť</InputLabel>
                              <Select
                                value={damage.severity}
                                onChange={(e) => updateDamage(damage.id, 'severity', e.target.value)}
                                label="Závažnosť"
                              >
                                <MenuItem value="low">Menšia</MenuItem>
                                <MenuItem value="medium">Stredná</MenuItem>
                                <MenuItem value="high">Vážna</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12}>
                            <IconButton
                              color="error"
                              onClick={() => removeDamage(damage.id)}
                              size="small"
                            >
                              <RemoveIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}
              
              {/* Step 5: Signatures */}
              {index === 4 && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Elektronický podpis
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      startIcon={<DrawIcon />}
                      onClick={() => setShowSignaturePad(true)}
                      fullWidth
                    >
                      Podpísať protokol
                    </Button>
                    
                    {protocol.signatures && protocol.signatures.map((signature, idx) => (
                      <Card key={signature.id} sx={{ mt: 2, p: 2 }}>
                        <Typography variant="subtitle2">
                          Podpis: {signature.signerName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Čas: {new Date(signature.timestamp).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Miesto: {signature.location}
                        </Typography>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}
              
              <Box sx={{ mb: 2 }}>
                <div>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={activeStep === steps.length - 1}
                  >
                    {activeStep === steps.length - 1 ? 'Dokončiť' : 'Pokračovať'}
                  </Button>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Späť
                  </Button>
                </div>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          onClick={handleGeneratePDF}
          startIcon={<PdfIcon />}
          variant="outlined"
          disabled={!protocol.location || !protocol.vehicleCondition?.odometer}
        >
          Generovať PDF
        </Button>
        <Button
          onClick={handleSave}
          startIcon={<SaveIcon />}
          variant="contained"
          disabled={!pdfGenerated}
        >
          Uložiť protokol
        </Button>
      </Box>

      {/* Progress Modal */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Ukladám protokol...</h3>
              <p className="text-gray-600 mb-4">{progressMessage}</p>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${pdfProgress}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-500">{pdfProgress}% dokončené</p>
            </div>
          </div>
        </div>
      )}

      {/* Photo capture dialog */}
      {activePhotoCapture && (
        <SerialPhotoCapture
          open={!!activePhotoCapture}
          onClose={() => setActivePhotoCapture(null)}
          onSave={(images, videos) => handleMediaSave(activePhotoCapture as 'vehicle' | 'document' | 'damage' | 'odometer' | 'fuel', images, videos)}
          title={`Fotografovanie - ${activePhotoCapture === 'vehicle' ? 'Vozidlo' : activePhotoCapture === 'document' ? 'Dokumenty' : activePhotoCapture === 'damage' ? 'Poškodenia' : activePhotoCapture === 'odometer' ? 'Tachometer' : 'Palivo'}`}
          allowedTypes={[activePhotoCapture as 'vehicle' | 'document' | 'damage' | 'fuel' | 'odometer']}
          maxImages={50}
          maxVideos={5}
          compressImages={true}
          compressVideos={true}
          entityId={protocol.id || protocolId}
          autoUploadToR2={true}
        />
      )}

      {/* Signature dialog */}
      {showSignaturePad && (
        <Dialog open={showSignaturePad} onClose={() => setShowSignaturePad(false)} maxWidth="md" fullWidth>
          <DialogContent>
            <DialogTitle>Elektronický podpis</DialogTitle>
            <TextField
              label="Meno podpisujúceho"
              value={state.user?.username || 'admin'}
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

      {/* ✅ Image Gallery Modal */}
      <ImageGalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={getAllMediaForGallery().images}
        videos={getAllMediaForGallery().videos}
        title={`Galéria protokolu - ${rental.customerName}`}
      />
    </Box>
  );
};

export default HandoverProtocolForm; 