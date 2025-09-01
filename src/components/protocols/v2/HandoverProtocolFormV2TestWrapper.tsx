/**
 * HandoverProtocolFormV2 Test Wrapper
 * Testovací wrapper pre V2 protokol s automatickým načítaním BMW X5 dát
 */

import React, { useEffect, useState } from 'react';
import {
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Science as TestIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Typography,
} from '@mui/material';

import {
  createTestRentalWithRelations,
  generateV2ProtocolData,
  logTestData,
} from '../../../utils/v2TestData';
import type { HandoverProtocolDataV2 } from './HandoverProtocolFormV2';
import { HandoverProtocolFormV2 } from './HandoverProtocolFormV2';

interface TestWrapperProps {
  open: boolean;
  onClose: () => void;
}

export function HandoverProtocolFormV2TestWrapper({
  open,
  onClose,
}: TestWrapperProps) {
  const [testData, setTestData] = useState<HandoverProtocolDataV2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProtocol, setShowProtocol] = useState(false);

  // Automatické načítanie test dát pri otvorení
  useEffect(() => {
    if (open && !testData) {
      loadTestData();
    }
  }, [open, testData]);

  const loadTestData = async () => {
    try {
      setLoading(true);

      // Simulácia API volania (ako V1)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Vytvorenie test dát z reálneho BMW X5 prenájmu
      const rental = createTestRentalWithRelations();
      const v2Data = generateV2ProtocolData(rental);

      setTestData(v2Data);

      // Debug log
      // console.log('🧪 V2 Test Data loaded:', v2Data);
      logTestData();
    } catch (error) {
      console.error('❌ Error loading test data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = () => {
    setShowProtocol(true);
  };

  const handleProtocolSave = () => {
    // console.log('✅ V2 Protocol saved:', protocol);
    alert('V2 Protokol úspešne uložený! Pozri console pre detaily.');
    setShowProtocol(false);
  };

  const handleProtocolClose = () => {
    setShowProtocol(false);
  };

  if (!open) return null;

  // Ak sa zobrazuje protokol, renderuj ho
  if (showProtocol && testData) {
    return (
      <HandoverProtocolFormV2
        initialData={testData}
        onSubmit={async () => {
          handleProtocolSave();
        }}
        onCancel={handleProtocolClose}
        userId="test-user"
      />
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        bgcolor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
      }}
    >
      <Card
        sx={{ maxWidth: 800, width: '90%', maxHeight: '90%', overflow: 'auto' }}
      >
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TestIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h5" component="h2">
              V2 Protocol Test Setup
            </Typography>
            <Button
              onClick={onClose}
              sx={{ ml: 'auto' }}
              variant="outlined"
              color="secondary"
            >
              Zavrieť
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Testovací režim:</strong> Načítavam reálne dáta z tvojho BMW
            X5 prenájmu (ID: 1606) pre testovanie V2 protokolu s automatickým
            vyplnením formulára.
          </Alert>

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Načítavam test dáta...</Typography>
            </Box>
          ) : testData ? (
            <>
              {/* Test Data Preview */}
              <Typography variant="h6" gutterBottom>
                📋 Načítané test dáta:
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Vehicle Info */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <CarIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          Vozidlo
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        <strong>
                          {testData.vehicle.brand} {testData.vehicle.model}
                        </strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testData.vehicle.licensePlate} •{' '}
                        {testData.vehicle.year}
                      </Typography>
                      <Chip
                        label={testData.vehicle.company}
                        size="small"
                        color="primary"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Customer Info */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <PersonIcon sx={{ mr: 1, color: 'success.main' }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          Zákazník
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        <strong>{testData.customer.name}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testData.customer.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testData.customer.phone}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Rental Info */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <ReceiptIcon sx={{ mr: 1, color: 'warning.main' }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          Prenájom
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        <strong>
                          Objednávka: {testData.rental.orderNumber}
                        </strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cena: {testData.rental.totalPrice}€
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Depozit: {testData.rental.deposit}€
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Povolené km: {testData.rental.allowedKilometers}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* V2 Features Preview */}
              <Typography variant="h6" gutterBottom>
                🚀 V2 Protocol Features:
              </Typography>

              <Grid container spacing={1} sx={{ mb: 3 }}>
                <Grid item>
                  <Chip
                    label="✅ Smart Caching"
                    color="success"
                    variant="outlined"
                  />
                </Grid>
                <Grid item>
                  <Chip
                    label="✅ 5 Foto Kategórií"
                    color="success"
                    variant="outlined"
                  />
                </Grid>
                <Grid item>
                  <Chip
                    label="✅ Queue Upload"
                    color="success"
                    variant="outlined"
                  />
                </Grid>
                <Grid item>
                  <Chip
                    label="✅ Performance Monitoring"
                    color="success"
                    variant="outlined"
                  />
                </Grid>
                <Grid item>
                  <Chip
                    label="✅ Email Status Tracking"
                    color="success"
                    variant="outlined"
                  />
                </Grid>
                <Grid item>
                  <Chip
                    label="✅ V1 Kompatibilita"
                    color="primary"
                    variant="outlined"
                  />
                </Grid>
              </Grid>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleStartTest}
                  startIcon={<TestIcon />}
                >
                  Spustiť V2 Protocol Test
                </Button>
                <Button variant="outlined" onClick={() => logTestData()}>
                  Zobraziť dáta v Console
                </Button>
              </Box>

              <Alert severity="success" sx={{ mt: 2 }}>
                <strong>Pripravené na testovanie!</strong> V2 protokol bude
                automaticky vyplnený s dátami z BMW X5 prenájmu, rovnako ako V1
                protokol.
              </Alert>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Button
                variant="contained"
                onClick={loadTestData}
                startIcon={<TestIcon />}
              >
                Načítať Test Dáta
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
