import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Alert,
  Collapse,
  IconButton,
} from '@mui/material';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CloseIcon from '@mui/icons-material/Close';
import { Rental, Customer, Vehicle } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface EmailParserProps {
  onParseSuccess: (rentalData: Partial<Rental>, customerData?: Customer) => void;
  vehicles: Vehicle[];
  customers: Customer[];
}

interface ParsedData {
  orderNumber?: string;
  orderDate?: string;
  paymentMethod?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  pickupPlace?: string;
  returnPlace?: string;
  reservationTime?: string;
  deposit?: number;
  totalAmount?: number;
  vehicleName?: string;
  vehicleCode?: string;
  vehiclePrice?: number;
}

export default function EmailParser({ onParseSuccess, vehicles, customers }: EmailParserProps) {
  const [emailText, setEmailText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string>('');
  const [showAlert, setShowAlert] = useState(false);
  const [vehicleFound, setVehicleFound] = useState<boolean>(false);

  const parseEmailText = (text: string): ParsedData => {
    const data: ParsedData = {};
    
    // Parsovanie čísla objednávky
    const orderNumberMatch = text.match(/Číslo objednávky\s+([A-Z]+\d+)/i);
    if (orderNumberMatch) {
      data.orderNumber = orderNumberMatch[1];
    }

    // Parsovanie dátumu objednávky
    const orderDateMatch = text.match(/Objednávka prijatá\s+(\d{2}\.\d{2}\.\d{4})/);
    if (orderDateMatch) {
      data.orderDate = orderDateMatch[1];
    }

    // Parsovanie spôsobu úhrady
    const paymentMethodMatch = text.match(/Spôsob úhrady\s+(.+)/);
    if (paymentMethodMatch) {
      data.paymentMethod = paymentMethodMatch[1].trim();
    }

    // Parsovanie odoberateľa (zákazníka)
    const customerMatch = text.match(/Odoberateľ\s+(.+)/);
    if (customerMatch) {
      data.customerName = customerMatch[1].trim();
    }

    // Parsovanie emailu
    const emailMatch = text.match(/E-mail\s+(.+)/);
    if (emailMatch) {
      data.customerEmail = emailMatch[1].trim();
    }

    // Parsovanie telefónu
    const phoneMatch = text.match(/Telefon\s+(.+)/);
    if (phoneMatch) {
      data.customerPhone = phoneMatch[1].trim();
    }

    // Parsovanie kontaktnej adresy
    const addressMatch = text.match(/Kontaktná adresa\s+(.+)/);
    if (addressMatch) {
      data.customerAddress = addressMatch[1].trim();
    }

    // Parsovanie miesta vyzdvihnutia
    const pickupMatch = text.match(/Miesto vyzdvihnutia\s+(.+)/);
    if (pickupMatch) {
      data.pickupPlace = pickupMatch[1].trim();
    }

    // Parsovanie miesta odovzdania
    const returnMatch = text.match(/Miesto odovzdania\s+(.+)/);
    if (returnMatch) {
      data.returnPlace = returnMatch[1].trim();
    }

    // Parsovanie času rezervácie
    const reservationMatch = text.match(/Čas rezervacie\s+(.+)/);
    if (reservationMatch) {
      data.reservationTime = reservationMatch[1].trim();
    }

    // Parsovanie depozitu
    const depositMatch = text.match(/Depozit\s+([\d\s,]+)\s*€/);
    if (depositMatch) {
      const depositStr = depositMatch[1].replace(/\s/g, '').replace(',', '.');
      data.deposit = parseFloat(depositStr);
    }

    // Parsovanie sumy k úhrade
    const totalMatch = text.match(/Suma k úhrade\s+([\d\s,]+)\s*€/);
    if (totalMatch) {
      const totalStr = totalMatch[1].replace(/\s/g, '').replace(',', '.');
      data.totalAmount = parseFloat(totalStr);
    }

    // Parsovanie vozidla z položiek objednávky
    const vehicleMatch = text.match(/Položky objednávky\s*\n\s*Názov\s+Kód\s+Cena\s+Spolu\s*\n([^\n]+)/);
    if (vehicleMatch) {
      const vehicleLine = vehicleMatch[1].trim();
      const parts = vehicleLine.split(/\s+/);
      // Nájdi index, kde je prvý výskyt slova s 6-7 znakmi (ŠPZ)
      const spzIndex = parts.findIndex(part => /^[A-Z0-9]{6,7}$/.test(part));
      if (spzIndex > 0) {
        // Názov auta je všetko pred ŠPZ
        data.vehicleName = parts.slice(0, spzIndex).join(' ');
        data.vehicleCode = parts[spzIndex];
        // Cena a suma sú za ŠPZ
        if (parts.length > spzIndex + 2) {
          const priceStr = parts[spzIndex + 1].replace(',', '.');
          data.vehiclePrice = parseFloat(priceStr);
          // suma je ešte o jedno ďalej
          // const sumStr = parts[spzIndex + 2].replace(',', '.');
          // data.vehicleSum = parseFloat(sumStr);
        }
      }
    }

    return data;
  };

  const handleParse = () => {
    if (!emailText.trim()) {
      setError('Prosím vložte text z emailu');
      setShowAlert(true);
      return;
    }

    try {
      const parsed = parseEmailText(emailText);
      setParsedData(parsed);
      
      // Kontrola, či sa našlo vozidlo
      if (parsed.vehicleCode) {
        const found = vehicles.some(v => v.licensePlate === parsed.vehicleCode);
        setVehicleFound(found);
      } else {
        setVehicleFound(false);
      }
      
      setError('');
      setShowAlert(false);
    } catch (err) {
      setError('Chyba pri parsovaní textu');
      setShowAlert(true);
    }
  };

  const handleApplyData = () => {
    if (!parsedData) return;

    // Vytvorenie alebo nájdenie zákazníka
    let customer: Customer | undefined;
    if (parsedData.customerName) {
      customer = customers.find(c => 
        (c.name && c.name.toLowerCase() === parsedData.customerName!.toLowerCase()) ||
        c.email === parsedData.customerEmail
      );

      if (!customer && parsedData.customerName) {
        customer = {
          id: uuidv4(),
          name: parsedData.customerName,
          email: parsedData.customerEmail || '',
          phone: parsedData.customerPhone || '',
          createdAt: new Date(),
        };
      }
    }

    // Kontrola, či sa našlo vozidlo
    let vehicleFound = false;
    if (parsedData.vehicleCode) {
      vehicleFound = vehicles.some(v => v.licensePlate === parsedData.vehicleCode);
    }

    // Nájdenie vozidla - primárne podľa ŠPZ, potom podľa názvu
    let selectedVehicle: Vehicle | undefined;
    if (parsedData.vehicleCode) {
      // Najprv hľadám podľa ŠPZ (kódu)
      selectedVehicle = vehicles.find(v => v.licensePlate === parsedData.vehicleCode);
    }
    
    // Ak sa nenájde podľa ŠPZ, skúsim podľa názvu
    if (!selectedVehicle && parsedData.vehicleName) {
      selectedVehicle = vehicles.find(v => 
        v.brand && v.model && `${v.brand} ${v.model}`.toLowerCase().includes(parsedData.vehicleName!.toLowerCase())
      );
    }

    // Parsovanie dátumu rezervácie
    let startDate = new Date();
    let endDate = new Date();
    if (parsedData.reservationTime) {
      const timeMatch = parsedData.reservationTime.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) - (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
      if (timeMatch) {
        startDate = new Date(timeMatch[1]);
        endDate = new Date(timeMatch[2]);
      }
    }

    // Určenie spôsobu platby
    let paymentMethod: 'cash' | 'bank_transfer' | 'vrp' | 'direct_to_owner' = 'cash';
    if (parsedData.paymentMethod) {
      const paymentLower = parsedData.paymentMethod.toLowerCase();
      if (paymentLower.includes('hotovosť') || paymentLower.includes('cash')) {
        paymentMethod = 'cash';
      } else if (paymentLower.includes('bank') || paymentLower.includes('prevod')) {
        paymentMethod = 'bank_transfer';
      } else if (paymentLower.includes('vrp')) {
        paymentMethod = 'vrp';
      }
    }

    const rentalData: Partial<Rental> = {
      vehicleId: selectedVehicle?.id || '',
      customerName: parsedData.customerName || '',
      startDate,
      endDate,
      totalPrice: parsedData.totalAmount || 0,
      paymentMethod,
      handoverPlace: parsedData.pickupPlace || '',
      orderNumber: parsedData.orderNumber || '',
    };

    onParseSuccess(rentalData, customer);
    
    // Upozornenie ak sa nenašlo vozidlo
    if (parsedData.vehicleCode && !vehicleFound) {
      alert(`Upozornenie: Vozidlo so ŠPZ "${parsedData.vehicleCode}" sa nenašlo v databáze. Prosím vyberte vozidlo manuálne.`);
    }
    
    // Vyčistenie formulára
    setEmailText('');
    setParsedData(null);
    setError('');
    setShowAlert(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setEmailText(text);
    } catch (err) {
      setError('Nepodarilo sa vložiť text zo schránky');
      setShowAlert(true);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoFixHighIcon />
          Automatické parsovanie z emailu
        </Typography>
        
        <Collapse in={showAlert}>
          <Alert 
            severity={error ? 'error' : 'success'} 
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setShowAlert(false)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {error || 'Dáta boli úspešne spracované'}
          </Alert>
        </Collapse>

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={8}
            variant="outlined"
            label="Vložte text z emailu"
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder="Vložte sem text z emailu s detailmi objednávky..."
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ContentPasteIcon />}
            onClick={handlePaste}
          >
            Vložiť zo schránky
          </Button>
          <Button
            variant="contained"
            startIcon={<AutoFixHighIcon />}
            onClick={handleParse}
            disabled={!emailText.trim()}
          >
            Spracovať dáta
          </Button>
        </Box>

        {parsedData && (
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Nájdené dáta:</strong>
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.9rem' }}>
                {parsedData.orderNumber && (
                  <div><strong>Číslo objednávky:</strong> {parsedData.orderNumber}</div>
                )}
                {parsedData.customerName && (
                  <div><strong>Zákazník:</strong> {parsedData.customerName}</div>
                )}
                {parsedData.customerEmail && (
                  <div><strong>Email:</strong> {parsedData.customerEmail}</div>
                )}
                {parsedData.customerPhone && (
                  <div><strong>Telefón:</strong> {parsedData.customerPhone}</div>
                )}
                {parsedData.vehicleCode && (
                  <div>
                    <strong>ŠPZ vozidla:</strong> {parsedData.vehicleCode}
                    {vehicleFound ? (
                      <span style={{ color: 'green', marginLeft: '8px' }}>✓ Nájdené</span>
                    ) : (
                      <span style={{ color: 'red', marginLeft: '8px' }}>✗ Nenájdené</span>
                    )}
                  </div>
                )}
                {parsedData.vehicleName && (
                  <div><strong>Názov vozidla:</strong> {parsedData.vehicleName}</div>
                )}
                {parsedData.totalAmount && (
                  <div><strong>Suma:</strong> {parsedData.totalAmount} €</div>
                )}
                {parsedData.pickupPlace && (
                  <div><strong>Miesto vyzdvihnutia:</strong> {parsedData.pickupPlace}</div>
                )}
                {parsedData.reservationTime && (
                  <div><strong>Čas rezervácie:</strong> {parsedData.reservationTime}</div>
                )}
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApplyData}
                sx={{ mt: 2 }}
                fullWidth
              >
                Použiť dáta v formulári
              </Button>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
} 